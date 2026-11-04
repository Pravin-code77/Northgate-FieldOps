
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { WorkOrder } from '../models/WorkOrder';

import {
  completeWorkOrder,
  fetchCompletedHistory,
  fetchWorkOrderDetail,
  listWorkOrders,
  saveWorkOrderNotes,
  startWorkOrder,
} from '../services/workOrderService';

import type {
  WorkOrderFilters,
} from '../repositories/workOrderRepository';

const DEFAULT_FILTERS: WorkOrderFilters = {
  status: 'all',
  priority: 'all',
  search: '',
  sortBy: 'due_date',
};

export function useWorkOrders(initialFilters?: WorkOrderFilters) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  const [completedHistory, setCompletedHistory] = useState<WorkOrder[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Single source of truth for all filters and sorting
  const [filters, setFilters] = useState<WorkOrderFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  // LOAD WORK ORDERS
  const loadWorkOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await listWorkOrders(filters);

      setWorkOrders(data);
    } catch (err: any) {
      console.error(
        '[useWorkOrders] Error loading work orders:',
        err
      );

      setError(
        err?.message || 'Failed to load work orders from SQLite.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // LOAD COMPLETED HISTORY
  const loadCompletedHistory = useCallback(async () => {
    try {
      const history = await fetchCompletedHistory();

      setCompletedHistory(history);
    } catch (err) {
      console.warn(
        '[useWorkOrders] Error loading completed history:',
        err
      );
    }
  }, []);

  // AUTOMATICALLY RELOAD WHEN FILTERS OR SORTING CHANGE
  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // START WORK ORDER
  const startWO = async (params: {
    workOrder: WorkOrder;
    hasActiveSession: boolean;
    isWithinRadius: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
    } | null;
    distanceMeters?: number;
    radiusMeters?: number;
  }): Promise<WorkOrder> => {
    const updated = await startWorkOrder(params);

    await loadWorkOrders();

    return updated;
  };

  // SAVE NOTES
  const saveNotes = async (
    workOrderId: number,
    notes: string
  ): Promise<void> => {
    await saveWorkOrderNotes(workOrderId, notes);

    await loadWorkOrders();
  };

  // COMPLETE WORK ORDER
  const completeWO = async (params: {
    workOrder: WorkOrder;
    notes: string;
    completionCoords: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
    };
  }): Promise<WorkOrder> => {
    const completed = await completeWorkOrder(params);

    await loadWorkOrders();

    await loadCompletedHistory();

    return completed;
  };

  return {
    workOrders,
    completedHistory,
    isLoading,
    error,

    filters,
    setFilters,

    refresh: loadWorkOrders,
    loadCompletedHistory,

    startWO,
    saveNotes,
    completeWO,

    getDetail: fetchWorkOrderDetail,
  };
}
