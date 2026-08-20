/**
 * =============================================================================
 * Module: Prediction Audit Log Schema
 * Authorship: Machine Learning & Full-Stack Team
 * Component: /app/backend/models/Prediction.js
 * Description: Schema for disease diagnostic logs and ML calculation audits.
 * =============================================================================
 */

const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['disease', 'profit'],
    required: true
  },
  farmId: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', PredictionSchema);
