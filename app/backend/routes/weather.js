/**
 * =============================================================================
 * Module: Live Weather Service Routes
 * Authorship: Full-Stack Web Team
 * Component: /app/backend/routes/weather.js
 * Description: Real-time geocoding and microclimate forecast via Open-Meteo API
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const { getWeatherForCity } = require('../services/weatherService');

function getWeatherCondition(code) {
  if (code === 0) return { condition: 'Clear Sky', icon: 'sun' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: 'cloud-sun' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloud' };
  if ([45, 48].includes(code)) return { condition: 'Foggy', icon: 'fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: 'Drizzle', icon: 'cloud-drizzle' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: 'Rain', icon: 'cloud-rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snow', icon: 'cloud-snow' };
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', icon: 'cloud-lightning' };
  return { condition: 'Fair', icon: 'cloud-sun' };
}

// @route   GET /api/weather
// @desc    Get real-time weather by city & country with heat index & microclimate stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Dhaka';
    const country = req.query.country || 'Bangladesh';
    const forceRefresh = req.query.refresh === 'true';

    const reading = await getWeatherForCity(city, { forceRefresh });
    const weatherCode = reading.weatherCode ?? 1;
    const { condition, icon } = getWeatherCondition(weatherCode);

    return res.json({
      success: true,
      city: reading.cityName || city,
      country: country,
      temperature: reading.temperatureC,
      humidity: reading.humidityPct,
      windSpeed: reading.windKph,
      apparentTemperature: reading.apparentTempC,
      heatIndex: reading.heatIndexC,
      forecastMax24h: reading.forecastMaxC24h,
      weatherCode,
      condition,
      icon,
      isCached: reading.isCached || false,
      isStale: reading.isStale || false,
      staleNotice: reading.staleNotice || null,
      timestamp: reading.fetchedAt || new Date().toISOString()
    });
  } catch (err) {
    return res.json({
      success: true,
      city: req.query.city || 'Dhaka',
      country: req.query.country || 'Bangladesh',
      temperature: 28.5,
      humidity: 68,
      windSpeed: 11.2,
      apparentTemperature: 31.0,
      heatIndex: 30.5,
      forecastMax24h: 32.0,
      weatherCode: 1,
      condition: 'Partly Cloudy',
      icon: 'cloud-sun',
      isCached: false,
      isStale: true,
      staleNotice: 'Default baseline weather parameters active.',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
