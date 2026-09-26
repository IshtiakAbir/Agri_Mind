/**
 * =============================================================================
 * Module: Poultry Farm Management & Automated Profit ML Routes
 * Authorship: Machine Learning & Farm Intelligence Team (ML_Project)
 * Component: /app/backend/routes/farms.js
 * Description: High-speed CRUD endpoints for multi-farm management with
 *              sub-millisecond in-memory ML profit estimation & resilient DB persistence.
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Farm = require('../models/Farm');
const { calculateProfitInstant } = require('../services/profitEngine');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Fast In-Memory ML Profit Engine (Instant <1ms response time)
function runProfitPrediction(data) {
  try {
    const result = calculateProfitInstant(data);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.resolve({
      success: false,
      error: 'CALCULATION_ERROR',
      message: err.message
    });
  }
}

const { store } = require('../config/inMemoryStore');

// In-memory fallback map for instant offline resilience
const inMemoryFarms = store.farms;

// @route   POST /api/farms
// @desc    Register a new poultry farm & calculate ML profit instantly
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
      averageMarketEggPrice: parseFloat(req.body.averageMarketEggPrice ?? req.body.eggPrice ?? req.body.egg_price) || 12.0,
      averageMarketChickenPrice: parseFloat(averageMarketChickenPrice) || 195.0,
      eggsProduced: parseFloat(req.body.eggsProduced ?? req.body.eggs_produced ?? req.body.totalEggs) || 0,
      brokenEggs: parseFloat(req.body.brokenEggs ?? req.body.broken_eggs) || 0,
      eggsSold: parseFloat(req.body.eggsSold ?? req.body.eggs_sold) || 0,
      brokenEggPrice: parseFloat(req.body.brokenEggPrice ?? req.body.broken_egg_price) || 0,
      eggPrice: parseFloat(req.body.eggPrice ?? req.body.egg_price ?? req.body.averageMarketEggPrice) || 12.0,
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

    // Store in-memory instantly
    const memoryId = new mongoose.Types.ObjectId().toString();
    const memoryFarm = { _id: memoryId, ...farmData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    inMemoryFarms.set(memoryId, memoryFarm);

    // If MongoDB is actively connected, persist asynchronously
    if (isDbConnected()) {
      try {
        const newFarm = new Farm(farmData);
        const savedFarm = await newFarm.save();
        inMemoryFarms.set(savedFarm._id.toString(), savedFarm.toObject());
        return res.status(201).json({ success: true, farm: savedFarm });
      } catch (dbErr) {
        return res.status(201).json({ success: true, farm: memoryFarm });
      }
    }

    return res.status(201).json({ success: true, farm: memoryFarm });
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
    let list = [];
    if (isDbConnected()) {
      try {
        const farms = await Farm.find().sort({ createdAt: -1 });
        if (farms && farms.length > 0) {
          list = farms.map(f => {
            const obj = f.toObject ? f.toObject() : f;
            obj.profitResult = calculateProfitInstant(obj);
            inMemoryFarms.set(obj._id.toString(), obj);
            return obj;
          });
          return res.json({ success: true, count: list.length, farms: list });
        }
      } catch (dbErr) {}
    }

    list = Array.from(inMemoryFarms.values())
      .map(f => ({ ...f, profitResult: calculateProfitInstant(f) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    let farm = null;
    if (isDbConnected()) {
      try {
        const dbFarm = await Farm.findById(id);
        if (dbFarm) farm = dbFarm.toObject ? dbFarm.toObject() : dbFarm;
      } catch (e) {}
    }

    if (!farm) {
      farm = inMemoryFarms.get(id);
    }

    if (farm) {
      farm.profitResult = calculateProfitInstant(farm);
      return res.json({ success: true, farm });
    }

    return res.status(404).json({ success: false, error: 'Farm not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch farm.' });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update farm specs & recalculate ML profit instantly
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

    if (isDbConnected()) {
      try {
        const updatedFarm = await Farm.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (updatedFarm) {
          inMemoryFarms.set(id, updatedFarm.toObject());
          return res.json({ success: true, farm: updatedFarm });
        }
      } catch (dbErr) {}
    }

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
    if (isDbConnected()) {
      try {
        await Farm.findByIdAndDelete(id);
      } catch (e) {}
    }

    inMemoryFarms.delete(id);
    return res.json({ success: true, message: 'Farm deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete farm.' });
  }
});

module.exports = router;
