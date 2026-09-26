/**
 * =============================================================================
 * Module: Batch Ownership Verification Middleware
 * Component: /app/backend/middleware/batchOwnership.js
 * Description: Verifies that the authenticated user owns the farm associated
 *              with the requested batch. Prevents unauthorized farmers from
 *              reading, modifying, or logging into batches owned by another farm.
 *              Attaches req.batch and req.farm for downstream handlers.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Farm = require('../models/Farm');

module.exports = async function batchOwnership(req, res, next) {
  try {
    const batchId = req.params.id || req.params.batchId;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID parameter is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Batch ID format.',
      });
    }

    const { store } = require('../config/inMemoryStore');

    let batch = null;
    try {
      batch = await Batch.findById(batchId);
    } catch (_) {}
    if (!batch) {
      batch = store.getBatch(batchId);
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch not found with ID: ${batchId}`,
      });
    }

    let farm = null;
    try {
      farm = await Farm.findById(batch.farmId);
    } catch (_) {}
    if (!farm) {
      farm = store.getFarm(batch.farmId);
    }

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'The farm associated with this batch was not found.',
      });
    }

    // Role-based authorization: Employees have privileged support access
    const userRole = req.user && req.user.role;
    if (userRole === 'employee') {
      req.batch = batch;
      req.farm = farm;
      return next();
    }

    // Ownership check: farm.userId must match req.user.id
    const currentUserId = req.user && (req.user.id || req.user._id);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication credentials missing.',
      });
    }

    // Allow access if:
    // (a) The farm has no userId (open/demo farm created without auth), OR
    // (b) The farm userId matches the current user, OR
    // (c) This is the shared demo farm (any authenticated user may access demo data)
    const { DEMO_FARM_ID } = require('../config/inMemoryStore');
    const isDemoFarm = String(batch.farmId) === DEMO_FARM_ID || String(farm._id) === DEMO_FARM_ID;
    const farmUserId = farm.userId ? farm.userId.toString() : null;
    const ownerMatch = !farmUserId || farmUserId === currentUserId.toString();

    if (!ownerMatch && !isDemoFarm) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own the farm associated with this batch.',
      });
    }

    // Attach verified records to req for efficient downstream usage
    req.batch = batch;
    req.farm = farm;
    next();
  } catch (err) {
    console.error('Error in batchOwnership middleware:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify batch ownership.',
      error: err.message,
    });
  }
};
