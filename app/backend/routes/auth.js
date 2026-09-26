/**
 * =============================================================================
 * Module: Authentication Routes
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/backend/routes/auth.js
 * Description: Registration, login, profile verification, and password recovery
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { DEMO_USER_ID } = require('../config/inMemoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'agrimind_super_secret_jwt_key_2026';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// In-memory fallback users for offline demo resilience
const inMemoryUsers = new Map();

// Helper to preseed default in-memory demo accounts
const defaultHashedPassword = bcrypt.hashSync('password123', 10);

const seedUser = (id, name, mobile, role) => {
  inMemoryUsers.set(mobile, {
    _id: id,
    id: id,
    name,
    mobile,
    role,
    password: defaultHashedPassword,
    matchPassword: async (p) => bcrypt.compare(p, defaultHashedPassword)
  });
};

seedUser(DEMO_USER_ID, 'Mohammad Rahman (Demo)', '01712345678', 'farmer');
seedUser('65fc20a1b900000000000000', 'Demo Farmer (Guest)', '01700000000', 'farmer');
seedUser('65fc20a1b900000000000009', 'Field Officer (Demo Staff)', '01800000000', 'employee');

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user._id || user.id, name: user.name, mobile: user.mobile, role: user.role } },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new farmer or employee
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, mobile, and password.' });
    }

    if (mobile.length !== 11 || !mobile.startsWith('01')) {
      return res.status(400).json({ success: false, message: 'Mobile must be 11 digits and start with 01.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Try MongoDB if connected
    if (isDbConnected()) {
      try {
        let user = await User.findOne({ mobile });
        if (user) {
          return res.status(400).json({ success: false, message: 'An account with this mobile number already exists.' });
        }

        user = new User({
          name: name.trim(),
          mobile: mobile.trim(),
          password,
          role: role === 'employee' ? 'employee' : 'farmer'
        });

        await user.save();
        const token = generateToken(user);

        return res.status(201).json({
          success: true,
          token,
          user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role }
        });
      } catch (dbErr) {
        console.warn('DB register error, falling back to in-memory:', dbErr.message);
      }
    }

    // Offline in-memory fallback
    if (inMemoryUsers.has(mobile)) {
      return res.status(400).json({ success: false, message: 'An account with this mobile number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const mockUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: name.trim(),
      mobile: mobile.trim(),
      password: hashedPassword,
      role: role === 'employee' ? 'employee' : 'farmer',
      matchPassword: async (p) => bcrypt.compare(p, hashedPassword)
    };

    inMemoryUsers.set(mobile, mockUser);
    const token = generateToken(mockUser);

    return res.status(201).json({
      success: true,
      token,
      user: { id: mockUser._id, name: mockUser.name, mobile: mockUser.mobile, role: mockUser.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both mobile number and password.' });
    }

    if (isDbConnected()) {
      try {
        const user = await User.findOne({ mobile });
        if (user) {
          const isMatch = await user.matchPassword(password);
          if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
          }
          const token = generateToken(user);
          return res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role }
          });
        }
      } catch (e) {
        console.warn('DB login error, falling back to in-memory:', e.message);
      }
    }

    // In-memory fallback check
    const mockUser = inMemoryUsers.get(mobile);
    if (mockUser) {
      const isMatch = await bcrypt.compare(password, mockUser.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
      }
      const token = generateToken(mockUser);
      return res.json({
        success: true,
        token,
        user: { id: mockUser._id, name: mockUser.name, mobile: mockUser.mobile, role: mockUser.role }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
          return res.json({ success: true, user });
        }
      } catch (e) {}
    }

    const mockUser = Array.from(inMemoryUsers.values()).find(u => u._id === req.user.id || u.id === req.user.id);
    if (mockUser) {
      return res.json({
        success: true,
        user: { id: mockUser._id, name: mockUser.name, mobile: mockUser.mobile, role: mockUser.role }
      });
    }

    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// @route   POST /api/auth/guest
// @desc    Fast guest / demo farmer authentication token
// @access  Public
router.post('/guest', (req, res) => {
  const guestUser = inMemoryUsers.get('01700000000') || {
    _id: DEMO_USER_ID,
    id: DEMO_USER_ID,
    name: 'Demo Farmer (Guest)',
    mobile: '01700000000',
    role: 'farmer'
  };
  const token = generateToken(guestUser);
  return res.json({
    success: true,
    token,
    user: guestUser
  });
});

module.exports = router;
