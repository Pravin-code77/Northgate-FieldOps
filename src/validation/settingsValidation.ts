import AppConfig from '../constants/config';

export interface SettingsValidationInput {
  gpsRadiusMeters: number;
  sessionTimeoutMinutes: number;
  maxRetries: number;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: Record<keyof SettingsValidationInput, string | null>;
}

export function validateSettings(input: SettingsValidationInput): SettingsValidationResult {
  const errors: Record<keyof SettingsValidationInput, string | null> = {
    gpsRadiusMeters: null,
    sessionTimeoutMinutes: null,
    maxRetries: null,
  };

  let isValid = true;

  if (
    isNaN(input.gpsRadiusMeters) ||
    input.gpsRadiusMeters < AppConfig.minGpsRadiusMeters ||
    input.gpsRadiusMeters > AppConfig.maxGpsRadiusMeters
  ) {
    errors.gpsRadiusMeters = `GPS radius must be between ${AppConfig.minGpsRadiusMeters}m and ${AppConfig.maxGpsRadiusMeters}m.`;
    isValid = false;
  }

  if (
    isNaN(input.sessionTimeoutMinutes) ||
    input.sessionTimeoutMinutes < AppConfig.minSessionTimeoutMinutes ||
    input.sessionTimeoutMinutes > AppConfig.maxSessionTimeoutMinutes
  ) {
    errors.sessionTimeoutMinutes = `Session timeout must be between ${AppConfig.minSessionTimeoutMinutes} and ${AppConfig.maxSessionTimeoutMinutes} minutes.`;
    isValid = false;
  }

  if (
    isNaN(input.maxRetries) ||
    input.maxRetries < AppConfig.minMaxRetries ||
    input.maxRetries > AppConfig.maxMaxRetries
  ) {
    errors.maxRetries = `Maximum retry count must be between ${AppConfig.minMaxRetries} and ${AppConfig.maxMaxRetries}.`;
    isValid = false;
  }

  return { isValid, errors };
}
