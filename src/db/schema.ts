export const SCHEMA_SQL = `
-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  biometric_enrolled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Table 2: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table 3: asset_types
CREATE TABLE IF NOT EXISTS asset_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL
);

-- Table 4: assets
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_ref TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_type_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  installation_date TEXT NOT NULL,
  last_inspection_date TEXT,
  notes TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
);

-- Table 5: work_orders
CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wo_number TEXT UNIQUE NOT NULL,
  asset_id INTEGER NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_engineer_id INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  description TEXT NOT NULL,
  completion_date TEXT,
  completion_lat REAL,
  completion_lng REAL,
  inspection_notes TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (assigned_engineer_id) REFERENCES users(id)
);

-- Table 6: inspection_photos
CREATE TABLE IF NOT EXISTS inspection_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  file_path TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  captured_lat REAL,
  captured_lng REAL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- Table 7: gps_logs
CREATE TABLE IF NOT EXISTS gps_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  captured_at TEXT NOT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
);

-- Table 8: outbound_logs
CREATE TABLE IF NOT EXISTS outbound_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  operation TEXT NOT NULL,
  module TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0
);

-- Table 9: sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Table 10: dashboard_cache
CREATE TABLE IF NOT EXISTS dashboard_cache (
  metric_key TEXT PRIMARY KEY,
  metric_value TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

-- Table 11: settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Table 12: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_engineer ON work_orders(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_deleted ON assets(is_deleted);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_wo ON inspection_photos(work_order_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
`;
