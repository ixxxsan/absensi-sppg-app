/**
 * Centralized configuration for geofence and app-wide constants.
 * Update coordinates here — all 3 layers (GPS indicator, camera page, server action) will use these values.
 */
export const GEOFENCE = {
  lat: -6.0987694,
  lon: 106.6531638,
  radiusMeters: 30,
} as const;
