import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityProvider } from '../../context/ConnectivityContext';
import { SessionProvider } from '../../context/SessionContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { ErrorBoundary } from '../error-boundary/ErrorBoundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ConnectivityProvider>
          <SettingsProvider>
            <SessionProvider>
              <StatusBar style="dark" />
              {children}
            </SessionProvider>
          </SettingsProvider>
        </ConnectivityProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};
