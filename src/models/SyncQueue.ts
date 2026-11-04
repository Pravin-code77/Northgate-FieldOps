import { SyncStatusType } from '../constants/statuses';

export interface SyncQueueItem {
  id: number;
  entity: string;
  entity_id: number;
  operation: string;
  status: SyncStatusType;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
