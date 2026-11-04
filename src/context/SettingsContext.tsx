import React, { createContext, useContext, useEffect, useState } from 'react';
import AppConfig from '../constants/config';
import { getAllSettings, setSetting } from '../repositories/settingsRepository';
import { validateSettings } from '../validation/settingsValidation';

interface SettingsContextType {
  gpsRadiusMeters: number;
  sessionTimeoutMinutes: number;
  maxRetries: number;
  syncFailureRate: number;
  isLoading: boolean;
  saveSettings: (newSettings: {
    gpsRadiusMeters: number;
    sessionTimeoutMinutes: number;
    maxRetries: number;
    syncFailureRate?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gpsRadiusMeters, setGpsRadiusMeters] = useState<number>(AppConfig.defaultGpsRadiusMeters);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(
    AppConfig.defaultSessionTimeoutMinutes
  );
  const [maxRetries, setMaxRetries] = useState<number>(AppConfig.defaultMaxRetries);
  const [syncFailureRate, setSyncFailureRate] = useState<number>(0.1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getAllSettings();

      if (settings.gps_radius_meters) {
        setGpsRadiusMeters(parseInt(settings.gps_radius_meters, 10));
      }
      if (settings.session_timeout_minutes) {
        setSessionTimeoutMinutes(parseInt(settings.session_timeout_minutes, 10));
      }
      if (settings.max_retries) {
        setMaxRetries(parseInt(settings.max_retries, 10));
      }
      if (settings.sync_failure_rate) {
        setSyncFailureRate(parseFloat(settings.sync_failure_rate));
      }
    } catch (err) {
      console.warn('[SettingsContext] Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async (newSettings: {
    gpsRadiusMeters: number;
    sessionTimeoutMinutes: number;
    maxRetries: number;
    syncFailureRate?: number;
  }): Promise<{ success: boolean; error?: string }> => {
    const validation = validateSettings({
      gpsRadiusMeters: newSettings.gpsRadiusMeters,
      sessionTimeoutMinutes: newSettings.sessionTimeoutMinutes,
      maxRetries: newSettings.maxRetries,
    });

    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).filter(Boolean).join(' ');
      return { success: false, error: errorMsg };
    }

    try {
      await setSetting('gps_radius_meters', newSettings.gpsRadiusMeters.toString());
      await setSetting('session_timeout_minutes', newSettings.sessionTimeoutMinutes.toString());
      await setSetting('max_retries', newSettings.maxRetries.toString());
      if (newSettings.syncFailureRate != null) {
        await setSetting('sync_failure_rate', newSettings.syncFailureRate.toString());
        setSyncFailureRate(newSettings.syncFailureRate);
      }

      setGpsRadiusMeters(newSettings.gpsRadiusMeters);
      setSessionTimeoutMinutes(newSettings.sessionTimeoutMinutes);
      setMaxRetries(newSettings.maxRetries);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to persist settings in SQLite.' };
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        gpsRadiusMeters,
        sessionTimeoutMinutes,
        maxRetries,
        syncFailureRate,
        isLoading,
        saveSettings,
        reloadSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
