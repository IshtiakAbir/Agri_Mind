/**
 * =============================================================================
 * Module: Feature Flags
 * Component: /app/backend/config/featureFlags.js
 * Description: Central feature flag registry. All new Smart Poultry features
 *              gate on SMART_POULTRY. Existing routes are never affected when
 *              the flag is off.
 *
 * Usage:
 *   const flags = require('./config/featureFlags');
 *   if (flags.SMART_POULTRY) { ... }
 * =============================================================================
 */

'use strict';

const flags = {
  /**
   * SMART_POULTRY
   * Enables: Batch management, DailyLog check-ins, lifecycle templates,
   *          task generator, status evaluator, weather alerts, rolling
   *          profit forecast, and diagnosis-to-marketplace cross-link.
   *
   * Set SMART_POULTRY=true in .env to activate.
   * Defaults to false so existing production features are never disrupted.
   */
  SMART_POULTRY: process.env.SMART_POULTRY === 'true',
};

// Print the active flag state at server startup so it is visible in logs
console.log(`🚩 Feature flags: SMART_POULTRY=${flags.SMART_POULTRY}`);

module.exports = flags;
