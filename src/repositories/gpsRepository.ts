import { getDatabase } from '../db/database';
import { GpsLog } from '../models/GpsLog';

export async function addGpsLog(log: Omit<GpsLog, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO gps_logs (work_order_id, event_type, latitude, longitude, accuracy, captured_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    log.work_order_id,
    log.event_type,
    log.latitude,
    log.longitude,
    log.accuracy,
    log.captured_at
  );
  return result.lastInsertRowId;
}

export async function getGpsLogsByWorkOrderId(workOrderId: number): Promise<GpsLog[]> {
  const db = await getDatabase();
  return await db.getAllAsync<GpsLog>(
    'SELECT * FROM gps_logs WHERE work_order_id = ? ORDER BY captured_at DESC;',
    workOrderId
  );
}
