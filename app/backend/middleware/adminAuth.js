/**
 * =============================================================================
 * Module: Admin Authorization Middleware
 * Component: /app/backend/middleware/adminAuth.js
 * Description: Role-based access control for admin panel endpoints.
 *              Provides requireAdmin (admin only) and requireAdminOrSupport
 *              (admin + support read-access) middleware functions.
 *              Must be used AFTER the standard auth middleware.
 * =============================================================================
 */

const User = require('../models/User');
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Middleware: requireAdmin
 * Only allows users with role === 'admin'.
 * Must be placed after the auth middleware so req.user is populated.
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let userRole = req.user.role;

    // Verify role from database or in-memory store for extra security
    if (isDbConnected()) {
      try {
        const dbUser = await User.findById(req.user.id).select('role suspendedAt');
        if (!dbUser) {
          return res.status(401).json({ success: false, message: 'User account not found.' });
        }
        if (dbUser.suspendedAt) {
          return res.status(403).json({ success: false, message: 'Account suspended.' });
        }
        userRole = dbUser.role;
      } catch (dbErr) {
        console.warn('Admin auth DB check failed, using JWT role:', dbErr.message);
      }
    } else {
      // In-memory fallback check
      try {
        const authRoute = require('../routes/auth');
        if (authRoute.inMemoryUsers) {
          for (const u of authRoute.inMemoryUsers.values()) {
            if (String(u._id || u.id) === String(req.user.id) || u.mobile === req.user.mobile) {
              if (u.suspendedAt) {
                return res.status(403).json({ success: false, message: 'Account suspended.' });
              }
              userRole = u.role;
              break;
            }
          }
        }
      } catch (_) {}
    }

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin access required.'
      });
    }

    req.adminRole = userRole;
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authorization check failed.' });
  }
};

/**
 * Middleware: requireAdminOrSupport
 * Allows users with role === 'admin' OR role === 'support'.
 * Support users get read-mostly access.
 */
const requireAdminOrSupport = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let userRole = req.user.role;

    if (isDbConnected()) {
      try {
        const dbUser = await User.findById(req.user.id).select('role suspendedAt');
        if (!dbUser) {
          return res.status(401).json({ success: false, message: 'User account not found.' });
        }
        if (dbUser.suspendedAt) {
          return res.status(403).json({ success: false, message: 'Account suspended.' });
        }
        userRole = dbUser.role;
      } catch (dbErr) {
        console.warn('Admin auth DB check failed, using JWT role:', dbErr.message);
      }
    } else {
      try {
        const authRoute = require('../routes/auth');
        if (authRoute.inMemoryUsers) {
          for (const u of authRoute.inMemoryUsers.values()) {
            if (String(u._id || u.id) === String(req.user.id) || u.mobile === req.user.mobile) {
              if (u.suspendedAt) {
                return res.status(403).json({ success: false, message: 'Account suspended.' });
              }
              userRole = u.role;
              break;
            }
          }
        }
      } catch (_) {}
    }

    if (userRole !== 'admin' && userRole !== 'support') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin or support access required.'
      });
    }

    req.adminRole = userRole;
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authorization check failed.' });
  }
};

module.exports = { requireAdmin, requireAdminOrSupport };
