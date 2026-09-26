/**
 * =============================================================================
 * Integration Tests: Batch Check-in & Stub Endpoints (Phase 8)
 * Component: /app/backend/routes/__tests__/batchesPhase8.test.js
 * Description: Tests POST /api/batches/:id/log, GET /:id/tasks, PATCH /:id/tasks/:taskId,
 *              GET /:id/status, and GET /:id/dashboard.
 *              Rigourously verifies:
 *                1. Morning + Evening submissions update the SAME 1 DailyLog doc.
 *                2. Mortality guard prevents exceeding live birds.
 *                3. Batch running totals (cumulativeFeedKg & cumulativeMortality) update atomically.
 * =============================================================================
 */

'use strict';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'agrimind_super_secret_jwt_key_2026';

const user = {
  id: new mongoose.Types.ObjectId().toString(),
  name: 'Farmer Rahim',
  mobile: '01711111111',
  role: 'farmer',
};

const token = jwt.sign(user, JWT_SECRET);

const farmId = new mongoose.Types.ObjectId().toString();
const batchId = new mongoose.Types.ObjectId().toString();

jest.mock('../../models/Farm');
jest.mock('../../models/Batch');
jest.mock('../../models/DailyLog');
jest.mock('../../models/Task');
jest.mock('../../models/Alert');

const Farm = require('../../models/Farm');
const Batch = require('../../models/Batch');
const DailyLog = require('../../models/DailyLog');
const Task = require('../../models/Task');
const Alert = require('../../models/Alert');
const batchesRouter = require('../batches');

const app = express();
app.use(express.json());
app.use('/api/batches', batchesRouter);

describe('Phase 8: Check-in API & Sub-document Upserting', () => {
  let mockBatch;
  let mockFarm;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFarm = {
      _id: farmId,
      userId: user.id,
      farmName: 'Rahim Poultry',
    };

    mockBatch = {
      _id: batchId,
      farmId,
      batchName: 'Broiler Batch 1',
      chickenType: 'Broiler',
      initialChickens: 500,
      batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
      initialAverageAgeDays: 0,
      cycleLengthDays: 35,
      cumulativeFeedKg: 0,
      cumulativeMortality: 0,
      liveBirdsEstimate: 500,
      status: 'Active',
      save: jest.fn().mockResolvedValue(true),
      toObject: function () { return { ...this }; },
    };

    Farm.findById.mockResolvedValue(mockFarm);
    Batch.findById.mockResolvedValue(mockBatch);
    Alert.find.mockResolvedValue([]);
    DailyLog.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    });
    Task.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    });
  });

  describe('Mortality Guard (POST /api/batches/:id/log)', () => {
    test('rejects mortality count exceeding current live birds with 400', async () => {
      // 500 live birds available, user submits 550 mortality
      DailyLog.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/batches/${batchId}/log`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: 'morning',
          logDay: '2026-09-10',
          mortalityCount: 550, // Exceeds 500!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds current live birds/);
    });
  });

  describe('Single Document Upserting: Morning + Evening = 1 DailyLog doc', () => {
    let storedDailyLog = null;

    test('morning check-in creates the DailyLog document and increments batch cumulative totals', async () => {
      // On morning check-in: no existing document for 2026-09-10
      DailyLog.findOne.mockResolvedValue(null);

      // Mock DailyLog constructor & save
      DailyLog.mockImplementation((data) => {
        storedDailyLog = {
          ...data,
          save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
          toObject: function () { return { ...this }; },
        };
        return storedDailyLog;
      });

      const res = await request(app)
        .post(`/api/batches/${batchId}/log`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: 'morning',
          logDay: '2026-09-10',
          feedCompleted: true,
          waterRefilled: true,
          feedAmountKg: 20,
          mortalityCount: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.log.logDay).toBe('2026-09-10');
      expect(res.body.log.morning.feedCompleted).toBe(true);
      expect(res.body.log.morning.waterRefilled).toBe(true);
      expect(res.body.log.feedAmountKg).toBe(20);
      expect(res.body.log.mortalityCount).toBe(2);
      expect(res.body.log.liveBirdsEndOfDay).toBe(498); // 500 - 2

      // Batch running totals updated
      expect(mockBatch.cumulativeFeedKg).toBe(20);
      expect(mockBatch.cumulativeMortality).toBe(2);
      expect(mockBatch.save).toHaveBeenCalled();
    });

    test('evening check-in on the SAME day updates the EXISTING DailyLog without creating a new doc', async () => {
      // Simulate batch state after morning check-in (20kg feed, 2 mortality)
      mockBatch.cumulativeFeedKg = 20;
      mockBatch.cumulativeMortality = 2;

      // Return the previously stored log from morning
      DailyLog.findOne.mockResolvedValue(storedDailyLog);

      const res = await request(app)
        .post(`/api/batches/${batchId}/log`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          session: 'evening',
          logDay: '2026-09-10',
          feedCompleted: true,
          feedAmountKg: 25,
          mortalityCount: 1,
          avgBodyWeightG: 450,
          observedSymptoms: ['lethargy'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Both morning and evening sessions are present on the single document
      expect(storedDailyLog.morning.feedCompleted).toBe(true);
      expect(storedDailyLog.evening.feedCompleted).toBe(true);
      expect(storedDailyLog.evening.completedAt).toBeDefined();

      // Cumulative daily totals sum morning + evening
      expect(storedDailyLog.feedAmountKg).toBe(45); // 20 morning + 25 evening
      expect(storedDailyLog.mortalityCount).toBe(3); // 2 morning + 1 evening
      expect(storedDailyLog.liveBirdsEndOfDay).toBe(497); // 498 - 1
      expect(storedDailyLog.avgBodyWeightG).toBe(450);
      expect(storedDailyLog.observedSymptoms).toContain('lethargy');

      // Batch cumulative totals incremented
      expect(mockBatch.cumulativeFeedKg).toBe(45);
      expect(mockBatch.cumulativeMortality).toBe(3);
    });
  });

  describe('Tasks & Status Endpoints', () => {
    test('GET /api/batches/:id/tasks returns sorted task list', async () => {
      const mockTasks = [
        { _id: 't1', title: 'Task 1', dueDate: new Date('2026-09-04') },
        { _id: 't2', title: 'Task 2', dueDate: new Date('2026-09-10') },
      ];

      Task.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTasks),
      });

      const res = await request(app)
        .get(`/api/batches/${batchId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.tasks[0].title).toBe('Task 1');
    });

    test('PATCH /api/batches/:id/tasks/:taskId marks task Completed with completionData', async () => {
      const mockTask = {
        _id: 'task_123',
        batchId,
        title: 'Weighing Task',
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true),
      };

      Task.findOne.mockResolvedValue(mockTask);

      const res = await request(app)
        .patch(`/api/batches/${batchId}/tasks/task_123`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'Completed',
          completionData: { avgWeightG: 480 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockTask.status).toBe('Completed');
      expect(mockTask.completedAt).toBeDefined();
      expect(mockTask.completionData).toEqual({ avgWeightG: 480 });
    });

    test('GET /api/batches/:id/status returns status badge and reasons', async () => {
      DailyLog.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/batches/${batchId}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(['Looks Good', 'Attention Required']).toContain(res.body.status);
      expect(Array.isArray(res.body.reasons)).toBe(true);
    });

    test('GET /api/batches/:id/dashboard returns aggregate dashboard payload', async () => {
      DailyLog.findOne.mockResolvedValue(null);
      DailyLog.getRecentDays = jest.fn().mockResolvedValue([]);
      Task.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await request(app)
        .get(`/api/batches/${batchId}/dashboard`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard).toBeDefined();
      expect(res.body.dashboard.batch).toBeDefined();
      expect(res.body.dashboard.stageInfo).toBeDefined();
      expect(['Looks Good', 'Attention Required']).toContain(res.body.dashboard.status);
      expect(Array.isArray(res.body.dashboard.recentLogs)).toBe(true);
      expect(Array.isArray(res.body.dashboard.upcomingTasks)).toBe(true);
    });
  });
});
