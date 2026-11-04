import { getDatabase } from '../db/database';
import { DashboardMetrics } from '../models/AuditLog';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = await getDatabase();

  // 1. Work orders grouped by status
  const woStats = await db.getAllAsync<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM work_orders GROUP BY status;'
  );

  let pendingJobs = 0;
  let inProgressJobs = 0;
  let completedJobs = 0;
  let cancelledJobs = 0;

  for (const s of woStats) {
    if (s.status === 'pending') pendingJobs = s.count;
    else if (s.status === 'in_progress') inProgressJobs = s.count;
    else if (s.status === 'completed') completedJobs = s.count;
    else if (s.status === 'cancelled') cancelledJobs = s.count;
  }

  // 2. Overdue jobs: due_date < current date string (YYYY-MM-DD) and status NOT IN ('completed', 'cancelled')
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM work_orders 
     WHERE due_date < ? AND status NOT IN ('completed', 'cancelled');`,
    todayStr
  );
  const overdueJobs = overdueRow?.count ?? 0;

  // 3. Today's completed jobs: completion_date starts with todayStr
  const todayRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM work_orders 
     WHERE status = 'completed' AND completion_date LIKE ?;`,
    `${todayStr}%`
  );
  const todayCompletedJobs = todayRow?.count ?? 0;

  // 4. Total active assets
  const totalAssetsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM assets WHERE is_deleted = 0;'
  );
  const totalAssets = totalAssetsRow?.count ?? 0;

  // 5. Pending assets (assets with no completed work order or last_inspection_date is null)
  const pendingAssetsRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM assets 
     WHERE is_deleted = 0 AND (
       last_inspection_date IS NULL OR 
       id NOT IN (SELECT DISTINCT asset_id FROM work_orders WHERE status = 'completed')
     );`
  );
  const pendingAssets = pendingAssetsRow?.count ?? 0;

  // 6. Sync queue counts
  const syncStats = await db.getAllAsync<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status;'
  );

  let failedSyncs = 0;
  let pendingSyncQueue = 0;

  for (const item of syncStats) {
    if (item.status === 'failed') {
      failedSyncs = item.count;
    } else if (item.status === 'pending' || item.status === 'uploading') {
      pendingSyncQueue += item.count;
    }
  }

  // 7. Last successful sync timestamp
  const lastSyncRow = await db.getFirstAsync<{ updated_at: string }>(
    `SELECT updated_at FROM sync_queue 
     WHERE status = 'success' 
     ORDER BY updated_at DESC LIMIT 1;`
  );
  const lastSuccessfulSync = lastSyncRow?.updated_at ?? null;

  // 8. Recent activity: combine latest audit logs and outbound logs
  const auditLogs = await db.getAllAsync<{ id: number; event_type: string; detail: string; created_at: string }>(
    'SELECT id, event_type, detail, created_at FROM audit_logs ORDER BY id DESC LIMIT 5;'
  );

  const outboundLogs = await db.getAllAsync<{ id: number; operation: string; entity: string; status: string; timestamp: string }>(
    'SELECT id, operation, entity, status, timestamp FROM outbound_logs ORDER BY id DESC LIMIT 5;'
  );

  const combinedActivity: DashboardMetrics['recentActivity'] = [];

  for (const al of auditLogs) {
    combinedActivity.push({
      id: `audit-${al.id}`,
      type: 'audit',
      title: al.event_type.replace(/_/g, ' ').toUpperCase(),
      detail: al.detail,
      timestamp: al.created_at,
    });
  }

  for (const ol of outboundLogs) {
    combinedActivity.push({
      id: `outbound-${ol.id}`,
      type: 'outbound',
      title: `${ol.operation.toUpperCase()} ${ol.entity}`,
      detail: `Outbound sync record status: ${ol.status}`,
      timestamp: ol.timestamp,
      status: ol.status,
    });
  }

  // Sort activity descending by timestamp
  combinedActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    completedJobs,
    pendingJobs,
    inProgressJobs,
    overdueJobs,
    todayCompletedJobs,
    totalAssets,
    pendingAssets,
    failedSyncs,
    pendingSyncQueue,
    lastSuccessfulSync,
    recentActivity: combinedActivity.slice(0, 8),
    statusChart: {
      pending: pendingJobs,
      in_progress: inProgressJobs,
      completed: completedJobs,
      cancelled: cancelledJobs,
    },
  };
}
