import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { useSession } from '../../context/SessionContext';

interface EnrollmentModalProps {
  visible: boolean;
  onCompleted: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ visible, onCompleted }) => {
  const { user, enroll } = useSession();
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);
    try {
      const success = await enroll();
      if (success) {
        onCompleted();
      } else {
        setError('Device biometric or passcode enrollment verification did not complete. Please retry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Enrollment error occurred.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FIRST-TIME SETUP</Text>
          </View>
          <Text style={styles.title}>Engineer Device Enrollment</Text>
          <Text style={styles.subtitle}>
            Welcome to {AppConfig.appName} for {AppConfig.organization}.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Engineer Profile</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Engineer Name</Text>
            <Text style={styles.value}>{user?.full_name || AppConfig.demoEngineer.fullName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Employee Code</Text>
            <Text style={styles.valueCode}>{user?.employee_code || AppConfig.demoEngineer.employeeCode}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Role / Division</Text>
            <Text style={styles.value}>{user?.role || AppConfig.demoEngineer.role}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Local Biometric Security</Text>
          <Text style={styles.infoText}>
            FieldOps Mobile uses your device's native fingerprint or face authentication to secure offline maintenance work orders and audit logs.
          </Text>
          <Text style={styles.infoSubText}>
            No biometric data or device passcodes ever leave your device. The operating system handles biometric verification.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryButton
            title={isEnrolling ? 'Verifying Hardware...' : 'Enable Biometric Authentication'}
            onPress={handleEnroll}
            loading={isEnrolling}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
  },
  badge: {
    backgroundColor: Colors.lightBlue,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryBlue,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginVertical: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  valueCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryBlue,
    fontFamily: 'monospace',
  },
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6D9FF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkBlue,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
    marginBottom: 6,
  },
  infoSubText: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 15,
  },
  errorBox: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFA39E',
  },
  errorText: {
    fontSize: 12,
    color: Colors.dangerRed,
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    marginBottom: 20,
  },
});
