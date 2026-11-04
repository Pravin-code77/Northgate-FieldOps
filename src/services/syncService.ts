import * as Network from 'expo-network';
import AppConfig from '../constants/config';
import { SyncStatus } from '../constants/statuses';
import { SyncQueueItem } from '../models/SyncQueue';
import { addAuditLog, updateOutboundStatus } from '../repositories/logRepository';
import { getSetting } from '../repositories/settingsRepository';
import {
  getAllQueueItems,
  getEligibleItems,
  incrementRetry,
  resetAllFailed,
  resetFailedItem,
  updateStatus,
} from '../repositories/syncRepository';

export interface SyncEngineResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  isOffline: boolean;
  message: string;
}

/**
 * Check device network connectivity
 */
export async function isNetworkConnected(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    // If network check fails, fallback safely to connected
    return true;
  }
}

/**
 * Run simulated synchronization engine
 */
export async function runSimulatedSync(options?: {
  forceOnline?: boolean;
  simulatedFailureRate?: number;
}): Promise<SyncEngineResult> {
  const connected = options?.forceOnline ? true : await isNetworkConnected();

  if (!connected) {
    return {
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      isOffline: true,
      message: 'Device is currently offline. Queue items will synchronize automatically when connectivity resumes.',
    };
  }

  // Get max retries limit
  const maxRetriesStr = await getSetting('max_retries', AppConfig.defaultMaxRetries.toString());
  const maxRetries = parseInt(maxRetriesStr, 10) || AppConfig.defaultMaxRetries;

  // Get failure rate setting
  const failureRateStr = await getSetting('sync_failure_rate', '0.1');
  const failureRate = options?.simulatedFailureRate ?? (parseFloat(failureRateStr) || 0.1);

  // Fetch pending items oldest first
  const items = await getEligibleItems(15);

  if (items.length === 0) {
    return {
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      isOffline: false,
      message: 'All items are currently up to date.',
    };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const item of items) {
    // 1. Transition state to 'uploading'
    await updateStatus(item.id, SyncStatus.UPLOADING);

    // 2. Simulate short transmission delay (200-500ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 3. Determine simulated outcome
    const shouldFail = Math.random() < failureRate;

    if (shouldFail) {
      const errorMsg = 'Simulated connection timeout during data packet transmission.';
      const newRetryCount = item.retry_count + 1;
      const isPermanent = newRetryCount >= maxRetries;

      await incrementRetry(item.id, errorMsg, isPermanent);
      failedCount++;

      await addAuditLog({
        user_id: 1,
        event_type: 'sync_item_failed',
        detail: `Sync failure on ${item.entity} #${item.entity_id}. Retry ${newRetryCount}/${maxRetries}.`,
      });
    } else {
      // Success
      await updateStatus(item.id, SyncStatus.SUCCESS);
      await updateOutboundStatus(item.entity_id, 'synced');
      successCount++;
    }
  }

  await addAuditLog({
    user_id: 1,
    event_type: 'sync_batch_completed',
    detail: `Simulated sync cycle finished: ${successCount} synced, ${failedCount} failed.`,
  });

  return {
    processedCount: items.length,
    successCount,
    failedCount,
    isOffline: false,
    message: `Sync cycle complete: ${successCount} successful, ${failedCount} retry queued.`,
  };
}

export async function retryQueueItem(id: number): Promise<void> {
  await resetFailedItem(id);
  await addAuditLog({
    user_id: 1,
    event_type: 'sync_retry_requested',
    detail: `Manual retry queued for sync item #${id}.`,
  });
  // Trigger sync run
  await runSimulatedSync({ forceOnline: true, simulatedFailureRate: 0.0 });
}

export async function retryAllEligibleFailed(): Promise<void> {
  await resetAllFailed();
  await addAuditLog({
    user_id: 1,
    event_type: 'sync_retry_all_requested',
    detail: 'Manual retry queued for all failed sync items.',
  });
  // Trigger sync run
  await runSimulatedSync({ forceOnline: true, simulatedFailureRate: 0.0 });
}

export async function fetchAllSyncQueue(): Promise<SyncQueueItem[]> {
  return await getAllQueueItems();
}
