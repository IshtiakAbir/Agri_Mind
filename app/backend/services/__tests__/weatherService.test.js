'use strict';

const { getWeatherForCity, resolveCoordinates, BD_CITY_COORDINATES } = require('../weatherService');
const WeatherReading = require('../../models/WeatherReading');

jest.mock('../../models/WeatherReading');
jest.mock('../../models/Farm');

describe('Phase 10: Weather Service with Caching & Resilience', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('resolveCoordinates', () => {
    test('resolves known Bangladesh poultry hubs immediately from presets', async () => {
      const dhaka = await resolveCoordinates('Dhaka');
      expect(dhaka.lat).toBe(23.8103);
      expect(dhaka.lon).toBe(90.4125);

      const gazipur = await resolveCoordinates('Gazipur');
      expect(gazipur.lat).toBe(23.9999);

      const bogura = await resolveCoordinates('Bogura');
      expect(bogura.lat).toBe(24.8465);
    });

    test('defaults to Dhaka if geocoding fails or returns no results', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const fallback = await resolveCoordinates('NonExistentVillageXYZ');
      expect(fallback.lat).toBe(BD_CITY_COORDINATES.dhaka.lat);
      expect(fallback.lon).toBe(BD_CITY_COORDINATES.dhaka.lon);
    });
  });

  describe('getWeatherForCity', () => {
    test('returns cached reading if fresh and forceRefresh is false', async () => {
      const freshTimestamp = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes old
      const mockCachedDoc = {
        cityKey: 'dhaka',
        temperatureC: 31,
        humidityPct: 65,
        heatIndexC: 36,
        apparentTempC: 34,
        windKph: 12,
        forecastMaxC24h: 33,
        fetchedAt: freshTimestamp,
        toObject: () => ({
          cityKey: 'dhaka',
          temperatureC: 31,
          humidityPct: 65,
          heatIndexC: 36,
          apparentTempC: 34,
          windKph: 12,
          forecastMaxC24h: 33,
          fetchedAt: freshTimestamp,
        }),
      };

      WeatherReading.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCachedDoc),
      });

      const result = await getWeatherForCity('Dhaka');
      expect(result.isCached).toBe(true);
      expect(result.isStale).toBe(false);
      expect(result.temperatureC).toBe(31);
    });

    test('fetches from Open-Meteo when no cache exists and calculates heat index', async () => {
      WeatherReading.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      // Mock WeatherReading constructor
      WeatherReading.mockImplementation(function (data) {
        Object.assign(this, data);
        this.toObject = () => ({ ...data });
        this.save = jest.fn().mockResolvedValue(this);
      });

      const mockApiResponse = {
        current: {
          temperature_2m: 32.4,
          relative_humidity_2m: 72,
          apparent_temperature: 38.1,
          wind_speed_10m: 14.5,
        },
        hourly: {
          temperature_2m: [30, 31, 32, 33, 34.2, 35.1, 33, 31, 29, 28, 27, 26, 26, 27, 28, 29, 31, 33, 34, 33, 32, 31, 30, 29],
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      });

      const result = await getWeatherForCity('Gazipur');
      expect(result.temperatureC).toBe(32.4);
      expect(result.humidityPct).toBe(72);
      expect(result.heatIndexC).toBeGreaterThan(35);
      expect(result.forecastMaxC24h).toBe(35.1);
      expect(result.isCached).toBe(false);
      expect(result.isStale).toBe(false);
    });

    test('falls back to last known reading when Open-Meteo fails', async () => {
      const staleTimestamp = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours old
      const mockStaleDoc = {
        cityKey: 'chittagong',
        temperatureC: 29.5,
        humidityPct: 75,
        heatIndexC: 33.0,
        apparentTempC: 32.0,
        windKph: 15.0,
        forecastMaxC24h: 31.0,
        fetchedAt: staleTimestamp,
        toObject: () => ({
          cityKey: 'chittagong',
          temperatureC: 29.5,
          humidityPct: 75,
          heatIndexC: 33.0,
          apparentTempC: 32.0,
          windKph: 15.0,
          forecastMaxC24h: 31.0,
          fetchedAt: staleTimestamp,
        }),
      };

      // 1. First findOne is for the cache check (pretend it was null or bypassed)
      // 2. Second findOne is for fallback after API fails
      WeatherReading.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockStaleDoc),
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await getWeatherForCity('Chittagong', { forceRefresh: true });
      expect(result.temperatureC).toBe(29.5);
      expect(result.isStale).toBe(true);
      expect(result.staleNotice).toContain('Using last known reading');
    });

    test('provides static baseline safe fallback when both API and DB cache fail', async () => {
      WeatherReading.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Complete network isolation'));

      const result = await getWeatherForCity('Sylhet', { forceRefresh: true });
      expect(typeof result.temperatureC).toBe('number');
      expect(result.isStale).toBe(true);
      expect(result.staleNotice).toBeDefined();
    });
  });
});
