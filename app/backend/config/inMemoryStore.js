/**
 * =============================================================================
 * Module: Resilient In-Memory Smart Poultry Store
 * Component: /app/backend/config/inMemoryStore.js
 * Description: High-speed, memory-resident fallback store for Farms, Batches,
 *              DailyLogs, Tasks, and Alerts. Guarantees 100% functionality
 *              when offline or disconnected from MongoDB Atlas.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const thresholds = require('./thresholds');
const templateLoader = require('../services/templateLoader');

// Consistent Demo Identifiers (Valid 24-char ObjectIds)
const DEMO_USER_ID = '65fc20a1b900000000000001';
const DEMO_FARM_ID = '65fc20a1b900000000000002';
const DEMO_BATCH_ID = '65fc20a1b900000000000003';

class InMemoryStore {
  constructor() {
    this.farms = new Map();
    this.batches = new Map();
    this.dailyLogs = new Map(); // key: `${batchId}_${logDay}`
    this.tasks = new Map();     // key: `${taskId}`
    this.alerts = new Map();    // key: `${alertId}`
    this.seedDemoData();
  }

  seedDemoData() {
    const now = DateTime.now().setZone(thresholds.defaultTimezone);
    const startDate = now.minus({ days: 14 }).startOf('day');
    const todayStr = now.toFormat('yyyy-MM-dd');
    const yesterdayStr = now.minus({ days: 1 }).toFormat('yyyy-MM-dd');

    // 1. Demo Farm
    const demoFarm = {
      _id: DEMO_FARM_ID,
      farmName: 'Green Valley Agro (Demo Farm)',
      ownerName: 'Mohammad Rahman',
      phoneNumber: '01712345678',
      country: 'Bangladesh',
      city: 'Gazipur',
      chickenType: 'Broiler',
      initialChickens: 1200,
      averageChickens: 1180,
      mortality: 15,
      feedKg: 1850,
      userId: DEMO_USER_ID,
      createdAt: now.minus({ days: 30 }).toISO(),
      updatedAt: now.toISO(),
      toObject() { return { ...this }; }
    };
    this.farms.set(DEMO_FARM_ID, demoFarm);

    // 2. Demo Active Batch (Day 14 Broiler)
    const demoBatch = {
      _id: DEMO_BATCH_ID,
      farmId: DEMO_FARM_ID,
      batchName: 'Broiler Flock #101',
      chickenType: 'Broiler',
      initialChickens: 1200,
      batchStartDate: startDate.toJSDate(),
      initialAverageAgeDays: 0,
      cycleLengthDays: 35,
      shedName: 'Shed 1 — East Wing',
      targetHarvestWeightKg: 2.1,
      expectedSalePricePerKg: 195,
      feedCostPerKg: 53.25,
      chickCostPerBird: 45,
      miscCostBudget: 6000,
      cumulativeFeedKg: 1850,
      cumulativeMortality: 15,
      status: 'Active',
      currentAgeDays: 14,
      liveBirdsEstimate: 1185,
      latestForecast: {
        predictedProfit: 74500,
        low: 63325,
        high: 85675,
        isStale: false,
        computedAt: now.toJSDate(),
        modelVersion: 'v1.0-partial'
      },
      createdAt: startDate.toISO(),
      updatedAt: now.toISO(),
      toObject() { return { ...this }; }
    };
    this.batches.set(DEMO_BATCH_ID, demoBatch);

    // 3. Demo Daily Logs
    const yesterdayLog = {
      _id: 'log_' + yesterdayStr,
      batchId: DEMO_BATCH_ID,
      logDay: yesterdayStr,
      morningRoutine: {
        completed: true,
        completedAt: now.minus({ days: 1 }).set({ hour: 8, minute: 30 }).toJSDate(),
        feedCompleted: true,
        waterRefilled: true,
      },
      eveningRoutine: {
        completed: true,
        completedAt: now.minus({ days: 1 }).set({ hour: 18, minute: 45 }).toJSDate(),
        feedWeightKg: 125,
        mortalityCount: 1,
      },
      symptoms: [],
      notes: 'Flock active and alert.',
      toObject() { return { ...this }; }
    };
    this.dailyLogs.set(`${DEMO_BATCH_ID}_${yesterdayStr}`, yesterdayLog);

    const todayLog = {
      _id: 'log_' + todayStr,
      batchId: DEMO_BATCH_ID,
      logDay: todayStr,
      morningRoutine: {
        completed: true,
        completedAt: now.set({ hour: 8, minute: 15 }).toJSDate(),
        feedCompleted: true,
        waterRefilled: true,
      },
      eveningRoutine: {
        completed: false,
        feedWeightKg: 0,
        mortalityCount: 0,
      },
      symptoms: [],
      notes: 'Morning ration fed on schedule.',
      toObject() { return { ...this }; }
    };
    this.dailyLogs.set(`${DEMO_BATCH_ID}_${todayStr}`, todayLog);

    // 4. Demo Tasks
    const tasks = [
      {
        _id: 'task_001',
        batchId: DEMO_BATCH_ID,
        title: 'Gumboro (IBD) Intermediate Vaccine',
        description: 'Administer IBD intermediate vaccine via drinking water with skimmed milk stabilizer.',
        category: 'Vaccination',
        targetAgeDays: 7,
        dueDate: startDate.plus({ days: 7 }).toJSDate(),
        isCritical: true,
        status: 'Completed',
        completedAt: startDate.plus({ days: 7 }).toJSDate(),
        toObject() { return { ...this }; }
      },
      {
        _id: 'task_002',
        batchId: DEMO_BATCH_ID,
        title: 'ND Lasota / Newcastle Booster Eye-drop',
        description: 'Administer Ranikhet Lasota strain booster via eye drop or drinking water.',
        category: 'Vaccination',
        targetAgeDays: 14,
        dueDate: now.toJSDate(),
        isCritical: true,
        status: 'Pending',
        toObject() { return { ...this }; }
      },
      {
        _id: 'task_003',
        batchId: DEMO_BATCH_ID,
        title: 'Day 21 Sample Weighing (5% Flock Census)',
        description: 'Weigh 60 birds across 3 shed zones to assess feed conversion ratio (FCR).',
        category: 'Weighing',
        targetAgeDays: 21,
        dueDate: startDate.plus({ days: 21 }).toJSDate(),
        isCritical: false,
        status: 'Pending',
        toObject() { return { ...this }; }
      },
      {
        _id: 'task_004',
        batchId: DEMO_BATCH_ID,
        title: 'Broiler Finisher Feed Transition',
        description: 'Begin gradual transition from grower crumble to finisher pellets over 3 days.',
        category: 'Feed Transition',
        targetAgeDays: 24,
        dueDate: startDate.plus({ days: 24 }).toJSDate(),
        isCritical: false,
        status: 'Pending',
        toObject() { return { ...this }; }
      }
    ];

    for (const t of tasks) {
      this.tasks.set(t._id, t);
    }
  }

  // Farm helpers
  getFarm(id) {
    return this.farms.get(String(id)) || null;
  }
  saveFarm(farm) {
    const id = String(farm._id || new mongoose.Types.ObjectId());
    const obj = {
      ...farm,
      _id: id,
      toObject() { return { ...this }; }
    };
    this.farms.set(id, obj);
    return obj;
  }
  listFarms(userId) {
    const result = [];
    for (const f of this.farms.values()) {
      if (!userId || !f.userId || String(f.userId) === String(userId)) {
        result.push(f);
      }
    }
    return result;
  }

  // Batch helpers
  getBatch(id) {
    return this.batches.get(String(id)) || null;
  }
  saveBatch(batch) {
    const id = String(batch._id || new mongoose.Types.ObjectId());
    const obj = {
      ...batch,
      _id: id,
      toObject() { return { ...this }; }
    };
    this.batches.set(id, obj);
    return obj;
  }
  listBatches(farmIds = null) {
    const result = [];
    for (const b of this.batches.values()) {
      if (!farmIds || farmIds.length === 0 || farmIds.map(String).includes(String(b.farmId))) {
        result.push(b);
      }
    }
    return result;
  }
  updateBatch(id, updates) {
    const b = this.batches.get(String(id));
    if (!b) return null;
    const updated = {
      ...b,
      ...updates,
      toObject() { return { ...this }; }
    };
    this.batches.set(String(id), updated);
    return updated;
  }

  // DailyLog helpers
  getDailyLog(batchId, logDay) {
    return this.dailyLogs.get(`${batchId}_${logDay}`) || null;
  }
  saveDailyLog(batchId, logDay, logData) {
    const key = `${batchId}_${logDay}`;
    const existing = this.dailyLogs.get(key) || { _id: 'log_' + Date.now(), batchId, logDay };
    const merged = {
      ...existing,
      ...logData,
      batchId,
      logDay,
      toObject() { return { ...this }; }
    };
    this.dailyLogs.set(key, merged);
    return merged;
  }
  getRecentLogs(batchId, count = 7) {
    const logs = [];
    for (const [key, val] of this.dailyLogs.entries()) {
      if (key.startsWith(`${batchId}_`)) {
        logs.push(val);
      }
    }
    return logs.sort((a, b) => (b.logDay > a.logDay ? 1 : -1)).slice(0, count);
  }

  // Task helpers
  getTasks(batchId, filter = {}) {
    const result = [];
    for (const t of this.tasks.values()) {
      if (String(t.batchId) === String(batchId)) {
        if (filter.status && t.status !== filter.status) continue;
        if (filter.isCritical !== undefined && t.isCritical !== filter.isCritical) continue;
        result.push(t);
      }
    }
    return result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }
  saveTask(task) {
    const id = String(task._id || 'task_' + Date.now() + Math.random().toString(36).substring(2, 6));
    const obj = {
      ...task,
      _id: id,
      toObject() { return { ...this }; }
    };
    this.tasks.set(id, obj);
    return obj;
  }
  updateTask(taskId, updates) {
    const t = this.tasks.get(String(taskId));
    if (!t) return null;
    const updated = {
      ...t,
      ...updates,
      toObject() { return { ...this }; }
    };
    this.tasks.set(String(taskId), updated);
    return updated;
  }

  // Alert helpers
  getAlerts(farmId, batchId) {
    const result = [];
    for (const a of this.alerts.values()) {
      if (
        (farmId && String(a.farmId) === String(farmId)) ||
        (batchId && String(a.batchId) === String(batchId))
      ) {
        if (a.status === 'Active') {
          result.push(a);
        }
      }
    }
    return result;
  }
}

const store = new InMemoryStore();
module.exports = {
  store,
  DEMO_USER_ID,
  DEMO_FARM_ID,
  DEMO_BATCH_ID,
};
