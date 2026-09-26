/**
 * =============================================================================
 * Tests: Global Status Evaluator Engine
 * Component: /app/backend/services/__tests__/statusEvaluator.test.js
 * Description: Exhaustive table-driven unit tests for all 7 reason codes:
 *                1. MORNING_MISSED       (flips without submission after cutoff)
 *                2. EVENING_MISSED       (flips without submission after cutoff)
 *                3. NO_LOG_YESTERDAY     (missing yesterday log for active batch)
 *                4. MORTALITY_HIGH       (high % rate & 2x spike rule)
 *                5. CRITICAL_TASK_OVERDUE (uncompleted critical task past due)
 *                6. RED_FLAG_SYMPTOM     (bloody droppings, respiratory sounds)
 *                7. WEATHER_ALERT        (active environmental hazard)
 * =============================================================================
 */

'use strict';

const { DateTime } = require('luxon');
const mongoose = require('mongoose');
const { evaluateStatus } = require('../statusEvaluator');

describe('Phase 9: Global Status Evaluator Engine', () => {
  const zone = 'Asia/Dhaka';
  const dummyBatchId = new mongoose.Types.ObjectId();

  const getBaseBatch = () => ({
    _id: dummyBatchId,
    farmId: new mongoose.Types.ObjectId(),
    batchName: 'Broiler Batch 1',
    chickenType: 'Broiler',
    initialChickens: 500,
    cumulativeMortality: 0,
    batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
    morningCutoffHour: 11,
    eveningCutoffHour: 20,
    status: 'Active',
  });

  const getFullTodayLog = (nowIso = '2026-09-10T12:00:00') => ({
    batchId: dummyBatchId,
    logDay: '2026-09-10',
    morning: { feedCompleted: true, waterRefilled: true, completedAt: new Date(nowIso) },
    evening: { feedCompleted: true, completedAt: new Date(nowIso) },
    feedAmountKg: 40,
    mortalityCount: 0,
    liveBirdsEndOfDay: 500,
    observedSymptoms: [],
  });

  const getYesterdayLog = () => ({
    batchId: dummyBatchId,
    logDay: '2026-09-09',
    feedAmountKg: 38,
    mortalityCount: 1,
    liveBirdsEndOfDay: 500,
  });

  test('returns "Looks Good" with empty reasons when all parameters are healthy', () => {
    // 14:00 (morning done, evening not due yet)
    const now = DateTime.fromISO('2026-09-10T14:00:00', { zone });
    const todayLog = {
      ...getFullTodayLog(),
      evening: { feedCompleted: false, completedAt: null }, // not evening yet
    };

    const res = evaluateStatus({
      batch: getBaseBatch(),
      todayLog,
      yesterdayLog: getYesterdayLog(),
      now,
      zone,
    });

    expect(res.status).toBe('Looks Good');
    expect(res.reasons.length).toBe(0);
  });

  describe('Reason 1: MORNING_MISSED', () => {
    test('flips to Attention Required at or after 11:00 without submission', () => {
      // 11:15 in Dhaka — morning check-in has NOT been submitted
      const now = DateTime.fromISO('2026-09-10T11:15:00', { zone });

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: null, // No submission made!
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      expect(res.status).toBe('Attention Required');
      const reason = res.reasons.find(r => r.code === 'MORNING_MISSED');
      expect(reason).toBeDefined();
      expect(reason.severity).toBe('Warning');
    });

    test('does NOT trigger before 11:00 cutoff', () => {
      // 09:30 in Dhaka — morning not completed yet, but cutoff has not passed
      const now = DateTime.fromISO('2026-09-10T09:30:00', { zone });

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: null,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'MORNING_MISSED')).toBeUndefined();
    });

    test('clears when morning routine has been submitted', () => {
      const now = DateTime.fromISO('2026-09-10T11:15:00', { zone });
      const todayLog = {
        batchId: dummyBatchId,
        logDay: '2026-09-10',
        morning: { feedCompleted: true, waterRefilled: true, completedAt: new Date() },
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'MORNING_MISSED')).toBeUndefined();
    });
  });

  describe('Reason 2: EVENING_MISSED', () => {
    test('flips to Attention Required at or after 20:00 without evening submission', () => {
      // 20:30 in Dhaka — evening not completed
      const now = DateTime.fromISO('2026-09-10T20:30:00', { zone });
      const todayLog = {
        batchId: dummyBatchId,
        logDay: '2026-09-10',
        morning: { feedCompleted: true, waterRefilled: true, completedAt: new Date() },
        evening: { feedCompleted: false, completedAt: null },
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      expect(res.status).toBe('Attention Required');
      expect(res.reasons.find(r => r.code === 'EVENING_MISSED')).toBeDefined();
    });

    test('does NOT trigger before 20:00 cutoff', () => {
      const now = DateTime.fromISO('2026-09-10T18:45:00', { zone });
      const todayLog = {
        batchId: dummyBatchId,
        logDay: '2026-09-10',
        morning: { feedCompleted: true, waterRefilled: true, completedAt: new Date() },
        evening: { feedCompleted: false, completedAt: null },
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'EVENING_MISSED')).toBeUndefined();
    });
  });

  describe('Reason 3: NO_LOG_YESTERDAY', () => {
    test('triggers if yesterdayLog is missing for an established batch', () => {
      const now = DateTime.fromISO('2026-09-10T09:00:00', { zone });
      const batch = { ...getBaseBatch(), batchStartDate: new Date('2026-09-01T00:00:00.000Z') };

      const res = evaluateStatus({
        batch,
        todayLog: null,
        yesterdayLog: null, // Missed yesterday!
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'NO_LOG_YESTERDAY')).toBeDefined();
    });

    test('does NOT trigger on Day 0 of placement (no yesterday existed)', () => {
      // Batch started on 2026-09-10. Today is 2026-09-10. Yesterday flock did not exist.
      const now = DateTime.fromISO('2026-09-10T09:00:00', { zone });
      const batch = { ...getBaseBatch(), batchStartDate: new Date('2026-09-10T00:00:00.000Z') };

      const res = evaluateStatus({
        batch,
        todayLog: null,
        yesterdayLog: null,
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'NO_LOG_YESTERDAY')).toBeUndefined();
    });
  });

  describe('Reason 4: MORTALITY_HIGH', () => {
    test('triggers on high percentage mortality (> 0.5% / day)', () => {
      // 5 deaths in 500 birds = 1.0% (> 0.5% threshold)
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const todayLog = {
        ...getFullTodayLog(),
        mortalityCount: 5,
        liveBirdsEndOfDay: 495,
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      const reason = res.reasons.find(r => r.code === 'MORTALITY_HIGH');
      expect(reason).toBeDefined();
      expect(reason.severity).toBe('Critical');
      expect(reason.mortalityCount).toBe(5);
    });

    test('triggers on 2x spike vs trailing 3-day average with at least 5 birds', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      // Trailing 3 days had 2, 2, 2 deaths (avg = 2)
      const trailingLogs = [
        { mortalityCount: 2 },
        { mortalityCount: 2 },
        { mortalityCount: 2 },
      ];

      // Today has 6 deaths (6 >= 2 * avg && 6 >= 5 min birds)
      // Even in a 2000-bird flock (where 6 / 2000 = 0.3% < 0.5%), spike rule triggers!
      const todayLog = {
        ...getFullTodayLog(),
        mortalityCount: 6,
        liveBirdsEndOfDay: 1994,
      };

      const res = evaluateStatus({
        batch: { ...getBaseBatch(), initialChickens: 2000 },
        todayLog,
        yesterdayLog: getYesterdayLog(),
        trailingLogs,
        now,
        zone,
      });

      const reason = res.reasons.find(r => r.code === 'MORTALITY_HIGH');
      expect(reason).toBeDefined();
      expect(reason.isSpike).toBe(true);
    });
  });

  describe('Reason 5: CRITICAL_TASK_OVERDUE', () => {
    test('triggers when a critical task is past its due date and not completed', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const overdueTask = {
        _id: 'task_gumboro',
        title: 'Gumboro Vaccine Eye-drop',
        isCritical: true,
        dueDate: new Date('2026-09-08T00:00:00.000Z'), // 2 days ago
        status: 'Pending',
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: getFullTodayLog(),
        yesterdayLog: getYesterdayLog(),
        tasks: [overdueTask],
        now,
        zone,
      });

      const reason = res.reasons.find(r => r.code === 'CRITICAL_TASK_OVERDUE');
      expect(reason).toBeDefined();
      expect(reason.severity).toBe('Critical');
      expect(reason.message).toContain('Gumboro Vaccine Eye-drop');
    });

    test('does NOT trigger for non-critical overdue tasks', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const nonCriticalTask = {
        _id: 'task_weigh',
        title: 'Weekly Weighing',
        isCritical: false, // non-critical
        dueDate: new Date('2026-09-08T00:00:00.000Z'),
        status: 'Pending',
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: getFullTodayLog(),
        yesterdayLog: getYesterdayLog(),
        tasks: [nonCriticalTask],
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'CRITICAL_TASK_OVERDUE')).toBeUndefined();
    });
  });

  describe('Reason 6: RED_FLAG_SYMPTOM', () => {
    test('triggers when red flag symptoms (bloody_droppings, respiratory_sounds) are reported', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const todayLog = {
        ...getFullTodayLog(),
        observedSymptoms: ['bloody_droppings'],
      };

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog,
        yesterdayLog: getYesterdayLog(),
        now,
        zone,
      });

      const reason = res.reasons.find(r => r.code === 'RED_FLAG_SYMPTOM');
      expect(reason).toBeDefined();
      expect(reason.severity).toBe('Critical');
      expect(reason.symptoms).toContain('bloody_droppings');
    });
  });

  describe('Reason 7: WEATHER_ALERT', () => {
    test('triggers when active HEAT_STRESS alert exists for farm', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const weatherAlerts = [
        {
          type: 'HEAT_STRESS',
          severity: 'Critical',
          message: 'Ambient heat index exceeds 38°C.',
          status: 'Active',
        },
      ];

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: getFullTodayLog(),
        yesterdayLog: getYesterdayLog(),
        weatherAlerts,
        now,
        zone,
      });

      const reason = res.reasons.find(r => r.code === 'WEATHER_ALERT');
      expect(reason).toBeDefined();
      expect(reason.message).toContain('Ambient heat index exceeds 38°C.');
    });

    test('ignores cleared alerts', () => {
      const now = DateTime.fromISO('2026-09-10T12:00:00', { zone });
      const weatherAlerts = [
        {
          type: 'HEAT_STRESS',
          severity: 'Critical',
          message: 'Ambient heat index exceeds 38°C.',
          status: 'Cleared',
        },
      ];

      const res = evaluateStatus({
        batch: getBaseBatch(),
        todayLog: getFullTodayLog(),
        yesterdayLog: getYesterdayLog(),
        weatherAlerts,
        now,
        zone,
      });

      expect(res.reasons.find(r => r.code === 'WEATHER_ALERT')).toBeUndefined();
    });
  });
});
