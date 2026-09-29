/**
 * =============================================================================
 * Module: Admin Seed Script
 * Component: /app/backend/seeds/adminSeed.js
 * Description: Creates the first admin account. Run manually via:
 *              node seeds/adminSeed.js
 *              Default credentials: mobile=01999999999, password=admin123456
 * =============================================================================
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const ADMIN_DEFAULTS = {
  name: 'Platform Admin',
  mobile: '01999999999',
  password: 'admin123456',
  role: 'admin'
};

async function seedAdmin() {
  try {
    await connectDB();
    console.log('🔌 Connected to database');

    // Check if admin already exists
    const existing = await User.findOne({ mobile: ADMIN_DEFAULTS.mobile });
    if (existing) {
      if (existing.role === 'admin') {
        console.log('✅ Admin account already exists:', existing.mobile);
      } else {
        existing.role = 'admin';
        await existing.save();
        console.log('🔄 Upgraded existing user to admin:', existing.mobile);
      }
    } else {
      const admin = new User(ADMIN_DEFAULTS);
      await admin.save();
      console.log('✅ Admin account created successfully!');
      console.log('   Mobile:', ADMIN_DEFAULTS.mobile);
      console.log('   Password:', ADMIN_DEFAULTS.password);
      console.log('   ⚠️  Change the password after first login!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();
