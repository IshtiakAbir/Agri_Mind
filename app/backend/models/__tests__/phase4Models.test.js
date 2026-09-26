/**
 * =============================================================================
 * Tests: Phase 4 Models (Task, Alert, WeatherReading, DiseaseTreatmentMap)
 * Component: /app/backend/models/__tests__/phase4Models.test.js
 * Description: Unit tests verifying schemas, validations, enums, defaults,
 *              virtuals, static helpers, and index definitions for Phase 4 models.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const Task = require('../Task');
const Alert = require('../Alert');
const WeatherReading = require('../WeatherReading');
const DiseaseTreatmentMap = require('../DiseaseTreatmentMap');

describe('Phase 4: Task, Alert, WeatherReading & DiseaseTreatmentMap Models', () => {

  describe('Task Model Schema & Validation', () => {
    const validBatchId = new mongoose.Types.ObjectId();

    const getValidTaskData = () => ({
      batchId: validBatchId,
      templateKey: 'nd-lasota-1',
      title: 'Newcastle Disease (ND LaSota) Eye-drop',
      category: 'Vaccination',
      dayNumber: 4,
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      isCritical: true,
      instructions: 'Administer one drop in eye per chick.',
    });

    test('valid task passes validation', () => {
      const task = new Task(getValidTaskData());
      const err = task.validateSync();
      expect(err).toBeUndefined();
    });

    test('requires mandatory fields: batchId, templateKey, title, category, dayNumber, dueDate', () => {
      const task = new Task({});
      const err = task.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.batchId).toBeDefined();
      expect(err.errors.templateKey).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.category).toBeDefined();
      expect(err.errors.dayNumber).toBeDefined();
      expect(err.errors.dueDate).toBeDefined();
    });

    test('enforces category enum strictly', () => {
      ['Vaccination', 'Feed Transition', 'Weighing', 'Medication'].forEach(cat => {
        const task = new Task({ ...getValidTaskData(), category: cat });
        expect(task.validateSync()).toBeUndefined();
      });

      const invalidTask = new Task({ ...getValidTaskData(), category: 'InvalidCategory' });
      const err = invalidTask.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.category).toBeDefined();
    });

    test('enforces status enum and defaults to Pending', () => {
      const task = new Task(getValidTaskData());
      expect(task.status).toBe('Pending');

      ['Pending', 'Completed', 'Overdue', 'Skipped'].forEach(status => {
        task.status = status;
        expect(task.validateSync()).toBeUndefined();
      });

      task.status = 'Discarded';
      expect(task.validateSync()).toBeDefined();
    });

    test('virtual isOverdueComputed checks dueDate vs now', () => {
      const pastDueDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDueDate = new Date(Date.now() + 3600000); // 1 hour from now

      const overdueTask = new Task({ ...getValidTaskData(), dueDate: pastDueDate, status: 'Pending' });
      expect(overdueTask.isOverdueComputed).toBe(true);

      const futureTask = new Task({ ...getValidTaskData(), dueDate: futureDueDate, status: 'Pending' });
      expect(futureTask.isOverdueComputed).toBe(false);

      const completedTask = new Task({ ...getValidTaskData(), dueDate: pastDueDate, status: 'Completed' });
      expect(completedTask.isOverdueComputed).toBe(false);

      const skippedTask = new Task({ ...getValidTaskData(), dueDate: pastDueDate, status: 'Skipped' });
      expect(skippedTask.isOverdueComputed).toBe(false);
    });

    test('has expected indexes configured including unique compound index on (batchId, templateKey)', () => {
      const indexes = Task.schema.indexes();
      const uniqueTemplateIndex = indexes.find(
        idx => idx[0].batchId === 1 && idx[0].templateKey === 1 && idx[1] && idx[1].unique === true
      );
      expect(uniqueTemplateIndex).toBeDefined();

      const dueDateIndex = indexes.find(idx => idx[0].batchId === 1 && idx[0].dueDate === 1);
      expect(dueDateIndex).toBeDefined();

      const criticalStatusIndex = indexes.find(
        idx => idx[0].batchId === 1 && idx[0].isCritical === 1 && idx[0].status === 1
      );
      expect(criticalStatusIndex).toBeDefined();
    });
  });

  describe('Alert Model Schema & Validation', () => {
    const validFarmId = new mongoose.Types.ObjectId();

    const getValidAlertData = () => ({
      farmId: validFarmId,
      type: 'HEAT_STRESS',
      severity: 'Warning',
      message: 'Temperature exceeds 32°C. Increase shed airflow and supply electrolytes.',
      advice: 'Ensure water tanks are shaded and provide cool water.',
    });

    test('valid alert passes validation', () => {
      const alert = new Alert(getValidAlertData());
      expect(alert.validateSync()).toBeUndefined();
    });

    test('requires mandatory fields: farmId, type, message', () => {
      const alert = new Alert({});
      const err = alert.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.farmId).toBeDefined();
      expect(err.errors.type).toBeDefined();
      expect(err.errors.message).toBeDefined();
    });

    test('enforces type enum strictly', () => {
      ['HEAT_STRESS', 'AMMONIA_MOISTURE', 'COLD_SNAP', 'CUSTOM'].forEach(type => {
        const alert = new Alert({ ...getValidAlertData(), type });
        expect(alert.validateSync()).toBeUndefined();
      });

      const invalidAlert = new Alert({ ...getValidAlertData(), type: 'EARTHQUAKE' });
      expect(invalidAlert.validateSync()).toBeDefined();
    });

    test('defaults status to Active and consecutiveSafeReadings to 0', () => {
      const alert = new Alert(getValidAlertData());
      expect(alert.status).toBe('Active');
      expect(alert.consecutiveSafeReadings).toBe(0);
    });

    test('has expected indexes configured', () => {
      const indexes = Alert.schema.indexes();
      const farmStatusIndex = indexes.find(idx => idx[0].farmId === 1 && idx[0].status === 1);
      expect(farmStatusIndex).toBeDefined();

      const farmTypeStatusIndex = indexes.find(
        idx => idx[0].farmId === 1 && idx[0].type === 1 && idx[0].status === 1
      );
      expect(farmTypeStatusIndex).toBeDefined();
    });
  });

  describe('WeatherReading Model Schema & Validation', () => {
    const getValidReadingData = () => ({
      cityKey: 'gazipur',
      lat: 23.9999,
      lon: 90.4203,
      temperatureC: 33.5,
      humidityPct: 78,
      apparentTempC: 39.2,
      heatIndexC: 41.0,
      windKph: 12.5,
      forecastMaxC24h: 36.0,
    });

    test('valid reading passes validation', () => {
      const reading = new WeatherReading(getValidReadingData());
      expect(reading.validateSync()).toBeUndefined();
    });

    test('requires mandatory fields: cityKey, lat, lon, temperatureC, humidityPct', () => {
      const reading = new WeatherReading({});
      const err = reading.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.cityKey).toBeDefined();
      expect(err.errors.lat).toBeDefined();
      expect(err.errors.lon).toBeDefined();
      expect(err.errors.temperatureC).toBeDefined();
      expect(err.errors.humidityPct).toBeDefined();
    });

    test('enforces humidityPct range [0, 100]', () => {
      const negativeHum = new WeatherReading({ ...getValidReadingData(), humidityPct: -5 });
      expect(negativeHum.validateSync()).toBeDefined();

      const excessHum = new WeatherReading({ ...getValidReadingData(), humidityPct: 105 });
      expect(excessHum.validateSync()).toBeDefined();
    });

    test('has TTL expiration index configured on fetchedAt for 7 days', () => {
      const indexes = WeatherReading.schema.indexes();
      const ttlIndex = indexes.find(
        idx => idx[0].fetchedAt === 1 && idx[1] && idx[1].expireAfterSeconds === 7 * 24 * 60 * 60
      );
      expect(ttlIndex).toBeDefined();

      const cityFetchedIndex = indexes.find(
        idx => idx[0].cityKey === 1 && idx[0].fetchedAt === -1
      );
      expect(cityFetchedIndex).toBeDefined();
    });
  });

  describe('DiseaseTreatmentMap Model Schema & Validation', () => {
    const getValidDiseaseData = () => ({
      diseaseKey: 'coccidiosis',
      displayName: 'Coccidiosis (Eimeria)',
      treatable: true,
      activeIngredients: ['Amprolium', 'Toltrazuril'],
      supportiveCare: ['Electrolytes', 'Vitamin K'],
      vetReferralRequired: false,
      treatmentTags: ['anticoccidial'],
    });

    test('valid disease map passes validation', () => {
      const disease = new DiseaseTreatmentMap(getValidDiseaseData());
      expect(disease.validateSync()).toBeUndefined();
    });

    test('requires mandatory fields: diseaseKey, displayName, treatable', () => {
      const disease = new DiseaseTreatmentMap({});
      const err = disease.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.diseaseKey).toBeDefined();
      expect(err.errors.displayName).toBeDefined();
      expect(err.errors.treatable).toBeDefined();
    });

    test('has unique index on diseaseKey configured', () => {
      const indexes = DiseaseTreatmentMap.schema.indexes();
      const uniqueDiseaseIndex = indexes.find(
        idx => idx[0].diseaseKey === 1 && idx[1] && idx[1].unique === true
      );
      expect(uniqueDiseaseIndex).toBeDefined();
    });

    test('static method findByLabel normalizes input string', () => {
      expect(typeof DiseaseTreatmentMap.findByLabel).toBe('function');
    });
  });
});
