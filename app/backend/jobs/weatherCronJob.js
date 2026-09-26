/**
 * =============================================================================
 * Module: 3-Hour Weather Polling & Alert Synchronization Cron Job
 * Component: /app/backend/jobs/weatherCronJob.js
 * Description: Runs every 3 hours:
 *              1. Queries distinct cities across all registered farms.
 *              2. De-duplicates city requests: 1 API call per city regardless
 *                 of how many farms are located in that district.
 *              3. Evaluates Heat Stress, Ammonia, and Cold Snap alerts with
 *                 hysteresis tracking for each farm.
 * =============================================================================
 */

'use strict';

const cron = require('node-cron');
const Farm = require('../models/Farm');
const weatherService = require('../services/weatherService');
const alertService = require('../services/alertService');
const thresholds = require('../config/thresholds');

/**
 * Runs the weather polling and alert evaluation routine.
 */
async function runWeatherCron() {
  console.log('[WeatherCron] Commencing 3-hour microclimate sync...');

  try {
    const distinctCities = await weatherService.getDistinctFarmCities();
    console.log(`[WeatherCron] Unique farm districts to poll (${distinctCities.length}): ${distinctCities.join(', ')}`);

    let totalApiCalls = 0;
    let totalFarmsAlerted = 0;

    for (const city of distinctCities) {
      try {
        // 1 API call per city with forceRefresh
        const reading = await weatherService.getWeatherForCity(city, { forceRefresh: true });
        totalApiCalls++;

        // Find all farms in this district
        const farmsInCity = await Farm.find({
          city: { $regex: new RegExp(`^${city}$`, 'i') },
        });

        // Sync alerts for each farm in this city
        for (const farm of farmsInCity) {
          const activeAlerts = await alertService.syncAlertsWithHysteresis(farm._id, reading);
          if (activeAlerts.length > 0) {
            totalFarmsAlerted++;
          }
        }
      } catch (cityErr) {
        console.error(`[WeatherCron] Failed to process city ${city}:`, cityErr.message);
      }
    }

    const summary = {
      citiesProcessed: distinctCities.length,
      totalApiCalls,
      totalFarmsAlerted,
      completedAt: new Date(),
    };

    console.log(`[WeatherCron] Microclimate sync completed: ${JSON.stringify(summary)}`);
    return summary;
  } catch (err) {
    console.error('[WeatherCron] Error in weather cron run:', err);
    throw err;
  }
}

/**
 * Initializes the node-cron schedule (every 3 hours).
 */
function initWeatherCron() {
  const cronExpression = `0 */${thresholds.weatherCronHours || 3} * * *`;

  cron.schedule(cronExpression, async () => {
    try {
      await runWeatherCron();
    } catch (err) {
      console.error('[WeatherCron] Scheduled run failed:', err);
    }
  });

  console.log(`⏰ Weather monitoring cron scheduled: "${cronExpression}"`);
}

module.exports = {
  runWeatherCron,
  initWeatherCron,
};
