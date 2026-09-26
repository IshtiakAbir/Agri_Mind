/**
 * =============================================================================
 * Module: Centralised Thresholds & Configuration
 * Component: /app/backend/config/thresholds.js
 * Description: All tuneable business-logic constants for the Smart Poultry
 *              upgrade in one place. Never hard-code these values in route
 *              handlers or service functions — always read from here so they
 *              can be adjusted without touching core logic.
 *
 * Review notes:
 *   - mortalityThresholdPct and mortalitySpikeFactor: starting values.
 *     Ask your hatchery technician to tune these after the first pilot batch.
 *   - heatStressTempC / coldSnapTempC: calibrated for Bangladesh climate.
 *     Review alert fatigue frequency during the pilot and adjust as needed.
 * =============================================================================
 */

'use strict';

module.exports = {
  // ─── Daily Check-in Cutoffs (farm local time, 24h clock) ──────────────────
  /** Hour after which morning routine is considered missed (11:00 local) */
  morningCutoffHour: 11,
  /** Hour after which evening routine is considered missed (20:00 local) */
  eveningCutoffHour: 20,

  // ─── Mortality Alert Thresholds ───────────────────────────────────────────
  /** Single-day mortality as % of live birds that triggers MORTALITY_HIGH */
  mortalityThresholdPct: 0.5,           // 0.5% per day — tune with hatchery tech
  /** Spike multiplier vs. the trailing 3-day daily average */
  mortalitySpikeFactor: 2,              // 2× the 3-day average triggers spike rule
  /** Minimum absolute bird count before the spike rule activates */
  mortalitySpikeMinBirds: 5,

  // ─── Weather Alert Thresholds ─────────────────────────────────────────────
  /** Ambient temperature (°C) above which Heat Stress alert fires */
  heatStressTempC: 32,
  /** 24h forecast max (°C) above which Heat Stress alert fires */
  heatStressForecastMaxC: 34,
  /** Humidity (%) above which Ammonia/Moisture Risk alert fires */
  humidityRiskPct: 80,
  /** Temperature (°C) that must also be exceeded for Ammonia/Moisture Risk */
  humidityRiskTempC: 28,
  /** Temperature (°C) below which Cold Snap alert fires */
  coldSnapTempC: 15,
  /** Maximum batch age (days) for Cold Snap alert to be relevant */
  coldSnapMaxAgeDays: 21,
  /** Batch age (days) below which brooder-zone guidance replaces ambient thresholds */
  brooderAgeThresholdDays: 7,

  // ─── Alert Hysteresis ─────────────────────────────────────────────────────
  /**
   * Number of consecutive safe readings required before an active alert clears.
   * Prevents the weather alert banner from flickering on/off every 3 hours.
   */
  alertHysteresisCount: 2,

  // ─── Weather Caching & Cron ───────────────────────────────────────────────
  /** How many days to keep WeatherReading documents before TTL auto-delete */
  weatherTTLDays: 7,
  /** How often the weather cron job runs (hours) */
  weatherCronHours: 3,

  // ─── Task Generation ──────────────────────────────────────────────────────
  /**
   * Full task generation applies to breeds with cycle ≤ this value.
   * Longer cycles use a rolling window instead (avoids generating 365 tasks upfront).
   */
  fullCycleGenerationMaxDays: 35,
  /**
   * Rolling window size (days) for long-cycle breeds (Layer, Desi, Cock, Sonali).
   * The nightly job extends this window as the batch ages.
   */
  taskRollingWindowDays: 60,

  // ─── Profit Forecast ──────────────────────────────────────────────────────
  /**
   * Minimum number of logged days required before the ML projection runs.
   * Before this threshold, the dashboard shows the static registration estimate.
   */
  forecastMinLogDays: 3,
  /**
   * Maximum time (ms) to wait for the Python profit process before marking
   * the forecast as stale and returning the cached result.
   */
  forecastTimeoutMs: 8000,
  /**
   * Minimum interval (ms) between profit recalculations per batch.
   * Prevents Python from being spawned on every single log write.
   * Default: 1 hour.
   */
  forecastDebounceMs: 60 * 60 * 1000,

  // ─── Disease Diagnosis ────────────────────────────────────────────────────
  /** Minimum model confidence required before showing diagnosis results */
  diagnosisConfidenceThreshold: 0.70,
  /** Maximum number of product cards to show alongside a diagnosis */
  diagnosisMaxProducts: 6,

  // ─── Timezone ─────────────────────────────────────────────────────────────
  /**
   * Default IANA timezone for farms that have not set a custom timezone.
   * Bangladesh has no daylight saving time, but the field is stored on each
   * farm record so the code works correctly for future multi-country expansion.
   */
  defaultTimezone: 'Asia/Dhaka',
};
