/**
 * =============================================================================
 * Integration Tests: Batch REST API Endpoints & Ownership Authorization
 * Component: /app/backend/routes/__tests__/batches.test.js
 * Description: Tests POST /api/batches, GET /api/batches, GET /api/batches/:id,
 *              PATCH /api/batches/:id, and POST /api/batches/:id/close.
 *              Verifies strict ownership protection using two different user JWTs.
 * =============================================================================
 */

'use strict';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'agrimind_super_secret_jwt_key_2026';

// Test Users
const userA = {
  id: new mongoose.Types.ObjectId().toString(),
  name: 'Farmer Rahim',
  mobile: '01711111111',
  role: 'farmer',
};

const userB = {
  id: new mongoose.Types.ObjectId().toString(),
  name: 'Farmer Karim',
  mobile: '01722222222',
  role: 'farmer',
};

const employeeUser = {
  id: new mongoose.Types.ObjectId().toString(),
  name: 'Support Agent',
  mobile: '01733333333',
  role: 'employee',
};

const tokenA = jwt.sign(userA, JWT_SECRET);
const tokenB = jwt.sign(userB, JWT_SECRET);
const tokenEmployee = jwt.sign(employeeUser, JWT_SECRET);

// Test IDs
const farmIdA = new mongoose.Types.ObjectId().toString();
const farmIdB = new mongoose.Types.ObjectId().toString();
const batchIdA = new mongoose.Types.ObjectId().toString();

// Mock models
jest.mock('../../models/Farm');
jest.mock('../../models/Batch');
jest.mock('../../models/Task');

const Farm = require('../../models/Farm');
const Batch = require('../../models/Batch');
const Task = require('../../models/Task');
const batchesRouter = require('../batches');

// Setup minimal Express test app
const app = express();
app.use(express.json());
app.use('/api/batches', batchesRouter);

describe('Phase 7: Batch Management API & Ownership Authorization', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Gates', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/batches');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/No authorization token provided/);
    });

    test('rejects invalid or expired token with 401', async () => {
      const res = await request(app)
        .get('/api/batches')
        .set('Authorization', 'Bearer invalid_token_xyz');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Token is invalid or has expired/);
    });
  });

  describe('POST /api/batches (Create Batch)', () => {
    test('rejects creation if required fields fail Zod validation', async () => {
      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: farmIdA,
          // missing batchName, chickenType, initialChickens, batchStartDate
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    test('rejects creation if user does not own target farm', async () => {
      // Farm belongs to User B
      Farm.findById.mockResolvedValue({
        _id: farmIdB,
        userId: userB.id,
        farmName: 'Karim Farm',
      });

      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${tokenA}`) // User A calling
        .send({
          farmId: farmIdB,
          batchName: 'Batch Sept 2026',
          chickenType: 'Broiler',
          initialChickens: 500,
          batchStartDate: '2026-09-01',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Access denied: You do not own this farm/);
    });

    test('allows batch creation for farm owner and generates tasks', async () => {
      Farm.findById.mockResolvedValue({
        _id: farmIdA,
        userId: userA.id,
        farmName: 'Rahim Poultry',
      });

      Task.bulkWrite.mockResolvedValue({ upsertedCount: 8, matchedCount: 0 });

      // Mock Batch constructor and save
      const mockSavedBatch = {
        _id: batchIdA,
        farmId: farmIdA,
        batchName: 'Broiler Batch 1',
        chickenType: 'Broiler',
        initialChickens: 500,
        batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
        initialAverageAgeDays: 0,
        cycleLengthDays: 35,
        status: 'Active',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return {
            _id: this._id,
            farmId: this.farmId,
            batchName: this.batchName,
            chickenType: this.chickenType,
            initialChickens: this.initialChickens,
            batchStartDate: this.batchStartDate,
            initialAverageAgeDays: this.initialAverageAgeDays,
            cycleLengthDays: this.cycleLengthDays,
            status: this.status,
          };
        },
      };

      Batch.mockImplementation(() => mockSavedBatch);

      const res = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: farmIdA,
          batchName: 'Broiler Batch 1',
          chickenType: 'Broiler',
          initialChickens: 500,
          batchStartDate: '2026-09-01',
          chickCostPerBird: 45,
          feedPricePerKg: 65,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.batch).toBeDefined();
      expect(res.body.batch.chickenType).toBe('Broiler');
      expect(res.body.batch.currentAge).toBeDefined();
      expect(res.body.batch.stageInfo).toBeDefined();
      expect(res.body.tasksGenerated).toBe(8);
    });
  });

  describe('GET /api/batches (List Batches)', () => {
    test('returns only batches for farms owned by the requesting farmer', async () => {
      Farm.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: farmIdA }]),
      });

      const mockBatches = [
        {
          _id: batchIdA,
          farmId: farmIdA,
          batchName: 'Rahim Batch 1',
          chickenType: 'Broiler',
          initialChickens: 500,
          batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
          initialAverageAgeDays: 0,
          cycleLengthDays: 35,
          cumulativeMortality: 10,
          toObject: function () { return { ...this }; },
        },
      ];

      Batch.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockBatches),
        }),
      });

      const res = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.batches[0].batchName).toBe('Rahim Batch 1');
      expect(res.body.batches[0].currentAge).toBeDefined();
      expect(res.body.batches[0].isPastCycleEnd).toBeDefined();
    });
  });

  describe('Ownership Enforcement with Two Different JWTs', () => {
    const mockBatchA = {
      _id: batchIdA,
      farmId: farmIdA,
      batchName: 'Rahim Batch 1',
      chickenType: 'Broiler',
      initialChickens: 500,
      batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
      initialAverageAgeDays: 0,
      cycleLengthDays: 35,
      status: 'Active',
      save: jest.fn().mockResolvedValue(true),
      toObject: function () { return { ...this }; },
    };

    const mockFarmA = {
      _id: farmIdA,
      userId: userA.id,
      farmName: 'Rahim Farm',
    };

    beforeEach(() => {
      Batch.findById.mockResolvedValue(mockBatchA);
      Farm.findById.mockResolvedValue(mockFarmA);
    });

    test('User A (Owner) CAN read their batch details', async () => {
      const res = await request(app)
        .get(`/api/batches/${batchIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.batch.batchName).toBe('Rahim Batch 1');
      expect(res.body.batch.stageInfo).toBeDefined();
    });

    test('User B (Different Farmer) CANNOT read User A batch (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/batches/${batchIdA}`)
        .set('Authorization', `Bearer ${tokenB}`); // User B attempting access

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Access denied: You do not own the farm/);
    });

    test('Employee user CAN read User A batch for support purposes', async () => {
      const res = await request(app)
        .get(`/api/batches/${batchIdA}`)
        .set('Authorization', `Bearer ${tokenEmployee}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.batch.batchName).toBe('Rahim Batch 1');
    });

    test('User B CANNOT update User A batch (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/batches/${batchIdA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ batchName: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('User A CAN update their batch parameters', async () => {
      const res = await request(app)
        .patch(`/api/batches/${batchIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ feedPricePerKg: 72.5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatchA.feedPricePerKg).toBe(72.5);
    });

    test('User B CANNOT close User A batch (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/batches/${batchIdA}/close`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ finalWeightKg: 1.8, soldCount: 480, revenue: 170000 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('User A CAN close their batch with harvest metrics', async () => {
      const res = await request(app)
        .post(`/api/batches/${batchIdA}/close`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ finalWeightKg: 1.8, soldCount: 480, revenue: 170000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockBatchA.status).toBe('Closed');
      expect(mockBatchA.finalWeightKg).toBe(1.8);
      expect(mockBatchA.soldCount).toBe(480);
      expect(mockBatchA.revenue).toBe(170000);
    });

    test('Closing an already-closed batch returns 400', async () => {
      mockBatchA.status = 'Closed';

      const res = await request(app)
        .post(`/api/batches/${batchIdA}/close`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ finalWeightKg: 1.8, soldCount: 480, revenue: 170000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/This batch is already closed/);
    });
  });
});
