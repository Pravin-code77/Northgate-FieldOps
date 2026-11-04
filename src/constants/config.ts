export const AppConfig = {
  appName: 'FieldOps Mobile',
  organization: 'Northgate Industrial Services',
  department: 'Asset Reliability & Field Operations Division',
  dbName: 'fieldops.db',
  
  // Validation bounds
  minGpsRadiusMeters: 25,
  maxGpsRadiusMeters: 1000,
  defaultGpsRadiusMeters: 100,

  minSessionTimeoutMinutes: 5,
  maxSessionTimeoutMinutes: 60,
  defaultSessionTimeoutMinutes: 15,

  minMaxRetries: 1,
  maxMaxRetries: 10,
  defaultMaxRetries: 5,

  minInspectionNotesLength: 10,

  // Demo Engineer configuration
  demoEngineer: {
    employeeCode: 'EMP-NG-4029',
    fullName: 'Marcus Vance',
    role: 'Senior Reliability & Field Operations Engineer',
  },

  // Documented benchmark GPS coordinates for testing / emulator location
  benchmarkLocation: {
    name: 'Northgate Plant Substation & Central Facility',
    latitude: 37.7749,
    longitude: -122.4194,
    description: 'Use this coordinate in the Android/iOS emulator location spoofer or GPS tester.',
  },

  // Storage paths
  photoDirName: 'fieldops/photos',
};

export default AppConfig;
