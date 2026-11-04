export interface OutboundLog {
  id: number;
  timestamp: string;
  operation: 'create' | 'update' | 'delete';
  module: 'assets' | 'work_orders' | 'photos' | 'sync';
  entity: string;
  entity_id: number;
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
}
