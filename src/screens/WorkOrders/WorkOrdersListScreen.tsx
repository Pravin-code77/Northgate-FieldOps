
import React from 'react';

import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../../constants/colors';

import { WorkOrderCard } from '../../components/cards/WorkOrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';

import { useWorkOrders } from '../../hooks/useWorkOrders';
import { WorkOrder } from '../../models/WorkOrder';

import type { WorkOrderSortBy } from '../../repositories/workOrderRepository';

interface WorkOrdersListScreenProps {
  navigation: any;
  route?: any;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_FILTERS = [
  { id: 'all', label: 'All Priorities' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const SORT_OPTIONS: {
  value: WorkOrderSortBy;
  label: string;
}[] = [
  { value: 'due_date', label: 'Due Date ↓' },
  { value: 'priority', label: 'Priority ↓' },
  { value: 'status', label: 'Status ↓' },
];

export const WorkOrdersListScreen: React.FC<
  WorkOrdersListScreenProps
> = ({ navigation, route }) => {

  const {
    workOrders,
    isLoading,
    error,
    refresh,
    filters,
    setFilters,
  } = useWorkOrders({
    status: route?.params?.status || 'all',
    priority: 'all',
    search: '',
    sortBy: 'due_date',
  });

  const activeStatus = filters.status || 'all';
  const activePriority = filters.priority || 'all';
  const searchQuery = filters.search || '';
  const sortBy = filters.sortBy || 'due_date';

  // STATUS FILTER
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status,
    }));
  };

  // PRIORITY FILTER
  const handlePriorityChange = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority,
    }));
  };

  // SEARCH
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search,
    }));
  };

  // SORTING
  const handleSortChange = () => {
    setFilters(prev => {
      const currentIndex = SORT_OPTIONS.findIndex(
        option => option.value === prev.sortBy
      );

      const nextIndex =
        (currentIndex + 1) % SORT_OPTIONS.length;

      return {
        ...prev,
        sortBy: SORT_OPTIONS[nextIndex].value,
      };
    });
  };

  // CLEAR FILTERS
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      search: '',
      sortBy: 'due_date',
    });
  };

  // CURRENT SORT LABEL
  const currentSortLabel =
    SORT_OPTIONS.find(option => option.value === sortBy)?.label
    || 'Due Date ↓';

  // WORK ORDER CARD
  const renderItem = ({ item }: { item: WorkOrder }) => (
    <WorkOrderCard
      workOrder={item}
      onPress={() =>
        navigation.navigate('WorkOrderDetail', {
          workOrderId: item.id,
        })
      }
    />
  );

  return (
    <View style={styles.container}>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search work order # or asset..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearchChange('')}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* STATUS FILTERS */}
     

      {/* PRIORITY FILTERS */}
      

      {/* SORT AND COUNT */}
      <View style={styles.subFiltersBar}>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort: </Text>

          <TouchableOpacity
            onPress={handleSortChange}
            style={styles.sortButton}
            activeOpacity={0.7}
          >
            <Text style={styles.sortValue}>
              {currentSortLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {workOrders.length} orders found
          </Text>
        </View>

      </View>

      {/* ERROR MESSAGE */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WORK ORDERS LIST */}
      {isLoading ? (
        <LoadingIndicator message="Loading Work Orders from SQLite..." />
      ) : (
        <FlatList
          data={workOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          extraData={sortBy}
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
              title="No Work Orders Found"
              description="No maintenance work orders matched your selected filters or search terms."
              actionTitle="Clear All Filters"
              onActionPress={handleClearFilters}
            />
          }
        />
      )}

    </View>
  );
};


// STYLES
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
  },

  searchInput: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    color: Colors.primaryText,
  },

  clearBtn: {
    position: 'absolute',
    right: 28,
    top: 20,
  },

  clearBtnText: {
    color: Colors.secondaryText,
    fontSize: 16,
    fontWeight: '700',
  },

  filtersWrapper: {
    backgroundColor: Colors.appBackground,
    paddingBottom: 6,
  },

  statusPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },

  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },

  statusPillActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },

  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },

  priorityPillActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },

  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },

  statusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  subFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGrey,
  },

  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sortLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },

  sortButton: {
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },

  sortValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },

  countBadge: {
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },

  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  errorContainer: {
    padding: 12,
    marginHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },

  retryText: {
    color: '#1D4ED8',
    fontWeight: '700',
    marginTop: 6,
  },

});
