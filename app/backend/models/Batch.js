/**
 * =============================================================================
 * Module: Batch Model Schema
 * Component: /app/backend/models/Batch.js
 * Description: A Batch represents one complete production cycle within a Farm
 *              (from chick placement to slaughter/closure). A single Farm can
 *              run multiple batches — concurrently or sequentially.
 *
 * Key design decisions:
 *   - farmId is required and indexed; every route verifies the caller owns
 *     the farm before touching any batch document.
 *   - Age is NEVER stored. It is always computed on-read via ageCalc.js so
 *     it is never stale.
 *   - cumulativeFeedKg and cumulativeMortality are cached totals, updated
 *     atomically on every DailyLog write. This avoids re-aggregating all logs
 *     on every dashboard request.
 *   - latestForecast caches the ML result. The dashboard never waits on Python.
 *   - batchStartDate is stored normalised to the start of the farm-local day
 *     by the route handler (see routes/batches.js) to prevent time-of-day drift.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

// ─── Forecast Sub-document ────────────────────────────────────────────────────

const ForecastSchema = new mongoose.Schema(
  {
    /** Predicted net profit in BDT */
    predictedProfit: { type: Number, default: null },
    /** Lower bound of the confidence range */
    low:             { type: Number, default: null },
    /** Upper bound of the confidence range */
    high:            { type: Number, default: null },
    /** When this forecast was last computed */
    computedAt:      { type: Date,   default: null },
    /** Which version of the ML model produced this result */
    modelVersion:    { type: String, default: null },
    /**
     * True when the cached forecast is outdated (e.g. Python failed, or
     * inputs changed but recalculation has not run yet).
     */
    isStale:         { type: Boolean, default: false },
  },
  { _id: false } // embedded — no separate _id needed
);

// ─── Batch Schema ─────────────────────────────────────────────────────────────

const BatchSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    /** The Farm this batch belongs to. All routes verify caller owns this farm. */
    farmId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Farm',
      required: [true, 'farmId is required'],
      index:    true,
    },

    // ── Identity ──────────────────────────────────────────────────────────────
    /** Human-readable name, e.g. "Batch Sept 2026" */
    batchName: {
      type:     String,
      required: [true, 'batchName is required'],
      trim:     true,
      maxlength: [100, 'batchName must be 100 characters or fewer'],
    },

    /** Breed / production type */
    chickenType: {
      type:     String,
      enum:     {
        values:  ['Broiler', 'Sonali', 'Desi', 'Cock', 'Layer'],
        message: 'chickenType must be one of: Broiler, Sonali, Desi, Cock, Layer',
      },
      required: [true, 'chickenType is required'],
    },

    /** Number of chicks placed at the start of this batch */
    initialChickens: {
      type:     Number,
      required: [true, 'initialChickens is required'],
      min:      [1, 'initialChickens must be at least 1'],
    },

    /** Lifecycle state of the batch */
    status: {
      type:    String,
      enum:    ['Active', 'Paused', 'Closed'],
      default: 'Active',
      index:   true,
    },

    // ── Age & Timing ──────────────────────────────────────────────────────────
    /**
     * Age of the chicks (in days) on the day the batch was registered.
     * Used by ageCalc.js: currentAge = initialAverageAgeDays + elapsedCalendarDays.
     * 0 means the chicks arrived on batchStartDate.
     */
    initialAverageAgeDays: {
      type:    Number,
      default: 0,
      min:     [0, 'initialAverageAgeDays cannot be negative'],
    },

    /**
     * The calendar date the batch started, normalised to the start of the
     * farm-local day by the route handler. Stored as UTC midnight.
     * DO NOT use this raw value for age arithmetic — always use ageCalc.js.
     */
    batchStartDate: {
      type:     Date,
      required: [true, 'batchStartDate is required'],
    },

    /**
     * Target end-of-cycle age in days.
     * Drives the task horizon and isPastCycleEnd flag.
     * Broiler ≈ 35, Sonali ≈ 70, Desi/Cock ≈ 75-90, Layer ≈ 365.
     */
    cycleLengthDays: {
      type:     Number,
      required: [true, 'cycleLengthDays is required'],
      min:      [1, 'cycleLengthDays must be at least 1'],
    },

    /**
     * Version string of the lifecycle template that generated this batch's tasks.
     * Existing batches keep their original task set even if the template updates.
     */
    templateVersion: {
      type:    String,
      default: null,
    },

    // ── Economics ─────────────────────────────────────────────────────────────
    /** Purchase cost per chick (BDT) */
    chickCostPerBird: {
      type:    Number,
      default: 0,
      min:     [0, 'chickCostPerBird cannot be negative'],
    },

    /** Feed cost per kg (BDT) */
    feedPricePerKg: {
      type:    Number,
      default: 0,
      min:     [0, 'feedPricePerKg cannot be negative'],
    },

    /** Expected sale price per kg of live bird (BDT) */
    expectedSalePricePerKg: {
      type:    Number,
      default: 0,
      min:     [0, 'expectedSalePricePerKg cannot be negative'],
    },

    // ── Running Totals (updated atomically on each DailyLog write) ────────────
    /**
     * Cumulative feed consumed across all logged days (kg).
     * Avoids re-summing all DailyLog documents on every dashboard load.
     */
    cumulativeFeedKg: {
      type:    Number,
      default: 0,
      min:     [0, 'cumulativeFeedKg cannot be negative'],
    },

    /**
     * Cumulative number of birds that have died across all logged days.
     * Avoids re-summing all DailyLog documents on every dashboard load.
     */
    cumulativeMortality: {
      type:    Number,
      default: 0,
      min:     [0, 'cumulativeMortality cannot be negative'],
    },

    // ── ML Forecast (cached) ──────────────────────────────────────────────────
    /**
     * The most recent profit forecast from the ML pipeline.
     * Updated asynchronously after each log write (debounced, max once/hour).
     * The dashboard reads from here and never waits on Python.
     */
    latestForecast: {
      type:    ForecastSchema,
      default: () => ({}),
    },

    // ── Onboarding ────────────────────────────────────────────────────────────
    /**
     * Template keys of vaccines the hatchery already administered before
     * the batch was registered. The task generator marks these as Completed
     * so they do not appear as false "overdue" tasks.
     * Example: ['nd-1', 'marek-1']
     */
    vaccinationsAlreadyGiven: {
      type:    [String],
      default: [],
    },

    // ── Check-in Cutoffs (farm-local hour, 24h clock, overridable per batch) ──
    /**
     * Hour after which morning routine is considered missed.
     * Defaults to the global threshold (11:00) from config/thresholds.js.
     * Stored on the batch so individual farmers can adjust it later.
     */
    morningCutoffHour: {
      type:    Number,
      default: 11,
      min:     0,
      max:     23,
    },

    /**
     * Hour after which evening routine is considered missed.
     * Defaults to the global threshold (20:00) from config/thresholds.js.
     */
    eveningCutoffHour: {
      type:    Number,
      default: 20,
      min:     0,
      max:     23,
    },

    // ── Closure Fields (set only when status → 'Closed') ─────────────────────
    /** Timestamp when the batch was closed */
    closedAt: { type: Date, default: null },

    /** Average live weight at slaughter (kg/bird) — actual outcome */
    finalWeightKg: { type: Number, default: null, min: 0 },

    /** Number of birds actually sold */
    soldCount: { type: Number, default: null, min: 0 },

    /** Total revenue from this batch (BDT) */
    revenue: { type: Number, default: null, min: 0 },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// List all active/paused batches for a farm efficiently
BatchSchema.index({ farmId: 1, status: 1 });

// Sort batches by creation date within a farm
BatchSchema.index({ farmId: 1, createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/**
 * liveBirdsEstimate
 * Quick estimate of current live birds without querying DailyLog.
 * For an accurate live-bird count, use the most recent DailyLog.liveBirdsEndOfDay.
 */
BatchSchema.virtual('liveBirdsEstimate').get(function () {
  return Math.max(0, this.initialChickens - this.cumulativeMortality);
});

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('Batch', BatchSchema);
