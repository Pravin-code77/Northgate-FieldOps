import { SQLiteDatabase } from 'expo-sqlite';
import AppConfig from '../../constants/config';
import { AssetStatus, PriorityLevel, WorkOrderStatus } from '../../constants/statuses';
import { getNowIso } from '../../utils/dateTime';

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<void> {
  // Check if users already seeded
  const userCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users;'
  );

  if (userCount && userCount.count > 0) {
    // Database already seeded
    return;
  }

  const now = getNowIso();

  await db.withExclusiveTransactionAsync(async (txn) => {
    // 1. Seed Demo Engineer
    await txn.runAsync(
      `INSERT INTO users (employee_code, full_name, role, biometric_enrolled, created_at)
       VALUES (?, ?, ?, ?, ?);`,
      AppConfig.demoEngineer.employeeCode,
      AppConfig.demoEngineer.fullName,
      AppConfig.demoEngineer.role,
      0, // Initially 0 until enrollment completed
      now
    );

    // 2. Seed Default Settings
    await txn.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES 
       ('gps_radius_meters', ?),
       ('session_timeout_minutes', ?),
       ('max_retries', ?),
       ('sync_failure_rate', '0.1');`,
      AppConfig.defaultGpsRadiusMeters.toString(),
      AppConfig.defaultSessionTimeoutMinutes.toString(),
      AppConfig.defaultMaxRetries.toString()
    );

    // 3. Seed Asset Types
    const assetTypes = [
      { name: 'Centrifugal Pump', description: 'Heavy-duty industrial slurry and cooling circulation pumps' },
      { name: 'Power Transformer', description: 'High-voltage step-down electrical transformer units' },
      { name: 'Control Valve', description: 'Pneumatic and electro-hydraulic flow control valves' },
      { name: 'HVAC Air Handler', description: 'Industrial ventilation and climate control handling units' },
      { name: 'Diesel Generator', description: 'Emergency backup standby power generator systems' },
      { name: 'Rotary Compressor', description: 'Twin-screw air compressors for pneumatic tool supply' },
    ];

    for (const at of assetTypes) {
      await txn.runAsync(
        'INSERT INTO asset_types (name, description) VALUES (?, ?);',
        at.name,
        at.description
      );
    }

    // Benchmark location: 37.7749, -122.4194
    // 4. Seed at least 10 Assets
    // Some assets are within 50m of benchmark (for immediate testing), some further away.
    const assets = [
      {
        ref: 'AST-PUMP-01',
        name: 'Primary Slurry Cooling Pump A',
        typeId: 1,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77492,
        lng: -122.41938, // ~5m from benchmark (INSIDE default 100m radius)
        installDate: '2023-01-15',
        lastInspect: '2026-10-10',
        notes: 'Impeller re-balanced in Q3. Operating at nominal vibration levels.',
      },
      {
        ref: 'AST-TRSF-02',
        name: 'Main Substation Step-Down Transformer T-1',
        typeId: 2,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77488,
        lng: -122.41945, // ~6m from benchmark (INSIDE default 100m radius)
        installDate: '2021-06-20',
        lastInspect: '2026-09-18',
        notes: 'Oil dielectric strength tested at 45kV. Silica gel breather clear.',
      },
      {
        ref: 'AST-VALV-03',
        name: 'High-Pressure Steam Isolation Valve V-104',
        typeId: 3,
        status: AssetStatus.FAULT,
        lat: 37.77495,
        lng: -122.41932, // ~10m from benchmark (INSIDE default 100m radius)
        installDate: '2022-11-05',
        lastInspect: '2026-10-28',
        notes: 'Minor packing gland weep detected during routine visual sweep.',
      },
      {
        ref: 'AST-HVAC-04',
        name: 'Control Room Air Handling Unit AHU-3',
        typeId: 4,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77482,
        lng: -122.41952, // ~15m from benchmark (INSIDE default 100m radius)
        installDate: '2024-03-12',
        lastInspect: '2026-10-01',
        notes: 'HEPA filters replaced in previous maintenance cycle.',
      },
      {
        ref: 'AST-GEN-05',
        name: 'Auxiliary Standby Diesel Generator DG-2',
        typeId: 5,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77505,
        lng: -122.41925, // ~22m from benchmark (INSIDE default 100m radius)
        installDate: '2020-08-30',
        lastInspect: '2026-10-15',
        notes: 'Full load test completed. 400kW output verified for 60 minutes.',
      },
      {
        ref: 'AST-COMP-06',
        name: 'Instrument Air Rotary Screw Compressor C-1',
        typeId: 6,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77475,
        lng: -122.4196, // ~25m from benchmark (INSIDE default 100m radius)
        installDate: '2023-09-10',
        lastInspect: '2026-10-20',
        notes: 'Line pressure stable at 7.5 bar. Oil separator differential normal.',
      },
      {
        ref: 'AST-PUMP-07',
        name: 'Secondary Wastewater Effluent Pump B',
        typeId: 1,
        status: AssetStatus.OPERATIONAL,
        lat: 37.7775,
        lng: -122.416, // ~400m away (OUTSIDE 100m radius, tests distance error)
        installDate: '2022-04-18',
        lastInspect: '2026-08-14',
        notes: 'Located in remote effluent treatment containment basin.',
      },
      {
        ref: 'AST-TRSF-08',
        name: 'North Yard Auxiliary Transformer T-3',
        typeId: 2,
        status: AssetStatus.OPERATIONAL,
        lat: 37.781,
        lng: -122.412, // ~900m away (OUTSIDE 100m radius)
        installDate: '2019-12-01',
        lastInspect: '2026-07-22',
        notes: 'Insulator bushings cleaned and thermographic scan recorded.',
      },
      {
        ref: 'AST-VALV-09',
        name: 'Feedwater Emergency Shutoff Valve V-209',
        typeId: 3,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77491,
        lng: -122.41939, // ~4m from benchmark (INSIDE default 100m radius)
        installDate: '2023-05-19',
        lastInspect: '2026-09-30',
        notes: 'Quarter-turn pneumatic actuator calibrated and lubricated.',
      },
      {
        ref: 'AST-HVAC-10',
        name: 'Switchgear Room Climate Exchanger AHU-1',
        typeId: 4,
        status: AssetStatus.FAULT,
        lat: 37.77498,
        lng: -122.41935, // ~11m from benchmark (INSIDE default 100m radius)
        installDate: '2022-02-14',
        lastInspect: '2026-10-25',
        notes: 'Blower belt tension low; intermittent high-temp warning flagged.',
      },
      {
        ref: 'AST-COMP-11',
        name: 'Backup Plant Nitrogen Booster Compressor C-4',
        typeId: 6,
        status: AssetStatus.OPERATIONAL,
        lat: 37.77485,
        lng: -122.41948, // ~9m from benchmark (INSIDE default 100m radius)
        installDate: '2024-07-01',
        lastInspect: '2026-10-12',
        notes: 'New installation in testing phase. Standard OEM warranty active.',
      },
    ];

    for (const a of assets) {
      await txn.runAsync(
        `INSERT INTO assets (asset_ref, name, asset_type_id, status, latitude, longitude, installation_date, last_inspection_date, notes, is_deleted, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?);`,
        a.ref,
        a.name,
        a.typeId,
        a.status,
        a.lat,
        a.lng,
        a.installDate,
        a.lastInspect,
        a.notes,
        now
      );
    }

    // 5. Seed at least 15 Work Orders
    // Status progression: Pending, In Progress, Completed, Overdue
    const workOrders = [
      {
        woNumber: 'WO-2026-001',
        assetId: 1,
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-15',
        description: 'Perform comprehensive vibration analysis, lubrication check, and seal flush verification on Primary Slurry Pump A.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-002',
        assetId: 2,
        priority: PriorityLevel.CRITICAL,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-05',
        description: 'Annual transformer condition assessment: DGA oil sample collection and thermographic bushing inspection.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-003',
        assetId: 3,
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.IN_PROGRESS,
        dueDate: '2026-11-08',
        description: 'Disassemble packing gland, replace PTFE chevron packing rings, and re-torque gland follower on Steam Valve V-104.',
        notes: 'Gland cover removed. Slight shaft scoring observed on upstream side; cleaning with emery cloth before packing renewal.',
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-004',
        assetId: 4,
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-18',
        description: 'Bi-monthly HVAC maintenance: Clean intake pre-filters, inspect condenser coil fins, and check belt tension.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-005',
        assetId: 5,
        priority: PriorityLevel.CRITICAL,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-10',
        description: 'Monthly emergency diesel generator test: check starter battery specific gravity, coolant glycol level, and fuel day-tank.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-006',
        assetId: 6,
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.IN_PROGRESS,
        dueDate: '2026-11-12',
        description: 'Oil and oil filter change for Rotary Screw Compressor C-1. Inspect minimum pressure valve and oil return scavenge line.',
        notes: 'Drained 15L of synthetic compressor lubricant. Oil filter cartridge replaced with genuine OEM part.',
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-007',
        assetId: 7,
        priority: PriorityLevel.LOW,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-25',
        description: 'Effluent pump motor bearing greasing (Mobil Polyrex EM) and discharge check-valve operational seating check.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-008',
        assetId: 8,
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-30',
        description: 'Inspect surge arresters and ground grid bonding resistance on North Yard Substation transformer.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-009',
        assetId: 9,
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-11-04',
        description: 'Emergency shutoff valve trip-speed timing verification. Stroke test pneumatic actuator from plant ESD panel.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-010',
        assetId: 10,
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-10-28', // OVERDUE
        description: 'OVERDUE: Replace worn drive belt on Switchgear AHU-1 and verify supply air temperature delta across cooling coil.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-011',
        assetId: 1,
        priority: PriorityLevel.CRITICAL,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-10-25', // OVERDUE
        description: 'OVERDUE: Critical pump mechanical seal leak inspection following plant pressure surge.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-012',
        assetId: 11,
        priority: PriorityLevel.LOW,
        status: WorkOrderStatus.PENDING,
        dueDate: '2026-12-01',
        description: 'Commissioning inspection for new Nitrogen Booster Compressor C-4. Log baseline suction and discharge temperatures.',
        notes: null,
        completionDate: null,
      },
      {
        woNumber: 'WO-2026-013',
        assetId: 2,
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.COMPLETED,
        dueDate: '2026-10-18',
        description: 'Quarterly substation grounding integrity and tap changer oil dielectric verification.',
        notes: 'Grounding impedance measured at 0.38 ohms (well below 1.0 ohm threshold). Dielectric breakdown voltage satisfactory at 52kV. All contacts cleaned.',
        completionDate: '2026-10-18T14:45:00.000Z',
      },
      {
        woNumber: 'WO-2026-014',
        assetId: 5,
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.COMPLETED,
        dueDate: '2026-10-15',
        description: 'Standby generator automatic transfer switch (ATS) simulation test during planned plant downtime window.',
        notes: 'Simulated utility grid drop. ATS transferred load within 8.2 seconds. Voltage regulation and frequency stabilized at 60.1Hz without harmonic distortion.',
        completionDate: '2026-10-15T11:20:00.000Z',
      },
      {
        woNumber: 'WO-2026-015',
        assetId: 4,
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.COMPLETED,
        dueDate: '2026-10-01',
        description: 'Control room air handler filter changeout and duct static pressure sensor recalibration.',
        notes: 'Installed MERV 14 pre-filters. Differential pressure transmitter recalibrated to 0.45 in. w.g. Air flow rate verified at 2400 CFM.',
        completionDate: '2026-10-01T16:10:00.000Z',
      },
      {
        woNumber: 'WO-2026-016',
        assetId: 3,
        priority: PriorityLevel.LOW,
        status: WorkOrderStatus.CANCELLED,
        dueDate: '2026-10-12',
        description: 'Routine external valve body painting and pipe insulation cosmetic touch-up.',
        notes: 'Cancelled due to scheduled line replacement project commencing next month.',
        completionDate: null,
      },
    ];

    for (const wo of workOrders) {
      const compLat = wo.status === WorkOrderStatus.COMPLETED ? 37.7749 : null;
      const compLng = wo.status === WorkOrderStatus.COMPLETED ? -122.4194 : null;

      await txn.runAsync(
        `INSERT INTO work_orders (
          wo_number, asset_id, priority, status, assigned_engineer_id,
          due_date, description, completion_date, completion_lat, completion_lng,
          inspection_notes, updated_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?);`,
        wo.woNumber,
        wo.assetId,
        wo.priority,
        wo.status,
        wo.dueDate,
        wo.description,
        wo.completionDate,
        compLat,
        compLng,
        wo.notes,
        now
      );
    }

    // 6. Seed mock completed photos for completed work order WO-2026-013 (wo_id = 13)
    await txn.runAsync(
      `INSERT INTO inspection_photos (work_order_id, kind, file_path, captured_at, captured_lat, captured_lng)
       VALUES 
       (13, 'before', 'documents/fieldops/photos/WO-2026-013/before_seed.jpg', '2026-10-18T13:00:00.000Z', 37.7749, -122.4194),
       (13, 'after', 'documents/fieldops/photos/WO-2026-013/after_seed.jpg', '2026-10-18T14:40:00.000Z', 37.7749, -122.4194);`
    );

    // 7. Seed initial outbound logs and sync queue items for completed jobs
    await txn.runAsync(
      `INSERT INTO outbound_logs (timestamp, operation, module, entity, entity_id, status, retry_count)
       VALUES 
       ('2026-10-18T14:45:00.000Z', 'update', 'work_orders', 'work_order', 13, 'synced', 0),
       ('2026-10-15T11:20:00.000Z', 'update', 'work_orders', 'work_order', 14, 'synced', 0),
       ('2026-10-01T16:10:00.000Z', 'update', 'work_orders', 'work_order', 15, 'synced', 0);`
    );

    // 8. Seed a sample sync queue item (e.g., pending sync)
    await txn.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, status, retry_count, last_error, created_at, updated_at)
       VALUES 
       ('work_order', 13, 'update', 'success', 0, NULL, '2026-10-18T14:45:00.000Z', '2026-10-18T14:46:00.000Z'),
       ('work_order', 14, 'update', 'success', 0, NULL, '2026-10-15T11:20:00.000Z', '2026-10-15T11:21:00.000Z');`
    );

    // 9. Initial Audit Log
    await txn.runAsync(
      `INSERT INTO audit_logs (user_id, event_type, detail, created_at)
       VALUES (1, 'database_initialized', 'SQLite database schema initialized and seeded with Northgate industrial sample data.', ?);`,
      now
    );
  });
}
