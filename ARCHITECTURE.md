# FieldOps Mobile — System Architecture Document

## 1. Architectural Philosophy: 100% On-Device Offline-First

FieldOps Mobile is engineered for industrial environments where cellular reception and Wi-Fi connectivity are completely unavailable (e.g. underground pump rooms, electrical substations, reinforced concrete basements, and remote processing facilities).

### Core Offline Tenets:
1. **SQLite Single Source of Truth**: All operational entities (work orders, assets, inspection notes, photo records, GPS logs, settings, outbound logs, audit trails) are read and written strictly on-device in SQLite (`fieldops.db`).
2. **Zero Remote Database Dependencies**: No cloud database (MongoDB, PostgreSQL, Prisma, Firebase, Supabase) is present or required.
3. **No Network Gate on Operations**: Engineers can launch the app, authenticate, view assigned tasks, verify GPS proximity, capture before/after photos, save notes, complete work orders, and manage equipment completely offline.
4. **Asynchronous Outbound Queuing**: Data-modifying transactions commit locally first, then append an outbound log and enqueue an item in `sync_queue`. The local synchronization engine processes this queue only when connectivity is present.

---

## 2. Layered Software Architecture

FieldOps Mobile implements a strict 6-layer architecture to guarantee separation of concerns, testability, and maintainability:

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   (Screens, Navigation, UI Components, Modals)         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Custom Hooks Layer                  │
│   (useWorkOrders, useAssets, useSyncQueue, useGps)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      Service Layer                     │
│   (workOrderService, photoService, authService, etc.)   │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼─────────────┐ ┌────────────▼─────────────┐
│      Validation Layer     │ │     Repository Layer     │
│  (workOrderValidation,    │ │ (workOrderRepository,    │
│   assetValidation, etc.)  │ │  photoRepository, etc.)  │
└───────────────────────────┘ └────────────┬─────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────┐
│                     Database Layer                     │
│  (expo-sqlite, Schema Migrations, Idempotent Seeds)    │
└────────────────────────────────────────────────────────┘
```

### Architectural Rule
**No SQL queries or raw database calls are ever executed in screens or components.** All database access is channeled through the Repository Layer, and all business rules are enforced in the Service and Validation layers.

---

## 3. SQLite Database Schema (12 Tables)

The application initializes SQLite with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;` for high-throughput write performance.

### Tables Overview:
1. **`users`**: Enrolled engineer identity (`employee_code`, `full_name`, `role`, `biometric_enrolled`, `created_at`).
2. **`sessions`**: Active authentication sessions (`user_id`, `started_at`, `last_active_at`, `expires_at`, `status`).
3. **`asset_types`**: Industrial equipment classifications (Pumps, Transformers, Valves, HVAC, Generators, Compressors).
4. **`assets`**: Equipment registry (`asset_ref`, `name`, `asset_type_id`, `status`, `latitude`, `longitude`, `installation_date`, `last_inspection_date`, `notes`, `is_deleted`).
5. **`work_orders`**: Maintenance tasks (`wo_number`, `asset_id`, `priority`, `status`, `assigned_engineer_id`, `due_date`, `description`, `completion_date`, `completion_lat`, `completion_lng`, `inspection_notes`).
6. **`inspection_photos`**: Before & after photo records (`work_order_id`, `kind`, `file_path`, `captured_at`, `captured_lat`, `captured_lng`).
7. **`gps_logs`**: Geolocation telemetry records (`work_order_id`, `event_type`, `latitude`, `longitude`, `accuracy`, `captured_at`).
8. **`outbound_logs`**: Mutation transaction audit entries (`timestamp`, `operation`, `module`, `entity`, `entity_id`, `status`, `retry_count`).
9. **`sync_queue`**: Simulated server upload queue (`entity`, `entity_id`, `operation`, `status`, `retry_count`, `last_error`, `created_at`, `updated_at`).
10. **`dashboard_cache`**: Pre-aggregated metrics cache for sub-second dashboard rendering (`metric_key`, `metric_value`, `computed_at`).
11. **`settings`**: Key-value operational configuration (`gps_radius_meters`, `session_timeout_minutes`, `max_retries`, `sync_failure_rate`).
12. **`audit_logs`**: Security & operational event history (`user_id`, `event_type`, `detail`, `created_at`).

---

## 4. Feature 1 Architecture: Work Order Lifecycle Management

```
Pending ──► (Verify GPS Proximity) ──► In Progress ──► (Capture Evidence & Notes) ──► Completed
   │
   └────────► Cancelled (Terminal)
```

### Business Rules & Invariants:
1. **Start Eligibility**:
   - Engineer must possess an active, non-expired local session.
   - GPS fix must be acquired and evaluated against asset coordinates using the Haversine equation.
   - Distance must not exceed `gps_radius_meters` (default 100m).
2. **Inspection Notes**:
   - Notes can be edited and saved incrementally during maintenance.
   - Saved locally via parameterized SQLite transactions.
   - Strictly requires a minimum of 10 characters before completion can be unlocked.
3. **Completion Invariants**:
   - Valid BEFORE photo must exist and be verified on disk.
   - Valid AFTER photo must exist and be verified on disk.
   - Minimum 10 characters of technical inspection notes must be saved.
   - Completion timestamp and current GPS fix are recorded on completion.

---

## 5. Feature 2 Architecture: Before-and-After Photo Capture

### Private Storage Layout:
Photographs are stored inside the sandboxed application directory using `expo-file-system/legacy`:
```
${FileSystem.documentDirectory}/fieldops/photos/WO-2026-001/before_1730548900000.jpg
${FileSystem.documentDirectory}/fieldops/photos/WO-2026-001/after_1730549200000.jpg
```

### Safety & Integrity Protocol:
1. Camera captures photo to a temporary cache URI.
2. App creates target work order directory if absent.
3. Photo is copied to private document storage.
4. **Integrity Check**: App checks `FileSystem.getInfoAsync(destPath)` to verify the file physically exists on the disk before issuing any `INSERT INTO inspection_photos` statement.
5. SQLite stores only metadata and local URI (never binary BLOBs) to preserve SQLite performance.

---

## 6. Authentication & App Lifecycle Security

```
App Start ──► SQLite Init ──► Enrollment Check ──► OS Biometric Prompt (Fingerprint/Face/Passcode)
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    ▼                                         ▼
                             [Success: Create                          [Failure / Cancel:
                             Session in SQLite]                         Display Error & Retry]
```

- **App Backgrounding**: When `AppState` transitions to `background`, the active session's `last_active_at` timestamp is committed.
- **App Foregrounding**: When `AppState` returns to `active`, the elapsed duration is compared against `session_timeout_minutes` (5–60 min). If expired, the session is marked `expired` in SQLite and the user is redirected to the authentication screen.

---

## 7. Android Build & Deployment

FieldOps Mobile is fully configured for Expo Continuous Native Generation (CNG) with native permissions for Android:

### Android Permissions Configured (`app.json`):
- `CAMERA` (for before/after inspection photos)
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION` (for GPS proximity)
- `USE_BIOMETRIC` & `USE_FINGERPRINT` (for engineer authentication)

### Generating Development Build / APK:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo EAS
eas login

# 3. Configure EAS project
eas build:configure

# 4. Generate local Android APK for testing
eas build --platform android --profile preview --local

# Or build in Expo Cloud
eas build --platform android --profile preview
```
