import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { GPSStatusCard } from '../../components/cards/GPSStatusCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { useSettings } from '../../context/SettingsContext';
import { useGps } from '../../hooks/useGps';

interface GPSVerificationModalProps {
  visible: boolean;
  assetName: string;
  assetCoords: { latitude: number; longitude: number };
  onVerificationSuccess: (coords: { latitude: number; longitude: number; accuracy: number | null }, distanceMeters: number) => void;
  onCancel: () => void;
}

export const GPSVerificationModal: React.FC<GPSVerificationModalProps> = ({
  visible,
  assetName,
  assetCoords,
  onVerificationSuccess,
  onCancel,
}) => {
  const { gpsRadiusMeters } = useSettings();
  const { currentLocation, isLocating, error, lastVerification, checkProximity, refreshLocation } = useGps();

  const [useBenchmarkCoords, setUseBenchmarkCoords] = useState<boolean>(false);

  const runVerification = async () => {
    if (useBenchmarkCoords) {
      // Use benchmark coordinates (San Francisco industrial facility yard)
      const benchmarkCoords = {
        latitude: AppConfig.benchmarkLocation.latitude,
        longitude: AppConfig.benchmarkLocation.longitude,
        accuracy: 5.0,
      };
      await checkProximity(assetCoords.latitude, assetCoords.longitude, gpsRadiusMeters);
    } else {
      await checkProximity(assetCoords.latitude, assetCoords.longitude, gpsRadiusMeters);
    }
  };

  useEffect(() => {
    if (visible) {
      runVerification();
    }
  }, [visible, useBenchmarkCoords]);

  const isVerified = lastVerification?.isWithinRadius === true;
  const distance = lastVerification?.distanceMeters ?? null;

  const handleConfirmStart = () => {
    if (!isVerified || !lastVerification?.currentLocation) return;
    onVerificationSuccess(lastVerification.currentLocation, distance ?? 0);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>GPS Proximity Verification</Text>
            <Text style={styles.subtitle}>
              Verifying engineer proximity to: <Text style={styles.assetHighlight}>{assetName}</Text>
            </Text>
          </View>

          <GPSStatusCard
            userCoords={currentLocation}
            assetCoords={assetCoords}
            distanceMeters={distance}
            radiusMeters={gpsRadiusMeters}
            isWithinRadius={isVerified}
            isLocating={isLocating}
            onRetry={runVerification}
          />

          {/* Test Benchmark Location Helper */}
          <View style={styles.testHelperBox}>
            <View style={styles.helperHeader}>
              <Text style={styles.helperTitle}>🧪 Testing & Demo Location Aid</Text>
              <TouchableOpacity
                onPress={() => setUseBenchmarkCoords((prev) => !prev)}
                style={[styles.toggleBtn, useBenchmarkCoords && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, useBenchmarkCoords && styles.toggleTextActive]}>
                  {useBenchmarkCoords ? 'Benchmark Active' : 'Use Benchmark'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperDesc}>
              {AppConfig.benchmarkLocation.description} ({AppConfig.benchmarkLocation.latitude.toFixed(4)}, {AppConfig.benchmarkLocation.longitude.toFixed(4)})
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <View style={styles.btnWrapper}>
              <SecondaryButton title="Cancel" onPress={onCancel} />
            </View>
            <View style={styles.btnWrapper}>
              <PrimaryButton
                title={isVerified ? 'Confirm & Start' : 'Start Disabled'}
                onPress={handleConfirmStart}
                disabled={!isVerified}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlayBackdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  assetHighlight: {
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  testHelperBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 16,
  },
  helperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  helperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  helperDesc: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 15,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dangerRed,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnWrapper: {
    flex: 1,
  },
});
