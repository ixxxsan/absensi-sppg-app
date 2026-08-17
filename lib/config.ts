/**
 * Centralized configuration for geofence and app-wide constants.
 * Update coordinates here — all 3 layers (GPS indicator, camera page, server action) will use these values.
 */
export const GEOFENCE = {
  lat: -6.098782,
  lon: 106.653263,
  radiusMeters: 1500,
} as const;
