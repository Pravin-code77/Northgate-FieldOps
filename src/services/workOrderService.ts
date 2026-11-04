import { WorkOrderStatus } from '../constants/statuses';
import { WorkOrder } from '../models/WorkOrder';
import { addAuditLog, addOutboundLog } from '../repositories/logRepository';
import {
  completeWorkOrder as repoCompleteWorkOrder,
  getAllWorkOrders,
  getCompletedWorkOrderHistory,
  getWorkOrderById,
  saveInspectionNotes as repoSaveNotes,
  startWorkOrder as repoStartWorkOrder,
  WorkOrderFilters,
} from '../repositories/workOrderRepository';
import { enqueue } from '../repositories/syncRepository';
import { updateAsset } from '../repositories/assetRepository';
import { getNowIso } from '../utils/dateTime';
import {
  validateCompleteWorkOrder,
  validateInspectionNotes,
  validateStartWorkOrder,
} from '../validation/workOrderValidation';
import { logGpsEvent } from './gpsService';
import { getPhotosForWorkOrder } from './photoService';

export async function listWorkOrders(
  filters?: WorkOrderFilters
): Promise<WorkOrder[]> {
  return getAllWorkOrders(filters);
}

export async function fetchWorkOrderDetail(id: number): Promise<WorkOrder | null> {
  return await getWorkOrderById(id);
}

export async function startWorkOrder(params: {
  workOrder: WorkOrder;
  hasActiveSession: boolean;
  isWithinRadius: boolean;
  currentLocation?: { latitude: number; longitude: number; accuracy: number | null } | null;
  distanceMeters?: number;
  radiusMeters?: number;
}): Promise<WorkOrder> {
  const { workOrder, hasActiveSession, isWithinRadius, currentLocation, distanceMeters, radiusMeters } = params;

  // Validate start eligibility
  const validation = validateStartWorkOrder({
    hasActiveSession,
    currentStatus: workOrder.status,
    isWithinRadius,
    distanceMeters,
    radiusMeters,
  });

  if (!validation.allowed) {
    throw new Error(validation.errors.join(' '));
  }

  // 1. Update status to IN_PROGRESS
  await repoStartWorkOrder(workOrder.id);

  // 2. Record GPS log
  if (currentLocation) {
    await logGpsEvent(workOrder.id, 'start_verification', currentLocation);
  }

  // 3. Create outbound log and enqueue sync
  await addOutboundLog({
    operation: 'update',
    module: 'work_orders',
    entity: 'work_order',
    entity_id: workOrder.id,
    status: 'pending',
  });

  await enqueue({
    entity: 'work_order',
    entity_id: workOrder.id,
    operation: 'update',
  });

  // 4. Audit log
  await addAuditLog({
    user_id: 1,
    event_type: 'work_order_started',
    detail: `Work order ${workOrder.wo_number} started within verified GPS proximity (${Math.round(distanceMeters ?? 0)}m).`,
  });

  // Re-read from database
  const updated = await getWorkOrderById(workOrder.id);
  if (!updated) {
    throw new Error('Failed to retrieve updated work order after start.');
  }
  return updated;
}

export async function saveWorkOrderNotes(workOrderId: number, notes: string): Promise<void> {
  await repoSaveNotes(workOrderId, notes);

  await addAuditLog({
    user_id: 1,
    event_type: 'notes_updated',
    detail: `Inspection notes updated for work order #${workOrderId}.`,
  });
}

export async function completeWorkOrder(params: {
  workOrder: WorkOrder;
  notes: string;
  completionCoords: { latitude: number; longitude: number; accuracy: number | null };
}): Promise<WorkOrder> {
  const { workOrder, notes, completionCoords } = params;

  // Check photos
  const { beforePhoto, afterPhoto } = await getPhotosForWorkOrder(workOrder.id);

  const validation = validateCompleteWorkOrder({
    currentStatus: workOrder.status,
    hasBeforePhoto: beforePhoto !== null,
    hasAfterPhoto: afterPhoto !== null,
    notes,
  });

  if (!validation.allowed) {
    throw new Error(validation.errors.join(' '));
  }

  const now = getNowIso();

  // 1. Complete work order in SQLite
  await repoCompleteWorkOrder(
    workOrder.id,
    now,
    completionCoords.latitude,
    completionCoords.longitude,
    notes
  );

  // 2. Update asset's last inspection date
  await updateAsset(workOrder.asset_id, {
    last_inspection_date: now,
  });

  // 3. Record GPS log for completion
  await logGpsEvent(workOrder.id, 'completion_record', completionCoords);

  // 4. Outbound log and sync enqueue
  await addOutboundLog({
    operation: 'update',
    module: 'work_orders',
    entity: 'work_order',
    entity_id: workOrder.id,
    status: 'pending',
  });

  await enqueue({
    entity: 'work_order',
    entity_id: workOrder.id,
    operation: 'complete',
  });

  // 5. Audit log
  await addAuditLog({
    user_id: 1,
    event_type: 'work_order_completed',
    detail: `Work order ${workOrder.wo_number} completed with verified photo evidence and inspection notes.`,
  });

  const completed = await getWorkOrderById(workOrder.id);
  if (!completed) {
    throw new Error('Failed to retrieve work order following completion.');
  }
  return completed;
}

export async function fetchCompletedHistory(): Promise<WorkOrder[]> {
  return await getCompletedWorkOrderHistory();
}
