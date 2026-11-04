
import { getDatabase } from '../db/database';
import { WorkOrderStatus } from '../constants/statuses';
import { WorkOrder } from '../models/WorkOrder';
import { getNowIso } from '../utils/dateTime';

export type WorkOrderSortBy = 'due_date' | 'priority' | 'status';

export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: WorkOrderSortBy;
}

export async function getAllWorkOrders(
  filters?: WorkOrderFilters
): Promise<WorkOrder[]> {
  const db = await getDatabase();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // STATUS FILTER
  if (filters?.status && filters.status !== 'all') {
    conditions.push('LOWER(wo.status) = LOWER(?)');
    params.push(filters.status);
  }

  // PRIORITY FILTER
  if (filters?.priority && filters.priority !== 'all') {
    conditions.push('LOWER(wo.priority) = LOWER(?)');
    params.push(filters.priority);
  }

  // SEARCH FILTER
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;

    conditions.push(`
      (
        wo.wo_number LIKE ?
        OR a.name LIKE ?
        OR wo.description LIKE ?
      )
    `);

    params.push(term, term, term);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  // SORTING LOGIC
  let orderClause = `
    ORDER BY
      CASE
        WHEN wo.due_date IS NULL OR wo.due_date = '' THEN 1
        ELSE 0
      END ASC,
      wo.due_date ASC
  `;

  if (filters?.sortBy === 'priority') {
    orderClause = `
      ORDER BY
        CASE LOWER(wo.priority)
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END ASC,
        wo.due_date ASC
    `;
  }

  else if (filters?.sortBy === 'status') {
    orderClause = `
      ORDER BY
        CASE LOWER(wo.status)
          WHEN 'in_progress' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
          ELSE 5
        END ASC,
        wo.due_date ASC
    `;
  }

  const query = `
    SELECT
      wo.*,
      a.name AS asset_name,
      a.asset_ref AS asset_ref,
      a.latitude AS asset_lat,
      a.longitude AS asset_lng,
      at.name AS asset_type_name,
      u.full_name AS engineer_name

    FROM work_orders wo

    LEFT JOIN assets a
      ON wo.asset_id = a.id

    LEFT JOIN asset_types at
      ON a.asset_type_id = at.id

    LEFT JOIN users u
      ON wo.assigned_engineer_id = u.id

    ${whereClause}

    ${orderClause};
  `;

  return await db.getAllAsync<WorkOrder>(query, ...params);
}


// GET WORK ORDER BY ID
export async function getWorkOrderById(
  id: number
): Promise<WorkOrder | null> {
  const db = await getDatabase();

  const query = `
    SELECT
      wo.*,
      a.name AS asset_name,
      a.asset_ref AS asset_ref,
      a.latitude AS asset_lat,
      a.longitude AS asset_lng,
      at.name AS asset_type_name,
      u.full_name AS engineer_name

    FROM work_orders wo

    LEFT JOIN assets a
      ON wo.asset_id = a.id

    LEFT JOIN asset_types at
      ON a.asset_type_id = at.id

    LEFT JOIN users u
      ON wo.assigned_engineer_id = u.id

    WHERE wo.id = ?;
  `;

  const result = await db.getFirstAsync<WorkOrder>(query, id);

  return result ?? null;
}


// START WORK ORDER
export async function startWorkOrder(
  id: number
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();

  await db.runAsync(
    `UPDATE work_orders
     SET status = ?, updated_at = ?
     WHERE id = ?;`,
    WorkOrderStatus.IN_PROGRESS,
    now,
    id
  );
}


// SAVE INSPECTION NOTES
export async function saveInspectionNotes(
  id: number,
  notes: string
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();

  await db.runAsync(
    `UPDATE work_orders
     SET inspection_notes = ?, updated_at = ?
     WHERE id = ?;`,
    notes,
    now,
    id
  );
}


// COMPLETE WORK ORDER
export async function completeWorkOrder(
  id: number,
  completionDate: string,
  lat: number,
  lng: number,
  notes: string
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();

  await db.runAsync(
    `UPDATE work_orders
     SET status = ?,
         completion_date = ?,
         completion_lat = ?,
         completion_lng = ?,
         inspection_notes = ?,
         updated_at = ?
     WHERE id = ?;`,

    WorkOrderStatus.COMPLETED,
    completionDate,
    lat,
    lng,
    notes,
    now,
    id
  );
}


// COMPLETED WORK ORDER HISTORY
export async function getCompletedWorkOrderHistory(): Promise<WorkOrder[]> {
  const db = await getDatabase();

  const query = `
    SELECT
      wo.*,
      a.name AS asset_name,
      a.asset_ref AS asset_ref,
      at.name AS asset_type_name,
      u.full_name AS engineer_name

    FROM work_orders wo

    LEFT JOIN assets a
      ON wo.asset_id = a.id

    LEFT JOIN asset_types at
      ON a.asset_type_id = at.id

    LEFT JOIN users u
      ON wo.assigned_engineer_id = u.id

    WHERE LOWER(wo.status) = 'completed'

    ORDER BY wo.completion_date DESC;
  `;

  return await db.getAllAsync<WorkOrder>(query);
}
