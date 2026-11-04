export interface AssetValidationInput {
  name: string;
  asset_type_id: number;
  latitude: number;
  longitude: number;
  installation_date: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAsset(input: AssetValidationInput): ValidationResult {
  const errors: string[] = [];

  // Name validation: required, 3-80 chars
  if (!input.name || typeof input.name !== 'string') {
    errors.push('Asset name is required.');
  } else {
    const trimmed = input.name.trim();
    if (trimmed.length < 3 || trimmed.length > 80) {
      errors.push('Asset name must be between 3 and 80 characters.');
    }
  }

  // Type validation: must be a positive integer
  if (!input.asset_type_id || input.asset_type_id <= 0) {
    errors.push('A valid asset type must be selected.');
  }

  // Coordinates validation
  if (input.latitude == null || isNaN(input.latitude)) {
    errors.push('Latitude coordinate is required.');
  } else if (input.latitude < -90 || input.latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees.');
  }

  if (input.longitude == null || isNaN(input.longitude)) {
    errors.push('Longitude coordinate is required.');
  } else if (input.longitude < -180 || input.longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees.');
  }

  // Installation date validation
  if (!input.installation_date || typeof input.installation_date !== 'string') {
    errors.push('Installation date is required.');
  } else {
    const installDate = new Date(input.installation_date);
    if (isNaN(installDate.getTime())) {
      errors.push('Installation date must be a valid date.');
    } else {
      const now = new Date();
      // Allow current day (set to end of day)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      if (installDate.getTime() > endOfToday.getTime()) {
        errors.push('Installation date cannot be in the future.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
