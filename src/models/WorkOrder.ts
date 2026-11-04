import { PriorityLevelType, WorkOrderStatusType } from '../constants/statuses';

export interface WorkOrder {
  id: number;
  wo_number: string;
  asset_id: number;
  priority: PriorityLevelType;
  status: WorkOrderStatusType;
  assigned_engineer_id: number;
  due_date: string;
  description: string;
  completion_date: string | null;
  completion_lat: number | null;
  completion_lng: number | null;
  inspection_notes: string | null;
  updated_at: string;

  // Joined fields from assets and users
  asset_name?: string;
  asset_ref?: string;
  asset_type_name?: string;
  asset_lat?: number;
  asset_lng?: number;
  engineer_name?: string;
}
