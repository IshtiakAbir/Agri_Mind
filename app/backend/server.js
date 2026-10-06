/**
 * =============================================================================
 * Module: Unified AgriMind Backend Server
 * Authorship: Full-Stack Web Team & Machine Learning Engineering Lead
 * Component: /app/backend/server.js
 * Description: Express REST API orchestrating Authentication, User Profiles,
 *              Multi-Farm Management, Automated Profit ML, Disease Diagnostics,
 *              Marketplace Trade, Weather Services, and (behind a feature flag)
 *              the Smart Poultry batch lifecycle upgrade.
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables FIRST — featureFlags reads from process.env
dotenv.config();

// Feature flags — loaded after dotenv so SMART_POULTRY is available
const flags = require('./config/featureFlags');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database connection
connectDB();

// Core Middleware
// PATCH added alongside existing methods to support batch/task updates
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Upload directory setup & static serving
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: uploads directory setup:', e.message);
}
app.use('/uploads', express.static(uploadsDir));

// ─── API Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'AgriMind Unified Platform',
    timestamp: new Date().toISOString(),
    features: {
      SMART_POULTRY: flags.SMART_POULTRY,
    },
  });
});

// ─── Core API Routes (always active) ─────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/farms',    require('./routes/farms'));
app.use('/api/predict',  require('./routes/predict'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/weather',  require('./routes/weather'));
app.use('/api/history',  require('./routes/predict')); // Alias for history query convenience
app.use('/api/doctors',  require('./routes/doctors'));

// ─── Public Homepage Content ────────────────────────────────────────────────
app.get('/api/content/homepage', (req, res) => {
  try {
    const contentPath = path.join(__dirname, 'config', 'homepageContent.json');
    if (fs.existsSync(contentPath)) {
      const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      return res.json({ success: true, content });
    }
  } catch (_) {}
  res.json({
    success: true,
    content: {
      heroHeadline: "Smart Farming. Healthier Flocks. Higher Profits.",
      heroSubtext: "Track batch health with daily smart check-ins, detect diseases from droppings in seconds, consult verified poultry doctors, and trade directly on AgriShop.",
      aboutTitle: "Everything your flock needs, in one unified platform",
      aboutText: "AgriMind bridges the gap between field reality and agricultural intelligence. From automated batch schedules and real-time disease detection to direct veterinary consultations, our tools are built specifically for the needs of Bangladeshi poultry farmers."
    }
  });
});

// ─── Admin Panel Routes ──────────────────────────────────────────────────────
app.use('/api/admin',    require('./routes/admin'));

// ─── Smart Poultry Routes (gated by SMART_POULTRY flag) ──────────────────────
// These routes are only registered when SMART_POULTRY=true in .env.
// Setting the flag to false leaves all existing behaviour completely unchanged.
if (flags.SMART_POULTRY) {
  // Validate and cache all poultry lifecycle templates
  try {
    const templateLoader = require('./services/templateLoader');
    const loadedBreeds = Object.keys(templateLoader.getAllTemplates());
    console.log(`✅ Smart Poultry templates verified & loaded: ${loadedBreeds.join(', ')}`);
  } catch (templateErr) {
    console.error('❌ Failed to load Smart Poultry lifecycle templates:', templateErr.message);
    throw templateErr;
  }

  // Phase 7 → Batch CRUD, check-in, dashboard, tasks, batch closure
  try {
    app.use('/api/batches', require('./routes/batches'));
    console.log('✅ Smart Poultry routes mounted: /api/batches');
  } catch (routeErr) {
    if (routeErr.code === 'MODULE_NOT_FOUND' && routeErr.message.includes('routes/batches')) {
      console.log('ℹ️  /api/batches route pending implementation in Phase 7');
    } else {
      throw routeErr;
    }
  }

  // Phase 9 → Nightly maintenance cron job (sync overdue tasks, extend rolling horizons)
  try {
    const nightlyJob = require('./jobs/nightlyJob');
    nightlyJob.initNightlyCron();
  } catch (cronErr) {
    console.error('❌ Failed to schedule nightly job:', cronErr.message);
  }

  // Phase 10 → 3-Hour Weather sync and alert evaluation cron job
  try {
    const weatherCronJob = require('./jobs/weatherCronJob');
    weatherCronJob.initWeatherCron();
  } catch (weatherCronErr) {
    console.error('❌ Failed to schedule weather cron job:', weatherCronErr.message);
  }

  // Phase 15 → Seed DiseaseTreatmentMap collection
  try {
    const { seedDiseaseTreatmentMap } = require('./seeds/diseaseTreatmentMap');
    seedDiseaseTreatmentMap().catch(seedErr => console.warn('ℹ️ DiseaseTreatmentMap auto-seed note:', seedErr.message));
  } catch (seedLoaderErr) {
    console.warn('ℹ️ DiseaseTreatmentMap seed loader note:', seedLoaderErr.message);
  }
}

// ─── React Production Bundle ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, '..', 'frontend', 'dist'))) {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// ─── Start Server (standalone mode) ───────────────────────────────────────────
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 AgriMind Unified API running on http://localhost:${PORT}`);
    console.log(`📊 ML Profit & Disease Pipelines connected via /ml`);
  });
}

module.exports = app;
