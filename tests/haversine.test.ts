import { calculateHaversineDistance, isWithinRadius } from '../src/utils/haversine';

describe('Haversine Distance & Proximity Calculations', () => {
  // Benchmark point: 37.7749, -122.4194
  const benchmarkLat = 37.7749;
  const benchmarkLng = -122.4194;

  test('distance between identical coordinates is 0', () => {
    const dist = calculateHaversineDistance(benchmarkLat, benchmarkLng, benchmarkLat, benchmarkLng);
    expect(dist).toBeCloseTo(0, 1);
  });

  test('calculates accurate distance for nearby asset (~5 meters away)', () => {
    // 37.77492, -122.41938
    const dist = calculateHaversineDistance(benchmarkLat, benchmarkLng, 37.77492, -122.41938);
    expect(dist).toBeGreaterThan(1);
    expect(dist).toBeLessThan(15);
  });

  test('calculates distance for asset ~400 meters away', () => {
    // 37.7775, -122.416
    const dist = calculateHaversineDistance(benchmarkLat, benchmarkLng, 37.7775, -122.416);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(500);
  });

  test('isWithinRadius returns true when within 100m default radius', () => {
    const within = isWithinRadius(benchmarkLat, benchmarkLng, 37.77492, -122.41938, 100);
    expect(within).toBe(true);
  });

  test('isWithinRadius returns false when outside 100m default radius', () => {
    const within = isWithinRadius(benchmarkLat, benchmarkLng, 37.7775, -122.416, 100);
    expect(within).toBe(false);
  });

  test('isWithinRadius handles custom radius (e.g. 500m)', () => {
    const within = isWithinRadius(benchmarkLat, benchmarkLng, 37.7775, -122.416, 500);
    expect(within).toBe(true);
  });

  test('isWithinRadius safely returns false for NaN or invalid coordinates', () => {
    expect(isWithinRadius(NaN, benchmarkLng, benchmarkLat, benchmarkLng, 100)).toBe(false);
    expect(isWithinRadius(benchmarkLat, benchmarkLng, NaN, benchmarkLng, 100)).toBe(false);
  });
});
