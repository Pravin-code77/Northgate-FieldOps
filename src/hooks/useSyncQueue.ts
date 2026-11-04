import { useCallback, useEffect, useState } from 'react';
import { SyncQueueItem } from '../models/SyncQueue';
import {
  fetchAllSyncQueue,
  retryAllEligibleFailed,
  retryQueueItem,
  runSimulatedSync,
  SyncEngineResult,
} from '../services/syncService';

export function useSyncQueue() {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SyncEngineResult | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await fetchAllSyncQueue();
      setQueueItems(items);
    } catch (err) {
      console.error('[useSyncQueue] Error loading sync queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const triggerManualSync = async (forceOnline = false): Promise<SyncEngineResult> => {
    setIsSyncing(true);
    try {
      const result = await runSimulatedSync({ forceOnline });
      setLastResult(result);
      await loadQueue();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const retryItem = async (id: number): Promise<void> => {
    setIsSyncing(true);
    try {
      await retryQueueItem(id);
      await loadQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const retryAll = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await retryAllEligibleFailed();
      await loadQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    queueItems,
    isLoading,
    isSyncing,
    lastResult,
    refresh: loadQueue,
    triggerManualSync,
    retryItem,
    retryAll,
  };
}
