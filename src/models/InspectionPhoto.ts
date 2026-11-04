import { PhotoKindType } from '../constants/statuses';

export interface InspectionPhoto {
  id: number;
  work_order_id: number;
  kind: PhotoKindType;
  file_path: string;
  captured_at: string;
  captured_lat: number | null;
  captured_lng: number | null;
}
