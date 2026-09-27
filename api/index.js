/**
 * Vercel Serverless Function entry point for AgriMind Express API.
 * Ensures MongoDB connection is established before serving requests,
 * then routes all /api/* requests directly into the Express application.
 */
const app = require('../app/backend/server');
const connectDB = require('../app/backend/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
  }
  return app(req, res);
};
