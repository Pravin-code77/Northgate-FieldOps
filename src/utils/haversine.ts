/**
 * Calculate the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Mean radius of the Earth in meters

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Check whether a user's current GPS location is within a configured radius
 * of the target asset's location.
 *
 * @param userLat Current user latitude
 * @param userLng Current user longitude
 * @param assetLat Asset latitude
 * @param assetLng Asset longitude
 * @param radiusMeters Configured threshold radius in meters
 * @returns boolean
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  assetLat: number,
  assetLng: number,
  radiusMeters: number
): boolean {
  if (
    typeof userLat !== 'number' ||
    typeof userLng !== 'number' ||
    typeof assetLat !== 'number' ||
    typeof assetLng !== 'number' ||
    isNaN(userLat) ||
    isNaN(userLng) ||
    isNaN(assetLat) ||
    isNaN(assetLng)
  ) {
    return false;
  }

  const distance = calculateHaversineDistance(userLat, userLng, assetLat, assetLng);
  return distance <= radiusMeters;
}
