import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { InspectionPhoto } from '../../models/InspectionPhoto';
import { PhotoTile } from './PhotoTile';

interface PhotoCaptureCardProps {
  beforePhoto: InspectionPhoto | null;
  afterPhoto: InspectionPhoto | null;
  onCaptureBefore: () => void;
  onCaptureAfter: () => void;
  onPreviewPhoto?: (photo: InspectionPhoto) => void;
  disabled?: boolean;
}

export const PhotoCaptureCard: React.FC<PhotoCaptureCardProps> = ({
  beforePhoto,
  afterPhoto,
  onCaptureBefore,
  onCaptureAfter,
  onPreviewPhoto,
  disabled = false,
}) => {
  const photoCount = (beforePhoto ? 1 : 0) + (afterPhoto ? 1 : 0);
  const isComplete = photoCount === 2;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inspection Evidence Photographs</Text>
          <Text style={styles.subtitle}>
            Both BEFORE and AFTER photographs are mandatory before completing work.
          </Text>
        </View>
        <View
          style={[
            styles.progressBadge,
            { backgroundColor: isComplete ? Colors.successGreenBg : Colors.warningOrangeBg },
          ]}
        >
          <Text
            style={[
              styles.progressText,
              { color: isComplete ? Colors.successGreen : Colors.warningOrange },
            ]}
          >
            {photoCount}/2 PHOTOS
          </Text>
        </View>
      </View>

      <PhotoTile
        kind="before"
        photo={beforePhoto}
        onCapturePress={onCaptureBefore}
        onPreviewPress={onPreviewPhoto}
        disabled={disabled}
      />

      <PhotoTile
        kind="after"
        photo={afterPhoto}
        onCapturePress={onCaptureAfter}
        onPreviewPress={onPreviewPhoto}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    maxWidth: 240,
    lineHeight: 16,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
