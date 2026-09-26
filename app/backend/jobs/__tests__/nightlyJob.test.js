/**
 * =============================================================================
 * Tests: Nightly Operations & Task Synchronization Job
 * Component: /app/backend/jobs/__tests__/nightlyJob.test.js
 * Description: Unit tests verifying that the nightly job syncs overdue tasks,
 *              extends rolling task horizons, and evaluates statuses.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const { runNightlyJob } = require('../nightlyJob');

jest.mock('../../models/Batch');
jest.mock('../../models/Task');
jest.mock('../../services/taskGenerator');
jest.mock('../../services/statusEvaluator');

const Batch = require('../../models/Batch');
const Task = require('../../models/Task');
const taskGenerator = require('../../services/taskGenerator');
const statusEvaluator = require('../../services/statusEvaluator');

describe('Phase 9: Nightly Job Synchronization', () => {
  const dummyBatchId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('syncs overdue tasks, extends rolling horizons, and evaluates statuses', async () => {
    const activeBatches = [
      {
        _id: dummyBatchId,
        chickenType: 'Sonali',
        cycleLengthDays: 70, // > 35, uses rolling window
        initialAverageAgeDays: 0,
        batchStartDate: new Date('2026-09-01T00:00:00.000Z'),
        status: 'Active',
      },
    ];

    Batch.find.mockResolvedValue(activeBatches);
    Task.updateMany.mockResolvedValue({ modifiedCount: 3 });
    taskGenerator.extendRollingTasks.mockResolvedValue({ insertedCount: 2 });
    statusEvaluator.evaluateBatchStatusFromDb.mockResolvedValue({
      status: 'Attention Required',
      reasons: [{ code: 'MORNING_MISSED' }],
    });

    const summary = await runNightlyJob({
      now: new Date('2026-09-10T00:05:00.000Z'),
    });

    expect(summary.activeBatchesCount).toBe(1);
    expect(summary.tasksMarkedOverdue).toBe(3);
    expect(summary.batchesExtended).toBe(1);
    expect(summary.batchesEvaluated).toBe(1);
    expect(summary.batchesAttentionRequired).toBe(1);

    expect(Task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: dummyBatchId,
        status: 'Pending',
      }),
      expect.objectContaining({
        $set: { status: 'Overdue' },
      })
    );

    expect(taskGenerator.extendRollingTasks).toHaveBeenCalled();
    expect(statusEvaluator.evaluateBatchStatusFromDb).toHaveBeenCalledWith(dummyBatchId, expect.any(Object));
  });
});
