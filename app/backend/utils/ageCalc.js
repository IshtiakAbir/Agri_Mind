/**
 * =============================================================================
 * Module: Age Calculator Utility
 * Component: /app/backend/utils/ageCalc.js
 * Description: Single source of truth for computing a batch's current age in
 *              days. Uses Luxon for timezone-aware calendar-day arithmetic so
 *              that:
 *                - Age increments at midnight farm time, NOT at the clock time
 *                  the batch was originally created.
 *                - Timezone is always respected (default: Asia/Dhaka).
 *                - Pre-start dates are clamped to 0 (no negative age).
 *
 * WHY THIS EXISTS:
 *   The original formula was:
 *     initialAverageAgeDays + floor((now - batchStartDate) / 86400000)
 *   This flips the age at the exact time of day the batch was created (e.g.
 *   2:37 PM), not at midnight. It also ignores timezone, which causes
 *   off-by-one errors around UTC±6 boundaries.
 *   This utility replaces that formula everywhere in the codebase.
 *
 * USAGE:
 *   const { currentAge } = require('../utils/ageCalc');
 *
 *   // From a route handler or service:
 *   const { ageDays, isPastCycleEnd } = currentAge(batch);
 *
 *   // In unit tests (inject a fixed "now" to make tests deterministic):
 *   const { DateTime } = require('luxon');
 *   const { ageDays } = currentAge(batch, 'Asia/Dhaka', DateTime.fromISO('2026-09-30T23:59:00'));
 * =============================================================================
 */

'use strict';

const { DateTime } = require('luxon');

/**
 * Computes the current age of a batch in whole calendar days, relative to
 * midnight in the farm's timezone.
 *
 * @param {Object}   batch                       - The batch document (or plain object)
 * @param {Date|string} batch.batchStartDate      - The date the batch started
 * @param {number}   batch.initialAverageAgeDays  - Age of chicks on the start date (≥ 0)
 * @param {number}   [batch.cycleLengthDays]      - Target end-of-cycle age (for isPastCycleEnd)
 * @param {string}   [zone='Asia/Dhaka']          - IANA timezone string for the farm
 * @param {DateTime} [now=DateTime.now()]         - Injectable clock for deterministic tests
 *
 * @returns {{ ageDays: number, isPastCycleEnd: boolean }}
 *   ageDays       — Current age in whole days (always ≥ 0)
 *   isPastCycleEnd — true when ageDays exceeds cycleLengthDays
 */
function currentAge(batch, zone = 'Asia/Dhaka', now = DateTime.now()) {
  if (!batch || batch.batchStartDate == null) {
    throw new Error('ageCalc: batch.batchStartDate is required');
  }
  if (typeof batch.initialAverageAgeDays !== 'number' || batch.initialAverageAgeDays < 0) {
    throw new Error('ageCalc: batch.initialAverageAgeDays must be a non-negative number');
  }

  // Normalise batchStartDate to the start of that calendar day in the farm timezone.
  // This is the key fix: we compare day-to-day, not millisecond-to-millisecond.
  const startOfBatchDay = DateTime
    .fromJSDate(new Date(batch.batchStartDate), { zone })
    .startOf('day');

  // Today, also at start of day in the same timezone.
  const startOfToday = now.setZone(zone).startOf('day');

  // Number of complete calendar days elapsed since the batch started.
  // Math.max(0, …) clamps negative values when batchStartDate is in the future.
  const elapsedDays = Math.max(
    0,
    Math.floor(startOfToday.diff(startOfBatchDay, 'days').days)
  );

  const ageDays = batch.initialAverageAgeDays + elapsedDays;

  // isPastCycleEnd: only meaningful when cycleLengthDays is provided.
  const isPastCycleEnd = typeof batch.cycleLengthDays === 'number'
    ? ageDays > batch.cycleLengthDays
    : false;

  return { ageDays, isPastCycleEnd };
}

function isPastCycleEnd(batch, zone = 'Asia/Dhaka', now = DateTime.now()) {
  return currentAge(batch, zone, now).isPastCycleEnd;
}

module.exports = { currentAge, isPastCycleEnd };
