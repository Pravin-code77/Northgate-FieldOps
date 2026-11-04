import { validateAsset } from '../src/validation/assetValidation';

describe('Asset Validation Rules', () => {
  const validInput = {
    name: 'Primary Cooling Pump A',
    asset_type_id: 1,
    latitude: 37.7749,
    longitude: -122.4194,
    installation_date: '2023-01-15',
  };

  test('accepts valid industrial asset data', () => {
    const res = validateAsset(validInput);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  test('rejects name shorter than 3 characters', () => {
    const res = validateAsset({ ...validInput, name: 'AB' });
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toMatch(/between 3 and 80 characters/i);
  });

  test('rejects name longer than 80 characters', () => {
    const longName = 'A'.repeat(85);
    const res = validateAsset({ ...validInput, name: longName });
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toMatch(/between 3 and 80 characters/i);
  });

  test('rejects missing or zero asset_type_id', () => {
    const res = validateAsset({ ...validInput, asset_type_id: 0 });
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toMatch(/valid asset type must be selected/i);
  });

  test('rejects out of bounds latitude', () => {
    const res1 = validateAsset({ ...validInput, latitude: 95.0 });
    expect(res1.isValid).toBe(false);
    expect(res1.errors[0]).toMatch(/between -90 and 90/i);

    const res2 = validateAsset({ ...validInput, latitude: -91.5 });
    expect(res2.isValid).toBe(false);
  });

  test('rejects out of bounds longitude', () => {
    const res = validateAsset({ ...validInput, longitude: 185.0 });
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toMatch(/between -180 and 180/i);
  });

  test('rejects future installation date', () => {
    const futureDate = '2099-01-01';
    const res = validateAsset({ ...validInput, installation_date: futureDate });
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toMatch(/cannot be in the future/i);
  });
});
