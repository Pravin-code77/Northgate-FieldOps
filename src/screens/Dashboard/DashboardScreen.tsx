import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import { MetricCard } from '../../components/cards/MetricCard';
import { SyncStatusBanner } from '../../components/cards/SyncStatusBanner';
import { WorkOrderStatusChart } from '../../components/charts/WorkOrderStatusChart';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useSession } from '../../context/SessionContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { getRelativeTime } from '../../utils/dateTime';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useSession();
  const { isConnected } = useConnectivity();
  const { metrics, isLoading, refresh } = useDashboard();
  const { queueItems, isSyncing, triggerManualSync } = useSyncQueue();

  const handleManualSync = async () => {
    await triggerManualSync();
    await refresh();
  };

  const pendingQueueCount = queueItems.filter(
    (q) => q.status === 'pending' || q.status === 'uploading'
  ).length;

  const failedQueueCount = queueItems.filter((q) => q.status === 'failed').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[Colors.primaryBlue]} />}
    >
      {/* Top Engineer Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Field Operations Dashboard</Text>
          <Text style={styles.engineerName}>
            {user?.full_name || 'Senior Field Engineer'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => navigation.navigate('SettingsTab')}
        >
          <Text style={styles.profileBadgeText}>
            {user?.employee_code || 'EMP-4029'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Status Banner */}
      <SyncStatusBanner
        isOnline={isConnected}
        pendingCount={pendingQueueCount}
        failedCount={failedQueueCount}
        lastSyncTime={metrics?.lastSuccessfulSync}
        isSyncing={isSyncing}
        onSyncPress={handleManualSync}
      />

      {/* Primary Operational Metric Cards */}
      <SectionHeader title="Operational Metrics" />
      <View style={styles.metricsGrid}>
        <MetricCard
          label="In Progress"
          value={metrics?.inProgressJobs ?? 0}
          accentColor={Colors.primaryBlue}
          onPress={() => navigation.navigate('WorkOrdersTab', { status: 'in_progress' })}
        />
        <MetricCard
          label="Pending Work"
          value={metrics?.pendingJobs ?? 0}
          accentColor={Colors.warningOrange}
          onPress={() => navigation.navigate('WorkOrdersTab', { status: 'pending' })}
        />
        <MetricCard
          label="Completed Today"
          value={metrics?.todayCompletedJobs ?? 0}
          sublabel={`${metrics?.completedJobs ?? 0} total completed`}
          accentColor={Colors.successGreen}
          onPress={() => navigation.navigate('WorkOrdersTab', { status: 'completed' })}
        />
        <MetricCard
          label="Overdue Alert"
          value={metrics?.overdueJobs ?? 0}
          accentColor={Colors.dangerRed}
          onPress={() => navigation.navigate('WorkOrdersTab', { filterOverdue: true })}
        />
      </View>

      {/* Secondary Asset & System Metrics */}
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Total Assets"
          value={metrics?.totalAssets ?? 0}
          sublabel="Operational equipment"
          accentColor="#0284C7"
          onPress={() => navigation.navigate('AssetsTab')}
        />
        <MetricCard
          label="Pending Assets"
          value={metrics?.pendingAssets ?? 0}
          sublabel="Needs inspection"
          accentColor="#7C3AED"
          onPress={() => navigation.navigate('AssetsTab')}
        />
      </View>

      {/* Work Order Status Breakdown Chart */}
      {metrics && (
        <WorkOrderStatusChart statusCounts={metrics.statusChart} />
      )}

      {/* Recent Local Activity Feed */}
      <SectionHeader
        title="Recent Local Activity"
        actionTitle="View Sync Queue"
        onActionPress={() => navigation.navigate('SyncTab')}
      />

      {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
        <View style={styles.activityList}>
          {metrics.recentActivity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityTime}>{getRelativeTime(item.timestamp)}</Text>
                </View>
                <Text style={styles.activityDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyActivityText}>No recent activity recorded.</Text>
        </View>
      )}
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  engineerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  profileBadge: {
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6D9FF',
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
    fontFamily: 'monospace',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  activityList: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryBlue,
    marginTop: 5,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  activityDetail: {
    fontSize: 12,
    color: Colors.secondaryText,
    lineHeight: 16,
  },
  emptyActivity: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  emptyActivityText: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
});
