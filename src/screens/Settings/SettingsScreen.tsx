import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { resetDatabase } from '../../db/database';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useSession();
  const { gpsRadiusMeters, sessionTimeoutMinutes, maxRetries, syncFailureRate, saveSettings } =
    useSettings();

  const [radiusInput, setRadiusInput] = useState<string>(gpsRadiusMeters.toString());
  const [timeoutInput, setTimeoutInput] = useState<string>(sessionTimeoutMinutes.toString());
  const [retriesInput, setRetriesInput] = useState<string>(maxRetries.toString());
  const [failureRateInput, setFailureRateInput] = useState<string>(syncFailureRate.toString());

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const radius = parseInt(radiusInput, 10);
    const timeout = parseInt(timeoutInput, 10);
    const retries = parseInt(retriesInput, 10);
    const rate = parseFloat(failureRateInput);

    const result = await saveSettings({
      gpsRadiusMeters: radius,
      sessionTimeoutMinutes: timeout,
      maxRetries: retries,
      syncFailureRate: isNaN(rate) ? 0.1 : rate,
    });

    setIsSaving(false);
    if (result.success) {
      Alert.alert('Settings Saved', 'Configuration saved in SQLite settings table.');
    } else {
      Alert.alert('Invalid Settings', result.error || 'Please correct the values.');
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const handleResetDbConfirm = async () => {
    setShowResetConfirm(false);
    try {
      await resetDatabase();
      Alert.alert('Database Reset', 'SQLite database was wiped and re-seeded with fresh reference data.');
      await logout();
    } catch (err: any) {
      Alert.alert('Reset Failed', err?.message || 'Database reset failed.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Engineer Profile Card */}
      <View style={styles.card}>
        <View style={styles.engineerHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>MV</Text>
          </View>
          <View style={styles.engineerInfo}>
            <Text style={styles.engineerName}>
              {user?.full_name || AppConfig.demoEngineer.fullName}
            </Text>
            <Text style={styles.employeeCode}>
              {user?.employee_code || AppConfig.demoEngineer.employeeCode}
            </Text>
            <Text style={styles.engineerRole}>
              {user?.role || AppConfig.demoEngineer.role}
            </Text>
          </View>
        </View>

        <View style={styles.orgTag}>
          <Text style={styles.orgTagText}>
            {AppConfig.organization} • {AppConfig.department}
          </Text>
        </View>
      </View>

      {/* Operational Settings */}
      <SectionHeader title="Operational Configuration" />
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>GPS Proximity Threshold</Text>
            <Text style={styles.settingHint}>Allowed radius from asset (25–1000m)</Text>
          </View>
          <View style={styles.inputCol}>
            <TextInput
              style={styles.settingInput}
              value={radiusInput}
              onChangeText={setRadiusInput}
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>m</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Session Idle Lock Timeout</Text>
            <Text style={styles.settingHint}>Re-authentication timeout (5–60 min)</Text>
          </View>
          <View style={styles.inputCol}>
            <TextInput
              style={styles.settingInput}
              value={timeoutInput}
              onChangeText={setTimeoutInput}
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>min</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Sync Maximum Retries</Text>
            <Text style={styles.settingHint}>Retry ceiling before permanent fail (1–10)</Text>
          </View>
          <View style={styles.inputCol}>
            <TextInput
              style={styles.settingInput}
              value={retriesInput}
              onChangeText={setRetriesInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Simulated Failure Rate</Text>
            <Text style={styles.settingHint}>Sync test glitch probability (0.0 to 1.0)</Text>
          </View>
          <View style={styles.inputCol}>
            <TextInput
              style={styles.settingInput}
              value={failureRateInput}
              onChangeText={setFailureRateInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <PrimaryButton
          title={isSaving ? 'Saving Settings...' : 'Save Configuration in SQLite'}
          onPress={handleSaveSettings}
          loading={isSaving}
          style={styles.saveBtn}
        />
      </View>

     

      {/* Account & Security Actions */}
      
      <View style={styles.actionCard}>
        <SecondaryButton
          title="Sign Out "
          onPress={() => setShowLogoutConfirm(true)}
          style={styles.logoutBtn}
        />

        <TouchableOpacity
          style={styles.resetDbBtn}
          onPress={() => setShowResetConfirm(true)}
        >
          <Text style={styles.resetDbText}>Reset Database & Reseed Demo Data</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation */}
      <ConfirmationDialog
        visible={showLogoutConfirm}
        title="Sign Out of FieldOps"
        message="Are you sure you want to sign out? All your local work orders, inspection photos, notes, and sync records will be preserved safely in SQLite."
        confirmText="Sign Out"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Reset Confirmation */}
      <ConfirmationDialog
        visible={showResetConfirm}
        title="Reset Local Database"
        message="This will delete and reinitialize the local SQLite database with fresh seed data. Any newly created records will be re-seeded."
        confirmText="Confirm Reset"
        isDestructive
        onConfirm={handleResetDbConfirm}
        onCancel={() => setShowResetConfirm(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 16,
  },
  engineerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  engineerInfo: {
    flex: 1,
  },
  engineerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  employeeCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  engineerRole: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  orgTag: {
    backgroundColor: Colors.appBackground,
    padding: 8,
    borderRadius: 6,
  },
  orgTagText: {
    fontSize: 11,
    color: Colors.secondaryText,
    textAlign: 'center',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGrey,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  inputCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingInput: {
    backgroundColor: Colors.appBackground,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 65,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  unitText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGrey,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  actionCard: {
    marginTop: 4,
  },
  logoutBtn: {
    marginBottom: 12,
  },
  resetDbBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetDbText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dangerRed,
  },
});
