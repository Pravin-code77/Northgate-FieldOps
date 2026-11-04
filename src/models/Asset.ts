import { AssetStatusType } from '../constants/statuses';

export interface AssetType {
  id: number;
  name: string;
  description: string;
}

export interface Asset {
  id: number;
  asset_ref: string;
  name: string;
  asset_type_id: number;
  status: AssetStatusType;
  latitude: number;
  longitude: number;
  installation_date: string;
  last_inspection_date: string | null;
  notes: string | null;
  is_deleted: number; // 0 or 1
  updated_at: string;
  // Joined field for convenience
  asset_type_name?: string;
}
