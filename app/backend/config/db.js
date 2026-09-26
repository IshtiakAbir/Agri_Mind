/**
 * =============================================================================
 * Module: Database Connection Config
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/backend/config/db.js
 * Description: Connects to MongoDB Atlas / local MongoDB with connection resilience
 *              and non-blocking buffer configuration for instant offline responses.
 * =============================================================================
 */

const mongoose = require('mongoose');

// Disable command buffering so offline queries return immediately (<1ms) instead of hanging 10s
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 500);

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrimind';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 1500,
      socketTimeoutMS: 5000
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
