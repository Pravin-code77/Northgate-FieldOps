import { getDatabase } from '../db/database';
import { AuditLog } from '../models/AuditLog';
import { OutboundLog } from '../models/OutboundLog';
import { getNowIso } from '../utils/dateTime';

export async function addOutboundLog(log: {
  operation: 'create' | 'update' | 'delete';
  module: 'assets' | 'work_orders' | 'photos' | 'sync';
  entity: string;
  entity_id: number;
  status: 'pending' | 'synced' | 'failed';
}): Promise<number> {
  const db = await getDatabase();
  const now = getNowIso();
  const result = await db.runAsync(
    `INSERT INTO outbound_logs (timestamp, operation, module, entity, entity_id, status, retry_count)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    now,
    log.operation,
    log.module,
    log.entity,
    log.entity_id,
    log.status
  );
  return result.lastInsertRowId;
}

export async function getRecentOutboundLogs(limit = 20): Promise<OutboundLog[]> {
  const db = await getDatabase();
  return await db.getAllAsync<OutboundLog>(
    'SELECT * FROM outbound_logs ORDER BY id DESC LIMIT ?;',
    limit
  );
}

export async function updateOutboundStatus(id: number, status: 'pending' | 'synced' | 'failed'): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE outbound_logs SET status = ? WHERE id = ?;', status, id);
}

export async function addAuditLog(log: {
  user_id?: number | null;
  event_type: string;
  detail: string;
}): Promise<number> {
  const db = await getDatabase();
  const now = getNowIso();
  const result = await db.runAsync(
    `INSERT INTO audit_logs (user_id, event_type, detail, created_at)
     VALUES (?, ?, ?, ?);`,
    log.user_id ?? 1,
    log.event_type,
    log.detail,
    now
  );
  return result.lastInsertRowId;
}

export async function getRecentAuditLogs(limit = 20): Promise<AuditLog[]> {
  const db = await getDatabase();
  return await db.getAllAsync<AuditLog>(
    'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?;',
    limit
  );
}
