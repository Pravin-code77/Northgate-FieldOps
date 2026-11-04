import { getDatabase } from '../db/database';
import { SyncStatus } from '../constants/statuses';
import { SyncQueueItem } from '../models/SyncQueue';
import { getNowIso } from '../utils/dateTime';

export async function enqueue(item: {
  entity: string;
  entity_id: number;
  operation: string;
}): Promise<number> {
  const db = await getDatabase();
  const now = getNowIso();
  const result = await db.runAsync(
    `INSERT INTO sync_queue (entity, entity_id, operation, status, retry_count, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, NULL, ?, ?);`,
    item.entity,
    item.entity_id,
    item.operation,
    SyncStatus.PENDING,
    now,
    now
  );
  return result.lastInsertRowId;
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<SyncQueueItem>(
    'SELECT * FROM sync_queue ORDER BY id DESC;'
  );
}

export async function getEligibleItems(limit = 10): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue 
     WHERE status = ? 
     ORDER BY created_at ASC 
     LIMIT ?;`,
    SyncStatus.PENDING,
    limit
  );
}

export async function updateStatus(
  id: number,
  status: string,
  error: string | null = null
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();
  await db.runAsync(
    'UPDATE sync_queue SET status = ?, last_error = ?, updated_at = ? WHERE id = ?;',
    status,
    error,
    now,
    id
  );
}

export async function incrementRetry(
  id: number,
  error: string,
  isPermanentFailure = false
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();
  const newStatus = isPermanentFailure ? SyncStatus.FAILED : SyncStatus.PENDING;
  await db.runAsync(
    `UPDATE sync_queue 
     SET retry_count = retry_count + 1,
         last_error = ?,
         status = ?,
         updated_at = ?
     WHERE id = ?;`,
    error,
    newStatus,
    now,
    id
  );
}

export async function resetFailedItem(id: number): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();
  await db.runAsync(
    `UPDATE sync_queue 
     SET status = ?,
         retry_count = 0,
         last_error = NULL,
         updated_at = ?
     WHERE id = ?;`,
    SyncStatus.PENDING,
    now,
    id
  );
}

export async function resetAllFailed(): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();
  await db.runAsync(
    `UPDATE sync_queue 
     SET status = ?,
         retry_count = 0,
         last_error = NULL,
         updated_at = ?
     WHERE status = ?;`,
    SyncStatus.PENDING,
    now,
    SyncStatus.FAILED
  );
}
