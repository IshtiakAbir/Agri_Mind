/**
 * =============================================================================
 * Module: Alert Model Schema
 * Component: /app/backend/models/Alert.js
 * Description: Stores environmental and operational alerts (e.g., Heat Stress,
 *              Ammonia / Moisture Risk, Cold Snap). Includes hysteresis tracking
 *              (consecutiveSafeReadings) to prevent flickering on/off.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    // ── Scope & Ownership ─────────────────────────────────────────────────────
    /** The Farm this alert pertains to */
    farmId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Farm',
      required: [true, 'farmId is required'],
      index:    true,
    },

    /** Optional specific batch impacted by this alert (null for farm-wide weather alerts) */
    batchId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Batch',
      default: null,
      index:   true,
    },

    // ── Alert Classification ──────────────────────────────────────────────────
    /** Type of alert */
    type: {
      type:     String,
      enum:     {
        values:  ['HEAT_STRESS', 'AMMONIA_MOISTURE', 'COLD_SNAP', 'CUSTOM'],
        message: 'type must be one of: HEAT_STRESS, AMMONIA_MOISTURE, COLD_SNAP, CUSTOM',
      },
      required: [true, 'type is required'],
    },

    /** Severity level */
    severity: {
      type:    String,
      enum:    {
        values:  ['Info', 'Warning', 'Critical'],
        message: 'severity must be one of: Info, Warning, Critical',
      },
      default: 'Warning',
    },

    /** Short descriptive alert message */
    message: {
      type:     String,
      required: [true, 'message is required'],
      trim:     true,
    },

    /** Actionable veterinary / environmental advice for the farmer */
    advice: {
      type:    String,
      default: '',
      trim:    true,
    },

    // ── Lifecycle & Hysteresis State ──────────────────────────────────────────
    /** Alert lifecycle status */
    status: {
      type:    String,
      enum:    {
        values:  ['Active', 'Cleared'],
        message: 'status must be one of: Active, Cleared',
      },
      default: 'Active',
      index:   true,
    },

    /** When the alert first triggered */
    startedAt: {
      type:    Date,
      default: Date.now,
    },

    /** When the alert was cleared after consecutive safe readings */
    clearedAt: {
      type:    Date,
      default: null,
    },

    /**
     * Counter of consecutive safe readings observed since this alert was triggered.
     * To prevent flickering, the alert only transitions from Active -> Cleared
     * when consecutiveSafeReadings >= 2 (HYSTERESIS_SAFE_READINGS_TO_CLEAR).
     */
    consecutiveSafeReadings: {
      type:    Number,
      default: 0,
      min:     0,
    },

    /** Weather metrics or custom telemetry that caused the alert */
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Query active alerts for a farm
AlertSchema.index({ farmId: 1, status: 1 });

// Query active alerts for a batch
AlertSchema.index({ batchId: 1, status: 1 });

// Check existing active alert of a specific type for a farm (for deduplication / updating)
AlertSchema.index({ farmId: 1, type: 1, status: 1 });

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Find active alerts for a given farm (including farm-wide and active batches)
 */
AlertSchema.statics.getActiveForFarm = function (farmId) {
  return this.find({ farmId, status: 'Active' }).sort({ startedAt: -1 });
};

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('Alert', AlertSchema);
