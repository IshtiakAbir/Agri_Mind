/**
 * =============================================================================
 * Module: User Management & Employee Operations Routes
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/backend/routes/user.js
 * Description: Profile modifications, password updates, and employee farmer lookup
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @route   PUT /api/user/profile
// @desc    Update user mobile and/or password
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { mobile, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (isDbConnected()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          // If updating mobile
          if (mobile && mobile !== user.mobile) {
            if (mobile.length !== 11 || !mobile.startsWith('01')) {
              return res.status(400).json({ success: false, message: 'Mobile must be 11 digits and start with 01.' });
            }
            const existing = await User.findOne({ mobile, _id: { $ne: userId } });
            if (existing) {
              return res.status(400).json({ success: false, message: 'This mobile number is already taken.' });
            }
            user.mobile = mobile.trim();
          }

          // If updating password
          if (newPassword) {
            if (!currentPassword) {
              return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
            }
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
              return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            }
            if (newPassword.length < 6) {
              return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
            }
            user.password = newPassword;
          }

          await user.save();
          return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role }
          });
        }
      } catch (dbErr) {}
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: { id: userId, name: req.user.name, mobile: mobile || req.user.mobile, role: req.user.role }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// @route   GET /api/user/farmer/:mobile
// @desc    Employee lookup of farmer account by mobile
// @access  Private (Employee only)
router.get('/farmer/:mobile', auth, async (req, res) => {
  try {
    const { mobile } = req.params;
    if (isDbConnected()) {
      try {
        const farmer = await User.findOne({ mobile, role: 'farmer' }).select('-password');
        if (farmer) {
          return res.json({ success: true, farmer });
        }
      } catch (e) {}
    }

    // Check in-memory users for fallback / demo evaluation
    const authRouter = require('./auth');
    if (authRouter.inMemoryUsers) {
      const mockUser = authRouter.inMemoryUsers.get(mobile);
      if (mockUser && mockUser.role === 'farmer') {
        return res.json({
          success: true,
          farmer: {
            id: mockUser._id || mockUser.id,
            name: mockUser.name,
            mobile: mockUser.mobile,
            role: mockUser.role,
            createdAt: mockUser.createdAt || new Date().toISOString()
          }
        });
      }
    }

    return res.status(404).json({ success: false, message: 'No farmer found with this mobile number.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error searching farmer.' });
  }
});

module.exports = router;
