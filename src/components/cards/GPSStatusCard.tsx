import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { formatCoordinates, formatDistance } from '../../utils/formatters';

interface GPSStatusCardProps {
  userCoords: { latitude: number; longitude: number; accuracy: number | null } | null;
  assetCoords: { latitude: number; longitude: number };
  distanceMeters: number | null;
  radiusMeters: number;
  isWithinRadius: boolean;
  isLocating?: boolean;
  onRetry: () => void;
}

export const GPSStatusCard: React.FC<GPSStatusCardProps> = ({
  userCoords,
  assetCoords,
  distanceMeters,
  radiusMeters,
  isWithinRadius,
  isLocating = false,
  onRetry,
}) => {
  const verified = isWithinRadius && distanceMeters != null;

  return (
    <View style={[styles.card, verified ? styles.cardVerified : styles.cardFailed]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>GPS Proximity Verification</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: verified ? Colors.successGreenBg : Colors.dangerRedBg },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: verified ? Colors.successGreen : Colors.dangerRed },
              ]}
            >
              {verified ? '✓ VERIFIED IN RANGE' : '⚠️ OUTSIDE RADIUS'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Distance to Asset</Text>
          <Text
            style={[
              styles.gridValue,
              { color: verified ? Colors.successGreen : Colors.dangerRed },
            ]}
          >
            {formatDistance(distanceMeters)}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Allowed Radius</Text>
          <Text style={styles.gridValue}>{radiusMeters} m</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Asset Target</Text>
          <Text style={styles.coordText}>
            {formatCoordinates(assetCoords.latitude, assetCoords.longitude)}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Current GPS Fix</Text>
          <Text style={styles.coordText}>
            {userCoords
              ? formatCoordinates(userCoords.latitude, userCoords.longitude)
              : 'Acquiring satellite lock...'}
          </Text>
          {userCoords?.accuracy != null && (
            <Text style={styles.accuracyText}>Accuracy: ±{Math.round(userCoords.accuracy)}m</Text>
          )}
        </View>
      </View>

      {!verified && (
        <Text style={styles.warningMessage}>
          You must be within {radiusMeters}m of this industrial equipment to start maintenance.
        </Text>
      )}

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        disabled={isLocating}
        activeOpacity={0.7}
      >
        <Text style={styles.retryButtonText}>
          {isLocating ? 'Acquiring GPS fix...' : '🔄 Refresh GPS Location'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
  },
  cardVerified: {
    borderColor: Colors.successGreen,
  },
  cardFailed: {
    borderColor: Colors.dangerRed,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    width: '47%',
    backgroundColor: Colors.appBackground,
    borderRadius: 8,
    padding: 10,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  coordText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  accuracyText: {
    fontSize: 10,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  warningMessage: {
    fontSize: 12,
    color: Colors.dangerRed,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6D9FF',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
});
