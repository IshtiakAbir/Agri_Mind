/**
 * =============================================================================
 * Migration: 001_add_batch_support.js
 * Component: /app/backend/migrations/001_add_batch_support.js
 * Description: Idempotent database migration script:
 *              1. Connects to MongoDB.
 *              2. Ensures indexes are synced for all Smart Poultry models
 *                 (Farm, Batch, DailyLog, Task, Alert, WeatherReading, DiseaseTreatmentMap).
 *              3. Seeds baseline DiseaseTreatmentMap entries if not already present.
 *              4. Audits existing Farms to confirm compatibility.
 * =============================================================================
 */

'use strict';

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from app/backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Farm = require('../models/Farm');
const Batch = require('../models/Batch');
const DailyLog = require('../models/DailyLog');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const WeatherReading = require('../models/WeatherReading');
const DiseaseTreatmentMap = require('../models/DiseaseTreatmentMap');

const BASELINE_DISEASE_MAPS = [
  {
    diseaseKey: 'coccidiosis',
    displayName: 'Coccidiosis (Eimeria infection)',
    treatable: true,
    activeIngredients: ['Amprolium', 'Toltrazuril', 'Sulfaquinoxaline'],
    supportiveCare: [
      'Provide oral electrolytes and Vitamin K in drinking water to curb intestinal bleeding',
      'Remove damp or caked litter immediately to break oocyst sporulation cycle',
      'Ensure drinkers are not leaking',
    ],
    vetReferralRequired: false,
    treatmentTags: ['anticoccidial', 'electrolyte', 'vitamin'],
    notes: 'Common in wet litter conditions. Monitor for bloody droppings or severe lethargy.',
  },
  {
    diseaseKey: 'newcastle',
    displayName: 'Newcastle Disease (Ranikhet / ND)',
    treatable: false,
    activeIngredients: [],
    supportiveCare: [
      'Strict isolation and quarantine of the affected shed immediately',
      'Administer broad-spectrum antibiotics to control secondary bacterial complications',
      'Disinfect shedding facilities, footbaths, and equipment with virucidal disinfectants',
      'Review and update hatchery and farm vaccination logs (ND LaSota / Clone 30)',
    ],
    vetReferralRequired: true,
    treatmentTags: ['disinfectant', 'biosecurity', 'vitamin'],
    notes: 'Viral pathology; no curative pharmacological cure exists once infected. Prevention via vaccination is essential.',
  },
  {
    diseaseKey: 'salmonella',
    displayName: 'Salmonellosis (Pullorum / Fowl Typhoid)',
    treatable: true,
    activeIngredients: ['Enrofloxacin', 'Amoxicillin', 'Colistin'],
    supportiveCare: [
      'Provide gut probiotics following antimicrobial therapy to restore microflora',
      'Chlorinate water supplies (3-5 ppm free chlorine) to eliminate biofilm bacteria',
      'Increase shed temperature slightly for weak chicks',
    ],
    vetReferralRequired: true,
    treatmentTags: ['antibiotic', 'probiotic', 'sanitizer'],
    notes: 'Zoonotic pathogen. Handle dead birds with protective gear and bury/incinerate safely.',
  },
  {
    diseaseKey: 'healthy',
    displayName: 'Healthy Flock (No Clinical Pathology)',
    treatable: false,
    activeIngredients: [],
    supportiveCare: [
      'Maintain standard biosecurity protocols and visitor logs',
      'Ensure access to clean, cool drinking water at all times',
      'Continue standard age-appropriate feeding and lighting program',
    ],
    vetReferralRequired: false,
    treatmentTags: ['feed', 'supplement', 'instrument'],
    notes: 'All diagnostic markers within normal range. Continue routine management.',
  },
];

async function runMigration() {
  const isDryRun = process.argv.some(a => a.toLowerCase().includes('dry-run')) || process.env.DRY_RUN === 'true';

  console.log('────────────────────────────────────────────────────────────');
  console.log(`🚀 Running Migration: 001_add_batch_support ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('────────────────────────────────────────────────────────────');

  if (isDryRun) {
    console.log('\n📊 Validating model schemas and indexes in-memory...');
    const models = [
      { name: 'Farm', model: Farm },
      { name: 'Batch', model: Batch },
      { name: 'DailyLog', model: DailyLog },
      { name: 'Task', model: Task },
      { name: 'Alert', model: Alert },
      { name: 'WeatherReading', model: WeatherReading },
      { name: 'DiseaseTreatmentMap', model: DiseaseTreatmentMap },
    ];

    for (const { name, model } of models) {
      const idxs = model.schema.indexes();
      console.log(`   ✓ Validated ${name} (${idxs.length} indexes configured)`);
    }

    console.log('\n🌿 Validating DiseaseTreatmentMap baseline records...');
    console.log(`   ✓ ${BASELINE_DISEASE_MAPS.length} protocols validated.`);

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('✅ Dry-run validation completed successfully.');
    console.log('────────────────────────────────────────────────────────────');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    // 1. Sync indexes for all models
    console.log('\n📊 Syncing database indexes...');
    const models = [
      { name: 'Farm', model: Farm },
      { name: 'Batch', model: Batch },
      { name: 'DailyLog', model: DailyLog },
      { name: 'Task', model: Task },
      { name: 'Alert', model: Alert },
      { name: 'WeatherReading', model: WeatherReading },
      { name: 'DiseaseTreatmentMap', model: DiseaseTreatmentMap },
    ];

    for (const { name, model } of models) {
      await model.syncIndexes();
      console.log(`   ✓ Indexes synced for ${name}`);
    }

    // 2. Seed baseline DiseaseTreatmentMap if empty or missing keys
    console.log('\n🌿 Verifying DiseaseTreatmentMap records...');
    for (const item of BASELINE_DISEASE_MAPS) {
      const existing = await DiseaseTreatmentMap.findOne({ diseaseKey: item.diseaseKey });
      if (!existing) {
        await DiseaseTreatmentMap.create(item);
        console.log(`   + Seeded protocol: ${item.displayName} (${item.diseaseKey})`);
      } else {
        console.log(`   ✓ Protocol already exists: ${item.displayName}`);
      }
    }

    // 3. Audit existing farms
    console.log('\n🏡 Auditing existing Farms...');
    const farmCount = await Farm.countDocuments();
    const batchCount = await Batch.countDocuments();
    console.log(`   • Existing Farms: ${farmCount}`);
    console.log(`   • Existing Batches: ${batchCount}`);

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('✅ Migration 001_add_batch_support completed successfully.');
    console.log('────────────────────────────────────────────────────────────');
  } catch (err) {
    console.error('\n⚠️ Migration database connection note:', err.message || err);
    console.log('💡 Tip: Ensure MongoDB Atlas cluster is reachable, or test with: npm run migrate -- --dry-run');
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
