/**
 * =============================================================================
 * Module: Alert Engine with Hysteresis & Age-Aware Environmental Rules
 * Component: /app/backend/services/alertService.js
 * Description: Evaluates weather readings against biosecurity & microclimate rules:
 *                1. HEAT_STRESS      (temp > 32°C, heat index > 35°C, or 24h max > 34°C)
 *                2. AMMONIA_MOISTURE (humidity > 80% & temp > 28°C)
 *                3. COLD_SNAP        (temp < 15°C for brooding age < 21 days)
 *
 *              Hysteresis:
 *                Prevents alert flickering by requiring 2 consecutive safe readings
 *                (alertHysteresisCount) before transitioning an active alert to Cleared.
 * =============================================================================
 */

'use strict';

const Alert = require('../models/Alert');
const thresholds = require('../config/thresholds');

/**
 * Pure evaluation function testing whether environmental alert conditions are met.
 *
 * @param {object} reading - Weather reading { temperatureC, humidityPct, heatIndexC, forecastMaxC24h, apparentTempC }
 * @param {object} [batch] - Optional batch for age-aware rules
 * @returns {Array<object>} Array of triggered alert definitions
 */
function evaluateAlertRules(reading, batch = null) {
  if (!reading) return [];

  const {
    temperatureC = 28,
    humidityPct = 60,
    heatIndexC = temperatureC,
    forecastMaxC24h = temperatureC,
    apparentTempC = temperatureC,
  } = reading;

  const triggered = [];
  const batchAgeDays = batch ? (batch.initialAverageAgeDays || 0) : 30;

  // ─── 1. HEAT_STRESS RULE ────────────────────────────────────────────────────
  const isHeatStress =
    temperatureC > thresholds.heatStressTempC ||
    heatIndexC > 35.0 ||
    apparentTempC > 35.0 ||
    forecastMaxC24h > thresholds.heatStressForecastMaxC;

  if (isHeatStress) {
    const isBrooding = batchAgeDays <= (thresholds.brooderAgeThresholdDays || 7);
    const advice = isBrooding
      ? 'Brooding age detected: maintain designated brooder zone warmth while ensuring fresh airflow and cool, clean drinking water.'
      : 'Increase shed ventilation, run cooling fans/foggers, supply electrolytes and Vitamin C in drinking water, and avoid bird handling during peak heat hours.';

    triggered.push({
      type: 'HEAT_STRESS',
      severity: (temperatureC > 35 || heatIndexC > 39) ? 'Critical' : 'Warning',
      message: `Heat Stress Warning: Temperature ${temperatureC}°C, Heat Index ${heatIndexC}°C (24h Forecast Max: ${forecastMaxC24h}°C).`,
      advice,
      metadata: { temperatureC, humidityPct, heatIndexC, forecastMaxC24h },
    });
  }

  // ─── 2. AMMONIA_MOISTURE RISK RULE ──────────────────────────────────────────
  const isAmmoniaRisk =
    humidityPct > thresholds.humidityRiskPct &&
    temperatureC > thresholds.humidityRiskTempC;

  if (isAmmoniaRisk) {
    triggered.push({
      type: 'AMMONIA_MOISTURE',
      severity: 'Warning',
      message: `High Ammonia & Moisture Risk: Relative humidity ${humidityPct}% combined with ${temperatureC}°C warmth.`,
      advice: 'Turn over and loosen damp litter, inspect nipple drinkers for leaks, and boost cross-ventilation to remove ammonia gas.',
      metadata: { temperatureC, humidityPct },
    });
  }

  // ─── 3. COLD_SNAP RULE (Age-Aware) ──────────────────────────────────────────
  const isBroodingFlock = batchAgeDays <= (thresholds.coldSnapMaxAgeDays || 21);
  const isColdSnap = temperatureC < thresholds.coldSnapTempC && isBroodingFlock;

  if (isColdSnap) {
    triggered.push({
      type: 'COLD_SNAP',
      severity: 'Warning',
      message: `Cold Snap Advisory: Outdoor temperature dropped to ${temperatureC}°C for flock aged ${batchAgeDays} days.`,
      advice: 'Young chicks cannot self-regulate body heat. Turn on auxiliary brooder heaters, seal drafts, and check chick clustering under heat lamps.',
      metadata: { temperatureC, batchAgeDays },
    });
  }

  return triggered;
}

/**
 * Updates or clears alerts in the database for a farm with 2-reading hysteresis.
 *
 * @param {string|ObjectId} farmId
 * @param {object} reading - Current weather reading
 * @param {string|ObjectId} [batchId] - Optional batchId
 * @returns {Promise<Array<object>>} Updated active alerts
 */
async function syncAlertsWithHysteresis(farmId, reading, batchId = null) {
  const triggeredRules = evaluateAlertRules(reading);
  const triggeredTypes = new Set(triggeredRules.map(r => r.type));

  const alertTypes = ['HEAT_STRESS', 'AMMONIA_MOISTURE', 'COLD_SNAP'];
  const activeAlerts = [];

  for (const type of alertTypes) {
    const isTriggered = triggeredTypes.has(type);
    const existing = await Alert.findOne({
      farmId,
      type,
      status: 'Active',
    });

    if (isTriggered) {
      const rule = triggeredRules.find(r => r.type === type);
      if (existing) {
        // Condition persists: reset consecutive safe readings counter
        existing.consecutiveSafeReadings = 0;
        existing.message = rule.message;
        existing.advice = rule.advice;
        existing.severity = rule.severity;
        existing.metadata = rule.metadata;
        await existing.save();
        activeAlerts.push(existing);
      } else {
        // Trigger new alert
        const newAlert = new Alert({
          farmId,
          batchId: batchId || null,
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          advice: rule.advice,
          status: 'Active',
          startedAt: new Date(),
          consecutiveSafeReadings: 0,
          metadata: rule.metadata,
        });
        await newAlert.save();
        activeAlerts.push(newAlert);
      }
    } else {
      // Safe reading observed for this alert type
      if (existing) {
        existing.consecutiveSafeReadings = (existing.consecutiveSafeReadings || 0) + 1;

        // Hysteresis threshold check
        if (existing.consecutiveSafeReadings >= (thresholds.alertHysteresisCount || 2)) {
          existing.status = 'Cleared';
          existing.clearedAt = new Date();
        }

        await existing.save();
        if (existing.status === 'Active') {
          activeAlerts.push(existing);
        }
      }
    }
  }

  return activeAlerts;
}

module.exports = {
  evaluateAlertRules,
  syncAlertsWithHysteresis,
};
