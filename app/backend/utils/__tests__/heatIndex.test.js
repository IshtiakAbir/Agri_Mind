'use strict';

const { calculateHeatIndex } = require('../heatIndex');

describe('calculateHeatIndex (NOAA Rothfusz regression)', () => {
  test('returns ambient temperature for temperatures below 20°C', () => {
    expect(calculateHeatIndex(15, 60)).toBe(15);
    expect(calculateHeatIndex(18.4, 80)).toBe(18.4);
    expect(calculateHeatIndex(5, 90)).toBe(5);
  });

  test('calculates correct heat index for moderate temperatures', () => {
    // 25°C at 50% humidity
    const hi = calculateHeatIndex(25, 50);
    expect(hi).toBeGreaterThanOrEqual(24);
    expect(hi).toBeLessThanOrEqual(27);
  });

  test('calculates severe heat index for hot and humid conditions (typical BD summer)', () => {
    // 34°C at 75% humidity produces extreme heat index > 42°C
    const hi = calculateHeatIndex(34, 75);
    expect(hi).toBeGreaterThan(40);
  });

  test('handles extreme high humidity adjustment correctly', () => {
    // 29°C at 90% humidity
    const hi = calculateHeatIndex(29, 90);
    expect(hi).toBeGreaterThan(32);
  });

  test('clamps relative humidity between 0 and 100%', () => {
    const hiNegativeRh = calculateHeatIndex(28, -20);
    const hiZeroRh = calculateHeatIndex(28, 0);
    expect(hiNegativeRh).toBe(hiZeroRh);

    const hiOver100 = calculateHeatIndex(28, 150);
    const hi100 = calculateHeatIndex(28, 100);
    expect(hiOver100).toBe(hi100);
  });

  test('throws Error for invalid temperature or humidity', () => {
    expect(() => calculateHeatIndex(null, 50)).toThrow('temperatureC must be a valid number');
    expect(() => calculateHeatIndex(undefined, 50)).toThrow('temperatureC must be a valid number');
    expect(() => calculateHeatIndex('30', 50)).toThrow('temperatureC must be a valid number');
    expect(() => calculateHeatIndex(30, NaN)).toThrow('humidityPct must be a valid number');
  });
});
