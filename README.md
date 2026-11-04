# FieldOps Mobile — Offline-First Field Service Management Application

**FieldOps Mobile** is a mission-critical, offline-first mobile application built with **React Native**, **Expo SDK 58**, **TypeScript**, and **SQLite (`expo-sqlite`)** for **Northgate Industrial Services (Asset Reliability & Field Operations Division)**.

It empowers industrial field reliability engineers to perform inspections and maintenance on critical equipment (centrifugal pumps, power transformers, control valves, HVAC air handlers, backup diesel generators, and compressors) in remote facilities, basements, and plant rooms without requiring any active internet connection.

---

## 🚀 Key Features

### 1. Work Order Management (Primary Assigned Feature 1)
- **Offline SQLite Source of Truth**: Instant access to assigned industrial work orders stored locally.
- **Search & Filtering**: Search by work order number or asset name. Filter by status (`pending`, `in_progress`, `completed`, `cancelled`) and priority (`critical`, `high`, `medium`, `low`). Sort by due date, priority, or status.
- **Status Progression**: Enforces strict state progression: `Pending` → `In Progress` → `Completed`. `Cancelled` is terminal.
- **GPS Start Gate**: Work order cannot be started unless the engineer is authenticated and physically within the configured radius of the target asset.
- **Inspection Notes Persistence**: Technical notes can be recorded and edited before completion; saved transactionally in SQLite; minimum 10 characters required for completion.
- **Work History**: Instant offline review of completed jobs with timestamps and completion coordinates.

### 2. Before-and-After Photo Capture (Primary Assigned Feature 2)
- **Private App Storage**: Photographs captured via `expo-camera` are persisted to private app file storage (`FileSystem.documentDirectory/fieldops/photos/WO-XXXX-XXX/`). Never depends on public photo galleries.
- **Hardware Integration**: Dedicated camera capture interface with live viewfinder, capture, preview, retake, and confirm controls.
- **Metadata Association**: Stores local file path, kind (`before` or `after`), capture timestamp, and GPS coordinates in the SQLite `inspection_photos` table.
- **File Verification**: Verifies the physical image file exists in storage before creating database records. Safe rollback if storage write fails.
- **Visual Evidence Review**: Interactive thumbnails in work-order details with modal full-screen preview.
- **Completion Validation Gate**: Completion is strictly blocked until both valid BEFORE and AFTER photographs are captured.

### 3. Local Biometric Authentication & Session Security
- **Native OS Biometrics**: Uses `expo-local-authentication` for fingerprint or Face ID authentication with device-passcode fallback.
- **Zero Cloud Credential Storage**: No biometric templates or PINs leave the device or are stored in code.
- **Session Management**: Session records created in SQLite `sessions` table.
- **Configurable Idle Timeout**: Default 15 minutes (configurable from 5 to 60 minutes).
- **Background Protection**: React Native `AppState` listener locks the application if idle timeout elapses while in the background.
- **First-Time Enrollment**: First-launch onboarding checks hardware capability and configures local biometric access in `expo-secure-store`.

### 4. Inline GPS Proximity Verification
- **Haversine Distance**: Computes exact geodesic distance between current GPS fix and asset coordinates.
- **Configurable Radius**: 100 meters default threshold (configurable from 25m to 1000m in Settings).
- **Interactive Proximity Feedback**: Displays distance, allowed threshold, accuracy, and coordinates with verified vs outside-range alerts.
- **Testing & Demo Benchmark Location**: Built-in benchmark reference coordinates (`37.7749, -122.4194`) documented for emulator location testing.

### 5. Industrial Asset Registry
- Full CRUD: Asset name, reference code, equipment type, status (`operational`, `fault`, `retired`), installation date, coordinates, and notes.
- Soft Delete: Soft-deleted assets are hidden from active lists while preserving historical outbound audit trails.
- Linked Work Orders: View active work orders associated with any equipment.

### 6. Simulated Synchronization Engine
- **Queue State Machine**: `Pending` → `Uploading` → `Success` / `Failed`.
- **Offline Queuing**: Every data mutation (work order update, asset change, photo record) generates an outbound log and sync queue item in the same transaction.
- **Network Awareness**: Uses `expo-network` to detect connectivity; processes oldest items first when connected.
- **Backoff & Retry Limit**: Configurable max retry ceiling (1–10, default 5) with exponential backoff delay.
- **Manual Sync & Retry**: Immediate manual sync trigger and retry controls for failed items.

### 7. MaintainX-Inspired UI/UX Design System
- **Color Palette**:
  - Primary Blue: `#246CFF`
  - Dark Blue: `#1749B8`
  - Light Blue: `#EAF1FF`
  - App Background: `#F7F8FA`
  - Card White: `#FFFFFF`
  - Primary Text: `#20242C`
  - Border Grey: `#E5E7EB`
  - Success Green: `#16A36A`
  - Warning Orange: `#F5A623`
  - Danger Red: `#E5484D`
- **Field-Ready UI**: Large touch targets, readable typography, high-contrast badges, and clean rounded card layouts.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Framework | React Native (Expo SDK 58) |
| Language | TypeScript 5.8+ |
| Database | SQLite (`expo-sqlite`) |
| Authentication | `expo-local-authentication`, `expo-secure-store` |
| Camera | `expo-camera` |
| File Storage | `expo-file-system` |
| GPS & Proximity | `expo-location` |
| Connectivity | `expo-network` |
| Navigation | React Navigation v7 (Native Stack & Bottom Tabs) |
| Icons | `lucide-react-native`, `react-native-svg` |
| Testing | Jest, `ts-jest` |

---

## 📂 Project Structure

```
fieldops-mobile/
  App.tsx                             # Root entrypoint with AppProviders
  app.json                            # Native Expo permissions & plugins
  jest.config.js                      # Jest automated test runner configuration
  package.json                        # SDK 58 dependencies
  tsconfig.json                       # Strict TypeScript configuration
  src/
    app/
      navigation/AppNavigator.tsx     # Bottom Tabs & Stack navigation
      providers/AppProviders.tsx      # Context providers and Error Boundary
      error-boundary/ErrorBoundary.tsx# Global uncaught exception protection
    components/
      cards/                          # MetricCard, WorkOrderCard, AssetCard, GPSStatusCard, SyncStatusBanner
      common/                         # PrimaryButton, SecondaryButton, LoadingIndicator, EmptyState, SectionHeader
      forms/                          # FormInput (with character counter)
      photos/                         # PhotoTile, PhotoCaptureCard
      status/                         # StatusChip, PriorityBadge
      charts/                         # WorkOrderStatusChart
    constants/
      colors.ts                       # MaintainX color tokens
      config.ts                       # Threshold boundaries & benchmark locations
      statuses.ts                     # Work order and asset status constants
    context/
      SessionContext.tsx              # Local session, biometric auth & AppState lock
      SettingsContext.tsx             # Configuration storage in SQLite
      ConnectivityContext.tsx         # Network connectivity monitor
    db/
      database.ts                     # SQLite singleton with WAL & foreign keys
      schema.ts                       # 12-table DDL schema & performance indexes
      migrations/index.ts             # Schema version migration runner
      seed/seedData.ts                # Idempotent seed data (15+ work orders, 10+ assets)
    hooks/
      useWorkOrders.ts, useAssets.ts, useSyncQueue.ts, useGps.ts, useDashboard.ts
    models/
      User.ts, Session.ts, Asset.ts, WorkOrder.ts, InspectionPhoto.ts, GpsLog.ts, SyncQueue.ts
    repositories/
      userRepository.ts, sessionRepository.ts, assetRepository.ts, workOrderRepository.ts,
      photoRepository.ts, gpsRepository.ts, syncRepository.ts, logRepository.ts,
      settingsRepository.ts, dashboardRepository.ts
    screens/
      Splash/SplashScreen.tsx
      Authentication/AuthenticationScreen.tsx, EnrollmentModal.tsx
      Dashboard/DashboardScreen.tsx
      WorkOrders/WorkOrdersListScreen.tsx
      WorkOrderDetail/WorkOrderDetailScreen.tsx
      CameraCapture/CameraCaptureScreen.tsx
      GPSVerification/GPSVerificationModal.tsx
      Assets/AssetsListScreen.tsx
      AssetDetail/AssetDetailScreen.tsx, AssetEditModal.tsx
      Sync/SyncScreen.tsx
      Settings/SettingsScreen.tsx
    services/
      authService.ts, sessionService.ts, workOrderService.ts, assetService.ts,
      photoService.ts, gpsService.ts, syncService.ts, dashboardService.ts
    utils/
      haversine.ts, dateTime.ts, formatters.ts
    validation/
      assetValidation.ts, workOrderValidation.ts, settingsValidation.ts
  tests/                              # 40 automated unit & validation tests
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js (v20+ or v22+)
- npm or bun

### Installation
```bash
# Install dependencies
npm install

# Run database & validation unit tests
npm test

# Run TypeScript compilation check
npx tsc --noEmit

# Run Expo health check
npx expo-doctor
```

### Running the Application
```bash
# Start the Expo development server
npx expo start

# Run on Android emulator or connected device
npx expo start --android

# Run on iOS simulator (macOS required)
npx expo start --ios
```

---

## 🧪 Testing Benchmark Coordinates
For testing GPS proximity verification in an emulator or offline facility:
- **Reference Benchmark Location**: Northgate Central Facility Substation
  - **Latitude**: `37.7749`
  - **Longitude**: `-122.4194`
- In the GPS Verification modal, tap **"Use Benchmark"** or set your emulator location to `37.7749, -122.4194` to verify equipment proximity within the 100-meter radius.
