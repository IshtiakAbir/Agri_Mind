/**
 * =============================================================================
 * Module: Admin Audit Log Model
 * Component: /app/backend/models/AdminAuditLog.js
 * Description: Tracks every admin action for accountability and auditing.
 *              Every create/update/delete performed through admin endpoints
 *              is logged here with before/after snapshots.
 * =============================================================================
 */

const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  adminName: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'product', 'doctor', 'appointment', 'farm', 'batch', 'diagnostic', 'content', 'settings'],
    index: true
  },
  targetId: {
    type: String,
    default: null
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient querying
AdminAuditLogSchema.index({ adminId: 1, timestamp: -1 });
AdminAuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
