/**
 * Centralized configuration for geofence and app-wide constants.
 * Update coordinates here — all 3 layers (GPS indicator, camera page, server action) will use these values.
 */
export const GEOFENCE = {
  lat: -6.098715809561847,
  lon: 106.65337852609656,
  radiusMeters: 500,
} as const;
