/**
 * =============================================================================
 * Module: Disease Diagnostics & Prediction History Routes
 * Authorship: Machine Learning & Full-Stack Team
 * Component: /app/backend/routes/predict.js
 * Description: Multipart image upload handling, Python ML inference execution,
 *              and prediction audit history endpoints.
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const DiseaseTreatmentMap = require('../models/DiseaseTreatmentMap');
const { findProductsByIngredients } = require('./products');
const { SEED_DATA } = require('../seeds/diseaseTreatmentMap');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Upload directory setup
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: uploadsDir creation setup in predict.js:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed!'));
  }
});

// Python Launcher Finder
function getPythonCommand() {
  const launcher = 'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe';
  if (fs.existsSync(launcher)) {
    return launcher;
  }
  return 'python';
}

const inMemoryPredictions = [];

// @route   POST /api/predict/disease
// @desc    Upload poultry fecal image and diagnose disease via ML pipeline
// @access  Public
router.post('/disease', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file.' });
    }

    const imagePath = req.file.path;
    const farmId = req.body.farmId || null;
    const pythonCmd = getPythonCommand();
    const scriptPath = path.join(__dirname, '..', '..', '..', 'ml', 'pipelines', 'infer_disease.py');

    const pythonProcess = spawn(pythonCmd, [scriptPath, imagePath]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => { outputData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

    pythonProcess.on('close', async () => {
      try {
        let result;
        if (outputData) {
          result = JSON.parse(outputData.trim());
        } else {
          result = { success: false, identified: false, error: 'PREDICTION_ERROR', message: 'Unable to process the image.' };
        }

        if (result.error && result.error === 'PREDICTION_ERROR') {
          return res.json({
            success: false,
            identified: false,
            error: 'PREDICTION_ERROR',
            message: result.message || 'Unable to process the image.'
          });
        }

        // ─── Phase 15: Veterinary Treatment & Product Cross-link Enrichment ───
        const confidence = result.confidence || 0;
        const defaultDisclaimer = 'This is AI-assisted guidance only. Always consult a qualified hatchery technician or veterinarian before treatment.';

        if (confidence < 0.70) {
          result.prediction = 'unclear_result';
          result.treatments = [];
          result.products = [];
          result.vetReferralRequired = false;
          result.disclaimer = 'Diagnostic confidence is below 70%. Image features are inconclusive. No medications recommended. Please consult a qualified veterinarian.';
        } else {
          let treatmentDoc = null;
          try {
            treatmentDoc = await DiseaseTreatmentMap.findByLabel(result.prediction);
          } catch (_) {}

          if (!treatmentDoc && SEED_DATA) {
            const key = String(result.prediction || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
            treatmentDoc = SEED_DATA.find(d => d.diseaseKey === key);
          }

          if (treatmentDoc) {
            result.disclaimer = treatmentDoc.disclaimer || defaultDisclaimer;
            result.vetReferralRequired = Boolean(treatmentDoc.vetReferralRequired);

            if (treatmentDoc.treatable === false) {
              result.treatments = [];
              result.products = [];
              result.supportiveCare = treatmentDoc.supportiveCare || [];
            } else {
              result.treatments = [
                {
                  activeIngredients: treatmentDoc.activeIngredients || [],
                  supportiveCare: Array.isArray(treatmentDoc.supportiveCare)
                    ? treatmentDoc.supportiveCare.join('. ')
                    : (treatmentDoc.supportiveCare || ''),
                  withdrawalNotes: 'Withdraw 5-7 days before slaughter or egg collection as per veterinary guidelines.'
                }
              ];
              result.products = findProductsByIngredients(treatmentDoc.activeIngredients, 6);
            }
          } else {
            result.treatments = [];
            result.products = [];
            result.disclaimer = defaultDisclaimer;
          }
        }

        // Save prediction record in-memory
        const predictionRecord = {
          _id: 'pred_' + Date.now(),
          type: 'disease',
          farmId: farmId,
          inputs: {
            filename: req.file.originalname,
            savedFilename: req.file.filename,
            fileSize: req.file.size,
            imageUrl: `/uploads/${req.file.filename}`
          },
          result,
          timestamp: new Date().toISOString()
        };
        inMemoryPredictions.unshift(predictionRecord);

        // Safe async save to MongoDB
        try {
          const predictionLog = new Prediction({
            type: 'disease',
            farmId: farmId,
            inputs: {
              filename: req.file.originalname,
              savedFilename: req.file.filename,
              fileSize: req.file.size,
              imageUrl: `/uploads/${req.file.filename}`
            },
            result
          });
          predictionLog.save().catch(() => {});
        } catch (e) {}

        return res.json(result);
      } catch (err) {
        console.error('Error parsing disease output:', err, outputData);
        return res.json({
          success: false,
          identified: false,
          error: 'PREDICTION_ERROR',
          message: 'Unable to process the image.'
        });
      }
    });

  } catch (err) {
    console.error('Server error on disease predict:', err);
    return res.json({
      success: false,
      identified: false,
      error: 'PREDICTION_ERROR',
      message: 'Unable to process the image.'
    });
  }
});

// @route   GET /api/history
// @desc    Get disease & ML diagnostic history
// @access  Public
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const farmId = req.query.farmId;

    if (isDbConnected()) {
      try {
        const filter = {};
        if (type) filter.type = type;
        if (farmId) filter.farmId = farmId;

        const history = await Prediction.find(filter).sort({ timestamp: -1 }).limit(limit);
        if (history && history.length > 0) {
          return res.json({ success: true, count: history.length, history });
        }
      } catch (e) {}
    }

    let filtered = inMemoryPredictions;
    if (type) filtered = filtered.filter(p => p.type === type);
    if (farmId) filtered = filtered.filter(p => String(p.farmId) === String(farmId));
    filtered = filtered.slice(0, limit);

    return res.json({ success: true, count: filtered.length, history: filtered });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
