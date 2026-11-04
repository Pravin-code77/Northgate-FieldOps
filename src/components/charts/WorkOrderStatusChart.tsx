import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';

interface WorkOrderStatusChartProps {
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

export const WorkOrderStatusChart: React.FC<WorkOrderStatusChartProps> = ({ statusCounts }) => {
  const { pending, in_progress, completed, cancelled } = statusCounts;
  const total = pending + in_progress + completed + cancelled;

  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  const inProgressPct = total > 0 ? (in_progress / total) * 100 : 0;
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const cancelledPct = total > 0 ? (cancelled / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Work Order Status Distribution</Text>
        <Text style={styles.totalBadge}>{total} Total Orders</Text>
      </View>

      {/* Segmented Distribution Bar */}
      <View style={styles.barContainer}>
        {in_progress > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${inProgressPct}%`, backgroundColor: Colors.primaryBlue },
            ]}
          />
        )}
        {pending > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${pendingPct}%`, backgroundColor: Colors.warningOrange },
            ]}
          />
        )}
        {completed > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${completedPct}%`, backgroundColor: Colors.successGreen },
            ]}
          />
        )}
        {cancelled > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${cancelledPct}%`, backgroundColor: Colors.disabledGrey },
            ]}
          />
        )}
        {total === 0 && <View style={[styles.barSegment, { width: '100%', backgroundColor: Colors.borderGrey }]} />}
      </View>

      {/* Legend Grid */}
      <View style={styles.legendGrid}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryBlue }]} />
          <Text style={styles.legendLabel}>In Progress</Text>
          <Text style={styles.legendCount}>{in_progress}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warningOrange }]} />
          <Text style={styles.legendLabel}>Pending</Text>
          <Text style={styles.legendCount}>{pending}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.successGreen }]} />
          <Text style={styles.legendLabel}>Completed</Text>
          <Text style={styles.legendCount}>{completed}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.disabledGrey }]} />
          <Text style={styles.legendLabel}>Cancelled</Text>
          <Text style={styles.legendCount}>{cancelled}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  totalBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
    backgroundColor: Colors.appBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  barContainer: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Colors.borderGrey,
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '22%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginRight: 4,
  },
  legendCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
  },
});
