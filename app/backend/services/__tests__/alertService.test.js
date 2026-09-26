'use strict';

const mongoose = require('mongoose');
const { evaluateAlertRules, syncAlertsWithHysteresis } = require('../alertService');
const Alert = require('../../models/Alert');

jest.mock('../../models/Alert');

describe('Phase 11: Alert Service (Rules & 2-Reading Hysteresis)', () => {
  const farmId = new mongoose.Types.ObjectId();
  const batchId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateAlertRules (Pure Evaluation)', () => {
    test('returns empty array when reading is null or within safe parameters', () => {
      expect(evaluateAlertRules(null)).toEqual([]);

      const safeReading = {
        temperatureC: 25,
        humidityPct: 60,
        heatIndexC: 25.5,
        forecastMaxC24h: 27,
        apparentTempC: 26,
      };
      expect(evaluateAlertRules(safeReading)).toEqual([]);
    });

    test('triggers HEAT_STRESS warning when temperature exceeds 32°C', () => {
      const reading = {
        temperatureC: 33,
        humidityPct: 50,
        heatIndexC: 34,
        forecastMaxC24h: 33,
        apparentTempC: 33,
      };
      const alerts = evaluateAlertRules(reading);
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HEAT_STRESS');
      expect(alerts[0].severity).toBe('Warning');
    });

    test('triggers HEAT_STRESS critical when temperature > 35°C or heatIndex > 39°C', () => {
      const reading = {
        temperatureC: 36,
        humidityPct: 70,
        heatIndexC: 44,
        forecastMaxC24h: 38,
        apparentTempC: 42,
      };
      const alerts = evaluateAlertRules(reading);
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HEAT_STRESS');
      expect(alerts[0].severity).toBe('Critical');
    });

    test('provides brooding-specific heat advice for young chicks <= 7 days', () => {
      const reading = { temperatureC: 33, humidityPct: 50, heatIndexC: 34 };
      const youngBatch = { initialAverageAgeDays: 4 };
      const olderBatch = { initialAverageAgeDays: 25 };

      const youngAlerts = evaluateAlertRules(reading, youngBatch);
      const olderAlerts = evaluateAlertRules(reading, olderBatch);

      expect(youngAlerts[0].advice).toContain('Brooding age detected');
      expect(olderAlerts[0].advice).toContain('cooling fans');
    });

    test('triggers AMMONIA_MOISTURE warning when humidity > 80% and temp > 28°C', () => {
      const reading = {
        temperatureC: 29,
        humidityPct: 85,
        heatIndexC: 32,
        forecastMaxC24h: 30,
        apparentTempC: 31,
      };
      const alerts = evaluateAlertRules(reading);
      const ammoniaAlert = alerts.find(a => a.type === 'AMMONIA_MOISTURE');
      expect(ammoniaAlert).toBeDefined();
      expect(ammoniaAlert.severity).toBe('Warning');
      expect(ammoniaAlert.advice).toContain('Turn over and loosen damp litter');
    });

    test('triggers COLD_SNAP for young brooding chicks (<= 21 days) when temp < 15°C', () => {
      const reading = { temperatureC: 12, humidityPct: 55 };
      const broodingBatch = { initialAverageAgeDays: 10 };
      const adultBatch = { initialAverageAgeDays: 35 };

      const broodingAlerts = evaluateAlertRules(reading, broodingBatch);
      const coldAlert = broodingAlerts.find(a => a.type === 'COLD_SNAP');
      expect(coldAlert).toBeDefined();
      expect(coldAlert.advice).toContain('auxiliary brooder heaters');

      // Older flocks can regulate body heat at 12°C with proper bedding
      const adultAlerts = evaluateAlertRules(reading, adultBatch);
      expect(adultAlerts.find(a => a.type === 'COLD_SNAP')).toBeUndefined();
    });
  });

  describe('syncAlertsWithHysteresis (Stateful 2-Reading Hysteresis)', () => {
    test('creates and saves new Active alert when condition is met', async () => {
      Alert.findOne.mockResolvedValue(null);

      const savedInstances = [];
      Alert.mockImplementation(function (data) {
        Object.assign(this, data);
        this.save = jest.fn().mockImplementation(async () => {
          savedInstances.push(this);
          return this;
        });
      });

      const hotReading = {
        temperatureC: 34,
        humidityPct: 60,
        heatIndexC: 38,
        forecastMaxC24h: 36,
        apparentTempC: 37,
      };

      const result = await syncAlertsWithHysteresis(farmId, hotReading, batchId);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].type).toBe('HEAT_STRESS');
      expect(result[0].status).toBe('Active');
      expect(result[0].consecutiveSafeReadings).toBe(0);
    });

    test('requires 2 consecutive safe readings before transitioning an Active alert to Cleared', async () => {
      const mockActiveAlert = {
        _id: new mongoose.Types.ObjectId(),
        farmId,
        type: 'HEAT_STRESS',
        status: 'Active',
        consecutiveSafeReadings: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      Alert.findOne.mockImplementation(({ type }) => {
        if (type === 'HEAT_STRESS') return Promise.resolve(mockActiveAlert);
        return Promise.resolve(null);
      });

      const safeReading = {
        temperatureC: 24,
        humidityPct: 50,
        heatIndexC: 24,
        forecastMaxC24h: 26,
        apparentTempC: 24,
      };

      // Reading 1: 1st safe reading -> consecutiveSafeReadings becomes 1, status remains 'Active'
      const activeAfterFirstSafe = await syncAlertsWithHysteresis(farmId, safeReading, batchId);
      expect(mockActiveAlert.consecutiveSafeReadings).toBe(1);
      expect(mockActiveAlert.status).toBe('Active');
      expect(activeAfterFirstSafe).toContain(mockActiveAlert);

      // Reading 2: 2nd consecutive safe reading -> consecutiveSafeReadings becomes 2, status flips to 'Cleared'
      const activeAfterSecondSafe = await syncAlertsWithHysteresis(farmId, safeReading, batchId);
      expect(mockActiveAlert.consecutiveSafeReadings).toBe(2);
      expect(mockActiveAlert.status).toBe('Cleared');
      expect(mockActiveAlert.clearedAt).toBeDefined();
      expect(activeAfterSecondSafe).not.toContain(mockActiveAlert);
    });

    test('resets consecutiveSafeReadings to 0 if hazard returns before reaching 2 safe readings', async () => {
      const mockActiveAlert = {
        _id: new mongoose.Types.ObjectId(),
        farmId,
        type: 'HEAT_STRESS',
        status: 'Active',
        consecutiveSafeReadings: 1, // Had 1 safe reading previously
        save: jest.fn().mockResolvedValue(true),
      };

      Alert.findOne.mockImplementation(({ type }) => {
        if (type === 'HEAT_STRESS') return Promise.resolve(mockActiveAlert);
        return Promise.resolve(null);
      });

      const hotReading = {
        temperatureC: 35,
        humidityPct: 65,
        heatIndexC: 40,
        forecastMaxC24h: 36,
        apparentTempC: 39,
      };

      const result = await syncAlertsWithHysteresis(farmId, hotReading, batchId);
      expect(mockActiveAlert.consecutiveSafeReadings).toBe(0);
      expect(mockActiveAlert.status).toBe('Active');
      expect(result).toContain(mockActiveAlert);
    });
  });
});
