import { validateSettings } from '../src/validation/settingsValidation';

describe('Settings Validation Rules', () => {
  test('accepts valid configuration bounds', () => {
    const res = validateSettings({
      gpsRadiusMeters: 100,
      sessionTimeoutMinutes: 15,
      maxRetries: 5,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors.gpsRadiusMeters).toBeNull();
    expect(res.errors.sessionTimeoutMinutes).toBeNull();
    expect(res.errors.maxRetries).toBeNull();
  });

  test('validates GPS radius bounds (25m - 1000m)', () => {
    const under = validateSettings({
      gpsRadiusMeters: 10,
      sessionTimeoutMinutes: 15,
      maxRetries: 5,
    });
    expect(under.isValid).toBe(false);
    expect(under.errors.gpsRadiusMeters).toMatch(/between 25m and 1000m/i);

    const over = validateSettings({
      gpsRadiusMeters: 1500,
      sessionTimeoutMinutes: 15,
      maxRetries: 5,
    });
    expect(over.isValid).toBe(false);
  });

  test('validates session timeout bounds (5 - 60 minutes)', () => {
    const under = validateSettings({
      gpsRadiusMeters: 100,
      sessionTimeoutMinutes: 2,
      maxRetries: 5,
    });
    expect(under.isValid).toBe(false);
    expect(under.errors.sessionTimeoutMinutes).toMatch(/between 5 and 60 minutes/i);

    const over = validateSettings({
      gpsRadiusMeters: 100,
      sessionTimeoutMinutes: 90,
      maxRetries: 5,
    });
    expect(over.isValid).toBe(false);
  });

  test('validates max retries bounds (1 - 10)', () => {
    const under = validateSettings({
      gpsRadiusMeters: 100,
      sessionTimeoutMinutes: 15,
      maxRetries: 0,
    });
    expect(under.isValid).toBe(false);
    expect(under.errors.maxRetries).toMatch(/between 1 and 10/i);

    const over = validateSettings({
      gpsRadiusMeters: 100,
      sessionTimeoutMinutes: 15,
      maxRetries: 15,
    });
    expect(over.isValid).toBe(false);
  });
});
