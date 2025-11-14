import type { Location, Point } from '../types/omlox';
import { ZONE_GEOREFERENCE } from '../config/constants';
import { wgs84ToLocal } from './georeferencing';

/**
 * Normalize a location to local coordinates
 * Converts WGS84 coordinates to local if needed
 */
export function normalizeLocationToLocal(location: Location): Location {
  const crs = location.crs || 'local';
  
  // If already local, return as-is
  if (crs === 'local') {
    return location;
  }

  // If WGS84 (EPSG:4326), transform to local
  if (crs === 'EPSG:4326' || crs.toLowerCase().includes('4326')) {
    try {
      const [lon, lat] = location.position.coordinates as [number, number];
      console.log(`🌍 Transforming WGS84 coordinates [${lon}, ${lat}] to local coordinates...`);
      console.log(`   Using ${ZONE_GEOREFERENCE.groundControlPoints.length} ground control points`);
      
      const localPosition = wgs84ToLocal(location.position, ZONE_GEOREFERENCE);
      const [localX, localY] = localPosition.coordinates as [number, number];
      
      // Validate transformed coordinates are reasonable
      if (isNaN(localX) || isNaN(localY) || !isFinite(localX) || !isFinite(localY)) {
        throw new Error(`Transformation produced invalid coordinates: [${localX}, ${localY}]`);
      }
      
      console.log(`✅ Transformed to local coordinates [${localX.toFixed(2)}, ${localY.toFixed(2)}] meters`);
      
      return {
        ...location,
        position: localPosition,
        crs: 'local', // Mark as local after transformation
      };
    } catch (error) {
      console.error(`❌ Error transforming WGS84 coordinates:`, error);
      console.warn(`⚠️ Returning location with original WGS84 coordinates. Check georeferencing configuration.`);
      console.warn(`   Original coordinates:`, location.position.coordinates);
      return location;
    }
  }

  // For other CRS, log warning and return as-is
  // In production, you might want to add more transformation support
  console.warn(`⚠️ Unsupported CRS: ${crs}. Returning location as-is.`);
  return location;
}

/**
 * Check if coordinates are in WGS84 format (longitude, latitude)
 */
export function isWgs84Coordinates(point: Point, crs?: string): boolean {
  if (crs === 'EPSG:4326' || crs?.toLowerCase().includes('4326')) {
    return true;
  }
  
  // Heuristic: WGS84 coordinates are typically:
  // - Longitude: -180 to 180
  // - Latitude: -90 to 90
  const [coord1, coord2] = point.coordinates;
  return (
    coord1 >= -180 && coord1 <= 180 &&
    coord2 >= -90 && coord2 <= 90 &&
    Math.abs(coord1) > 1 && Math.abs(coord2) > 1 // Exclude small local coordinates
  );
}

