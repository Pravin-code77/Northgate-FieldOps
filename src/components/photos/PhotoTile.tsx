import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { InspectionPhoto } from '../../models/InspectionPhoto';
import { formatDateTime } from '../../utils/dateTime';
import { formatCoordinates } from '../../utils/formatters';

interface PhotoTileProps {
  kind: 'before' | 'after';
  photo: InspectionPhoto | null;
  onCapturePress: () => void;
  onPreviewPress?: (photo: InspectionPhoto) => void;
  disabled?: boolean;
}

export const PhotoTile: React.FC<PhotoTileProps> = ({
  kind,
  photo,
  onCapturePress,
  onPreviewPress,
  disabled = false,
}) => {
  const isBefore = kind === 'before';
  const label = isBefore ? 'BEFORE MAINTENANCE' : 'AFTER MAINTENANCE';
  const badgeColor = isBefore ? Colors.infoBlue : Colors.successGreen;

  if (!photo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
          <Text style={styles.requiredTag}>* Required</Text>
        </View>

        <TouchableOpacity
          style={[styles.emptyBox, disabled && styles.disabledBox]}
          onPress={onCapturePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.capturePrompt}>
            {disabled ? 'Start work order to capture' : `Tap to capture ${kind} photo`}
          </Text>
          <Text style={styles.subPrompt}>Camera capture stored in private storage</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <Text style={styles.capturedTag}>✓ Captured</Text>
      </View>

      <TouchableOpacity
        style={styles.imageCard}
        onPress={() => onPreviewPress && onPreviewPress(photo)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: photo.file_path }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.photoOverlay}>
          <Text style={styles.photoTime}>{formatDateTime(photo.captured_at)}</Text>
          {photo.captured_lat != null && photo.captured_lng != null && (
            <Text style={styles.photoCoords}>
              {formatCoordinates(photo.captured_lat, photo.captured_lng)}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!disabled && (
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={onCapturePress}
          activeOpacity={0.7}
        >
          <Text style={styles.retakeText}>Retake {kind} Photograph</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  requiredTag: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dangerRed,
  },
  capturedTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successGreen,
  },
  emptyBox: {
    height: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C6D9FF',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  disabledBox: {
    borderColor: Colors.borderGrey,
    backgroundColor: '#F9FAFB',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  capturePrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryBlue,
    marginBottom: 2,
    textAlign: 'center',
  },
  subPrompt: {
    fontSize: 11,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  imageCard: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  photoTime: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  photoCoords: {
    color: '#93C5FD',
    fontSize: 10,
    marginTop: 1,
  },
  retakeButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
});
