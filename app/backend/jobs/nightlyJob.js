/**
 * =============================================================================
 * Module: Nightly Operations & Task Synchronization Cron Job
 * Component: /app/backend/jobs/nightlyJob.js
 * Description: Nightly batch maintenance job:
 *              1. Synchronizes task states: marks past-due 'Pending' tasks as 'Overdue'.
 *              2. Extends rolling task horizon for long-cycle breeds (Layer, Sonali, Desi, Cock).
 *              3. Re-evaluates flock status across all active batches.
 * =============================================================================
 */

'use strict';

const cron = require('node-cron');
const { DateTime } = require('luxon');
const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Task = require('../models/Task');
const ageCalc = require('../utils/ageCalc');
const taskGenerator = require('../services/taskGenerator');
const statusEvaluator = require('../services/statusEvaluator');
const thresholds = require('../config/thresholds');
const { store } = require('../config/inMemoryStore');

const isDbConnected = () => (mongoose.connection && mongoose.connection.readyState === 1) || process.env.NODE_ENV === 'test';

/**
 * Runs the nightly synchronization routine across all active batches.
 *
 * @param {object} [options={}]
 * @param {DateTime|Date} [options.now] - Injectable clock for tests
 * @returns {Promise<object>} Run summary statistics
 */
async function runNightlyJob(options = {}) {
  const zone = thresholds.defaultTimezone;
  const nowDt = options.now
    ? (options.now instanceof DateTime ? options.now.setZone(zone) : DateTime.fromJSDate(new Date(options.now), { zone }))
    : DateTime.now().setZone(zone);

  console.log(`[NightlyJob] Starting nightly flock sync at ${nowDt.toISO()}...`);

  let activeBatches = [];
  if (isDbConnected()) {
    try {
      activeBatches = await Batch.find({ status: 'Active' });
    } catch (e) {
      console.warn('[NightlyJob] DB query failed, using in-memory batches:', e.message);
      activeBatches = Array.from(store.batches.values()).filter(b => b.status === 'Active');
    }
  } else {
    activeBatches = Array.from(store.batches.values()).filter(b => b.status === 'Active');
  }
  let tasksMarkedOverdue = 0;
  let batchesExtended = 0;
  let batchesEvaluated = 0;
  let batchesAttentionRequired = 0;

  for (const batch of activeBatches) {
    try {
      // 1. Mark pending tasks whose due date has passed as 'Overdue'
      const overdueUpdate = await Task.updateMany(
        {
          batchId: batch._id,
          status: 'Pending',
          dueDate: { $lt: nowDt.toJSDate() },
        },
        {
          $set: { status: 'Overdue' },
        }
      );
      tasksMarkedOverdue += overdueUpdate.modifiedCount || 0;

      // 2. Extend rolling task window for breeds with long cycles
      const { ageDays: currentAge } = ageCalc.currentAge(batch, zone, nowDt);
      if (batch.cycleLengthDays > thresholds.fullCycleGenerationMaxDays) {
        const extendResult = await taskGenerator.extendRollingTasks(batch, currentAge);
        if (extendResult.insertedCount > 0) {
          batchesExtended++;
        }
      }

      // 3. Re-evaluate status
      const evaluation = await statusEvaluator.evaluateBatchStatusFromDb(batch._id, { now: nowDt, zone });
      batchesEvaluated++;
      if (evaluation.status === 'Attention Required') {
        batchesAttentionRequired++;
      }
    } catch (batchErr) {
      console.error(`[NightlyJob] Error processing batch ${batch._id}:`, batchErr.message);
    }
  }

  const summary = {
    activeBatchesCount: activeBatches.length,
    tasksMarkedOverdue,
    batchesExtended,
    batchesEvaluated,
    batchesAttentionRequired,
    completedAt: nowDt.toJSDate(),
  };

  console.log(`[NightlyJob] Completed: ${JSON.stringify(summary)}`);
  return summary;
}

/**
 * Initializes the node-cron scheduled job (runs every night at 00:05 Asia/Dhaka time).
 */
function initNightlyCron() {
  // Cron expression: 5 minutes past midnight (00:05) every day
  const cronExpression = '5 0 * * *';

  cron.schedule(cronExpression, async () => {
    try {
      await runNightlyJob();
    } catch (err) {
      console.error('[NightlyJob] Scheduled run encountered an error:', err);
    }
  }, {
    timezone: thresholds.defaultTimezone,
  });

  console.log(`⏰ Nightly maintenance cron scheduled: "${cronExpression}" (${thresholds.defaultTimezone})`);
}

module.exports = {
  runNightlyJob,
  initNightlyCron,
};
