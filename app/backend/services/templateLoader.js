/**
 * =============================================================================
 * Module: Lifecycle Template Loader Service
 * Component: /app/backend/services/templateLoader.js
 * Description: Loads and validates JSON breed lifecycle templates at startup
 *              using Ajv against templates/schema.json. Provides lookups for
 *              flock rearing stages, targets, tips, and scheduled tasks.
 *
 * Acceptance criteria:
 *   - Invalid template fails startup with a clear, descriptive message.
 *   - getStageForAge(chickenType, ageDays) accurately maps flock age to stage.
 * =============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const SCHEMA_FILE = path.join(TEMPLATES_DIR, 'schema.json');

const ajv = new Ajv({ allErrors: true });

// Read schema and compile validator
let validateSchema = null;
try {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const schemaJson = JSON.parse(schemaContent);
  validateSchema = ajv.compile(schemaJson);
} catch (err) {
  throw new Error(`Failed to initialize template validator schema from ${SCHEMA_FILE}: ${err.message}`);
}

// In-memory cache of validated templates, keyed by chickenType
const templatesCache = new Map();

/**
 * Validates a template object against the JSON Schema.
 * Throws an Error with all Ajv validation errors if invalid.
 *
 * @param {object} templateObj - The template object to validate
 * @param {string} [sourceIdentifier='inline template'] - Identifier for error messages
 * @returns {boolean} true if valid
 */
function validateTemplate(templateObj, sourceIdentifier = 'inline template') {
  if (!validateSchema(templateObj)) {
    const errorDetails = (validateSchema.errors || [])
      .map(e => `  - ${e.instancePath || '/'} ${e.message}`)
      .join('\n');
    throw new Error(
      `Template validation failed for ${sourceIdentifier}:\n${errorDetails}`
    );
  }

  // Additional business validation: verify stage ranges and chronological order
  const { stages, cycleLengthDays } = templateObj;
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    if (stage.toDay < stage.fromDay) {
      throw new Error(
        `Template validation failed for ${sourceIdentifier}: stage "${stage.name}" has toDay (${stage.toDay}) less than fromDay (${stage.fromDay}).`
      );
    }

    if (i > 0) {
      const prevStage = stages[i - 1];
      if (stage.fromDay <= prevStage.toDay) {
        throw new Error(
          `Template validation failed for ${sourceIdentifier}: stage "${stage.name}" fromDay (${stage.fromDay}) overlaps with previous stage toDay (${prevStage.toDay}).`
        );
      }
    }
  }

  // Verify milestone days fall within stage bounds
  for (const stage of stages) {
    for (const m of (stage.milestones || [])) {
      if (m.day < stage.fromDay || m.day > stage.toDay) {
        throw new Error(
          `Template validation failed for ${sourceIdentifier}: milestone "${m.key}" at day ${m.day} is outside stage "${stage.name}" bounds [${stage.fromDay}, ${stage.toDay}].`
        );
      }
    }
  }

  return true;
}

/**
 * Synchronously loads and validates all templates from the templates directory.
 * Populates the internal cache. Fails fast if any template is invalid.
 *
 * @returns {Map<string, object>} Loaded templates cache
 */
function loadTemplates() {
  templatesCache.clear();

  if (!fs.existsSync(TEMPLATES_DIR)) {
    throw new Error(`Templates directory not found: ${TEMPLATES_DIR}`);
  }

  const files = fs.readdirSync(TEMPLATES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'schema.json');

  if (jsonFiles.length === 0) {
    throw new Error(`No lifecycle templates found in ${TEMPLATES_DIR}`);
  }

  for (const filename of jsonFiles) {
    const fullPath = path.join(TEMPLATES_DIR, filename);
    let parsed;
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      parsed = JSON.parse(content);
    } catch (parseErr) {
      throw new Error(`Failed to parse template JSON file ${filename}: ${parseErr.message}`);
    }

    // Validate schema
    validateTemplate(parsed, filename);

    // Ensure chickenType matches filename (e.g. Broiler.json -> Broiler)
    const expectedType = filename.replace('.json', '');
    if (parsed.chickenType !== expectedType) {
      throw new Error(
        `Template file ${filename} defines chickenType "${parsed.chickenType}", expected "${expectedType}".`
      );
    }

    templatesCache.set(parsed.chickenType, parsed);
  }

  return templatesCache;
}

/**
 * Retrieves the validated template for a given chicken breed.
 *
 * @param {string} chickenType - e.g. 'Broiler', 'Sonali', 'Desi', 'Cock', 'Layer'
 * @returns {object} Template object
 */
function getTemplate(chickenType) {
  if (templatesCache.size === 0) {
    loadTemplates();
  }

  const template = templatesCache.get(chickenType);
  if (!template) {
    throw new Error(
      `No lifecycle template found for chickenType: "${chickenType}". Available breeds: ${Array.from(templatesCache.keys()).join(', ')}`
    );
  }
  return template;
}

/**
 * Determines the current flock lifecycle stage for a given chicken type and age.
 *
 * @param {string} chickenType - e.g. 'Broiler', 'Sonali', etc.
 * @param {number} ageDays - Current flock age in days
 * @returns {object} Stage resolution details:
 *   {
 *     stage: object,
 *     stageIndex: number,
 *     totalStages: number,
 *     isPastCycleEnd: boolean,
 *     daysRemainingInStage: number
 *   }
 */
function getStageForAge(chickenType, ageDays) {
  const template = getTemplate(chickenType);
  const stages = template.stages;
  const clampedAge = Math.max(0, ageDays);

  let matchedIndex = -1;
  for (let i = 0; i < stages.length; i++) {
    if (clampedAge >= stages[i].fromDay && clampedAge <= stages[i].toDay) {
      matchedIndex = i;
      break;
    }
  }

  // If age exceeds the last stage's toDay, select the final stage
  if (matchedIndex === -1) {
    if (clampedAge > stages[stages.length - 1].toDay) {
      matchedIndex = stages.length - 1;
    } else {
      matchedIndex = 0;
    }
  }

  const stage = stages[matchedIndex];
  const daysRemainingInStage = Math.max(0, stage.toDay - clampedAge);
  const isPastCycleEnd = ageDays > template.cycleLengthDays;

  return {
    stage,
    stageIndex: matchedIndex,
    totalStages: stages.length,
    isPastCycleEnd,
    daysRemainingInStage,
  };
}

/**
 * Returns all currently loaded templates.
 *
 * @returns {object} Map of chickenType -> template
 */
function getAllTemplates() {
  if (templatesCache.size === 0) {
    loadTemplates();
  }
  return Object.fromEntries(templatesCache.entries());
}

// Automatically load templates on first module require
try {
  loadTemplates();
} catch (startupErr) {
  console.error('❌ TemplateLoader initialization failure:', startupErr.message);
  // Re-throw so server or test runner fails fast
  throw startupErr;
}

module.exports = {
  loadTemplates,
  getTemplate,
  getStageForAge,
  getAllTemplates,
  validateTemplate,
};
