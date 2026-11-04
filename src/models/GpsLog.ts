export interface GpsLog {
  id: number;
  work_order_id: number;
  event_type: 'start_verification' | 'completion_record' | 'manual_verification';
  latitude: number;
  longitude: number;
  accuracy: number | null;
  captured_at: string;
}
