import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useSession } from '../../context/SessionContext';
import { EnrollmentModal } from './EnrollmentModal';

export const AuthenticationScreen: React.FC = () => {
  const { user, login, isLoading, requiresEnrollment, refreshSession } = useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await login();
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please use device passcode.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <EnrollmentModal
        visible={requiresEnrollment}
        onCompleted={refreshSession}
      />

      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.boltIcon}>⚡</Text>
          </View>
          <Text style={styles.appName}>{AppConfig.appName}</Text>
          <Text style={styles.orgName}>{AppConfig.organization}</Text>
          <Text style={styles.deptName}>{AppConfig.department}</Text>
        </View>

        {/* Engineer Card */}
        <View style={styles.engineerCard}>
          <Text style={styles.cardHeader}>Enrolled Engineer Profile</Text>
          <Text style={styles.engineerName}>
            {user?.full_name || AppConfig.demoEngineer.fullName}
          </Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeBadge}>
              {user?.employee_code || AppConfig.demoEngineer.employeeCode}
            </Text>
            <Text style={styles.engineerRole}>
              {user?.role || AppConfig.demoEngineer.role}
            </Text>
          </View>
        </View>

        {/* Biometric Visual Icon */}
        <View style={styles.biometricPrompt}>
          <View style={styles.fingerprintBadge}>
            <Text style={styles.fingerprintEmoji}>👆</Text>
          </View>
          <Text style={styles.promptTitle}>Biometric or Passcode Verification</Text>
          <Text style={styles.promptDesc}>
            Touch fingerprint sensor, glance for Face ID, or enter your device security passcode.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title={isAuthenticating ? 'Verifying Identity...' : 'Authenticate & Open FieldOps'}
          onPress={handleAuthenticate}
          loading={isAuthenticating || isLoading}
        />

        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={handleAuthenticate}
          activeOpacity={0.7}
        >
          <Text style={styles.fallbackText}>Device Passcode Fallback Available</Text>
        </TouchableOpacity>

        <Text style={styles.securePill}>
          🔒 100% On-Device Local Security • SQLite Verified
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  boltIcon: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryBlue,
    marginBottom: 2,
  },
  deptName: {
    fontSize: 11,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  engineerCard: {
    width: '100%',
    backgroundColor: Colors.appBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  engineerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  codeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkBlue,
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  engineerRole: {
    fontSize: 12,
    color: Colors.secondaryText,
    flex: 1,
  },
  biometricPrompt: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  fingerprintBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#C6D9FF',
  },
  fingerprintEmoji: {
    fontSize: 36,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 6,
    textAlign: 'center',
  },
  promptDesc: {
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFA39E',
    marginTop: 12,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: Colors.dangerRed,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    width: '100%',
  },
  fallbackButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  securePill: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
});
