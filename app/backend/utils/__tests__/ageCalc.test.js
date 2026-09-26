/**
 * =============================================================================
 * Tests: Age Calculator Utility
 * Component: /app/backend/utils/__tests__/ageCalc.test.js
 *
 * Test strategy: inject a fixed Luxon DateTime as `now` into every test so
 * results are deterministic regardless of when the tests run.
 * Never call Date.now() or DateTime.now() in business logic — always pass
 * `now` as an argument so it can be overridden here.
 * =============================================================================
 */

'use strict';

const { DateTime } = require('luxon');
const { currentAge } = require('../ageCalc');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal batch object for testing.
 * @param {string} batchStartDate - ISO date string (date only, e.g. '2026-09-20')
 * @param {number} initialAverageAgeDays
 * @param {number} [cycleLengthDays]
 */
function makeBatch(batchStartDate, initialAverageAgeDays, cycleLengthDays) {
  return {
    batchStartDate: new Date(batchStartDate),
    initialAverageAgeDays,
    cycleLengthDays,
  };
}

/**
 * Build a Luxon DateTime pinned to a specific ISO timestamp in Asia/Dhaka.
 * @param {string} isoString - e.g. '2026-09-24T23:59:00'
 */
function at(isoString) {
  return DateTime.fromISO(isoString, { zone: 'Asia/Dhaka' });
}

const ZONE = 'Asia/Dhaka';

// ─── Core Correctness ─────────────────────────────────────────────────────────

describe('currentAge — core correctness', () => {
  test('returns initialAverageAgeDays + 0 on the batch start day', () => {
    const batch = makeBatch('2026-09-20', 7, 35);
    // now = same calendar day as batchStartDate, mid-day
    const now = at('2026-09-20T10:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(7); // 7 + 0 elapsed days
  });

  test('returns initialAverageAgeDays + 1 the next calendar day', () => {
    const batch = makeBatch('2026-09-20', 7, 35);
    const now = at('2026-09-21T10:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(8); // 7 + 1 elapsed day
  });

  test('returns initialAverageAgeDays + 14 after 14 calendar days', () => {
    const batch = makeBatch('2026-09-01', 0, 35);
    const now = at('2026-09-15T12:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(14);
  });
});

// ─── Midnight Boundary (The Original Bug) ────────────────────────────────────

describe('currentAge — midnight boundary', () => {
  /**
   * The original bug: age flipped at 2:37 PM (time-of-day the batch was created)
   * instead of at midnight.
   *
   * A batch created at 2026-09-20 14:37 should still show age=7 at 23:59:59
   * on that same calendar day, and age=8 at 00:00:00 the next calendar day.
   */
  const batch = makeBatch('2026-09-20', 7, 35);

  test('age does NOT increment at 23:59 (still same calendar day)', () => {
    const now = at('2026-09-20T23:59:59');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(7);
  });

  test('age increments exactly at 00:00 the next day', () => {
    const now = at('2026-09-21T00:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(8);
  });

  test('age is correct at 00:01 the next day', () => {
    const now = at('2026-09-21T00:01:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(8);
  });

  test('a batch created at 14:37 does not age at 14:37 the next day — it aged at 00:00', () => {
    // At 13:59 on day+1 (before the old formula would have flipped), the new
    // formula already shows age=8 because the calendar day has changed.
    const now = at('2026-09-21T13:59:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(8);
  });
});

// ─── Pre-Start Date (Clamp to 0) ─────────────────────────────────────────────

describe('currentAge — pre-start date guard', () => {
  test('returns ageDays = initialAverageAgeDays when now is before batchStartDate', () => {
    // Batch starts tomorrow, but "now" is today — should not go negative
    const batch = makeBatch('2026-09-25', 0, 35);
    const now = at('2026-09-24T12:00:00'); // one day before start
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(0); // 0 + max(0, -1) = 0
  });

  test('returns ageDays = initialAverageAgeDays (non-zero) when now is before batchStartDate', () => {
    const batch = makeBatch('2026-09-25', 5, 35);
    const now = at('2026-09-24T23:59:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(5); // 5 + max(0, -1) = 5, not 4
  });
});

// ─── isPastCycleEnd ───────────────────────────────────────────────────────────

describe('currentAge — isPastCycleEnd', () => {
  test('is false when ageDays < cycleLengthDays', () => {
    const batch = makeBatch('2026-09-01', 0, 35);
    const now = at('2026-09-15T12:00:00'); // day 14 of cycle
    const { ageDays, isPastCycleEnd } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(14);
    expect(isPastCycleEnd).toBe(false);
  });

  test('is false when ageDays === cycleLengthDays (last day of cycle, not past it)', () => {
    const batch = makeBatch('2026-09-01', 0, 35);
    const now = at('2026-10-06T12:00:00'); // day 35 of cycle
    const { ageDays, isPastCycleEnd } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(35);
    expect(isPastCycleEnd).toBe(false);
  });

  test('is true when ageDays > cycleLengthDays', () => {
    const batch = makeBatch('2026-09-01', 0, 35);
    const now = at('2026-10-07T12:00:00'); // day 36 of cycle
    const { ageDays, isPastCycleEnd } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(36);
    expect(isPastCycleEnd).toBe(true);
  });

  test('is false when cycleLengthDays is not provided', () => {
    const batch = makeBatch('2026-09-01', 0); // no cycleLengthDays
    const now = at('2026-10-07T12:00:00');
    const { isPastCycleEnd } = currentAge(batch, ZONE, now);
    expect(isPastCycleEnd).toBe(false);
  });
});

// ─── initialAverageAgeDays > 0 (Mid-Cycle Start) ─────────────────────────────

describe('currentAge — mid-cycle start (initialAverageAgeDays > 0)', () => {
  test('Broiler batch onboarded at day 9 shows age 9 on the start date', () => {
    const batch = makeBatch('2026-09-20', 9, 35);
    const now = at('2026-09-20T08:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(9);
  });

  test('Broiler batch onboarded at day 9 shows age 14 on day+5', () => {
    const batch = makeBatch('2026-09-20', 9, 35);
    const now = at('2026-09-25T08:00:00');
    const { ageDays } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(14);
  });

  test('isPastCycleEnd is true when mid-cycle batch exceeds cycleLengthDays', () => {
    // Batch onboarded at day 30, cycle is 35 days — will be past cycle in 5 days
    const batch = makeBatch('2026-09-20', 30, 35);
    const now = at('2026-09-26T00:00:00'); // 6 days later = age 36
    const { ageDays, isPastCycleEnd } = currentAge(batch, ZONE, now);
    expect(ageDays).toBe(36);
    expect(isPastCycleEnd).toBe(true);
  });
});

// ─── Input Validation ─────────────────────────────────────────────────────────

describe('currentAge — input validation', () => {
  test('throws if batch is null', () => {
    expect(() => currentAge(null)).toThrow('batchStartDate is required');
  });

  test('throws if batchStartDate is missing', () => {
    expect(() => currentAge({ initialAverageAgeDays: 0 })).toThrow('batchStartDate is required');
  });

  test('throws if initialAverageAgeDays is negative', () => {
    expect(() =>
      currentAge({ batchStartDate: new Date(), initialAverageAgeDays: -1 })
    ).toThrow('initialAverageAgeDays must be a non-negative number');
  });

  test('throws if initialAverageAgeDays is not a number', () => {
    expect(() =>
      currentAge({ batchStartDate: new Date(), initialAverageAgeDays: 'nine' })
    ).toThrow('initialAverageAgeDays must be a non-negative number');
  });
});

// ─── Timezone Correctness ─────────────────────────────────────────────────────

describe('currentAge — timezone handling', () => {
  test('uses the provided zone, not UTC', () => {
    // Asia/Dhaka is UTC+6. At 2026-09-20T20:00:00 UTC it is already
    // 2026-09-21T02:00:00 in Dhaka — so the age should reflect the Dhaka date.
    const batch = makeBatch('2026-09-20', 0, 35);
    // Simulate now as a UTC+6 time (already past midnight in Dhaka)
    const nowInDhaka = DateTime.fromISO('2026-09-21T02:00:00', { zone: 'Asia/Dhaka' });
    const { ageDays } = currentAge(batch, 'Asia/Dhaka', nowInDhaka);
    expect(ageDays).toBe(1); // It is already the next calendar day in Dhaka
  });

  test('accepts a custom timezone string', () => {
    const batch = makeBatch('2026-09-20', 0, 35);
    const now = DateTime.fromISO('2026-09-22T10:00:00', { zone: 'UTC' });
    // 2 days elapsed regardless of UTC offset on this particular date
    const { ageDays } = currentAge(batch, 'UTC', now);
    expect(ageDays).toBe(2);
  });
});
