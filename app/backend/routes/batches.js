/**
 * =============================================================================
 * Module: Batch Management & Lifecycle REST API Routes
 * Component: /app/backend/routes/batches.js
 * Description: CRUD endpoints for poultry batches:
 *              - POST   /api/batches         (Create batch + generate tasks)
 *              - GET    /api/batches         (List user's batches with computed age)
 *              - GET    /api/batches/:id     (Batch details + stage info)
 *              - PATCH  /api/batches/:id     (Update batch parameters)
 *              - POST   /api/batches/:id/close (Close batch with real outcomes)
 * =============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { z } = require('zod');
const { DateTime } = require('luxon');

const path = require('path');
const { execFile } = require('child_process');
const Batch = require('../models/Batch');
const Farm = require('../models/Farm');
const DailyLog = require('../models/DailyLog');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const batchOwnership = require('../middleware/batchOwnership');
const ageCalc = require('../utils/ageCalc');
const templateLoader = require('../services/templateLoader');
const taskGenerator = require('../services/taskGenerator');
const statusEvaluator = require('../services/statusEvaluator');
const thresholds = require('../config/thresholds');
const { calculateProfitInstant } = require('../services/profitEngine');
const { store, DEMO_FARM_ID } = require('../config/inMemoryStore');
const { getWeatherForCity } = require('../services/weatherService');

/**
 * Recalculate ML profit projection asynchronously with 1-hour debounce
 * Reads DailyLog cumulative telemetry, passes to Python pipeline (or in-memory fallback),
 * and updates Batch.latestForecast without blocking HTTP request.
 */
function recalculateProfitAsync(batchId) {
  setImmediate(async () => {
    try {
      let batch = null;
      try {
        batch = await Batch.findById(batchId);
      } catch (_) {}
      if (!batch) {
        batch = store.getBatch(batchId);
      }
      if (!batch || batch.status === 'Closed') return;

      // Debounce: max once per hour per batch
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (batch.latestForecast && batch.latestForecast.computedAt && batch.latestForecast.computedAt > oneHourAgo) {
        return;
      }

      const batchAgeDays = (typeof ageCalc.currentAge === 'function')
        ? ageCalc.currentAge(batch).ageDays
        : (batch.initialAverageAgeDays || 0);

      const payload = {
        chicken_type: batch.chickenType,
        initial_chickens: batch.initialChickens,
        current_age_days: batchAgeDays,
        cumulative_feed_kg: batch.cumulativeFeedKg || 0,
        cumulative_mortality: batch.cumulativeMortality || 0,
        live_birds: Math.max(0, (batch.initialChickens || 0) - (batch.cumulativeMortality || 0)),
        cycle_length_days: batch.cycleLengthDays || 35,
        feed_price_per_kg: batch.feedPricePerKg || 53.25,
        average_market_chicken_price: batch.expectedSalePricePerKg || 195.0
      };

      const scriptPath = path.resolve(__dirname, '../../../ml/pipelines/calc_profit.py');
      const pythonExe = process.platform === 'win32' ? 'py' : 'python3';

      execFile(pythonExe, [scriptPath, JSON.stringify(payload)], { timeout: 8000 }, async (err, stdout) => {
        if (!err && stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.success && parsed.predicted_profit != null) {
              batch.latestForecast = {
                predictedProfit: parsed.predicted_profit,
                low: parsed.low ?? Math.round(parsed.predicted_profit * 0.85),
                high: parsed.high ?? Math.round(parsed.predicted_profit * 1.15),
                computedAt: new Date(),
                modelVersion: '1.2.0',
                isStale: false
              };
              try {
                await batch.save();
              } catch (_) {
                store.updateBatch(batch._id, { latestForecast: batch.latestForecast });
              }
              return;
            }
          } catch (_) {}
        }

        // Resilient in-memory fallback
        try {
          const fallback = calculateProfitInstant({
            chickenType: batch.chickenType,
            initialChickens: batch.initialChickens,
            mortality: batch.cumulativeMortality || 0,
            feedKg: batch.cumulativeFeedKg || 0,
            feedPricePerKg: batch.feedPricePerKg || 53.25,
            chickenPricePerKg: batch.expectedSalePricePerKg || 195.0
          });

          const profit = fallback?.predictedProfit || 0;
          batch.latestForecast = {
            predictedProfit: profit,
            low: Math.round(profit * 0.85),
            high: Math.round(profit * 1.15),
            computedAt: new Date(),
            modelVersion: '1.2.0-fallback',
            isStale: false
          };
          try {
            await batch.save();
          } catch (_) {
            store.updateBatch(batch._id, { latestForecast: batch.latestForecast });
          }
        } catch (_) {}
      });
    } catch (bgErr) {
      console.warn('Background profit recalculation skipped:', bgErr.message);
    }
  });
}


// ─── Zod Request Validation Schemas ──────────────────────────────────────────

const CreateBatchSchema = z.object({
  farmId: z.string().min(1, 'farmId is required'),
  batchName: z.string().min(1, 'batchName is required').max(100),
  chickenType: z.enum(['Broiler', 'Sonali', 'Desi', 'Cock', 'Layer']),
  initialChickens: z.number().int().min(1, 'initialChickens must be at least 1'),
  batchStartDate: z.string().min(1, 'batchStartDate is required'),
  initialAverageAgeDays: z.number().int().min(0).default(0),
  cycleLengthDays: z.number().int().min(1).optional(),
  chickCostPerBird: z.number().min(0).default(0),
  feedPricePerKg: z.number().min(0).default(0),
  expectedSalePricePerKg: z.number().min(0).default(0),
  vaccinationsAlreadyGiven: z.array(z.string()).default([]),
  morningCutoffHour: z.number().int().min(0).max(23).default(thresholds.morningCutoffHour),
  eveningCutoffHour: z.number().int().min(0).max(23).default(thresholds.eveningCutoffHour),
});

const UpdateBatchSchema = z.object({
  batchName: z.string().min(1).max(100).optional(),
  chickCostPerBird: z.number().min(0).optional(),
  feedPricePerKg: z.number().min(0).optional(),
  expectedSalePricePerKg: z.number().min(0).optional(),
  morningCutoffHour: z.number().int().min(0).max(23).optional(),
  eveningCutoffHour: z.number().int().min(0).max(23).optional(),
  status: z.enum(['Active', 'Paused', 'Closed']).optional(),
});

const CloseBatchSchema = z.object({
  finalWeightKg: z.number().min(0, 'finalWeightKg must be non-negative'),
  soldCount: z.number().int().min(0, 'soldCount must be non-negative'),
  revenue: z.number().min(0, 'revenue must be non-negative'),
});

const DailyLogSessionSchema = z.object({
  session: z.enum(['morning', 'evening']),
  logDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logDay must be in YYYY-MM-DD format').optional(),
  feedCompleted: z.boolean().optional(),
  waterRefilled: z.boolean().optional(),
  feedAmountKg: z.number().min(0, 'feedAmountKg must be >= 0').optional().default(0),
  mortalityCount: z.number().int().min(0, 'mortalityCount must be >= 0').optional().default(0),
  avgBodyWeightG: z.number().min(0, 'avgBodyWeightG must be >= 0').optional().nullable(),
  observedSymptoms: z.array(z.string()).optional().default([]),
  symptomNotes: z.string().max(500).optional().default(''),
});

// ─── POST /api/batches — Create Batch ─────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  try {
    const parseResult = CreateBatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Verify farm exists and caller is owner or employee
    let farm = null;
    try {
      farm = await Farm.findById(data.farmId);
    } catch (_) {}
    if (!farm) {
      farm = store.getFarm(data.farmId);
    }

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: `Farm not found with ID: ${data.farmId}`,
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isEmployee = req.user.role === 'employee';
    const isDemoFarm = String(data.farmId) === DEMO_FARM_ID || String(farm._id) === DEMO_FARM_ID;
    const farmUserId = farm.userId ? farm.userId.toString() : null;
    const ownerMatch = !farmUserId || farmUserId === (currentUserId || '').toString();
    if (!isEmployee && !ownerMatch && !isDemoFarm) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this farm.',
      });
    }

    // Get template for cycle length and versioning
    const template = templateLoader.getTemplate(data.chickenType);
    const cycleLengthDays = data.cycleLengthDays || template.cycleLengthDays;
    const templateVersion = template.version;

    // Normalise batchStartDate to the start of the farm-local day
    const farmZone = thresholds.defaultTimezone;
    const normalisedStartDate = DateTime.fromISO(data.batchStartDate, { zone: farmZone })
      .startOf('day')
      .toJSDate();

    // Create batch document
    const batch = new Batch({
      farmId: data.farmId,
      batchName: data.batchName,
      chickenType: data.chickenType,
      initialChickens: data.initialChickens,
      batchStartDate: normalisedStartDate,
      initialAverageAgeDays: data.initialAverageAgeDays,
      cycleLengthDays,
      templateVersion,
      chickCostPerBird: data.chickCostPerBird,
      feedPricePerKg: data.feedPricePerKg,
      expectedSalePricePerKg: data.expectedSalePricePerKg,
      vaccinationsAlreadyGiven: data.vaccinationsAlreadyGiven,
      morningCutoffHour: data.morningCutoffHour,
      eveningCutoffHour: data.eveningCutoffHour,
      status: 'Active',
    });

    try {
      await batch.save();
    } catch (saveErr) {
      store.saveBatch(batch);
    }

    // Generate scheduled tasks
    let taskResult = { insertedCount: 0 };
    try {
      taskResult = await taskGenerator.generateTasksForBatch(batch, { zone: farmZone });
    } catch (taskErr) {
      if (template && Array.isArray(template.milestones)) {
        for (const m of template.milestones) {
          store.saveTask({
            batchId: batch._id,
            title: m.title,
            description: m.description,
            category: m.category,
            targetAgeDays: m.targetAgeDays,
            dueDate: DateTime.fromJSDate(batch.batchStartDate).plus({ days: m.targetAgeDays }).toJSDate(),
            isCritical: !!m.isCritical,
            status: 'Pending'
          });
          taskResult.insertedCount++;
        }
      }
    }

    // Calculate initial computed age
    const { ageDays: computedAge } = ageCalc.currentAge(batch);
    const stageInfo = templateLoader.getStageForAge(batch.chickenType, computedAge);

    res.status(201).json({
      success: true,
      message: 'Batch created and scheduled tasks generated successfully.',
      batch: {
        ...(batch.toObject ? batch.toObject() : batch),
        currentAge: computedAge,
        stageInfo,
      },
      tasksGenerated: taskResult.insertedCount,
    });
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create batch.',
      error: err.message,
    });
  }
});

// ─── GET /api/batches — List Batches ──────────────────────────────────────────

router.get('/', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const isEmployee = req.user.role === 'employee';

    const filter = {};

    // Filter by specific farmId if provided in query
    if (req.query.farmId) {
      filter.farmId = req.query.farmId;
    } else if (!isEmployee) {
      let farmIds = [];
      if (mongoose.Types.ObjectId.isValid(currentUserId)) {
        try {
          const userFarms = await Farm.find({ userId: currentUserId }).select('_id');
          farmIds = userFarms.map(f => f._id);
        } catch (_) {}
      }
      if (farmIds.length === 0) {
        const memoryFarms = store.listFarms(currentUserId);
        farmIds = memoryFarms.map(f => f._id);
      }
      if (farmIds.length > 0) {
        filter.farmId = { $in: farmIds };
      }
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    let batches = [];
    try {
      batches = await Batch.find(filter)
        .populate('farmId', 'farmName city ownerName')
        .sort({ createdAt: -1 });
    } catch (_) {}

    if (!batches || batches.length === 0) {
      const farmIds = filter.farmId && filter.farmId.$in ? filter.farmId.$in : null;
      batches = store.listBatches(farmIds);
    }

    // Compute dynamic currentAge and stage for each batch
    const formattedBatches = batches.map(batch => {
      const bObj = batch.toObject ? batch.toObject() : { ...batch };
      let currentAge = 0, isPastCycleEnd = false;
      try {
        const computed = ageCalc.currentAge(batch);
        currentAge = computed.ageDays;
        isPastCycleEnd = computed.isPastCycleEnd;
      } catch (_) {
        currentAge = batch.currentAgeDays || 0;
      }
      return {
        ...bObj,
        currentAge,
        currentAgeDays: currentAge,
        isPastCycleEnd,
      };
    });

    res.json({
      success: true,
      count: formattedBatches.length,
      batches: formattedBatches,
    });
  } catch (err) {
    console.error('Error listing batches:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list batches.',
      error: err.message,
    });
  }
});

// ─── GET /api/batches/:id — Batch Detail ──────────────────────────────────────

router.get('/:id', auth, batchOwnership, async (req, res) => {
  try {
    const batch = req.batch;
    const { ageDays: currentAge, isPastCycleEnd } = ageCalc.currentAge(batch);
    const stageInfo = templateLoader.getStageForAge(batch.chickenType, currentAge);

    res.json({
      success: true,
      batch: {
        ...batch.toObject(),
        currentAge,
        isPastCycleEnd,
        stageInfo,
      },
    });
  } catch (err) {
    console.error('Error fetching batch details:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batch details.',
      error: err.message,
    });
  }
});

// ─── PATCH /api/batches/:id — Update Batch Parameters ─────────────────────────

router.patch('/:id', auth, batchOwnership, async (req, res) => {
  try {
    const parseResult = UpdateBatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const updates = parseResult.data;
    const batch = req.batch;

    // Apply allowed updates
    Object.keys(updates).forEach(key => {
      batch[key] = updates[key];
    });

    await batch.save();

    const { ageDays: currentAge } = ageCalc.currentAge(batch);

    res.json({
      success: true,
      message: 'Batch updated successfully.',
      batch: {
        ...batch.toObject(),
        currentAge,
      },
    });
  } catch (err) {
    console.error('Error updating batch:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch.',
      error: err.message,
    });
  }
});

// ─── POST /api/batches/:id/close — Close Batch ────────────────────────────────

router.post('/:id/close', auth, batchOwnership, async (req, res) => {
  try {
    const parseResult = CloseBatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const batch = req.batch;

    if (batch.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'This batch is already closed.',
      });
    }

    const { finalWeightKg, soldCount, revenue } = parseResult.data;

    batch.status = 'Closed';
    batch.closedAt = new Date();
    batch.finalWeightKg = finalWeightKg;
    batch.soldCount = soldCount;
    batch.revenue = revenue;

    await batch.save();

    res.json({
      success: true,
      message: 'Batch closed successfully with harvest outcome metrics.',
      batch: batch.toObject(),
    });
  } catch (err) {
    console.error('Error closing batch:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to close batch.',
      error: err.message,
    });
  }
});

// ─── POST /api/batches/:id/log — Submit Daily Check-in ────────────────────────

router.post('/:id/log', auth, batchOwnership, async (req, res) => {
  try {
    const parseResult = DailyLogSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const {
      session,
      logDay: requestedLogDay,
      feedCompleted,
      waterRefilled,
      feedAmountKg = 0,
      mortalityCount = 0,
      avgBodyWeightG,
      observedSymptoms = [],
      symptomNotes = '',
    } = parseResult.data;

    const batch = req.batch;
    const farmZone = thresholds.defaultTimezone;

    // Determine calendar day string YYYY-MM-DD in farm timezone
    const todayStr = DateTime.now().setZone(farmZone).toFormat('yyyy-MM-dd');
    const yesterdayStr = DateTime.now().setZone(farmZone).minus({ days: 1 }).toFormat('yyyy-MM-dd');
    const logDay = requestedLogDay || todayStr;

    // Check if a DailyLog document already exists for this (batchId, logDay)
    let log = null;
    try {
      log = await DailyLog.findOne({ batchId: batch._id, logDay });
    } catch (_) {}
    if (!log) {
      log = store.getDailyLog(batch._id, logDay);
    }

    // Determine available live birds before this session's mortality
    let availableLiveBirds;
    if (log && typeof log.liveBirdsEndOfDay === 'number') {
      availableLiveBirds = log.liveBirdsEndOfDay;
    } else {
      availableLiveBirds = Math.max(0, (batch.initialChickens || 1000) - (batch.cumulativeMortality || 0));
    }

    // Mortality guard: cannot exceed available live birds
    if (mortalityCount > availableLiveBirds) {
      return res.status(400).json({
        success: false,
        message: `Mortality count (${mortalityCount}) exceeds current live birds (${availableLiveBirds}).`,
        availableLiveBirds,
      });
    }

    const { ageDays: currentAge } = ageCalc.currentAge(batch);
    const now = new Date();

    if (!log) {
      // First session for this day creates the single DailyLog document
      log = new DailyLog({
        batchId: batch._id,
        logDay,
        logDate: now,
        ageOnDay: currentAge,
        feedAmountKg: 0,
        mortalityCount: 0,
        liveBirdsEndOfDay: availableLiveBirds,
      });
    }

    // Upsert into appropriate session sub-document
    if (session === 'morning') {
      log.morning = {
        feedCompleted: feedCompleted !== undefined ? feedCompleted : (log.morning && log.morning.feedCompleted),
        waterRefilled: waterRefilled !== undefined ? waterRefilled : (log.morning && log.morning.waterRefilled),
        completedAt: now,
      };
      log.morningRoutine = {
        completed: true,
        completedAt: now,
        feedCompleted: log.morning.feedCompleted,
        waterRefilled: log.morning.waterRefilled,
      };
    } else if (session === 'evening') {
      log.evening = {
        feedCompleted: feedCompleted !== undefined ? feedCompleted : (log.evening && log.evening.feedCompleted),
        completedAt: now,
      };
      log.eveningRoutine = {
        completed: true,
        completedAt: now,
        feedCompleted: log.evening.feedCompleted,
        feedWeightKg: feedAmountKg,
        mortalityCount,
      };
    }

    // Add session feed and mortality to today's cumulative day totals
    log.feedAmountKg = (log.feedAmountKg || 0) + feedAmountKg;
    log.mortalityCount = (log.mortalityCount || 0) + mortalityCount;
    log.liveBirdsEndOfDay = Math.max(0, availableLiveBirds - mortalityCount);

    if (avgBodyWeightG !== undefined && avgBodyWeightG !== null) {
      log.avgBodyWeightG = avgBodyWeightG;
    }

    if (observedSymptoms && observedSymptoms.length > 0) {
      const currentSymptoms = new Set(log.observedSymptoms || []);
      observedSymptoms.forEach(s => currentSymptoms.add(s));
      log.observedSymptoms = Array.from(currentSymptoms);
    }

    if (symptomNotes) {
      log.symptomNotes = (log.symptomNotes ? log.symptomNotes + ' | ' : '') + symptomNotes;
    }

    try {
      await log.save();
    } catch (_) {
      store.saveDailyLog(batch._id, logDay, log);
    }

    // Atomically increment batch running totals
    if (feedAmountKg > 0 || mortalityCount > 0) {
      batch.cumulativeFeedKg = (batch.cumulativeFeedKg || 0) + feedAmountKg;
      batch.cumulativeMortality = (batch.cumulativeMortality || 0) + mortalityCount;
      try {
        await batch.save();
      } catch (_) {
        store.updateBatch(batch._id, {
          cumulativeFeedKg: batch.cumulativeFeedKg,
          cumulativeMortality: batch.cumulativeMortality,
        });
      }
    }

    // Run real-time status evaluation post-submission
    let evaluation = null;
    try {
      evaluation = await statusEvaluator.evaluateBatchStatusFromDb(batch._id);
    } catch (_) {
      const todayLogObj = store.getDailyLog(batch._id, todayStr);
      const yesterdayLogObj = store.getDailyLog(batch._id, yesterdayStr);
      const trailingLogs = store.getRecentLogs(batch._id, 7).filter(l => l.logDay !== todayStr).slice(0, 3);
      const activeTasks = store.getTasks(batch._id, { isCritical: true }).filter(t => ['Pending', 'Overdue'].includes(t.status));
      const weatherAlerts = store.getAlerts(batch.farmId, batch._id);
      evaluation = statusEvaluator.evaluateStatus({
        batch,
        todayLog: todayLogObj,
        yesterdayLog: yesterdayLogObj,
        trailingLogs,
        tasks: activeTasks,
        weatherAlerts,
      });
    }

    // Trigger asynchronous debounced ML profit recalculation (never blocks response)
    recalculateProfitAsync(batch._id);

    res.status(200).json({
      success: true,
      message: `${session.charAt(0).toUpperCase() + session.slice(1)} check-in recorded successfully.`,
      log,
      batch: {
        _id: batch._id,
        cumulativeFeedKg: batch.cumulativeFeedKg,
        cumulativeMortality: batch.cumulativeMortality,
        liveBirdsEstimate: batch.liveBirdsEstimate,
      },
      evaluation,
    });
  } catch (err) {
    console.error('Error recording daily log:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to record daily log.',
      error: err.message,
    });
  }
});

// ─── GET /api/batches/:id/tasks — Batch Tasks List ────────────────────────────

router.get('/:id/tasks', auth, batchOwnership, async (req, res) => {
  try {
    const filter = { batchId: req.batch._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.from || req.query.to) {
      filter.dueDate = {};
      if (req.query.from) filter.dueDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.dueDate.$lte = new Date(req.query.to);
    }

    let tasks = [];
    try {
      tasks = await Task.find(filter).sort({ dueDate: 1 });
    } catch (_) {}
    if (!tasks || tasks.length === 0) {
      tasks = store.getTasks(req.batch._id, filter);
    }

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks.',
      error: err.message,
    });
  }
});

// ─── PATCH /api/batches/:id/tasks/:taskId & /api/batches/:id/tasks — Mark Task Complete / Skipped ──

router.patch(['/:id/tasks/:taskId', '/:id/tasks'], auth, batchOwnership, async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const { status, completionData } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required in URL parameter or request body.',
      });
    }

    if (!status || !['Completed', 'Skipped', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status ("Completed", "Skipped", or "Pending") is required.',
      });
    }

    let task = null;
    try {
      task = await Task.findOne({ _id: taskId, batchId: req.batch._id });
    } catch (_) {}
    if (!task) {
      task = store.tasks.get(String(taskId));
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found for this batch.',
      });
    }

    task.status = status;
    task.completedAt = (status === 'Completed' || status === 'Skipped') ? new Date() : null;
    if (completionData !== undefined) {
      task.completionData = completionData;
    }

    try {
      await task.save();
    } catch (_) {
      store.updateTask(taskId, { status, completedAt: task.completedAt, completionData });
    }

    res.json({
      success: true,
      message: `Task marked as ${status}.`,
      task,
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update task.',
      error: err.message,
    });
  }
});

// ─── GET /api/batches/:id/status — Flock Status Evaluation ────────────────────

router.get('/:id/status', auth, batchOwnership, async (req, res) => {
  try {
    const batch = req.batch;
    let evaluation = null;
    try {
      evaluation = await statusEvaluator.evaluateBatchStatusFromDb(batch._id);
    } catch (_) {
      const farmZone = thresholds.defaultTimezone;
      const todayStr = DateTime.now().setZone(farmZone).toFormat('yyyy-MM-dd');
      const yesterdayStr = DateTime.now().setZone(farmZone).minus({ days: 1 }).toFormat('yyyy-MM-dd');
      const todayLog = store.getDailyLog(batch._id, todayStr);
      const yesterdayLog = store.getDailyLog(batch._id, yesterdayStr);
      const trailingLogs = store.getRecentLogs(batch._id, 7).filter(l => l.logDay !== todayStr).slice(0, 3);
      const activeTasks = store.getTasks(batch._id, { isCritical: true }).filter(t => ['Pending', 'Overdue'].includes(t.status));
      const weatherAlerts = store.getAlerts(batch.farmId, batch._id);
      evaluation = statusEvaluator.evaluateStatus({
        batch,
        todayLog,
        yesterdayLog,
        trailingLogs,
        tasks: activeTasks,
        weatherAlerts,
      });
    }

    res.json({
      success: true,
      batchStatus: batch.status,
      status: evaluation.status,
      reasons: evaluation.reasons,
      evaluatedAt: evaluation.evaluatedAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching batch status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch status.',
      error: err.message,
    });
  }
});

// ─── GET /api/batches/:id/dashboard — Global Display Aggregate ────────────────

router.get('/:id/dashboard', auth, batchOwnership, async (req, res) => {
  try {
    const batch = req.batch;
    const { ageDays: currentAge, isPastCycleEnd } = ageCalc.currentAge(batch);
    const stageInfo = templateLoader.getStageForAge(batch.chickenType, currentAge);

    const farmZone = thresholds.defaultTimezone;
    const todayStr = DateTime.now().setZone(farmZone).toFormat('yyyy-MM-dd');
    const yesterdayStr = DateTime.now().setZone(farmZone).minus({ days: 1 }).toFormat('yyyy-MM-dd');

    let todayLog = null, yesterdayLog = null, trailingLogs = [], upcomingTasks = [], weatherAlerts = [], activeTasks = [];
    try {
      [todayLog, yesterdayLog, trailingLogs, upcomingTasks, weatherAlerts] = await Promise.all([
        DailyLog.findOne({ batchId: batch._id, logDay: todayStr }),
        DailyLog.findOne({ batchId: batch._id, logDay: yesterdayStr }),
        DailyLog.getRecentDays(batch._id, 7),
        Task.find({ batchId: batch._id }).sort({ dueDate: 1 }).limit(50),
        Alert.find({
          $or: [{ batchId: batch._id }, { farmId: batch.farmId }],
          status: 'Active',
        }),
      ]);
      activeTasks = await Task.find({ batchId: batch._id, isCritical: true, status: { $in: ['Pending', 'Overdue'] } });
    } catch (_) {
      todayLog = store.getDailyLog(batch._id, todayStr);
      yesterdayLog = store.getDailyLog(batch._id, yesterdayStr);
      trailingLogs = store.getRecentLogs(batch._id, 7);
      upcomingTasks = store.getTasks(batch._id);
      weatherAlerts = store.getAlerts(batch.farmId, batch._id);
      activeTasks = store.getTasks(batch._id, { isCritical: true }).filter(t => ['Pending', 'Overdue'].includes(t.status));
    }

    const evaluation = statusEvaluator.evaluateStatus({
      batch,
      todayLog,
      yesterdayLog,
      trailingLogs: (trailingLogs || []).filter(l => l.logDay !== todayStr).slice(0, 3),
      tasks: activeTasks || [],
      weatherAlerts: weatherAlerts || [],
    });

    const bObj = batch.toObject ? batch.toObject() : { ...batch };
    const liveEstimate = batch.liveBirdsEstimate ?? ((bObj.initialChickens || 1000) - (bObj.cumulativeMortality || 0));

    let farmCity = 'Dhaka';
    try {
      if (batch.farmId) {
        let farm = null;
        try {
          farm = await Farm.findById(batch.farmId);
        } catch (_) {
          farm = store.getFarm(batch.farmId);
        }
        if (farm?.city) farmCity = farm.city;
      }
    } catch (_) {}

    let weatherReading = null;
    try {
      weatherReading = await getWeatherForCity(farmCity);
    } catch (e) {
      console.warn('Weather fetch note for dashboard:', e.message);
    }

    res.json({
      success: true,
      dashboard: {
        batch: {
          ...bObj,
          currentAge,
          isPastCycleEnd,
          liveBirdsEstimate: liveEstimate,
        },
        stageInfo,
        status: evaluation.status,
        reasons: evaluation.reasons,
        evaluation: {
          status: evaluation.status,
          reasons: evaluation.reasons,
          evaluatedAt: evaluation.evaluatedAt || new Date().toISOString(),
        },
        weather: weatherReading,
        alerts: weatherAlerts || [],
        todayLog,
        recentLogs: trailingLogs,
        upcomingTasks,
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.',
      error: err.message,
    });
  }
});

module.exports = router;
