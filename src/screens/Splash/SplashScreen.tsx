import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { getDatabase } from '../../db/database';

interface SplashScreenProps {
  onInitialized: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onInitialized }) => {
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        // Initialize SQLite schema, run migrations, and seed sample data
        await getDatabase();
        if (isMounted) {
          setTimeout(() => {
            onInitialized();
          }, 800);
        }
      } catch (err) {
        console.error('[SplashScreen] Init error:', err);
        if (isMounted) {
          onInitialized();
        }
      }
    };
    init();

    return () => {
      isMounted = false;
    };
  }, [onInitialized]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>

        <Text style={styles.appName}>{AppConfig.appName.toUpperCase()}</Text>
        <Text style={styles.orgName}>{AppConfig.organization}</Text>
        <Text style={styles.deptName}>{AppConfig.department}</Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Initializing Local SQLite Engine...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.offlinePill}>OFFLINE-FIRST ON-DEVICE ARCHITECTURE</Text>
        <Text style={styles.versionText}>v1.0.0 • SQLite Single Source of Truth</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1E3D',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingContainer: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  offlinePill: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.successGreen,
    backgroundColor: 'rgba(22, 163, 106, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 11,
    color: '#64748B',
  },
});
