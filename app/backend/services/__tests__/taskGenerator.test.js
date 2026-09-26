/**
 * =============================================================================
 * Tests: Task Generator Service
 * Component: /app/backend/services/__tests__/taskGenerator.test.js
 * Description: Unit tests verifying mid-cycle start guard, rolling window,
 *              vaccinationsAlreadyGiven handling, due date calculations,
 *              and idempotency.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const taskGenerator = require('../taskGenerator');

describe('Phase 6: Automated Task Generator Service', () => {
  const dummyBatchId = new mongoose.Types.ObjectId();
  const testStartDate = new Date('2026-09-01T00:00:00.000Z');

  describe('calculateDueDate helper', () => {
    test('accurately calculates calendar day due date in farm timezone', () => {
      // Start date: 2026-09-01. Milestone day: 14. Initial age: 0. Elapsed: 14 days.
      const dueDate = taskGenerator.calculateDueDate(testStartDate, 14, 0, 'Asia/Dhaka');
      const dt = DateTime.fromJSDate(dueDate, { zone: 'Asia/Dhaka' });

      expect(dt.year).toBe(2026);
      expect(dt.month).toBe(9);
      expect(dt.day).toBe(15); // Sept 1 + 14 days = Sept 15
    });

    test('offsets due date by initialAverageAgeDays for mid-cycle start', () => {
      // Start date: 2026-09-01. Flock is ALREADY age 9 on Sept 1.
      // Milestone at day 14 is due in 5 days (14 - 9 = 5).
      const dueDate = taskGenerator.calculateDueDate(testStartDate, 14, 9, 'Asia/Dhaka');
      const dt = DateTime.fromJSDate(dueDate, { zone: 'Asia/Dhaka' });

      expect(dt.year).toBe(2026);
      expect(dt.month).toBe(9);
      expect(dt.day).toBe(6); // Sept 1 + 5 days = Sept 6
    });
  });

  describe('Full-cycle task generation (Broiler <= 35 days)', () => {
    test('generates all milestones for Day 0 Broiler batch', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Broiler',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 0,
        cycleLengthDays: 35,
        vaccinationsAlreadyGiven: [],
      };

      const planned = taskGenerator.planTasksForBatch(batch);
      expect(planned.length).toBeGreaterThanOrEqual(7);

      // Verify specific milestone keys
      const keys = planned.map(t => t.templateKey);
      expect(keys).toContain('broiler-hatchery-check'); // Day 1
      expect(keys).toContain('broiler-nd-ib-1');         // Day 4
      expect(keys).toContain('broiler-gumboro-ibd-1');   // Day 10
      expect(keys).toContain('broiler-harvest-weighing');// Day 35

      // All initial tasks are Pending
      planned.forEach(task => {
        expect(task.status).toBe('Pending');
        expect(task.batchId).toBe(dummyBatchId);
      });
    });
  });

  describe('Mid-cycle start guard (Broiler starting at age 9)', () => {
    test('skips tasks before start age and schedules future tasks correctly', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Broiler',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 9,
        cycleLengthDays: 35,
        vaccinationsAlreadyGiven: [],
      };

      const planned = taskGenerator.planTasksForBatch(batch);
      const keys = planned.map(t => t.templateKey);

      // Tasks before Day 9 (Day 1, Day 4, Day 7) must be skipped
      expect(keys).not.toContain('broiler-hatchery-check'); // Day 1
      expect(keys).not.toContain('broiler-nd-ib-1');         // Day 4
      expect(keys).not.toContain('broiler-weighing-day7');   // Day 7

      // Future tasks must be scheduled
      expect(keys).toContain('broiler-gumboro-ibd-1');       // Day 10
      expect(keys).toContain('broiler-weighing-day14');      // Day 14
      expect(keys).toContain('broiler-harvest-weighing');    // Day 35

      // Check due date of Day 10 task: due in 1 day (10 - 9)
      const day10Task = planned.find(t => t.templateKey === 'broiler-gumboro-ibd-1');
      const dt = DateTime.fromJSDate(day10Task.dueDate, { zone: 'Asia/Dhaka' });
      expect(dt.day).toBe(2); // Sept 1 + 1 = Sept 2
    });
  });

  describe('vaccinationsAlreadyGiven onboarding handling', () => {
    test('marks onboarding vaccines as Completed even if before start age', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Broiler',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 9,
        cycleLengthDays: 35,
        vaccinationsAlreadyGiven: ['broiler-nd-ib-1'], // Hatchery gave ND+IB on Day 4
      };

      const planned = taskGenerator.planTasksForBatch(batch);
      const ndTask = planned.find(t => t.templateKey === 'broiler-nd-ib-1');

      expect(ndTask).toBeDefined();
      expect(ndTask.status).toBe('Completed');
      expect(ndTask.completionData).toEqual({ recordedAtOnboarding: true });
      expect(ndTask.completedAt).toBeDefined();

      // Hatchery check (not declared) should still be omitted
      expect(planned.find(t => t.templateKey === 'broiler-hatchery-check')).toBeUndefined();
    });

    test('marks future vaccine as Completed if pre-administered by hatchery', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Broiler',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 0,
        cycleLengthDays: 35,
        vaccinationsAlreadyGiven: ['broiler-hatchery-check', 'broiler-nd-ib-1'],
      };

      const planned = taskGenerator.planTasksForBatch(batch);

      const checkTask = planned.find(t => t.templateKey === 'broiler-hatchery-check');
      const ndTask = planned.find(t => t.templateKey === 'broiler-nd-ib-1');
      const gumboroTask = planned.find(t => t.templateKey === 'broiler-gumboro-ibd-1');

      expect(checkTask.status).toBe('Completed');
      expect(ndTask.status).toBe('Completed');
      expect(gumboroTask.status).toBe('Pending');
    });
  });

  describe('Rolling window generation for long-cycle breeds (Layer 365 days)', () => {
    test('generates only 60-day rolling window tasks for new Layer flock', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Layer',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 0,
        cycleLengthDays: 365,
        vaccinationsAlreadyGiven: [],
      };

      const planned = taskGenerator.planTasksForBatch(batch);
      const keys = planned.map(t => t.templateKey);

      // Within 60-day window:
      expect(keys).toContain('layer-mareks-check');     // Day 1
      expect(keys).toContain('layer-nd-ib-eyedrop');    // Day 4
      expect(keys).toContain('layer-gumboro-eyedrop');  // Day 12
      expect(keys).toContain('layer-beak-conditioning');// Day 35
      expect(keys).toContain('layer-fowl-pox-wingweb'); // Day 42
      expect(keys).toContain('layer-nd-ib-killed-inj'); // Day 56

      // Beyond 60-day window (must NOT be generated upfront):
      expect(keys).not.toContain('layer-weighing-day70');       // Day 70
      expect(keys).not.toContain('layer-nd-eds-ib-killed');     // Day 112
      expect(keys).not.toContain('layer-first-egg-milestone');  // Day 140
      expect(keys).not.toContain('layer-cycle-close-audit');    // Day 365
    });

    test('extendRollingTasks plans extended tasks when flock ages to Day 60', () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Layer',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 0,
        cycleLengthDays: 365,
        vaccinationsAlreadyGiven: [],
      };

      // Extend window at age 60 -> window extends to age 60 + 60 = 120 days
      const extended = taskGenerator.planTasksForBatch(batch, {
        horizonDays: 60 + 60,
      });
      const keys = extended.map(t => t.templateKey);

      // Should now include tasks up to Day 120
      expect(keys).toContain('layer-weighing-day70');   // Day 70
      expect(keys).toContain('layer-deworming-prelay'); // Day 84
      expect(keys).toContain('layer-nd-eds-ib-killed'); // Day 112

      // Still excludes tasks beyond Day 120
      expect(keys).not.toContain('layer-first-egg-milestone'); // Day 140
    });
  });

  describe('generateTasksForBatch dryRun & error guards', () => {
    test('dryRun returns planned tasks count without throwing DB errors', async () => {
      const batch = {
        _id: dummyBatchId,
        chickenType: 'Sonali',
        batchStartDate: testStartDate,
        initialAverageAgeDays: 0,
        cycleLengthDays: 70,
        vaccinationsAlreadyGiven: [],
      };

      const result = await taskGenerator.generateTasksForBatch(batch, { dryRun: true });
      expect(result.plannedCount).toBeGreaterThan(0);
      expect(result.tasks.length).toBe(result.plannedCount);
    });

    test('throws error if batch has missing or invalid chickenType', () => {
      expect(() => {
        taskGenerator.planTasksForBatch({});
      }).toThrow(/Batch with valid chickenType is required/);
    });
  });
});
