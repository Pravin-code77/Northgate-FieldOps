import { useCallback, useEffect, useState } from 'react';
import { DashboardMetrics } from '../models/AuditLog';
import { fetchDashboardData } from '../services/dashboardService';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardData();
      setMetrics(data);
    } catch (err: any) {
      console.error('[useDashboard] Error loading metrics from SQLite:', err);
      setError(err?.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refresh: loadMetrics,
  };
}
