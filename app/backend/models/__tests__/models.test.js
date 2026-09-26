/**
 * =============================================================================
 * Tests: Batch & DailyLog Mongoose Model Schemas
 * Component: /app/backend/models/__tests__/models.test.js
 * Description: Unit tests verifying schema constraints, required fields,
 *              enum validations, defaults, virtuals, and index definitions
 *              for Batch and DailyLog models.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const Batch = require('../Batch');
const DailyLog = require('../DailyLog');

describe('Phase 3: Batch and DailyLog Models', () => {

  describe('Batch Model Schema & Validation', () => {
    const validFarmId = new mongoose.Types.ObjectId();

    const getValidBatchData = () => ({
      farmId: validFarmId,
      batchName: 'Batch 2026-Alpha',
      chickenType: 'Broiler',
      initialChickens: 500,
      batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
      cycleLengthDays: 35,
    });

    test('valid batch passes validation', () => {
      const batch = new Batch(getValidBatchData());
      const err = batch.validateSync();
      expect(err).toBeUndefined();
    });

    test('requires mandatory fields: farmId, batchName, chickenType, initialChickens, batchStartDate, cycleLengthDays', () => {
      const batch = new Batch({});
      const err = batch.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.farmId).toBeDefined();
      expect(err.errors.batchName).toBeDefined();
      expect(err.errors.chickenType).toBeDefined();
      expect(err.errors.initialChickens).toBeDefined();
      expect(err.errors.batchStartDate).toBeDefined();
      expect(err.errors.cycleLengthDays).toBeDefined();
    });

    test('enforces chickenType enum strictly', () => {
      const batch = new Batch({
        ...getValidBatchData(),
        chickenType: 'InvalidBreed',
      });
      const err = batch.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.chickenType).toBeDefined();

      ['Broiler', 'Sonali', 'Desi', 'Cock', 'Layer'].forEach(breed => {
        const validBatch = new Batch({
          ...getValidBatchData(),
          chickenType: breed,
        });
        expect(validBatch.validateSync()).toBeUndefined();
      });
    });

    test('enforces status enum and defaults to Active', () => {
      const batch = new Batch(getValidBatchData());
      expect(batch.status).toBe('Active');

      batch.status = 'Paused';
      expect(batch.validateSync()).toBeUndefined();

      batch.status = 'Closed';
      expect(batch.validateSync()).toBeUndefined();

      batch.status = 'Archived';
      const err = batch.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    test('validates minimum numeric constraints', () => {
      const batch = new Batch({
        ...getValidBatchData(),
        initialChickens: 0,
        cycleLengthDays: 0,
        initialAverageAgeDays: -1,
        chickCostPerBird: -5,
        feedPricePerKg: -10,
        expectedSalePricePerKg: -20,
        cumulativeFeedKg: -1,
        cumulativeMortality: -1,
      });
      const err = batch.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.initialChickens).toBeDefined();
      expect(err.errors.cycleLengthDays).toBeDefined();
      expect(err.errors.initialAverageAgeDays).toBeDefined();
      expect(err.errors.chickCostPerBird).toBeDefined();
      expect(err.errors.feedPricePerKg).toBeDefined();
      expect(err.errors.expectedSalePricePerKg).toBeDefined();
      expect(err.errors.cumulativeFeedKg).toBeDefined();
      expect(err.errors.cumulativeMortality).toBeDefined();
    });

    test('virtual liveBirdsEstimate calculates correctly and clamps to 0', () => {
      const batch = new Batch({
        ...getValidBatchData(),
        initialChickens: 500,
        cumulativeMortality: 50,
      });
      expect(batch.liveBirdsEstimate).toBe(450);

      batch.cumulativeMortality = 600;
      expect(batch.liveBirdsEstimate).toBe(0);
    });

    test('has expected indexes configured', () => {
      const indexes = Batch.schema.indexes();
      const hasFarmStatusIndex = indexes.some(idx => idx[0].farmId === 1 && idx[0].status === 1);
      const hasFarmCreatedAtIndex = indexes.some(idx => idx[0].farmId === 1 && idx[0].createdAt === -1);

      expect(hasFarmStatusIndex).toBe(true);
      expect(hasFarmCreatedAtIndex).toBe(true);
    });
  });

  describe('DailyLog Model Schema & Validation', () => {
    const validBatchId = new mongoose.Types.ObjectId();

    const getValidDailyLogData = () => ({
      batchId: validBatchId,
      logDay: '2026-09-24',
      ageOnDay: 15,
      feedAmountKg: 45.5,
      mortalityCount: 2,
      liveBirdsEndOfDay: 498,
    });

    test('valid daily log passes validation', () => {
      const log = new DailyLog(getValidDailyLogData());
      const err = log.validateSync();
      expect(err).toBeUndefined();
    });

    test('requires mandatory fields: batchId and logDay', () => {
      const log = new DailyLog({});
      const err = log.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.batchId).toBeDefined();
      expect(err.errors.logDay).toBeDefined();
    });

    test('enforces logDay format as YYYY-MM-DD string', () => {
      const invalidFormats = ['2026/09/24', '24-09-2026', '2026-9-24', 'today', '20260924'];
      invalidFormats.forEach(val => {
        const log = new DailyLog({
          ...getValidDailyLogData(),
          logDay: val,
        });
        const err = log.validateSync();
        expect(err).toBeDefined();
        expect(err.errors.logDay).toBeDefined();
      });

      const validLog = new DailyLog({
        ...getValidDailyLogData(),
        logDay: '2026-12-31',
      });
      expect(validLog.validateSync()).toBeUndefined();
    });

    test('enforces observedSymptoms controlled vocabulary enum', () => {
      const logWithValidSymptoms = new DailyLog({
        ...getValidDailyLogData(),
        observedSymptoms: ['bloody_droppings', 'lethargy'],
      });
      expect(logWithValidSymptoms.validateSync()).toBeUndefined();

      const logWithInvalidSymptom = new DailyLog({
        ...getValidDailyLogData(),
        observedSymptoms: ['unknown_illness_xyz'],
      });
      const err = logWithInvalidSymptom.validateSync();
      expect(err).toBeDefined();
      expect(err.errors['observedSymptoms.0']).toBeDefined();
    });

    test('validates non-negative constraints for measurements', () => {
      const log = new DailyLog({
        ...getValidDailyLogData(),
        feedAmountKg: -10,
        mortalityCount: -1,
        liveBirdsEndOfDay: -5,
        avgBodyWeightG: -20,
        ageOnDay: -1,
      });
      const err = log.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.feedAmountKg).toBeDefined();
      expect(err.errors.mortalityCount).toBeDefined();
      expect(err.errors.liveBirdsEndOfDay).toBeDefined();
      expect(err.errors.avgBodyWeightG).toBeDefined();
      expect(err.errors.ageOnDay).toBeDefined();
    });

    test('virtual isMorningComplete and isEveningComplete function correctly', () => {
      const log = new DailyLog(getValidDailyLogData());
      expect(log.isMorningComplete).toBe(false);
      expect(log.isEveningComplete).toBe(false);

      log.morning = { completedAt: new Date(), feedCompleted: true, waterRefilled: true };
      expect(log.isMorningComplete).toBe(true);
      expect(log.isEveningComplete).toBe(false);

      log.evening = { completedAt: new Date(), feedCompleted: true };
      expect(log.isEveningComplete).toBe(true);
    });

    test('virtual hasRedFlagSymptom detects bloody_droppings and respiratory_sounds', () => {
      const log = new DailyLog(getValidDailyLogData());
      expect(log.hasRedFlagSymptom).toBe(false);

      log.observedSymptoms = ['lethargy'];
      expect(log.hasRedFlagSymptom).toBe(false);

      log.observedSymptoms = ['lethargy', 'bloody_droppings'];
      expect(log.hasRedFlagSymptom).toBe(true);

      log.observedSymptoms = ['respiratory_sounds'];
      expect(log.hasRedFlagSymptom).toBe(true);
    });

    test('has unique compound index on (batchId, logDay) configured', () => {
      const indexes = DailyLog.schema.indexes();
      const uniqueCompoundIndex = indexes.find(
        idx => idx[0].batchId === 1 && idx[0].logDay === 1 && idx[1] && idx[1].unique === true
      );
      expect(uniqueCompoundIndex).toBeDefined();

      const secondaryLogDateIndex = indexes.find(
        idx => idx[0].batchId === 1 && idx[0].logDate === -1
      );
      expect(secondaryLogDateIndex).toBeDefined();
    });

    test('static methods getForDay and getRecentDays are defined', () => {
      expect(typeof DailyLog.getForDay).toBe('function');
      expect(typeof DailyLog.getRecentDays).toBe('function');
    });
  });
});
