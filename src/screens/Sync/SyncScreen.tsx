import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StatusChip } from '../../components/status/StatusChip';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { SyncQueueItem } from '../../models/SyncQueue';
import { formatDateTime, getRelativeTime } from '../../utils/dateTime';

export const SyncScreen: React.FC = () => {
  const { isConnected } = useConnectivity();
  const { queueItems, isLoading, isSyncing, lastResult, refresh, triggerManualSync, retryItem, retryAll } =
    useSyncQueue();

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
  const uploadingCount = queueItems.filter((i) => i.status === 'uploading').length;
  const successCount = queueItems.filter((i) => i.status === 'success').length;
  const failedCount = queueItems.filter((i) => i.status === 'failed').length;

  const filteredItems = queueItems.filter((i) => {
    if (activeFilter === 'all') return true;
    return i.status === activeFilter;
  });

  const renderItem = ({ item }: { item: SyncQueueItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.entityBadge}>
          <Text style={styles.entityText}>
            {item.operation.toUpperCase()} {item.entity.toUpperCase()} #{item.entity_id}
          </Text>
        </View>
        <StatusChip status={item.status} size="small" />
      </View>

      {item.last_error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {item.last_error}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.footerTime}>Created: {formatDateTime(item.created_at)}</Text>
        <Text style={styles.retryBadge}>Retries: {item.retry_count}</Text>
      </View>

      {item.status === 'failed' && (
        <TouchableOpacity
          style={styles.retrySingleBtn}
          onPress={() => retryItem(item.id)}
          disabled={isSyncing}
        >
          <Text style={styles.retrySingleText}>↻ Retry This Record</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Status & Controls */}
      <View style={styles.topControlCard}>
        <View style={styles.connRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: isConnected ? Colors.successGreen : Colors.warningOrange },
            ]}
          />
          <Text style={styles.connStatus}>
            {isConnected ? 'Connected • Ready to Sync' : 'Offline • On-Device Queueing'}
          </Text>
        </View>

        <View style={styles.countsRow}>
          <View style={styles.countBox}>
            <Text style={[styles.countNum, { color: Colors.warningOrange }]}>{pendingCount}</Text>
            <Text style={styles.countLbl}>Pending</Text>
          </View>
          <View style={styles.countBox}>
            <Text style={[styles.countNum, { color: Colors.primaryBlue }]}>{uploadingCount}</Text>
            <Text style={styles.countLbl}>Uploading</Text>
          </View>
          <View style={styles.countBox}>
            <Text style={[styles.countNum, { color: Colors.successGreen }]}>{successCount}</Text>
            <Text style={styles.countLbl}>Success</Text>
          </View>
          <View style={styles.countBox}>
            <Text style={[styles.countNum, { color: Colors.dangerRed }]}>{failedCount}</Text>
            <Text style={styles.countLbl}>Failed</Text>
          </View>
        </View>

        {lastResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultMsg}>{lastResult.message}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <View style={styles.btnCol}>
            <PrimaryButton
              title={isSyncing ? 'Synchronizing...' : 'Run Sync Cycle'}
              onPress={() => triggerManualSync(true)}
              loading={isSyncing}
            />
          </View>
          {failedCount > 0 && (
            <View style={styles.btnCol}>
              <SecondaryButton
                title="Retry All Failed"
                onPress={retryAll}
                disabled={isSyncing}
              />
            </View>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersBar}>
        {['all', 'pending', 'success', 'failed'].map((filterKey) => (
          <TouchableOpacity
            key={filterKey}
            style={[styles.filterTab, activeFilter === filterKey && styles.filterTabActive]}
            onPress={() => setActiveFilter(filterKey)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filterKey && styles.filterTabTextActive,
              ]}
            >
              {filterKey.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Queue List */}
      {isLoading ? (
        <LoadingIndicator message="Loading Queue from SQLite..." />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[Colors.primaryBlue]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Queue is Clean"
              description="No synchronization records match this status."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  topControlCard: {
    backgroundColor: Colors.cardWhite,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGrey,
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.appBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  countBox: {
    alignItems: 'center',
    flex: 1,
  },
  countNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  countLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  resultBox: {
    backgroundColor: Colors.lightBlue,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  resultMsg: {
    fontSize: 12,
    color: Colors.primaryBlue,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCol: {
    flex: 1,
  },
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: Colors.cardWhite,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entityBadge: {
    backgroundColor: Colors.appBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  entityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  errorBox: {
    backgroundColor: Colors.dangerRedBg,
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dangerRed,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerTime: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  retryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  retrySingleBtn: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: Colors.lightBlue,
    borderRadius: 6,
  },
  retrySingleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
});
