/**
 * =============================================================================
 * Module: Unified AgriMind Backend Server
 * Authorship: Full-Stack Web Team & Machine Learning Engineering Lead
 * Component: /app/backend/server.js
 * Description: Express REST API orchestrating Authentication, User Profiles,
 *              Multi-Farm Management, Automated Profit ML, Disease Diagnostics,
 *              Marketplace Trade, and Weather Services.
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database connection
connectDB();

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory setup & static serving
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'AgriMind Unified Platform',
    timestamp: new Date().toISOString()
  });
});

// Mount Modular API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/products', require('./routes/products'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/history', require('./routes/predict')); // Alias for history query convenience

// Serve React production bundle if in production mode
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, '..', 'frontend', 'dist'))) {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 AgriMind Unified API running on http://localhost:${PORT}`);
  console.log(`📊 ML Profit & Disease Pipelines connected via /ml`);
});

module.exports = app;
