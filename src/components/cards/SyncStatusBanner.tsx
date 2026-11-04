import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { getRelativeTime } from '../../utils/dateTime';

interface SyncStatusBannerProps {
  isOnline: boolean;
  pendingCount: number;
  failedCount?: number;
  lastSyncTime?: string | null;
  isSyncing: boolean;
  onSyncPress: () => void;
}

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({
  isOnline,
  pendingCount,
  failedCount = 0,
  lastSyncTime,
  isSyncing,
  onSyncPress,
}) => {
  return (
    <View style={styles.banner}>
      <View style={styles.infoCol}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? Colors.successGreen : Colors.warningOrange },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online (Offline-Ready)' : 'Working Offline'}
          </Text>
        </View>

        <Text style={styles.detailsText}>
          {pendingCount > 0
            ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} queued locally`
            : 'All records synced locally'}
          {failedCount > 0 ? ` • ${failedCount} retry pending` : ''}
        </Text>

        {lastSyncTime && (
          <Text style={styles.timeText}>
            Last sync: {getRelativeTime(lastSyncTime)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
        onPress={onSyncPress}
        disabled={isSyncing}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.syncButtonText}>Sync Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCol: {
    flex: 1,
    marginRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  syncButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: Colors.disabledGrey,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
