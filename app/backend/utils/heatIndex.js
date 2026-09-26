/**
 * =============================================================================
 * Module: Heat Index Calculation Utility
 * Component: /app/backend/utils/heatIndex.js
 * Description: Computes the Steadman / Rothfusz regression Heat Index (°C) from
 *              dry-bulb temperature (°C) and relative humidity (%).
 *              Used for poultry heat stress risk evaluation.
 * =============================================================================
 */

'use strict';

/**
 * Calculates Heat Index in Celsius based on NOAA / National Weather Service
 * Rothfusz regression algorithm.
 *
 * @param {number} temperatureC - Dry-bulb temperature in degrees Celsius
 * @param {number} humidityPct - Relative humidity (0 - 100%)
 * @returns {number} Heat Index in degrees Celsius (rounded to 1 decimal place)
 */
function calculateHeatIndex(temperatureC, humidityPct) {
  if (typeof temperatureC !== 'number' || isNaN(temperatureC)) {
    throw new Error('calculateHeatIndex: temperatureC must be a valid number');
  }
  if (typeof humidityPct !== 'number' || isNaN(humidityPct)) {
    throw new Error('calculateHeatIndex: humidityPct must be a valid number');
  }

  const rh = Math.min(100, Math.max(0, humidityPct));

  // Below 20°C, heat index equals ambient temperature
  if (temperatureC < 20) {
    return Math.round(temperatureC * 10) / 10;
  }

  // Convert to Fahrenheit for NOAA formula
  const tf = temperatureC * 1.8 + 32;

  // Simple formula test
  const simpleHi = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094);

  let hiF;
  if ((simpleHi + tf) / 2 < 80) {
    hiF = simpleHi;
  } else {
    // Full Rothfusz regression
    hiF =
      -42.379 +
      2.04901523 * tf +
      10.14333127 * rh -
      0.22475541 * tf * rh -
      0.00683783 * tf * tf -
      0.05481717 * rh * rh +
      0.00122874 * tf * tf * rh +
      0.00085282 * tf * rh * rh -
      0.00000199 * tf * tf * rh * rh;

    // Low humidity adjustment
    if (rh < 13 && tf >= 80 && tf <= 112) {
      const adjustment = ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tf - 95)) / 17);
      hiF -= adjustment;
    }
    // High humidity adjustment
    else if (rh > 85 && tf >= 80 && tf <= 87) {
      const adjustment = ((rh - 85) / 10) * ((87 - tf) / 5);
      hiF += adjustment;
    }
  }

  // Convert back to Celsius
  const hiC = (hiF - 32) / 1.8;
  return Math.round(hiC * 10) / 10;
}

module.exports = { calculateHeatIndex };
