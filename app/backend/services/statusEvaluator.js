/**
 * =============================================================================
 * Module: Global Status Evaluator Engine
 * Component: /app/backend/services/statusEvaluator.js
 * Description: Evaluates the real-time health and operational status of a flock.
 *              Evaluates against all 7 standardized reason codes:
 *                1. MORNING_MISSED       (past cutoff hour without check-in)
 *                2. EVENING_MISSED       (past cutoff hour without check-in)
 *                3. NO_LOG_YESTERDAY     (missing yesterday log for active batch)
 *                4. MORTALITY_HIGH       (exceeds % threshold or 2x 3-day spike)
 *                5. CRITICAL_TASK_OVERDUE (uncompleted critical milestone past due)
 *                6. RED_FLAG_SYMPTOM     (bloody droppings, respiratory sounds, etc.)
 *                7. WEATHER_ALERT        (active environmental risk alert)
 *
 *              Output:
 *                status: 'Looks Good' (reasons.length === 0) | 'Attention Required'
 *                reasons: Array<{ code, message, severity, ... }>
 * =============================================================================
 */

'use strict';

const { DateTime } = require('luxon');
const DailyLog = require('../models/DailyLog');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const Batch = require('../models/Batch');
const thresholds = require('../config/thresholds');

const RED_FLAG_SYMPTOMS = [
  'bloody_droppings',
  'respiratory_sounds',
  'sudden_death_cluster',
];

/**
 * Pure evaluation function without database side-effects.
 *
 * @param {object} params
 * @param {object} params.batch - The batch document/object
 * @param {object|null} params.todayLog - Today's DailyLog document
 * @param {object|null} params.yesterdayLog - Yesterday's DailyLog document
 * @param {Array<object>} [params.trailingLogs=[]] - Preceding 3 days DailyLogs (for spike calculation)
 * @param {Array<object>} [params.tasks=[]] - Batch tasks
 * @param {Array<object>} [params.weatherAlerts=[]] - Active weather/farm alerts
 * @param {DateTime|Date|string} [params.now] - Injectable clock for deterministic tests
 * @param {string} [params.zone] - Farm timezone (default: Asia/Dhaka)
 * @returns {{ status: 'Looks Good'|'Attention Required', reasons: Array<object>, evaluatedAt: Date }}
 */
function evaluateStatus(params = {}) {
  const {
    batch,
    todayLog = null,
    yesterdayLog = null,
    trailingLogs = [],
    tasks = [],
    weatherAlerts = [],
    zone = thresholds.defaultTimezone,
  } = params;

  if (!batch) {
    throw new Error('statusEvaluator: batch object is required.');
  }

  // Parse clock into Luxon DateTime
  let nowDt;
  if (params.now) {
    nowDt = params.now instanceof DateTime
      ? params.now.setZone(zone)
      : DateTime.fromJSDate(new Date(params.now), { zone });
  } else {
    nowDt = DateTime.now().setZone(zone);
  }

  const currentHour = nowDt.hour;
  const reasons = [];

  // If batch is Closed, it does not evaluate active check-ins or tasks
  if (batch.status === 'Closed') {
    return {
      status: 'Closed',
      reasons: [],
      evaluatedAt: nowDt.toJSDate(),
    };
  }

  // ─── 1. MORNING_MISSED ──────────────────────────────────────────────────────
  const morningCutoff = batch.morningCutoffHour !== undefined
    ? batch.morningCutoffHour
    : thresholds.morningCutoffHour;

  if (currentHour >= morningCutoff) {
    const morningComplete = !!(
      todayLog && (
        (todayLog.morning && todayLog.morning.completedAt) ||
        (todayLog.morningRoutine && (todayLog.morningRoutine.completedAt || todayLog.morningRoutine.completed))
      )
    );
    if (!morningComplete) {
      reasons.push({
        code: 'MORNING_MISSED',
        message: `Morning routine was not submitted by the ${morningCutoff}:00 cutoff.`,
        severity: 'Warning',
      });
    }
  }

  // ─── 2. EVENING_MISSED ──────────────────────────────────────────────────────
  const eveningCutoff = batch.eveningCutoffHour !== undefined
    ? batch.eveningCutoffHour
    : thresholds.eveningCutoffHour;

  if (currentHour >= eveningCutoff) {
    const eveningComplete = !!(
      todayLog && (
        (todayLog.evening && todayLog.evening.completedAt) ||
        (todayLog.eveningRoutine && (todayLog.eveningRoutine.completedAt || todayLog.eveningRoutine.completed))
      )
    );
    if (!eveningComplete) {
      reasons.push({
        code: 'EVENING_MISSED',
        message: `Evening routine was not submitted by the ${eveningCutoff}:00 cutoff.`,
        severity: 'Warning',
      });
    }
  }

  // ─── 3. NO_LOG_YESTERDAY ────────────────────────────────────────────────────
  if (batch.batchStartDate) {
    const batchStartDt = DateTime.fromJSDate(new Date(batch.batchStartDate), { zone }).startOf('day');
    const yesterdayDt = nowDt.minus({ days: 1 }).startOf('day');

    // Only flag missing yesterday log if the flock was already placed yesterday
    if (yesterdayDt >= batchStartDt) {
      if (!yesterdayLog) {
        reasons.push({
          code: 'NO_LOG_YESTERDAY',
          message: 'No daily log was submitted for yesterday.',
          severity: 'Warning',
        });
      }
    }
  }

  // ─── 4. MORTALITY_HIGH ──────────────────────────────────────────────────────
  if (todayLog && todayLog.mortalityCount > 0) {
    const todayMortality = todayLog.mortalityCount;

    // Calculate baseline live birds
    let liveBirds;
    if (typeof todayLog.liveBirdsEndOfDay === 'number') {
      liveBirds = todayLog.liveBirdsEndOfDay + todayMortality;
    } else {
      liveBirds = Math.max(0, (batch.initialChickens || 0) - (batch.cumulativeMortality || 0) + todayMortality);
    }

    const mortalityPct = liveBirds > 0 ? (todayMortality / liveBirds) * 100 : 0;
    const thresholdPct = thresholds.mortalityThresholdPct || 0.5;

    // Spike test against trailing average
    let isSpike = false;
    if (trailingLogs && trailingLogs.length > 0) {
      const sumTrailing = trailingLogs.reduce((acc, l) => acc + (l.mortalityCount || 0), 0);
      const avgTrailing = sumTrailing / trailingLogs.length;

      if (
        todayMortality >= (thresholds.mortalitySpikeMinBirds || 5) &&
        todayMortality >= avgTrailing * (thresholds.mortalitySpikeFactor || 2)
      ) {
        isSpike = true;
      }
    }

    if (mortalityPct >= thresholdPct || isSpike) {
      reasons.push({
        code: 'MORTALITY_HIGH',
        message: isSpike
          ? `Mortality spike: ${todayMortality} birds died today (2× the 3-day average).`
          : `High flock mortality: ${todayMortality} birds died today (${mortalityPct.toFixed(1)}% of flock).`,
        severity: 'Critical',
        mortalityCount: todayMortality,
        mortalityPct: Number(mortalityPct.toFixed(2)),
        isSpike,
      });
    }
  }

  // ─── 5. CRITICAL_TASK_OVERDUE ───────────────────────────────────────────────
  const taskList = Array.isArray(tasks) ? tasks : [];
  const overdueCriticalTasks = taskList.filter(task => {
    if (!task.isCritical) return false;
    if (task.status === 'Completed' || task.status === 'Skipped') return false;

    if (task.status === 'Overdue') return true;

    // Check if dueDate is in the past
    if (task.dueDate) {
      return nowDt.toJSDate() > new Date(task.dueDate);
    }
    return false;
  });

  if (overdueCriticalTasks.length > 0) {
    reasons.push({
      code: 'CRITICAL_TASK_OVERDUE',
      message: `Critical task overdue: ${overdueCriticalTasks.map(t => t.title).join(', ')}.`,
      severity: 'Critical',
      taskCount: overdueCriticalTasks.length,
      tasks: overdueCriticalTasks.map(t => ({
        id: t._id,
        title: t.title,
        dueDate: t.dueDate,
      })),
    });
  }

  // ─── 6. RED_FLAG_SYMPTOM ────────────────────────────────────────────────────
  if (todayLog && Array.isArray(todayLog.observedSymptoms)) {
    const presentRedFlags = todayLog.observedSymptoms.filter(s => RED_FLAG_SYMPTOMS.includes(s));
    if (presentRedFlags.length > 0) {
      reasons.push({
        code: 'RED_FLAG_SYMPTOM',
        message: `Red flag clinical symptoms reported today: ${presentRedFlags.join(', ')}. Consult a poultry veterinarian immediately.`,
        severity: 'Critical',
        symptoms: presentRedFlags,
      });
    }
  }

  // ─── 7. WEATHER_ALERT ───────────────────────────────────────────────────────
  const alertList = Array.isArray(weatherAlerts) ? weatherAlerts : [];
  const activeWeatherAlerts = alertList.filter(alert => alert && alert.status === 'Active');
  if (activeWeatherAlerts.length > 0) {
    reasons.push({
      code: 'WEATHER_ALERT',
      message: `Active weather advisory: ${activeWeatherAlerts.map(a => a.message).join(' | ')}`,
      severity: activeWeatherAlerts.some(a => a.severity === 'Critical') ? 'Critical' : 'Warning',
      alertCount: activeWeatherAlerts.length,
      alerts: activeWeatherAlerts.map(a => ({
        type: a.type,
        severity: a.severity,
        message: a.message,
      })),
    });
  }

  const status = reasons.length === 0 ? 'Looks Good' : 'Attention Required';

  return {
    status,
    reasons,
    evaluatedAt: nowDt.toJSDate(),
  };
}

/**
 * Convenience helper that queries MongoDB for a batch and evaluates status.
 *
 * @param {string|ObjectId} batchId
 * @param {object} [options={}]
 * @returns {Promise<object>} Evaluation results
 */
async function evaluateBatchStatusFromDb(batchId, options = {}) {
  const zone = options.zone || thresholds.defaultTimezone;
  const nowDt = options.now
    ? (options.now instanceof DateTime ? options.now.setZone(zone) : DateTime.fromJSDate(new Date(options.now), { zone }))
    : DateTime.now().setZone(zone);

  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw new Error(`Batch not found with ID: ${batchId}`);
  }

  const todayStr = nowDt.toFormat('yyyy-MM-dd');
  const yesterdayStr = nowDt.minus({ days: 1 }).toFormat('yyyy-MM-dd');

  // Query database safely
  let todayLog = null;
  let yesterdayLog = null;
  let trailingLogs = [];
  let tasks = [];
  let weatherAlerts = [];

  try {
    todayLog = await DailyLog.findOne({ batchId: batch._id, logDay: todayStr });
  } catch (_) {}

  try {
    yesterdayLog = await DailyLog.findOne({ batchId: batch._id, logDay: yesterdayStr });
  } catch (_) {}

  try {
    if (typeof DailyLog.getRecentDays === 'function') {
      const recents = await DailyLog.getRecentDays(batch._id, 4);
      trailingLogs = (recents || []).filter(l => l.logDay !== todayStr).slice(0, 3);
    } else if (DailyLog.find) {
      trailingLogs = await DailyLog.find({ batchId: batch._id, logDay: { $lt: todayStr } })
        .sort({ logDay: -1 })
        .limit(3);
    }
  } catch (_) {}

  try {
    if (Task.find) {
      const res = await Task.find({ batchId: batch._id, isCritical: true, status: { $in: ['Pending', 'Overdue'] } });
      tasks = Array.isArray(res) ? res : [];
    }
  } catch (_) {}

  try {
    if (Alert.find) {
      const res = await Alert.find({
        $or: [{ batchId: batch._id }, { farmId: batch.farmId }],
        status: 'Active',
      });
      weatherAlerts = Array.isArray(res) ? res : [];
    }
  } catch (_) {}

  return evaluateStatus({
    batch,
    todayLog,
    yesterdayLog,
    trailingLogs,
    tasks,
    weatherAlerts,
    now: nowDt,
    zone,
  });
}

module.exports = {
  evaluateStatus,
  evaluateBatchStatusFromDb,
  RED_FLAG_SYMPTOMS,
};
