import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { WorkOrder } from '../../models/WorkOrder';
import { formatDate, isOverdue } from '../../utils/dateTime';
import { PriorityBadge } from '../status/PriorityBadge';
import { StatusChip } from '../status/StatusChip';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onPress: () => void;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder, onPress }) => {
  const overdue = isOverdue(workOrder.due_date, workOrder.status);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, overdue && styles.cardOverdue]}
    >
      {overdue && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueBannerText}>⚠️ OVERDUE MAINTENANCE</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.numberRow}>
          <Text style={styles.woNumber}>{workOrder.wo_number}</Text>
          <PriorityBadge priority={workOrder.priority} />
        </View>
        <StatusChip status={workOrder.status} size="small" />
      </View>

      <Text style={styles.assetName} numberOfLines={1}>
        {workOrder.asset_name || 'Industrial Equipment'}
      </Text>

      {workOrder.asset_ref && (
        <Text style={styles.assetRef}>{workOrder.asset_ref}</Text>
      )}

      <Text style={styles.description} numberOfLines={2}>
        {workOrder.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.dueRow}>
          <Text style={styles.dueLabel}>Due: </Text>
          <Text style={[styles.dueValue, overdue && styles.dueOverdue]}>
            {formatDate(workOrder.due_date)}
          </Text>
        </View>
        <Text style={styles.viewDetailsText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardOverdue: {
    borderColor: '#FFA39E',
    borderLeftWidth: 4,
    borderLeftColor: Colors.dangerRed,
  },
  overdueBanner: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  overdueBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dangerRed,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  woNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  assetRef: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryBlue,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.secondaryText,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGrey,
    paddingTop: 10,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  dueValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  dueOverdue: {
    color: Colors.dangerRed,
    fontWeight: '700',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
});
