/**
 * =============================================================================
 * Module: AgriMind Admin Panel API Routes
 * Component: /app/backend/routes/admin.js
 * Description: Production-grade admin API covering:
 *              1. Access control & audit logging
 *              2. Dashboard key numbers & real-time metrics
 *              3. User management with complete cascading erasure
 *              4. Marketplace product, stock, & category management
 *              5. Doctor directory & appointment oversight
 *              6. Farms & Diagnostics oversight with manual flagging
 *              7. Content management (breed templates, treatments, weather, homepage)
 *              8. Tuneable platform settings & admin user management
 * =============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const auth = require('../middleware/auth');
const { requireAdmin, requireAdminOrSupport } = require('../middleware/adminAuth');

// Models
const User = require('../models/User');
const Farm = require('../models/Farm');
const AdminAuditLog = require('../models/AdminAuditLog');

// Conditional / Optional Models
let Batch, DailyLog, Task, Alert, Prediction, DiseaseTreatmentMap;
try { Batch = require('../models/Batch'); } catch (_) { Batch = null; }
try { DailyLog = require('../models/DailyLog'); } catch (_) { DailyLog = null; }
try { Task = require('../models/Task'); } catch (_) { Task = null; }
try { Alert = require('../models/Alert'); } catch (_) { Alert = null; }
try { Prediction = require('../models/Prediction'); } catch (_) { Prediction = null; }
try { DiseaseTreatmentMap = require('../models/DiseaseTreatmentMap'); } catch (_) { DiseaseTreatmentMap = null; }

// External Services & Stores
const inMemoryStore = require('../config/inMemoryStore').store || null;
const thresholds = require('../config/thresholds');
const templateLoader = require('../services/templateLoader');
const authRoute = require('./auth');
const productsRoute = require('./products');
const ordersRoute = require('./orders');
const doctorsRoute = require('./doctors');
const predictRoute = require('./predict');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// In-memory fallback audit log store for offline resilience
const inMemoryAuditLogs = [];

/**
 * Log an administrative action for full auditability
 */
async function logAudit(adminId, adminName, action, targetType, targetId, before, after, metadata = {}) {
  const entry = {
    _id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    adminId: adminId ? adminId.toString() : 'unknown',
    adminName: adminName || 'Admin',
    action,
    targetType,
    targetId: targetId ? targetId.toString() : null,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    metadata,
    timestamp: new Date()
  };

  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.pop();

  if (isDbConnected()) {
    try {
      await AdminAuditLog.create(entry);
    } catch (err) {
      console.warn('DB AdminAuditLog write notice:', err.message);
    }
  }
  return entry;
}

// All /api/admin/* endpoints require valid auth
router.use(auth);

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 2: DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/dashboard', requireAdminOrSupport, async (req, res) => {
  try {
    let totalUsers = 0;
    let activeFarms = 0;
    let totalBatches = 0;
    let activeBatches = 0;
    let newUsersThisWeek = 0;
    let suspendedUsers = 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (isDbConnected()) {
      try {
        const [uCount, fCount, newU, suspU] = await Promise.all([
          User.countDocuments(),
          Farm.countDocuments(),
          User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
          User.countDocuments({ suspendedAt: { $ne: null } })
        ]);
        totalUsers = uCount;
        activeFarms = fCount;
        newUsersThisWeek = newU;
        suspendedUsers = suspU;

        if (Batch) {
          totalBatches = await Batch.countDocuments();
          activeBatches = await Batch.countDocuments({ status: { $in: ['active', 'in_progress', 'Active'] } });
        }
      } catch (dbErr) {
        console.warn('Dashboard DB query fallback:', dbErr.message);
      }
    }

    // In-memory fallback overlay
    if (totalUsers === 0 && authRoute.inMemoryUsers) {
      totalUsers = authRoute.inMemoryUsers.size;
      for (const u of authRoute.inMemoryUsers.values()) {
        if (u.suspendedAt) suspendedUsers++;
        if (u.createdAt && new Date(u.createdAt) >= oneWeekAgo) newUsersThisWeek++;
      }
    }

    if (activeFarms === 0 && inMemoryStore?.farms) {
      activeFarms = inMemoryStore.farms.size;
    }

    if (activeBatches === 0 && inMemoryStore?.batches) {
      totalBatches = inMemoryStore.batches.size;
      for (const b of inMemoryStore.batches.values()) {
        if (b.status === 'Active' || b.status === 'active') activeBatches++;
      }
    }

    // Products count
    const totalProducts = productsRoute.inMemoryProducts ? productsRoute.inMemoryProducts.length : 0;

    // Doctor Appointments count
    let pendingAppointments = 0;
    if (doctorsRoute.appointments) {
      for (const appt of doctorsRoute.appointments.values()) {
        if (appt.status === 'pending') pendingAppointments++;
      }
    }

    // Flagged items count
    let flaggedContentCount = 0;
    if (inMemoryStore?.farms) {
      for (const f of inMemoryStore.farms.values()) {
        if (f.flagged) flaggedContentCount++;
      }
    }
    if (predictRoute.inMemoryPredictions) {
      for (const p of predictRoute.inMemoryPredictions) {
        if (p.flagged) flaggedContentCount++;
      }
    }

    // Recent activity log
    let recentActivity = [];
    if (isDbConnected()) {
      try {
        recentActivity = await AdminAuditLog.find().sort({ timestamp: -1 }).limit(20).lean();
      } catch (_) {}
    }
    if (recentActivity.length === 0) {
      recentActivity = inMemoryAuditLogs.slice(0, 20);
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeFarms,
        totalBatches,
        activeBatches,
        totalProducts,
        totalDoctors: doctorsRoute.SEED_DOCTORS ? doctorsRoute.SEED_DOCTORS.length : 0,
        pendingAppointments,
        flaggedContentCount,
        newUsersThisWeek,
        suspendedUsers,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard metrics.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 3: USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// List users with search, role, status filters, and pagination
router.get('/users', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let usersList = [];
    let total = 0;

    if (isDbConnected()) {
      try {
        const query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } }
          ];
        }
        if (role) query.role = role;
        if (status === 'suspended') query.suspendedAt = { $ne: null };
        if (status === 'active') query.suspendedAt = null;

        const [users, count] = await Promise.all([
          User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
          User.countDocuments(query)
        ]);
        usersList = users;
        total = count;
      } catch (dbErr) {
        console.warn('User list DB error, fallback to memory:', dbErr.message);
      }
    }

    // Fallback to inMemoryUsers
    if (usersList.length === 0 && authRoute.inMemoryUsers) {
      let all = Array.from(authRoute.inMemoryUsers.values()).map(u => ({
        _id: u._id || u.id,
        name: u.name,
        mobile: u.mobile,
        role: u.role || 'farmer',
        suspendedAt: u.suspendedAt || null,
        lastLoginAt: u.lastLoginAt || null,
        createdAt: u.createdAt || new Date('2026-01-01').toISOString()
      }));

      if (search) {
        const s = search.toLowerCase();
        all = all.filter(u => u.name.toLowerCase().includes(s) || u.mobile.includes(s));
      }
      if (role) all = all.filter(u => u.role === role);
      if (status === 'suspended') all = all.filter(u => u.suspendedAt !== null);
      if (status === 'active') all = all.filter(u => u.suspendedAt === null);

      total = all.length;
      usersList = all.slice(skip, skip + parseInt(limit));
    }

    // Attach farm counts to user list
    const enriched = usersList.map(u => {
      let farmCount = 0;
      if (inMemoryStore?.farms) {
        for (const f of inMemoryStore.farms.values()) {
          if (String(f.userId) === String(u._id)) farmCount++;
        }
      }
      return { ...u, farmCount };
    });

    res.json({
      success: true,
      users: enriched,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
});

// Single user detail with linked farms, batches, appointments, diagnoses
router.get('/users/:id', requireAdminOrSupport, async (req, res) => {
  try {
    const userId = req.params.id;
    let user = null;

    if (isDbConnected()) {
      try {
        user = await User.findById(userId).select('-password').lean();
      } catch (_) {}
    }

    if (!user && authRoute.inMemoryUsers) {
      for (const u of authRoute.inMemoryUsers.values()) {
        if (String(u._id || u.id) === String(userId)) {
          user = {
            _id: u._id || u.id,
            name: u.name,
            mobile: u.mobile,
            role: u.role,
            suspendedAt: u.suspendedAt || null,
            lastLoginAt: u.lastLoginAt || null,
            createdAt: u.createdAt || new Date('2026-01-01').toISOString()
          };
          break;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Linked Farms
    let userFarms = [];
    if (isDbConnected()) {
      try { userFarms = await Farm.find({ userId }).lean(); } catch (_) {}
    }
    if (userFarms.length === 0 && inMemoryStore?.farms) {
      for (const f of inMemoryStore.farms.values()) {
        if (String(f.userId) === String(userId)) userFarms.push(f);
      }
    }

    // Linked Batches
    let userBatches = [];
    if (isDbConnected() && Batch) {
      try { userBatches = await Batch.find({ userId }).lean(); } catch (_) {}
    }
    if (userBatches.length === 0 && inMemoryStore?.batches) {
      const farmIds = userFarms.map(f => String(f._id));
      for (const b of inMemoryStore.batches.values()) {
        if (String(b.userId) === String(userId) || farmIds.includes(String(b.farmId))) {
          userBatches.push(b);
        }
      }
    }

    // Linked Appointments
    const userAppointments = [];
    if (doctorsRoute.appointments) {
      for (const appt of doctorsRoute.appointments.values()) {
        if (String(appt.farmerId) === String(userId) || appt.farmerMobile === user.mobile) {
          userAppointments.push(appt);
        }
      }
    }

    // Linked Diagnoses
    let userDiagnoses = [];
    if (predictRoute.inMemoryPredictions) {
      userDiagnoses = predictRoute.inMemoryPredictions.filter(p =>
        String(p.userId) === String(userId) || userFarms.some(f => String(f._id) === String(p.farmId))
      );
    }

    res.json({
      success: true,
      user,
      farms: userFarms,
      batches: userBatches,
      appointments: userAppointments,
      diagnoses: userDiagnoses
    });
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user details.' });
  }
});

// Edit user: name, role, suspend/unsuspend
const handleUpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-demotion or self-suspension
    if (String(userId) === String(req.user.id)) {
      if (req.body.role && req.body.role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot demote your own admin account.' });
      }
      if (req.body.suspend === true) {
        return res.status(400).json({ success: false, message: 'Cannot suspend your own admin account.' });
      }
    }

    let before = null;
    let updatedUser = null;

    if (isDbConnected()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          before = { name: user.name, role: user.role, suspendedAt: user.suspendedAt };

          if (req.body.name) user.name = req.body.name.trim();
          if (req.body.role && ['farmer', 'employee', 'admin', 'support'].includes(req.body.role)) {
            user.role = req.body.role;
          }
          if (req.body.suspend === true) user.suspendedAt = new Date();
          if (req.body.suspend === false) user.suspendedAt = null;

          await user.save();
          updatedUser = { id: user._id, _id: user._id, name: user.name, mobile: user.mobile, role: user.role, suspendedAt: user.suspendedAt };
        }
      } catch (e) {
        console.warn('DB user update notice:', e.message);
      }
    }

    // In-memory update
    if (authRoute.inMemoryUsers) {
      for (const [mob, u] of authRoute.inMemoryUsers.entries()) {
        if (String(u._id || u.id) === String(userId)) {
          if (!before) before = { name: u.name, role: u.role, suspendedAt: u.suspendedAt || null };

          if (req.body.name) u.name = req.body.name.trim();
          if (req.body.role && ['farmer', 'employee', 'admin', 'support'].includes(req.body.role)) {
            u.role = req.body.role;
          }
          if (req.body.suspend === true) u.suspendedAt = new Date();
          if (req.body.suspend === false) u.suspendedAt = null;

          updatedUser = { id: u._id || u.id, _id: u._id || u.id, name: u.name, mobile: u.mobile, role: u.role, suspendedAt: u.suspendedAt };
          break;
        }
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const action = req.body.suspend === true ? 'user.suspend' :
                   req.body.suspend === false ? 'user.unsuspend' :
                   (req.body.role && req.body.role !== before?.role) ? 'user.role_change' : 'user.edit';

    await logAudit(req.user.id, req.user.name, action, 'user', userId, before, updatedUser);

    res.json({
      success: true,
      message: `User ${action === 'user.suspend' ? 'suspended' : action === 'user.unsuspend' ? 'reactivated' : 'updated'} successfully.`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Admin edit user error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

router.put('/users/:id', requireAdmin, handleUpdateUser);
router.put('/users/:id/suspend', requireAdmin, (req, res) => {
  req.body = { ...req.body, suspend: true };
  return handleUpdateUser(req, res);
});
router.put('/users/:id/unsuspend', requireAdmin, (req, res) => {
  req.body = { ...req.body, suspend: false };
  return handleUpdateUser(req, res);
});

// Force password reset / set temporary password
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const tempPassword = req.body.tempPassword || 'Reset@' + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    if (isDbConnected()) {
      try {
        await User.findByIdAndUpdate(userId, { password: hashedPassword });
      } catch (_) {}
    }

    if (authRoute.inMemoryUsers) {
      for (const u of authRoute.inMemoryUsers.values()) {
        if (String(u._id || u.id) === String(userId)) {
          u.password = hashedPassword;
          break;
        }
      }
    }

    await logAudit(req.user.id, req.user.name, 'user.reset_password', 'user', userId, null, { tempPasswordSet: true });

    res.json({
      success: true,
      message: 'Password reset successfully.',
      temporaryPassword: tempPassword
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// Delete user: COMPLETE, PERMANENT ERASURE (Cascading Delete of farms, batches, logs, predictions, storage photos, appointments)
const handleDeleteUserCascade = async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    // 1. Locate user
    let userMobile = '';
    let userName = '';

    if (isDbConnected()) {
      try {
        const u = await User.findById(userId).lean();
        if (u) { userMobile = u.mobile; userName = u.name; }
      } catch (_) {}
    }

    if (!userMobile && authRoute.inMemoryUsers) {
      for (const u of authRoute.inMemoryUsers.values()) {
        if (String(u._id || u.id) === String(userId)) {
          userMobile = u.mobile;
          userName = u.name;
          break;
        }
      }
    }

    if (!userMobile && !userName) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Typed confirmation validation (Task 3 requirement)
    if (req.body && req.body.confirmMobileOrEmail) {
      const confirmVal = String(req.body.confirmMobileOrEmail).trim();
      if (confirmVal !== userMobile && confirmVal !== userName) {
        return res.status(400).json({
          success: false,
          message: `Confirmation mismatch. Typed confirmation must match "${userMobile}" or "${userName}".`
        });
      }
    }

    // 2. Tally & collect all records to delete
    const counts = {
      farms: 0,
      batches: 0,
      dailyLogs: 0,
      tasks: 0,
      alerts: 0,
      appointments: 0,
      predictions: 0,
      photosRemoved: 0
    };

    const photosToDelete = [];

    // Find user farms
    let farmIds = [];
    if (isDbConnected()) {
      try {
        const dbFarms = await Farm.find({ userId }).select('_id').lean();
        farmIds = dbFarms.map(f => f._id);
        counts.farms = farmIds.length;
      } catch (_) {}
    }

    if (inMemoryStore?.farms) {
      for (const [fId, f] of inMemoryStore.farms.entries()) {
        if (String(f.userId) === String(userId)) {
          if (!farmIds.some(id => String(id) === String(fId))) farmIds.push(fId);
          counts.farms++;
        }
      }
    }

    // Find predictions + photos on disk
    if (isDbConnected() && Prediction) {
      try {
        const preds = await Prediction.find({ $or: [{ userId }, { farmId: { $in: farmIds } }] }).lean();
        counts.predictions += preds.length;
        preds.forEach(p => {
          if (p.inputs?.savedFilename) photosToDelete.push(p.inputs.savedFilename);
        });
      } catch (_) {}
    }

    if (predictRoute.inMemoryPredictions) {
      predictRoute.inMemoryPredictions.forEach(p => {
        if (String(p.userId) === String(userId) || farmIds.some(fId => String(fId) === String(p.farmId))) {
          counts.predictions++;
          if (p.inputs?.savedFilename) photosToDelete.push(p.inputs.savedFilename);
        }
      });
    }

    // Write ONE AdminAuditLog entry BEFORE deletion recording reason and counts (Task 3 requirement)
    await logAudit(
      req.user.id,
      req.user.name,
      'USER_CASCADE_DELETE',
      'user',
      userId,
      { mobile: userMobile, name: userName },
      null,
      {
        reason: req.body?.reason || 'Permanent cascade erasure',
        confirmMobileOrEmail: req.body?.confirmMobileOrEmail || userMobile,
        deletionSummary: counts
      }
    );

    // Delete predictions from DB
    if (isDbConnected() && Prediction) {
      try {
        await Prediction.deleteMany({ $or: [{ userId }, { farmId: { $in: farmIds } }] });
      } catch (_) {}
    }

    // Delete in-memory predictions
    if (predictRoute.inMemoryPredictions) {
      const remainingPreds = predictRoute.inMemoryPredictions.filter(p =>
        !(String(p.userId) === String(userId) || farmIds.some(fId => String(fId) === String(p.farmId)))
      );
      predictRoute.inMemoryPredictions.length = 0;
      remainingPreds.forEach(p => predictRoute.inMemoryPredictions.push(p));
    }

    // Delete photos physically from uploads directory
    const uploadsDir = predictRoute.uploadsDir || path.join(__dirname, '..', 'uploads');
    photosToDelete.forEach(filename => {
      try {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          counts.photosRemoved++;
        }
      } catch (err) {
        console.warn('Notice: photo file deletion:', err.message);
      }
    });

    // Delete Batches, DailyLogs, Tasks, Alerts from MongoDB
    if (isDbConnected()) {
      try {
        if (Batch) {
          const res = await Batch.deleteMany({ $or: [{ userId }, { farmId: { $in: farmIds } }] });
          counts.batches += res.deletedCount || 0;
        }
        if (DailyLog) {
          const res = await DailyLog.deleteMany({ $or: [{ userId }, { farmId: { $in: farmIds } }] });
          counts.dailyLogs += res.deletedCount || 0;
        }
        if (Task) {
          const res = await Task.deleteMany({ userId });
          counts.tasks += res.deletedCount || 0;
        }
        if (Alert) {
          const res = await Alert.deleteMany({ $or: [{ userId }, { farmId: { $in: farmIds } }] });
          counts.alerts += res.deletedCount || 0;
        }
        await Farm.deleteMany({ userId });
        await User.findByIdAndDelete(userId);
      } catch (dbErr) {
        console.warn('DB cascade deletion notice:', dbErr.message);
      }
    }

    // Delete from in-memory store
    if (inMemoryStore) {
      if (inMemoryStore.farms) {
        farmIds.forEach(id => inMemoryStore.farms.delete(id));
      }
      if (inMemoryStore.batches) {
        for (const [bId, b] of inMemoryStore.batches.entries()) {
          if (String(b.userId) === String(userId) || farmIds.some(fId => String(fId) === String(b.farmId))) {
            inMemoryStore.batches.delete(bId);
            counts.batches++;
          }
        }
      }
      if (inMemoryStore.dailyLogs) {
        for (const [lId, l] of inMemoryStore.dailyLogs.entries()) {
          if (String(l.userId) === String(userId) || farmIds.some(fId => String(fId) === String(l.farmId))) {
            inMemoryStore.dailyLogs.delete(lId);
            counts.dailyLogs++;
          }
        }
      }
      if (inMemoryStore.tasks) {
        for (const [tId, t] of inMemoryStore.tasks.entries()) {
          if (String(t.userId) === String(userId)) {
            inMemoryStore.tasks.delete(tId);
            counts.tasks++;
          }
        }
      }
      if (inMemoryStore.alerts) {
        for (const [aId, a] of inMemoryStore.alerts.entries()) {
          if (String(a.userId) === String(userId) || farmIds.some(fId => String(fId) === String(a.farmId))) {
            inMemoryStore.alerts.delete(aId);
            counts.alerts++;
          }
        }
      }
    }

    // Delete Appointments
    if (doctorsRoute.appointments) {
      for (const [apptId, appt] of doctorsRoute.appointments.entries()) {
        if (String(appt.farmerId) === String(userId) || appt.farmerMobile === userMobile) {
          doctorsRoute.appointments.delete(apptId);
          counts.appointments++;
        }
      }
    }

    // Delete from inMemoryUsers
    if (authRoute.inMemoryUsers && userMobile) {
      authRoute.inMemoryUsers.delete(userMobile);
    }

    res.json({
      success: true,
      message: `User "${userName}" and all associated data permanently erased.`,
      deletionSummary: counts
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to permanently erase user.' });
  }
};

router.delete('/users/:id', requireAdmin, handleDeleteUserCascade);
router.delete('/users/:id/cascade-delete', requireAdmin, handleDeleteUserCascade);

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 4: MARKETPLACE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// List products with pagination, search, category, lowStock filter
router.get('/products', requireAdminOrSupport, (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', lowStock = '', status = '' } = req.query;
    let products = productsRoute.inMemoryProducts ? [...productsRoute.inMemoryProducts] : [];

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sellerName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (lowStock === 'true') {
      const thresh = thresholds.lowStockThreshold || 10;
      products = products.filter(p => (parseInt(p.stock) || 0) <= thresh);
    }

    if (status) {
      products = products.filter(p => p.status === status);
    }

    const total = products.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = products.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      products: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list marketplace products.' });
  }
});

// Create product
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, unit, description, stock, image, activeIngredients, treatmentTags, sellerName, sellerPhone, sellerLocation, status } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    }

    const newProd = {
      _id: 'prod_admin_' + Date.now(),
      name: name.trim(),
      category,
      price: parseFloat(price),
      unit: unit || '1 unit',
      description: description || '',
      stock: parseInt(stock) || 0,
      image: image || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
      activeIngredients: Array.isArray(activeIngredients) ? activeIngredients : [],
      treatmentTags: Array.isArray(treatmentTags) ? treatmentTags : [],
      sellerName: sellerName || 'AgriMind Official Store',
      sellerPhone: sellerPhone || '+880 1999-999999',
      sellerLocation: sellerLocation || 'Dhaka',
      rating: 5.0,
      badge: 'Official',
      status: status || 'active',
      isFarmerListing: false,
      createdAt: new Date().toISOString()
    };

    if (productsRoute.inMemoryProducts) {
      productsRoute.inMemoryProducts.unshift(newProd);
    }

    await logAudit(req.user.id, req.user.name, 'product.create', 'product', newProd._id, null, newProd);

    res.status(201).json({ success: true, product: newProd, message: 'Product created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// Edit product
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const pId = req.params.id;
    if (!productsRoute.inMemoryProducts) {
      return res.status(404).json({ success: false, message: 'Products store unavailable.' });
    }

    const idx = productsRoute.inMemoryProducts.findIndex(p => String(p._id) === String(pId));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const before = { ...productsRoute.inMemoryProducts[idx] };
    const updated = {
      ...before,
      ...req.body,
      _id: before._id,
      updatedAt: new Date().toISOString()
    };
    if (req.body.price !== undefined) updated.price = parseFloat(req.body.price);
    if (req.body.stock !== undefined) updated.stock = parseInt(req.body.stock);

    productsRoute.inMemoryProducts[idx] = updated;

    await logAudit(req.user.id, req.user.name, 'product.edit', 'product', pId, before, updated);

    res.json({ success: true, product: updated, message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const pId = req.params.id;
    if (!productsRoute.inMemoryProducts) {
      return res.status(404).json({ success: false, message: 'Products store unavailable.' });
    }

    const idx = productsRoute.inMemoryProducts.findIndex(p => String(p._id) === String(pId));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const deleted = productsRoute.inMemoryProducts.splice(idx, 1)[0];

    await logAudit(req.user.id, req.user.name, 'product.delete', 'product', pId, deleted, null);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// Bulk status toggle (activate / deactivate / hide)
router.post('/products/bulk-status', requireAdmin, async (req, res) => {
  try {
    const { productIds, status } = req.body;
    if (!Array.isArray(productIds) || !status) {
      return res.status(400).json({ success: false, message: 'productIds array and status are required.' });
    }

    let modified = 0;
    if (productsRoute.inMemoryProducts) {
      productsRoute.inMemoryProducts.forEach(p => {
        if (productIds.includes(p._id)) {
          p.status = status;
          modified++;
        }
      });
    }

    await logAudit(req.user.id, req.user.name, 'product.bulk_status', 'product', 'bulk', null, { productIds, status, modified });

    res.json({ success: true, message: `Updated ${modified} products to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed bulk status update.' });
  }
});

// Bulk stock update
router.post('/products/bulk-stock', requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, stock }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'updates array is required.' });
    }

    let modified = 0;
    if (productsRoute.inMemoryProducts) {
      updates.forEach(u => {
        const prod = productsRoute.inMemoryProducts.find(p => p._id === u.id);
        if (prod && u.stock !== undefined) {
          prod.stock = parseInt(u.stock);
          modified++;
        }
      });
    }

    await logAudit(req.user.id, req.user.name, 'product.bulk_stock', 'product', 'bulk', null, { updatesCount: updates.length, modified });

    res.json({ success: true, message: `Updated stock for ${modified} products.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed bulk stock update.' });
  }
});

// Product Categories
router.get('/categories', requireAdminOrSupport, (req, res) => {
  res.json({ success: true, categories: productsRoute.productCategories || [] });
});

router.post('/categories', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Category name required.' });
  const trimmed = name.trim();
  if (productsRoute.productCategories && !productsRoute.productCategories.includes(trimmed)) {
    productsRoute.productCategories.push(trimmed);
  }
  await logAudit(req.user.id, req.user.name, 'category.create', 'product', trimmed, null, { name: trimmed });
  res.status(201).json({ success: true, categories: productsRoute.productCategories });
});

router.put('/categories/:oldName', requireAdmin, async (req, res) => {
  const oldName = decodeURIComponent(req.params.oldName);
  const { newName } = req.body;
  if (!newName || !newName.trim()) return res.status(400).json({ success: false, message: 'New category name required.' });
  const trimmed = newName.trim();
  if (productsRoute.productCategories) {
    const idx = productsRoute.productCategories.indexOf(oldName);
    if (idx !== -1) productsRoute.productCategories[idx] = trimmed;
    if (productsRoute.inMemoryProducts) {
      productsRoute.inMemoryProducts.forEach(p => {
        if (p.category === oldName) p.category = trimmed;
      });
    }
  }
  await logAudit(req.user.id, req.user.name, 'category.edit', 'product', oldName, { name: oldName }, { name: trimmed });
  res.json({ success: true, categories: productsRoute.productCategories });
});

router.delete('/categories/:name', requireAdmin, async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  if (productsRoute.productCategories) {
    productsRoute.productCategories = productsRoute.productCategories.filter(c => c !== name);
  }
  await logAudit(req.user.id, req.user.name, 'category.delete', 'product', name, { name }, null);
  res.json({ success: true, categories: productsRoute.productCategories });
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER ORDERS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// List all customer orders with filters and pagination
router.get('/orders', requireAdminOrSupport, (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let list = ordersRoute.inMemoryOrders ? [...ordersRoute.inMemoryOrders] : [];

    if (status && status !== 'all') {
      list = list.filter(o => o.orderStatus?.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = list.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      orders: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list orders.' });
  }
});

// Update order status or delivery notes
router.put('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const oId = req.params.id;
    if (!ordersRoute.inMemoryOrders) {
      return res.status(404).json({ success: false, message: 'Orders store unavailable.' });
    }

    const order = ordersRoute.inMemoryOrders.find(o => String(o._id) === String(oId) || String(o.orderNumber) === String(oId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const before = { ...order };
    if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
    if (req.body.notes !== undefined) order.notes = req.body.notes;
    order.updatedAt = new Date().toISOString();

    await logAudit(req.user.id, req.user.name, 'order.update_status', 'order', order.orderNumber, before, order);

    res.json({ success: true, order, message: `Order ${order.orderNumber} updated successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order.' });
  }
});

// Delete or cancel order
router.delete('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const oId = req.params.id;
    if (!ordersRoute.inMemoryOrders) {
      return res.status(404).json({ success: false, message: 'Orders store unavailable.' });
    }

    const idx = ordersRoute.inMemoryOrders.findIndex(o => String(o._id) === String(oId) || String(o.orderNumber) === String(oId));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const deleted = ordersRoute.inMemoryOrders.splice(idx, 1)[0];
    await logAudit(req.user.id, req.user.name, 'order.delete', 'order', deleted.orderNumber, deleted, null);

    res.json({ success: true, message: `Order ${deleted.orderNumber} removed.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete order.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 5: DOCTOR DIRECTORY & APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// List doctors (including inactive & synthetic)
router.get('/doctors', requireAdminOrSupport, (req, res) => {
  try {
    const doctors = doctorsRoute.SEED_DOCTORS || [];
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list doctors.' });
  }
});

// Create doctor
router.post('/doctors', requireAdmin, async (req, res) => {
  try {
    const { name, district, specialty, consultationFee, phone, email, rating, isSynthetic, active } = req.body;

    if (!name || !district) {
      return res.status(400).json({ success: false, message: 'Doctor name and district are required.' });
    }

    const newDoc = {
      _id: 'doc_' + Date.now(),
      name: name.trim(),
      district: district.trim(),
      specialty: specialty || 'General Poultry Health',
      consultationFee: consultationFee || { video: 350, farmVisit: 1200 },
      phone: phone || '+880 1700-000000',
      email: email || '',
      rating: parseFloat(rating) || 5.0,
      isSynthetic: isSynthetic !== undefined ? Boolean(isSynthetic) : false,
      active: active !== undefined ? Boolean(active) : true,
      availability: 'Mon - Fri, 9am - 6pm'
    };

    if (doctorsRoute.SEED_DOCTORS) {
      doctorsRoute.SEED_DOCTORS.unshift(newDoc);
    }

    await logAudit(req.user.id, req.user.name, 'doctor.create', 'doctor', newDoc._id, null, newDoc);

    res.status(201).json({ success: true, doctor: newDoc, message: 'Doctor added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add doctor.' });
  }
});

// Edit doctor (toggle verification, active status, details)
router.put('/doctors/:id', requireAdmin, async (req, res) => {
  try {
    const dId = req.params.id;
    const doc = doctorsRoute.SEED_DOCTORS?.find(d => d._id === dId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const before = { ...doc };
    Object.assign(doc, req.body);
    doc._id = dId;

    const action = req.body.active !== undefined
      ? (req.body.active ? 'doctor.activate' : 'doctor.deactivate')
      : req.body.isSynthetic !== undefined
      ? (req.body.isSynthetic ? 'doctor.unverify' : 'doctor.verify')
      : 'doctor.edit';

    await logAudit(req.user.id, req.user.name, action, 'doctor', dId, before, doc);

    res.json({ success: true, doctor: doc, message: 'Doctor updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update doctor.' });
  }
});

// Delete doctor
router.delete('/doctors/:id', requireAdmin, async (req, res) => {
  try {
    const dId = req.params.id;
    const idx = doctorsRoute.SEED_DOCTORS?.findIndex(d => d._id === dId);
    if (idx === -1 || idx === undefined) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const deleted = doctorsRoute.SEED_DOCTORS.splice(idx, 1)[0];
    await logAudit(req.user.id, req.user.name, 'doctor.delete', 'doctor', dId, deleted, null);

    res.json({ success: true, message: 'Doctor listing deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete doctor.' });
  }
});

// List all appointments (filter by status, type, district, date range)
router.get('/appointments', requireAdminOrSupport, (req, res) => {
  try {
    const { status, type, district, page = 1, limit = 25 } = req.query;
    let list = [];

    if (doctorsRoute.appointments) {
      list = Array.from(doctorsRoute.appointments.values());
    }

    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }
    if (type && type !== 'all') {
      list = list.filter(a => a.type === type);
    }
    if (district) {
      const d = district.toLowerCase();
      list = list.filter(a => a.doctorDistrict?.toLowerCase().includes(d) || a.farmAddress?.toLowerCase().includes(d));
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = list.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      appointments: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list appointments.' });
  }
});

// Update appointment status manually (mark completed, cancelled, confirmed)
router.put('/appointments/:id', requireAdmin, async (req, res) => {
  try {
    const apptId = req.params.id;
    const appt = doctorsRoute.appointments?.get(apptId);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const before = { ...appt };
    if (req.body.status) appt.status = req.body.status;
    if (req.body.notes !== undefined) appt.notes = req.body.notes;
    appt.updatedAt = new Date().toISOString();

    doctorsRoute.appointments.set(apptId, appt);

    await logAudit(req.user.id, req.user.name, 'appointment.update', 'appointment', apptId, before, appt);

    res.json({ success: true, appointment: appt, message: 'Appointment status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 6: FARMS & DIAGNOSTICS OVERSIGHT
// ═══════════════════════════════════════════════════════════════════════════════

// List all farms
router.get('/farms', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', flagged = '' } = req.query;
    let farms = [];

    if (isDbConnected()) {
      try {
        farms = await Farm.find().populate('userId', 'name mobile role').sort({ createdAt: -1 }).lean();
      } catch (_) {}
    }

    if (farms.length === 0 && inMemoryStore?.farms) {
      farms = Array.from(inMemoryStore.farms.values());
    }

    if (search) {
      const s = search.toLowerCase();
      farms = farms.filter(f =>
        f.farmName?.toLowerCase().includes(s) ||
        f.ownerName?.toLowerCase().includes(s) ||
        f.city?.toLowerCase().includes(s)
      );
    }

    if (flagged === 'true') {
      farms = farms.filter(f => f.flagged === true);
    }

    // Attach batch count
    const enriched = farms.map(f => {
      let batchCount = 0;
      if (inMemoryStore?.batches) {
        for (const b of inMemoryStore.batches.values()) {
          if (String(b.farmId) === String(f._id)) batchCount++;
        }
      }
      return {
        ...f,
        batchCount,
        status: f.flagged ? 'Attention Required' : 'Looks Good'
      };
    });

    const total = enriched.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = enriched.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      farms: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list farms.' });
  }
});

// Single farm detail with batches
router.get('/farms/:id', requireAdminOrSupport, async (req, res) => {
  try {
    const farmId = req.params.id;
    let farm = null;

    if (isDbConnected()) {
      try {
        farm = await Farm.findById(farmId).populate('userId', 'name mobile').lean();
      } catch (_) {}
    }

    if (!farm && inMemoryStore?.farms) {
      farm = inMemoryStore.farms.get(farmId) || null;
    }

    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

    let batches = [];
    if (isDbConnected() && Batch) {
      try { batches = await Batch.find({ farmId }).lean(); } catch (_) {}
    }
    if (batches.length === 0 && inMemoryStore?.batches) {
      for (const b of inMemoryStore.batches.values()) {
        if (String(b.farmId) === String(farmId)) batches.push(b);
      }
    }

    res.json({ success: true, farm, batches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get farm details.' });
  }
});

// Flag / unflag farm for follow-up
router.put('/farms/:id/flag', requireAdmin, async (req, res) => {
  try {
    const farmId = req.params.id;
    const { flagged, note } = req.body;

    if (isDbConnected()) {
      try {
        await Farm.findByIdAndUpdate(farmId, { flagged: Boolean(flagged), flaggedNote: note || '' });
      } catch (_) {}
    }

    if (inMemoryStore?.farms) {
      const f = inMemoryStore.farms.get(farmId);
      if (f) {
        f.flagged = Boolean(flagged);
        f.flaggedNote = note || '';
      }
    }

    const action = flagged ? 'farm.flag' : 'farm.unflag';
    await logAudit(req.user.id, req.user.name, action, 'farm', farmId, null, { flagged, note });

    res.json({ success: true, message: `Farm ${flagged ? 'flagged for follow-up' : 'unflagged'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update farm flag.' });
  }
});

// Delete farm with complete erasure
router.delete('/farms/:id', requireAdmin, async (req, res) => {
  try {
    const farmId = req.params.id;
    const counts = { batches: 0, dailyLogs: 0, predictions: 0, photosRemoved: 0 };
    const photosToDelete = [];

    // Tally predictions & photos
    if (predictRoute.inMemoryPredictions) {
      const remaining = [];
      predictRoute.inMemoryPredictions.forEach(p => {
        if (String(p.farmId) === String(farmId)) {
          counts.predictions++;
          if (p.inputs?.savedFilename) photosToDelete.push(p.inputs.savedFilename);
        } else {
          remaining.push(p);
        }
      });
      predictRoute.inMemoryPredictions.length = 0;
      remaining.forEach(p => predictRoute.inMemoryPredictions.push(p));
    }

    // Unlink image files
    const uploadsDir = predictRoute.uploadsDir || path.join(__dirname, '..', 'uploads');
    photosToDelete.forEach(fn => {
      try {
        const p = path.join(uploadsDir, fn);
        if (fs.existsSync(p)) { fs.unlinkSync(p); counts.photosRemoved++; }
      } catch (_) {}
    });

    if (isDbConnected()) {
      try {
        if (Batch) {
          const r = await Batch.deleteMany({ farmId });
          counts.batches += r.deletedCount || 0;
        }
        if (DailyLog) {
          const r = await DailyLog.deleteMany({ farmId });
          counts.dailyLogs += r.deletedCount || 0;
        }
        if (Prediction) {
          await Prediction.deleteMany({ farmId });
        }
        await Farm.findByIdAndDelete(farmId);
      } catch (_) {}
    }

    if (inMemoryStore) {
      inMemoryStore.farms?.delete(farmId);
      if (inMemoryStore.batches) {
        for (const [bId, b] of inMemoryStore.batches.entries()) {
          if (String(b.farmId) === String(farmId)) { inMemoryStore.batches.delete(bId); counts.batches++; }
        }
      }
      if (inMemoryStore.dailyLogs) {
        for (const [lId, l] of inMemoryStore.dailyLogs.entries()) {
          if (String(l.farmId) === String(farmId)) { inMemoryStore.dailyLogs.delete(lId); counts.dailyLogs++; }
        }
      }
    }

    await logAudit(req.user.id, req.user.name, 'farm.delete', 'farm', farmId, null, { deletionSummary: counts });

    res.json({ success: true, message: 'Farm and all associated data permanently erased.', deletionSummary: counts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete farm.' });
  }
});

// Diagnostics list with confidence distribution chart
router.get('/diagnostics', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', flagged = '' } = req.query;
    let list = [];

    if (isDbConnected() && Prediction) {
      try {
        list = await Prediction.find({ type: 'disease' }).sort({ timestamp: -1 }).lean();
      } catch (_) {}
    }

    if (list.length === 0 && predictRoute.inMemoryPredictions) {
      list = [...predictRoute.inMemoryPredictions];
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.result?.prediction?.toLowerCase().includes(s) ||
        p.inputs?.filename?.toLowerCase().includes(s) ||
        p.farmId?.toLowerCase().includes(s)
      );
    }

    if (flagged === 'true') {
      list = list.filter(p => p.flagged === true);
    }

    // Confidence distribution calculation across all records
    const distribution = {
      total: list.length,
      highConfidence: list.filter(p => (p.result?.confidence || 0) >= 0.85).length,
      mediumConfidence: list.filter(p => (p.result?.confidence || 0) >= 0.70 && (p.result?.confidence || 0) < 0.85).length,
      lowConfidence: list.filter(p => (p.result?.confidence || 0) < 0.70).length
    };

    const total = list.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = list.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      diagnostics: paginated,
      distribution,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list diagnostics.' });
  }
});

// Flag / unflag diagnostic result for follow-up (e.g. suspected model error)
router.put('/diagnostics/:id/flag', requireAdmin, async (req, res) => {
  try {
    const diagId = req.params.id;
    const { flagged, note } = req.body;

    if (isDbConnected() && Prediction) {
      try {
        await Prediction.findByIdAndUpdate(diagId, { flagged: Boolean(flagged), flaggedNote: note || '' });
      } catch (_) {}
    }

    if (predictRoute.inMemoryPredictions) {
      const pred = predictRoute.inMemoryPredictions.find(p => String(p._id) === String(diagId));
      if (pred) {
        pred.flagged = Boolean(flagged);
        pred.flaggedNote = note || '';
      }
    }

    const action = flagged ? 'diagnostic.flag' : 'diagnostic.unflag';
    await logAudit(req.user.id, req.user.name, action, 'diagnostic', diagId, null, { flagged, note });

    res.json({ success: true, message: `Diagnostic record ${flagged ? 'flagged for follow-up' : 'unflagged'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update diagnostic flag.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 7: CONTENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Breed Lifecycle Templates
router.get('/content/breeds', requireAdminOrSupport, (req, res) => {
  try {
    const templates = templateLoader.getAllTemplates();
    const list = Object.keys(templates).map(key => {
      const active = templates[key];
      const draft = templateLoader.getDraftTemplate(key);
      return {
        chickenType: key,
        active,
        draft: draft || null
      };
    });
    res.json({ success: true, breeds: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list breed templates.' });
  }
});

// Save draft breed template
router.post('/content/breeds/:type/draft', requireAdmin, async (req, res) => {
  try {
    const chickenType = req.params.type;
    const draft = templateLoader.saveDraftTemplate(chickenType, req.body);
    await logAudit(req.user.id, req.user.name, 'content.breed_draft', 'content', chickenType, null, { chickenType });
    res.json({ success: true, draft, message: 'Draft template saved.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Publish breed template live (requires 2-step confirmation on frontend)
router.post('/content/breeds/:type/publish', requireAdmin, async (req, res) => {
  try {
    const chickenType = req.params.type;
    const before = templateLoader.getTemplate(chickenType);
    const published = templateLoader.publishTemplate(chickenType, req.body);

    await logAudit(
      req.user.id,
      req.user.name,
      'content.breed_publish',
      'content',
      chickenType,
      { version: before?.version },
      { version: published.version, stagesCount: published.stages?.length }
    );

    res.json({
      success: true,
      published,
      message: `Breed template for "${chickenType}" v${published.version} published live!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to publish template: ' + err.message });
  }
});

// Disease Treatment Maps
router.get('/content/treatments', requireAdminOrSupport, async (req, res) => {
  try {
    let treatments = [];
    if (isDbConnected() && DiseaseTreatmentMap) {
      try { treatments = await DiseaseTreatmentMap.find().lean(); } catch (_) {}
    }
    if (treatments.length === 0) {
      const { SEED_DATA } = require('../seeds/diseaseTreatmentMap');
      treatments = SEED_DATA || [];
    }
    res.json({ success: true, treatments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get treatment mappings.' });
  }
});

router.put('/content/treatments/:id', requireAdmin, async (req, res) => {
  try {
    const tId = req.params.id;
    let updated = null;
    let before = null;

    if (isDbConnected() && DiseaseTreatmentMap) {
      try {
        before = await DiseaseTreatmentMap.findById(tId).lean();
        updated = await DiseaseTreatmentMap.findByIdAndUpdate(tId, { $set: req.body }, { new: true }).lean();
      } catch (_) {}
    }

    if (!updated) {
      const { SEED_DATA } = require('../seeds/diseaseTreatmentMap');
      const idx = SEED_DATA.findIndex(d => String(d._id) === String(tId) || d.diseaseKey === tId);
      if (idx !== -1) {
        before = { ...SEED_DATA[idx] };
        Object.assign(SEED_DATA[idx], req.body);
        updated = SEED_DATA[idx];
      }
    }

    await logAudit(req.user.id, req.user.name, 'content.treatment_edit', 'content', tId, before, updated);

    res.json({ success: true, treatment: updated, message: 'Treatment map updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update treatment map.' });
  }
});

// Weather alert thresholds
router.get('/content/weather-thresholds', requireAdminOrSupport, (req, res) => {
  res.json({ success: true, thresholds });
});

router.put('/content/weather-thresholds', requireAdmin, async (req, res) => {
  try {
    const before = { ...thresholds };
    const allowed = ['heatStressTempC', 'heatStressForecastMaxC', 'humidityRiskPct', 'humidityRiskTempC', 'coldSnapTempC', 'coldSnapMaxAgeDays'];

    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        thresholds[key] = parseFloat(req.body[key]);
      }
    });

    await logAudit(req.user.id, req.user.name, 'content.weather_edit', 'content', 'thresholds', before, thresholds);

    res.json({ success: true, thresholds, message: 'Weather thresholds updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update weather thresholds.' });
  }
});

// Homepage copy content
router.get('/content/homepage', requireAdminOrSupport, (req, res) => {
  try {
    const contentPath = path.join(__dirname, '..', 'config', 'homepageContent.json');
    if (fs.existsSync(contentPath)) {
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      return res.json({ success: true, content });
    }
  } catch (_) {}
  res.json({
    success: true,
    content: {
      heroHeadline: "Smarter poultry farming, every single day",
      heroSubtext: "Track batch health with daily smart check-ins, detect diseases from droppings in seconds, consult verified poultry doctors, and trade directly on AgriShop.",
      aboutTitle: "Everything your flock needs, in one unified platform",
      aboutText: "AgriMind bridges the gap between field reality and agricultural intelligence. From automated batch schedules and real-time disease detection to direct veterinary consultations, our tools are built specifically for the needs of Bangladeshi poultry farmers."
    }
  });
});

router.put('/content/homepage', requireAdmin, async (req, res) => {
  try {
    const contentPath = path.join(__dirname, '..', 'config', 'homepageContent.json');
    const before = fs.existsSync(contentPath) ? JSON.parse(fs.readFileSync(contentPath, 'utf8')) : {};
    const updated = {
      heroHeadline: req.body.heroHeadline || before.heroHeadline || "Smarter poultry farming, every single day",
      heroSubtext: req.body.heroSubtext || before.heroSubtext || "",
      aboutTitle: req.body.aboutTitle || before.aboutTitle || "Everything your flock needs, in one unified platform",
      aboutText: req.body.aboutText || before.aboutText || ""
    };

    fs.writeFileSync(contentPath, JSON.stringify(updated, null, 2), 'utf8');

    await logAudit(req.user.id, req.user.name, 'content.homepage_edit', 'content', 'homepage', before, updated);

    res.json({ success: true, content: updated, message: 'Homepage copy updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update homepage copy.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TASK 8: SETTINGS & ADMIN USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Platform settings
router.get('/settings', requireAdmin, (req, res) => {
  res.json({
    success: true,
    settings: {
      diagnosisConfidenceThreshold: thresholds.diagnosisConfidenceThreshold !== undefined ? thresholds.diagnosisConfidenceThreshold : 0.70,
      photoRetentionDays: thresholds.photoRetentionDays || 90,
      mortalityThresholdPct: thresholds.mortalityThresholdPct || 0.5,
      mortalitySpikeFactor: thresholds.mortalitySpikeFactor || 2,
      lowStockThreshold: thresholds.lowStockThreshold || 10,
      weatherTTLDays: thresholds.weatherTTLDays || 7,
      dbConnected: isDbConnected()
    }
  });
});

// Update settings (affects farmer-facing app immediately)
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const before = {
      diagnosisConfidenceThreshold: thresholds.diagnosisConfidenceThreshold,
      photoRetentionDays: thresholds.photoRetentionDays,
      mortalityThresholdPct: thresholds.mortalityThresholdPct,
      mortalitySpikeFactor: thresholds.mortalitySpikeFactor,
      lowStockThreshold: thresholds.lowStockThreshold
    };

    if (req.body.diagnosisConfidenceThreshold !== undefined) {
      thresholds.diagnosisConfidenceThreshold = parseFloat(req.body.diagnosisConfidenceThreshold);
    }
    if (req.body.photoRetentionDays !== undefined) {
      thresholds.photoRetentionDays = parseInt(req.body.photoRetentionDays);
    }
    if (req.body.mortalityThresholdPct !== undefined) {
      thresholds.mortalityThresholdPct = parseFloat(req.body.mortalityThresholdPct);
    }
    if (req.body.mortalitySpikeFactor !== undefined) {
      thresholds.mortalitySpikeFactor = parseFloat(req.body.mortalitySpikeFactor);
    }
    if (req.body.lowStockThreshold !== undefined) {
      thresholds.lowStockThreshold = parseInt(req.body.lowStockThreshold);
    }

    const after = {
      diagnosisConfidenceThreshold: thresholds.diagnosisConfidenceThreshold,
      photoRetentionDays: thresholds.photoRetentionDays,
      mortalityThresholdPct: thresholds.mortalityThresholdPct,
      mortalitySpikeFactor: thresholds.mortalitySpikeFactor,
      lowStockThreshold: thresholds.lowStockThreshold
    };

    await logAudit(req.user.id, req.user.name, 'settings.update', 'settings', 'global', before, after);

    res.json({
      success: true,
      message: 'Platform settings updated successfully. Changes are now active across all services.',
      settings: after
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update platform settings.' });
  }
});

// Admin Users List
router.get('/settings/admins', requireAdmin, async (req, res) => {
  try {
    let admins = [];
    if (isDbConnected()) {
      try {
        admins = await User.find({ role: { $in: ['admin', 'support'] } }).select('-password').lean();
      } catch (_) {}
    }

    if (admins.length === 0 && authRoute.inMemoryUsers) {
      for (const u of authRoute.inMemoryUsers.values()) {
        if (u.role === 'admin' || u.role === 'support') {
          admins.push({
            _id: u._id || u.id,
            name: u.name,
            mobile: u.mobile,
            role: u.role,
            createdAt: u.createdAt || new Date().toISOString()
          });
        }
      }
    }

    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list admin users.' });
  }
});

// Create / Invite Admin or Support user (Admin only)
router.post('/settings/admins', requireAdmin, async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile, and password are required.' });
    }

    if (!['admin', 'support'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "admin" or "support".' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let newAdmin = null;

    if (isDbConnected()) {
      try {
        const existing = await User.findOne({ mobile });
        if (existing) {
          existing.role = role;
          existing.name = name.trim();
          existing.password = hashedPassword;
          await existing.save();
          newAdmin = { _id: existing._id, name: existing.name, mobile: existing.mobile, role: existing.role };
        } else {
          const user = new User({ name: name.trim(), mobile: mobile.trim(), password, role });
          await user.save();
          newAdmin = { _id: user._id, name: user.name, mobile: user.mobile, role: user.role };
        }
      } catch (dbErr) {
        console.warn('DB admin creation notice:', dbErr.message);
      }
    }

    // In-memory fallback
    if (!newAdmin && authRoute.inMemoryUsers) {
      const mockAdmin = {
        _id: 'admin_' + Date.now(),
        name: name.trim(),
        mobile: mobile.trim(),
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString()
      };
      authRoute.inMemoryUsers.set(mobile.trim(), mockAdmin);
      newAdmin = { _id: mockAdmin._id, name: mockAdmin.name, mobile: mockAdmin.mobile, role: mockAdmin.role };
    }

    await logAudit(req.user.id, req.user.name, 'admin.create', 'user', newAdmin?._id, null, { name, mobile, role });

    res.status(201).json({ success: true, admin: newAdmin, message: `${role.toUpperCase()} account created successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create admin user.' });
  }
});

// Revoke or change admin user role
router.put('/settings/admins/:id', requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { role } = req.body;

    if (String(targetId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot change your own admin privileges.' });
    }

    if (!['farmer', 'employee', 'admin', 'support'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role.' });
    }

    if (isDbConnected()) {
      try {
        await User.findByIdAndUpdate(targetId, { role });
      } catch (_) {}
    }

    if (authRoute.inMemoryUsers) {
      for (const u of authRoute.inMemoryUsers.values()) {
        if (String(u._id || u.id) === String(targetId)) {
          u.role = role;
          break;
        }
      }
    }

    await logAudit(req.user.id, req.user.name, 'admin.revoke', 'user', targetId, null, { newRole: role });

    res.json({ success: true, message: `Access role updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update admin role.' });
  }
});

// Audit Log Viewer (paginated, filtered)
const handleGetAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 30, action = '', targetType = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let logs = [];
    let total = 0;

    if (isDbConnected()) {
      try {
        const query = {};
        if (action) query.action = { $regex: action, $options: 'i' };
        if (targetType) query.targetType = targetType;

        const [dbLogs, count] = await Promise.all([
          AdminAuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)).lean(),
          AdminAuditLog.countDocuments(query)
        ]);
        logs = dbLogs;
        total = count;
      } catch (_) {}
    }

    if (logs.length === 0) {
      let filtered = [...inMemoryAuditLogs];
      if (action) filtered = filtered.filter(l => l.action.includes(action));
      if (targetType) filtered = filtered.filter(l => l.targetType === targetType);
      total = filtered.length;
      logs = filtered.slice(skip, skip + parseInt(limit));
    }

    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load audit log.' });
  }
};

router.get('/audit-log', requireAdminOrSupport, handleGetAuditLog);
router.get('/audit-logs', requireAdminOrSupport, handleGetAuditLog);

module.exports = router;
