/**
 * =============================================================================
 * Module: Poultry Farm Management & Automated Profit ML Routes
 * Authorship: Machine Learning & Farm Intelligence Team (ML_Project)
 * Component: /app/backend/routes/farms.js
 * Description: CRUD endpoints for multi-farm management with automated
 *              Lasso Regression pipeline profit estimation.
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Farm = require('../models/Farm');

// Python Launcher Finder
function getPythonCommand() {
  const launcher = 'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe';
  if (fs.existsSync(launcher)) {
    return launcher;
  }
  return 'python';
}

// Helper to run Python profit ML pipeline
function runProfitPrediction(data) {
  return new Promise((resolve) => {
    const pythonCmd = getPythonCommand();
    const scriptPath = path.join(__dirname, '..', '..', '..', 'ml', 'pipelines', 'calc_profit.py');

    const pythonPayload = {
      chicken_type: data.chickenType || data.chicken_type || 'Broiler',
      initial_chickens: Number(data.initialChickens ?? data.initial_chickens ?? 1700),
      average_chickens: Number(data.averageChickens ?? data.average_chickens ?? 1650),
      age_months: Number(data.ageMonths ?? data.age_months ?? 2),
      feed_kg: Number(data.feedKg ?? data.feed_kg ?? 5500),
      mortality: Number(data.mortality ?? 50),
      feed_price_per_kg: Number(data.feedPricePerKg ?? data.feed_price_per_kg ?? 53.25),
      average_market_egg_price: Number(data.averageMarketEggPrice ?? data.average_market_egg_price ?? 11.8),
      average_market_chicken_price: Number(data.averageMarketChickenPrice ?? data.average_market_chicken_price ?? 195.0),
      medicine_cost: Number(data.medicineCost ?? 30000),
      vaccination_cost: Number(data.vaccinationCost ?? 12000),
      labor_cost: Number(data.laborCost ?? 48000),
      electricity_cost: Number(data.electricityCost ?? 21000),
      water_cost: Number(data.waterCost ?? 6000),
      transport_cost: Number(data.transportCost ?? 15000),
      other_cost: Number(data.otherCost ?? 9000)
    };

    const pythonProcess = spawn(pythonCmd, [scriptPath, JSON.stringify(pythonPayload)]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (d) => { outputData += d.toString(); });
    pythonProcess.stderr.on('data', (d) => { errorData += d.toString(); });

    pythonProcess.on('close', () => {
      try {
        if (outputData) {
          const res = JSON.parse(outputData.trim());
          resolve(res);
        } else {
          resolve({
            success: false,
            error: 'ML_MODEL_ERROR',
            message: 'Profit model output unavailable.',
            used_ml_model: false
          });
        }
      } catch (err) {
        resolve({
          success: false,
          error: 'ML_MODEL_ERROR',
          message: err.message || 'Error processing profit model.',
          used_ml_model: false
        });
      }
    });
  });
}

// In-memory fallback map for offline resilience
const inMemoryFarms = new Map();

// @route   POST /api/farms
// @desc    Register a new poultry farm & calculate ML profit
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      farmName,
      ownerName,
      phoneNumber,
      country,
      city,
      chickenType,
      initialChickens,
      averageChickens,
      ageMonths,
      feedKg,
      mortality,
      feedPricePerKg,
      averageMarketEggPrice,
      averageMarketChickenPrice,
      medicineCost,
      vaccinationCost,
      laborCost,
      electricityCost,
      waterCost,
      transportCost,
      otherCost,
      userId
    } = req.body;

    if (!farmName || !ownerName) {
      return res.status(400).json({ success: false, error: 'Farm name and owner name are required.' });
    }
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is mandatory.' });
    }

    const profitResult = await runProfitPrediction(req.body);

    const farmData = {
      farmName: farmName.trim(),
      ownerName: ownerName.trim(),
      phoneNumber: String(phoneNumber).trim(),
      country: (country || 'Bangladesh').trim(),
      city: (city || 'Dhaka').trim(),
      chickenType: chickenType || 'Broiler',
      initialChickens: parseInt(initialChickens) || 1700,
      averageChickens: parseInt(averageChickens) || 1650,
      ageMonths: parseFloat(ageMonths) || 2,
      feedKg: parseFloat(feedKg) || 5500,
      mortality: parseFloat(mortality) || 50,
      feedPricePerKg: parseFloat(feedPricePerKg) || 53.25,
      averageMarketEggPrice: parseFloat(averageMarketEggPrice) || 11.8,
      averageMarketChickenPrice: parseFloat(averageMarketChickenPrice) || 195.0,
      medicineCost: parseFloat(medicineCost) || 30000,
      vaccinationCost: parseFloat(vaccinationCost) || 12000,
      laborCost: parseFloat(laborCost) || 48000,
      electricityCost: parseFloat(electricityCost) || 21000,
      waterCost: parseFloat(waterCost) || 6000,
      transportCost: parseFloat(transportCost) || 15000,
      otherCost: parseFloat(otherCost) || 9000,
      profitResult,
      totalChickens: parseInt(initialChickens) || 1700,
      location: `${(city || 'Dhaka').trim()}, ${(country || 'Bangladesh').trim()}`,
      userId: userId || null
    };

    // Store in-memory
    const memoryId = 'farm_' + Date.now();
    const memoryFarm = { _id: memoryId, ...farmData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    inMemoryFarms.set(memoryId, memoryFarm);

    // Persist to MongoDB if available
    try {
      const newFarm = new Farm(farmData);
      const savedFarm = await newFarm.save();
      inMemoryFarms.set(savedFarm._id.toString(), savedFarm.toObject());
      return res.status(201).json({ success: true, farm: savedFarm });
    } catch (dbErr) {
      return res.status(201).json({ success: true, farm: memoryFarm });
    }
  } catch (err) {
    console.error('Error creating farm:', err);
    return res.status(500).json({ success: false, error: 'Failed to create farm.' });
  }
});

// @route   GET /api/farms
// @desc    Get all stored poultry farms
// @access  Public
router.get('/', async (req, res) => {
  try {
    try {
      const farms = await Farm.find().sort({ createdAt: -1 });
      if (farms && farms.length > 0) {
        farms.forEach(f => inMemoryFarms.set(f._id.toString(), f.toObject()));
        return res.json({ success: true, count: farms.length, farms });
      }
    } catch (dbErr) {}

    const list = Array.from(inMemoryFarms.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, count: list.length, farms: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch farms.' });
  }
});

// @route   GET /api/farms/:id
// @desc    Get single poultry farm by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const farm = await Farm.findById(id);
      if (farm) return res.json({ success: true, farm });
    } catch (e) {}

    const memoryFarm = inMemoryFarms.get(id);
    if (memoryFarm) return res.json({ success: true, farm: memoryFarm });

    return res.status(404).json({ success: false, error: 'Farm not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch farm.' });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update farm specs & recalculate ML profit
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profitResult = await runProfitPrediction(req.body);

    const updateData = {
      ...req.body,
      profitResult,
      updatedAt: new Date().toISOString()
    };

    try {
      const updatedFarm = await Farm.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (updatedFarm) {
        inMemoryFarms.set(id, updatedFarm.toObject());
        return res.json({ success: true, farm: updatedFarm });
      }
    } catch (dbErr) {}

    if (inMemoryFarms.has(id)) {
      const existing = inMemoryFarms.get(id);
      const merged = { ...existing, ...updateData };
      inMemoryFarms.set(id, merged);
      return res.json({ success: true, farm: merged });
    }

    return res.status(404).json({ success: false, error: 'Farm not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update farm.' });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Delete a poultry farm
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Farm.findByIdAndDelete(id);
    } catch (e) {}

    inMemoryFarms.delete(id);
    return res.json({ success: true, message: 'Farm deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete farm.' });
  }
});

module.exports = router;
