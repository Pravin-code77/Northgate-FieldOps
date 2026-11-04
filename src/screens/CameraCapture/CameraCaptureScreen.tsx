import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from '../../constants/colors';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { useGps } from '../../hooks/useGps';
import { saveInspectionPhoto } from '../../services/photoService';

interface CameraCaptureScreenProps {
  navigation: any;
  route: {
    params: {
      workOrderId: number;
      woNumber: string;
      assetName: string;
      kind: 'before' | 'after';
    };
  };
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({ navigation, route }) => {
  const { workOrderId, woNumber, assetName, kind } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const { currentLocation, refreshLocation } = useGps();

  const isBefore = kind === 'before';
  const badgeText = isBefore ? 'BEFORE MAINTENANCE' : 'AFTER MAINTENANCE';
  const badgeBg = isBefore ? Colors.infoBlue : Colors.successGreen;

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Get location fix for photo GPS tagging
      await refreshLocation();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
      } else {
        setErrorMessage('Failed to capture photograph from camera.');
      }
    } catch (err: any) {
      console.warn('[CameraCapture] Capture error:', err);
      setErrorMessage(err?.message || 'Camera capture failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhotoUri(null);
    setErrorMessage(null);
  };

  const handleConfirmSave = async () => {
    if (!capturedPhotoUri) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const location = currentLocation
        ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
        : null;

      await saveInspectionPhoto({
        workOrderId,
        woNumber,
        kind,
        tempUri: capturedPhotoUri,
        location,
      });

      // Navigate back to Work Order Detail
      navigation.goBack();
    } catch (err: any) {
      console.error('[CameraCapture] Save photo error:', err);
      setErrorMessage(err?.message || 'Failed to save photo into private storage.');
      setIsProcessing(false);
    }
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingText}>Checking Camera Permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permText}>
          FieldOps Mobile requires device camera access to capture required before and after maintenance inspection evidence.
        </Text>
        <PrimaryButton
          title="Grant Camera Access"
          onPress={requestPermission}
          style={styles.permButton}
        />
        <SecondaryButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.permButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Industrial Overlay Header */}
      <View style={styles.topBar}>
        <View style={styles.infoRow}>
          <Text style={styles.woNumber}>{woNumber}</Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={styles.badgeLabel}>{badgeText}</Text>
          </View>
        </View>
        <Text style={styles.assetName} numberOfLines={1}>{assetName}</Text>
      </View>

      {/* Main Viewfinder / Image Preview */}
      <View style={styles.previewContainer}>
        {capturedPhotoUri ? (
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing="back"
          />
        )}

        {isProcessing && (
          <View style={styles.processingBackdrop}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Processing evidence photo...</Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {capturedPhotoUri ? (
          <View style={styles.confirmRow}>
            <View style={styles.btnCol}>
              <SecondaryButton
                title="Retake Photo"
                onPress={handleRetake}
                disabled={isProcessing}
              />
            </View>
            <View style={styles.btnCol}>
              <PrimaryButton
                title="Confirm & Save"
                onPress={handleConfirmSave}
                loading={isProcessing}
                variant="success"
              />
            </View>
          </View>
        ) : (
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <View style={styles.placeholderSpace} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.secondaryText,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 10,
    textAlign: 'center',
  },
  permText: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permButton: {
    width: '100%',
    marginBottom: 12,
  },
  topBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  woNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  assetName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  cameraView: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  processingBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: Colors.dangerRedBg,
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dangerRed,
  },
  errorText: {
    color: Colors.dangerRed,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelLink: {
    padding: 12,
    width: 80,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryBlue,
  },
  placeholderSpace: {
    width: 80,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCol: {
    flex: 1,
  },
});
