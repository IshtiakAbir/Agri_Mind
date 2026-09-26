/**
 * =============================================================================
 * Module: DailyLog Model Schema
 * Component: /app/backend/models/DailyLog.js
 * Description: Records the farmer's morning and evening check-in data for a
 *              single calendar day within a batch. One document = one day.
 *
 * Key design decisions:
 *   - Regular collection (NOT MongoDB time-series).
 *     Reason: Time-series collections restrict updates. Morning and evening
 *     sessions both need to update the same day's document ($set on morning
 *     or evening sub-document). A regular collection with a unique compound
 *     index on (batchId, logDay) is the correct choice.
 *
 *   - logDay is a 'YYYY-MM-DD' string in the farm's local timezone (not UTC).
 *     This is the canonical "which calendar day is this?" key. Storing it as
 *     a string prevents UTC-midnight vs local-midnight confusion.
 *
 *   - liveBirdsEndOfDay is computed and stored by the route handler
 *     (previous day's liveBirds − mortalityCount for today). It is stored so
 *     later logs and the dashboard can read it without re-aggregating history.
 *
 *   - ageOnDay is frozen at write time. It records the exact age of the flock
 *     on this day for historical analysis, even if the batch's start date is
 *     ever corrected.
 *
 *   - observedSymptoms uses a controlled vocabulary so the status evaluator
 *     can reliably detect red-flag conditions without free-text parsing.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

// ─── Controlled Symptom Vocabulary ───────────────────────────────────────────
// Add new values here as needed; do NOT remove existing values (breaks history).
const SYMPTOM_ENUM = [
  'bloody_droppings',      // RED FLAG → triggers RED_FLAG_SYMPTOM status reason
  'respiratory_sounds',    // RED FLAG → triggers RED_FLAG_SYMPTOM status reason
  'lethargy',
  'reduced_feed_intake',
  'swollen_head',
  'discolouration',        // unusual coloring on comb, wattles, or skin
  'diarrhoea',
  'sudden_death_cluster',  // multiple birds found dead with no prior warning
  'nasal_discharge',
  'other',
];

// ─── Morning Session Sub-document ────────────────────────────────────────────
const MorningSchema = new mongoose.Schema(
  {
    /** Whether the morning feed was distributed */
    feedCompleted:  { type: Boolean, default: false },
    /** Whether drinkers were checked and water refilled */
    waterRefilled:  { type: Boolean, default: false },
    /** Timestamp when the morning session was submitted */
    completedAt:    { type: Date,    default: null  },
  },
  { _id: false }
);

// ─── Evening Session Sub-document ────────────────────────────────────────────
const EveningSchema = new mongoose.Schema(
  {
    /** Whether the evening feed was distributed */
    feedCompleted: { type: Boolean, default: false },
    /** Timestamp when the evening session was submitted */
    completedAt:   { type: Date,    default: null  },
  },
  { _id: false }
);

// ─── DailyLog Schema ──────────────────────────────────────────────────────────
const DailyLogSchema = new mongoose.Schema(
  {
    // ── Ownership & Identification ─────────────────────────────────────────
    /** The batch this log entry belongs to */
    batchId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Batch',
      required: [true, 'batchId is required'],
      index:    true,
    },

    /**
     * Calendar date of this log entry in 'YYYY-MM-DD' format, in the
     * farm's local timezone (Asia/Dhaka by default).
     *
     * IMPORTANT: This is NOT a Date object. It is a string like '2026-09-24'.
     * Storing it as a string avoids UTC-midnight drift that would cause
     * the date to appear as the wrong calendar day in UTC.
     *
     * Combined with batchId, this forms the unique compound index that
     * prevents duplicate entries for the same day.
     */
    logDay: {
      type:     String,
      required: [true, 'logDay is required'],
      match:    [/^\d{4}-\d{2}-\d{2}$/, 'logDay must be in YYYY-MM-DD format'],
    },

    /**
     * UTC timestamp of the first write to this document (morning check-in).
     * Used for audit trail; NOT used for the "which day is this" logic.
     */
    logDate: {
      type:    Date,
      default: Date.now,
    },

    /**
     * Age of the flock on this specific day, frozen at write time.
     * Computed by the route handler from ageCalc.js and stored for history.
     * Even if batchStartDate is later corrected, this value remains accurate
     * for the historical record.
     */
    ageOnDay: {
      type: Number,
      min:  [0, 'ageOnDay cannot be negative'],
    },

    // ── Morning & Evening Sessions ─────────────────────────────────────────
    /** Data submitted during the morning check-in (before noon) */
    morning: {
      type:    MorningSchema,
      default: () => ({}),
    },

    /** Data submitted during the evening check-in (after noon) */
    evening: {
      type:    EveningSchema,
      default: () => ({}),
    },

    // ── Measurements ──────────────────────────────────────────────────────
    /**
     * Total feed given to the flock today (kg).
     * Validated by the route handler: must be ≥ 0.
     * Added to Batch.cumulativeFeedKg atomically after each write.
     */
    feedAmountKg: {
      type:    Number,
      default: 0,
      min:     [0, 'feedAmountKg cannot be negative'],
    },

    /**
     * Number of birds that died today.
     * Validated by the route handler: must be ≤ liveBirdsAtStartOfDay.
     * Added to Batch.cumulativeMortality atomically after each write.
     */
    mortalityCount: {
      type:    Number,
      default: 0,
      min:     [0, 'mortalityCount cannot be negative'],
    },

    /**
     * Live bird count at the END of today.
     * Computed by the route handler: previousDay.liveBirdsEndOfDay − mortalityCount.
     * For the first day of a batch: initialChickens − mortalityCount.
     * Stored so the next day's check-in can read it without re-aggregating.
     */
    liveBirdsEndOfDay: {
      type: Number,
      min:  [0, 'liveBirdsEndOfDay cannot be negative'],
    },

    /**
     * Average body weight per bird (grams), measured on weighing days only.
     * Optional — left null on non-weighing days.
     * Improves the ML profit forecast accuracy and FCR calculation.
     */
    avgBodyWeightG: {
      type:    Number,
      default: null,
      min:     [0, 'avgBodyWeightG cannot be negative'],
    },

    // ── Health Observations ───────────────────────────────────────────────
    /**
     * Controlled-vocabulary list of observed symptoms.
     * The status evaluator checks for RED FLAG symptoms:
     *   'bloody_droppings' and 'respiratory_sounds' → triggers ATTENTION REQUIRED.
     * Add 'other' when something is wrong but doesn't fit the list.
     */
    observedSymptoms: {
      type:    [String],
      enum:    {
        values:  SYMPTOM_ENUM,
        message: `observedSymptoms must be one of: ${SYMPTOM_ENUM.join(', ')}`,
      },
      default: [],
    },

    /**
     * Free-text field for additional notes about observed symptoms.
     * Not used by the automated status evaluator — for the farmer's record only.
     */
    symptomNotes: {
      type:      String,
      default:   '',
      maxlength: [500, 'symptomNotes must be 500 characters or fewer'],
      trim:      true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY UNIQUE INDEX: (batchId, logDay)
 *
 * This is the core correctness guarantee of DailyLog:
 *   - There can only be one document per batch per calendar day.
 *   - Morning and evening check-ins UPSERT this same document.
 *   - A retry on a failed request cannot create a duplicate.
 *   - Attempting to insert a second document for the same day throws a
 *     MongoDB duplicate key error (code 11000), which the route handler
 *     catches and returns as a 409 Conflict response.
 */
DailyLogSchema.index({ batchId: 1, logDay: 1 }, { unique: true });

/**
 * SECONDARY INDEX: (batchId, logDate)
 * Supports efficient "fetch the last N days of logs for this batch" queries
 * used by the status evaluator's trailing-3-day mortality spike check.
 */
DailyLogSchema.index({ batchId: 1, logDate: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/**
 * isMorningComplete
 * True if the morning check-in has been submitted (feedCompleted or waterRefilled).
 */
DailyLogSchema.virtual('isMorningComplete').get(function () {
  return !!(this.morning && this.morning.completedAt);
});

/**
 * isEveningComplete
 * True if the evening check-in has been submitted.
 */
DailyLogSchema.virtual('isEveningComplete').get(function () {
  return !!(this.evening && this.evening.completedAt);
});

/**
 * hasRedFlagSymptom
 * True if the log contains any symptom that triggers the RED_FLAG_SYMPTOM
 * status reason. Used by the status evaluator and by route response shaping.
 */
DailyLogSchema.virtual('hasRedFlagSymptom').get(function () {
  const RED_FLAGS = ['bloody_droppings', 'respiratory_sounds'];
  return (this.observedSymptoms || []).some(s => RED_FLAGS.includes(s));
});

// ─── Static Helpers ───────────────────────────────────────────────────────────

/**
 * DailyLog.getForDay(batchId, logDay)
 * Convenience finder used by the status evaluator and check-in route.
 * Returns null if no log exists for that day.
 *
 * @param {ObjectId|string} batchId
 * @param {string}          logDay   'YYYY-MM-DD'
 * @returns {Promise<DailyLog|null>}
 */
DailyLogSchema.statics.getForDay = function (batchId, logDay) {
  return this.findOne({ batchId, logDay });
};

/**
 * DailyLog.getRecentDays(batchId, n)
 * Returns the most recent `n` log documents for a batch, newest first.
 * Used for trailing-3-day mortality spike calculation.
 *
 * @param {ObjectId|string} batchId
 * @param {number}          n
 * @returns {Promise<DailyLog[]>}
 */
DailyLogSchema.statics.getRecentDays = function (batchId, n = 3) {
  return this.find({ batchId })
    .sort({ logDate: -1 })
    .limit(n)
    .lean();
};

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('DailyLog', DailyLogSchema);
