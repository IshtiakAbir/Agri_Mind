/**
 * =============================================================================
 * Module: WeatherReading Model Schema
 * Component: /app/backend/models/WeatherReading.js
 * Description: Stores weather observations fetched from Open-Meteo API.
 *              De-duplicated by city coordinates, with a 7-day TTL index
 *              to prevent unbounded database growth.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

const WeatherReadingSchema = new mongoose.Schema(
  {
    /** Canonical lookup key for the city/region (e.g., 'dhaka', 'gazipur', 'mymensingh') */
    cityKey: {
      type:     String,
      required: [true, 'cityKey is required'],
      trim:     true,
      lowercase: true,
      index:    true,
    },

    /** Latitude of weather reading */
    lat: {
      type:     Number,
      required: [true, 'lat is required'],
    },

    /** Longitude of weather reading */
    lon: {
      type:     Number,
      required: [true, 'lon is required'],
    },

    /** Ambient dry-bulb temperature (°C) */
    temperatureC: {
      type:     Number,
      required: [true, 'temperatureC is required'],
    },

    /** Relative humidity percentage (0-100) */
    humidityPct: {
      type:     Number,
      required: [true, 'humidityPct is required'],
      min:      [0, 'humidityPct cannot be negative'],
      max:      [100, 'humidityPct cannot exceed 100'],
    },

    /** Apparent temperature / feels like (°C) from Open-Meteo */
    apparentTempC: {
      type:    Number,
      default: null,
    },

    /** Calculated Steadman/Rothfusz heat index (°C) */
    heatIndexC: {
      type:    Number,
      default: null,
    },

    /** Wind speed in km/h */
    windKph: {
      type:    Number,
      default: null,
      min:     0,
    },

    /** Maximum forecasted temperature over the next 24 hours (°C) */
    forecastMaxC24h: {
      type:    Number,
      default: null,
    },

    /** Timestamp when the reading was fetched from the weather provider */
    fetchedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Efficiently fetch the most recent reading for a city
WeatherReadingSchema.index({ cityKey: 1, fetchedAt: -1 });

// TTL index: automatically delete readings older than 7 days (604,800 seconds)
WeatherReadingSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Get the latest weather reading for a given cityKey
 */
WeatherReadingSchema.statics.getLatestForCity = function (cityKey) {
  return this.findOne({ cityKey: cityKey.trim().toLowerCase() }).sort({ fetchedAt: -1 });
};

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('WeatherReading', WeatherReadingSchema);
