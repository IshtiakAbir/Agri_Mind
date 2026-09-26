/**
 * =============================================================================
 * Module: DiseaseTreatmentMap Database Seed Script
 * File: /app/backend/seeds/diseaseTreatmentMap.js
 * Description: Populates curated veterinary treatment protocols linking
 *              AI disease classifications (Coccidiosis, Salmonella,
 *              Newcastle Disease, Healthy) to pharmaceutical active ingredients,
 *              supportive care, and veterinarian referral mandates.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const DiseaseTreatmentMap = require('../models/DiseaseTreatmentMap');

const SEED_DATA = [
  {
    diseaseKey: 'coccidiosis',
    displayName: 'Coccidiosis',
    treatable: true,
    activeIngredients: ['Amprolium', 'Toltrazuril', 'Sulfaquinoxaline'],
    supportiveCare: [
      'Replace wet or caked litter immediately to reduce oocyst sporulation',
      'Add Vitamin K and electrolytes to drinking water to control internal hemorrhage',
      'Ensure proper ventilation to maintain litter humidity below 25%'
    ],
    vetReferralRequired: false,
    treatmentTags: ['anticoccidial', 'amprolium', 'coccidiostat', 'medicines'],
    notes: 'Caused by protozoan Eimeria species damaging the intestinal lining. Early intervention with water-soluble anticoccidials is essential.',
    disclaimer: 'This is AI-assisted guidance only. Always consult a qualified hatchery technician or veterinarian before treatment.'
  },
  {
    diseaseKey: 'salmonella',
    displayName: 'Salmonella (Fowl Typhoid / Pullorum)',
    treatable: true,
    activeIngredients: ['Oxytetracycline', 'Enrofloxacin', 'Amoxicillin'],
    supportiveCare: [
      'Administer oral electrolytes and poultry probiotics post-antibiotic treatment',
      'Isolate clinically depressed or lethargic birds immediately',
      'Sanitize drinkers and water distribution lines daily'
    ],
    vetReferralRequired: false,
    treatmentTags: ['antibiotic', 'antimicrobial', 'oxytetracycline', 'medicines'],
    notes: 'Bacterial enteritis affecting gut integrity and systemic vitality. Complete the full prescribed course to prevent antibiotic resistance.',
    disclaimer: 'This is AI-assisted guidance only. Always consult a qualified hatchery technician or veterinarian before treatment.'
  },
  {
    diseaseKey: 'newcastle_disease',
    displayName: 'Newcastle Disease (Ranikhet / NDV)',
    treatable: false,
    activeIngredients: [],
    supportiveCare: [
      'Strict quarantine of affected shed — restrict all farm visitor and vehicle access',
      'Immediately contact local Upazila Livestock Officer (DLS) or hatchery technician',
      'Do not move live birds, eggs, or manure off the premises to stop contagion spread',
      'Provide supportive multivitamins and electrolytes to unexposed adjoining sheds'
    ],
    vetReferralRequired: true,
    treatmentTags: ['viral', 'quarantine', 'disinfectant', 'vaccines'],
    notes: 'Highly contagious viral disease with no effective therapeutic cure once clinical symptoms appear. Strict biosecurity, vaccination, and disinfection with Virkon-S are critical.',
    disclaimer: 'This is AI-assisted guidance only. Always consult a qualified hatchery technician or veterinarian before treatment.'
  },
  {
    diseaseKey: 'healthy',
    displayName: 'Healthy (No Pathology Detected)',
    treatable: false,
    activeIngredients: [],
    supportiveCare: [
      'Maintain standard biosecurity footbaths at all shed entrance portals',
      'Continue age-appropriate balanced feed formulations and clean drinking water',
      'Monitor daily feed conversion ratio (FCR) and normal fecal consistency'
    ],
    vetReferralRequired: false,
    treatmentTags: ['prevention', 'feed', 'nutrition'],
    notes: 'Flock droppings appear uniform and healthy with normal fecal and cecal patterns. Maintain existing feeding schedule.',
    disclaimer: 'This is AI-assisted guidance only. Always consult a qualified hatchery technician or veterinarian before treatment.'
  }
];

async function seedDiseaseTreatmentMap() {
  if (mongoose.connection.readyState !== 1) {
    mongoose.connection.once('connected', () => {
      seedDiseaseTreatmentMap().catch(() => {});
    });
    return false;
  }
  try {
    for (const entry of SEED_DATA) {
      await DiseaseTreatmentMap.findOneAndUpdate(
        { diseaseKey: entry.diseaseKey },
        entry,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] DiseaseTreatmentMap successfully seeded with ${SEED_DATA.length} conditions.`);
    return true;
  } catch (err) {
    console.error('[Seed] Error seeding DiseaseTreatmentMap:', err.message);
    throw err;
  }
}

// Allow standalone execution via node seeds/diseaseTreatmentMap.js
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/agrimind';
  mongoose.connect(MONGO_URI)
    .then(async () => {
      await seedDiseaseTreatmentMap();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = { seedDiseaseTreatmentMap, SEED_DATA };
