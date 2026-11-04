import * as Location from 'expo-location';
import AppConfig from '../constants/config';
import { addGpsLog } from '../repositories/gpsRepository';
import { getSetting } from '../repositories/settingsRepository';
import { calculateHaversineDistance } from '../utils/haversine';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface GpsVerificationResult {
  isWithinRadius: boolean;
  distanceMeters: number;
  radiusMeters: number;
  currentLocation: LocationCoordinates | null;
  error?: string;
}

/**
 * Request GPS foreground permissions and get current fix
 */
export async function getCurrentCoordinates(): Promise<LocationCoordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('GPS Location permission was denied. Please grant location access to verify equipment proximity.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
  };
}

/**
 * Verify proximity to an asset based on configured radius in settings
 */
export async function verifyAssetProximity(
  assetLat: number,
  assetLng: number,
  customRadiusMeters?: number
): Promise<GpsVerificationResult> {
  const radiusSettingStr = await getSetting(
    'gps_radius_meters',
    AppConfig.defaultGpsRadiusMeters.toString()
  );
  const radiusMeters = customRadiusMeters ?? (parseInt(radiusSettingStr, 10) || AppConfig.defaultGpsRadiusMeters);

  try {
    const coords = await getCurrentCoordinates();
    const distanceMeters = calculateHaversineDistance(
      coords.latitude,
      coords.longitude,
      assetLat,
      assetLng
    );

    const isWithinRadius = distanceMeters <= radiusMeters;

    return {
      isWithinRadius,
      distanceMeters,
      radiusMeters,
      currentLocation: coords,
    };
  } catch (err: any) {
    return {
      isWithinRadius: false,
      distanceMeters: Infinity,
      radiusMeters,
      currentLocation: null,
      error: err?.message || 'Failed to acquire GPS fix.',
    };
  }
}

/**
 * Record a verified GPS event for a work order in SQLite
 */
export async function logGpsEvent(
  workOrderId: number,
  eventType: 'start_verification' | 'completion_record' | 'manual_verification',
  coords: LocationCoordinates
): Promise<number> {
  return await addGpsLog({
    work_order_id: workOrderId,
    event_type: eventType,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    captured_at: new Date().toISOString(),
  });
}
