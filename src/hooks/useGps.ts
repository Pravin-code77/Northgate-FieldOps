import { useCallback, useState } from 'react';
import {
  getCurrentCoordinates,
  GpsVerificationResult,
  LocationCoordinates,
  verifyAssetProximity,
} from '../services/gpsService';

export function useGps() {
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVerification, setLastVerification] = useState<GpsVerificationResult | null>(null);

  const refreshLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    setIsLocating(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      setCurrentLocation(coords);
      return coords;
    } catch (err: any) {
      const msg = err?.message || 'Failed to obtain GPS location.';
      setError(msg);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const checkProximity = useCallback(
    async (assetLat: number, assetLng: number, radiusMeters?: number): Promise<GpsVerificationResult> => {
      setIsLocating(true);
      setError(null);
      try {
        const result = await verifyAssetProximity(assetLat, assetLng, radiusMeters);
        setLastVerification(result);
        if (result.currentLocation) {
          setCurrentLocation(result.currentLocation);
        }
        if (result.error) {
          setError(result.error);
        }
        return result;
      } finally {
        setIsLocating(false);
      }
    },
    []
  );

  return {
    currentLocation,
    isLocating,
    error,
    lastVerification,
    refreshLocation,
    checkProximity,
  };
}
