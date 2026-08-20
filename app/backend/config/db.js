/**
 * =============================================================================
 * Module: Database Connection Config
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/backend/config/db.js
 * Description: Connects to MongoDB Atlas / local MongoDB with connection resilience
 * =============================================================================
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrimind';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
    console.log('ℹ️ Running with active in-memory storage fallback for offline resilience.');
    return false;
  }
};

module.exports = connectDB;
