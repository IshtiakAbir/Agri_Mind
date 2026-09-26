/**
 * =============================================================================
 * Module: DiseaseTreatmentMap Model Schema
 * Component: /app/backend/models/DiseaseTreatmentMap.js
 * Description: Curated veterinary knowledge base linking AI disease detection
 *              classes to pharmaceutical active ingredients, supportive care,
 *              vet referral flags, and disclaimers.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

const DiseaseTreatmentMapSchema = new mongoose.Schema(
  {
    /** Normalized machine-readable key matching the ML classifier label */
    diseaseKey: {
      type:      String,
      required:  [true, 'diseaseKey is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
    },

    /** Human-readable medical / common name */
    displayName: {
      type:     String,
      required: [true, 'displayName is required'],
      trim:     true,
    },

    /** Whether pharmaceutical or veterinary treatments exist for this condition */
    treatable: {
      type:     Boolean,
      required: [true, 'treatable is required'],
    },

    /**
     * Recommended pharmacological active ingredients (NOT brand names)
     * e.g., ['Amprolium', 'Toltrazuril', 'Sulfaquinoxaline']
     */
    activeIngredients: {
      type:    [String],
      default: [],
    },

    /** Supportive nursing care recommendations (electrolytes, warmth, vitamins) */
    supportiveCare: {
      type:    [String],
      default: [],
    },

    /** True if condition is viral, notifiable, or requires immediate veterinary intervention */
    vetReferralRequired: {
      type:    Boolean,
      default: false,
    },

    /** Tags for filtering compatible marketplace products */
    treatmentTags: {
      type:    [String],
      default: [],
    },

    /** Clinical notes and biosecurity guidelines */
    notes: {
      type:    String,
      default: '',
      trim:    true,
    },

    /** Legal veterinary disclaimer */
    disclaimer: {
      type:    String,
      default: 'This information is for veterinary guidance only. Always consult a registered veterinarian or poultry specialist before administering prescription medication.',
      trim:    true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Lookup treatment protocol by predicted disease label
 */
DiseaseTreatmentMapSchema.statics.findByLabel = function (label) {
  if (!label) return null;
  const key = label.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return this.findOne({ diseaseKey: key });
};

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('DiseaseTreatmentMap', DiseaseTreatmentMapSchema);
