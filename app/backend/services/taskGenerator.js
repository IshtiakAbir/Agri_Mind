/**
 * =============================================================================
 * Module: Automated Task Generator Service
 * Component: /app/backend/services/taskGenerator.js
 * Description: Generates scheduled flock management tasks (vaccines, feed
 *              transitions, weighings, medications) for a batch based on its
 *              breed lifecycle template.
 *
 * Core capabilities:
 *   1. Mid-cycle start guard:
 *      - Milestones before flock start age (day < initialAverageAgeDays) are skipped.
 *      - Milestones declared in vaccinationsAlreadyGiven are marked Completed.
 *   2. Rolling task window:
 *      - Full cycle generated upfront for short cycles (Broiler <= 35 days).
 *      - 60-day rolling window for long-cycle breeds (Layer, Desi, Cock, Sonali).
 *   3. Idempotent bulk writes:
 *      - Uses $setOnInsert keyed on (batchId, templateKey) so re-runs never
 *        duplicate tasks or overwrite farmer-entered completion data.
 * =============================================================================
 */

'use strict';

const { DateTime } = require('luxon');
const Task = require('../models/Task');
const templateLoader = require('./templateLoader');
const thresholds = require('../config/thresholds');

/**
 * Computes the due date for a milestone relative to batch start date and flock start age.
 *
 * @param {Date|string} batchStartDate - Normalised calendar start date
 * @param {number} milestoneDay - Target flock age in days for the task
 * @param {number} initialAverageAgeDays - Flock age at batch registration
 * @param {string} [zone='Asia/Dhaka'] - Farm local timezone
 * @returns {Date} JavaScript Date object representing due date at start of farm day
 */
function calculateDueDate(batchStartDate, milestoneDay, initialAverageAgeDays = 0, zone = thresholds.defaultTimezone) {
  const elapsedDays = Math.max(0, milestoneDay - initialAverageAgeDays);
  const start = DateTime.fromJSDate(new Date(batchStartDate), { zone }).startOf('day');
  return start.plus({ days: elapsedDays }).toJSDate();
}

/**
 * Determines which tasks should be scheduled for a batch and builds task definitions.
 * Pure planning function without side effects.
 *
 * @param {object} batch - Batch object or document
 * @param {object} [options={}] - Configuration options
 * @param {number} [options.horizonDays] - Max flock age up to which to generate tasks
 * @param {string} [options.zone] - Farm timezone
 * @returns {Array<object>} Array of raw task definitions ready for insertion
 */
function planTasksForBatch(batch, options = {}) {
  if (!batch || !batch.chickenType) {
    throw new Error('Batch with valid chickenType is required to generate tasks.');
  }

  const zone = options.zone || thresholds.defaultTimezone;
  const initialAge = Math.max(0, batch.initialAverageAgeDays || 0);
  const cycleLength = batch.cycleLengthDays || 35;
  const alreadyGiven = new Set(batch.vaccinationsAlreadyGiven || []);

  // Determine horizon: full cycle for short cycles; rolling window for long cycles
  let horizonDays;
  if (options.horizonDays !== undefined) {
    horizonDays = options.horizonDays;
  } else if (cycleLength <= thresholds.fullCycleGenerationMaxDays) {
    horizonDays = cycleLength;
  } else {
    horizonDays = Math.min(cycleLength, initialAge + thresholds.taskRollingWindowDays);
  }

  const template = templateLoader.getTemplate(batch.chickenType);
  const plannedTasks = [];

  for (const stage of template.stages) {
    for (const milestone of (stage.milestones || [])) {
      const milestoneDay = milestone.day;
      const isAlreadyGiven = alreadyGiven.has(milestone.key);

      // Mid-cycle start logic:
      // If milestone day < initial start age and NOT in vaccinationsAlreadyGiven:
      // Skip it to avoid creating false overdue tasks.
      if (milestoneDay < initialAge) {
        if (isAlreadyGiven) {
          plannedTasks.push({
            batchId: batch._id,
            templateKey: milestone.key,
            title: milestone.title,
            category: milestone.category,
            dayNumber: milestoneDay,
            dueDate: calculateDueDate(batch.batchStartDate, milestoneDay, initialAge, zone),
            isCritical: !!milestone.critical,
            status: 'Completed',
            completedAt: new Date(batch.batchStartDate),
            completionData: { recordedAtOnboarding: true },
            instructions: milestone.instructions || '',
          });
        }
        continue;
      }

      // If milestone exceeds the current horizon window, skip for now
      if (milestoneDay > horizonDays) {
        continue;
      }

      // Task is due within the generation horizon
      const dueDate = calculateDueDate(batch.batchStartDate, milestoneDay, initialAge, zone);

      let status = 'Pending';
      let completedAt = null;
      let completionData = null;

      if (isAlreadyGiven) {
        status = 'Completed';
        completedAt = new Date(batch.batchStartDate);
        completionData = { recordedAtOnboarding: true };
      }

      plannedTasks.push({
        batchId: batch._id,
        templateKey: milestone.key,
        title: milestone.title,
        category: milestone.category,
        dayNumber: milestoneDay,
        dueDate,
        isCritical: !!milestone.critical,
        status,
        completedAt,
        completionData,
        instructions: milestone.instructions || '',
      });
    }
  }

  return plannedTasks;
}

/**
 * Generates and persists scheduled tasks for a batch.
 * Idempotent: can be called multiple times without duplicate creation or
 * overwriting already-completed tasks.
 *
 * @param {object} batch - Batch object or Mongoose document
 * @param {object} [options={}] - Options
 * @param {boolean} [options.dryRun=false] - If true, returns planned tasks without DB writes
 * @returns {Promise<object>} Summary of planned and created tasks
 */
async function generateTasksForBatch(batch, options = {}) {
  const plannedTasks = planTasksForBatch(batch, options);

  if (options.dryRun || plannedTasks.length === 0) {
    return {
      plannedCount: plannedTasks.length,
      insertedCount: 0,
      tasks: plannedTasks,
    };
  }

  // Idempotent bulk insertion using $setOnInsert
  const bulkOps = plannedTasks.map(task => ({
    updateOne: {
      filter: {
        batchId: task.batchId,
        templateKey: task.templateKey,
      },
      update: {
        $setOnInsert: task,
      },
      upsert: true,
    },
  }));

  const result = await Task.bulkWrite(bulkOps, { ordered: false });

  return {
    plannedCount: plannedTasks.length,
    insertedCount: result.upsertedCount || 0,
    matchedCount: result.matchedCount || 0,
    tasks: plannedTasks,
  };
}

/**
 * Extends the rolling task window for a long-cycle batch (called by nightly cron job).
 *
 * @param {object} batch - Batch document
 * @param {number} currentAgeDays - Current flock age
 * @param {object} [options={}] - Options
 * @returns {Promise<object>} Result summary
 */
async function extendRollingTasks(batch, currentAgeDays, options = {}) {
  const newHorizon = Math.min(
    batch.cycleLengthDays || 365,
    currentAgeDays + thresholds.taskRollingWindowDays
  );

  return generateTasksForBatch(batch, {
    ...options,
    horizonDays: newHorizon,
  });
}

module.exports = {
  calculateDueDate,
  planTasksForBatch,
  generateTasksForBatch,
  extendRollingTasks,
};
