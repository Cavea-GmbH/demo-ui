import type { Point, Fence, Polygon } from '../types/omlox';
import type { ZoneGeoreference, GroundControlPoint } from '../utils/georeferencing';

/**
 * Floor Configuration - Environment-based with fallback defaults
 * 
 * This module provides floor plan georeferencing configuration and demo data
 * that can be customized per deployment via environment variables, with sensible
 * defaults as fallback.
 * 
 * Environment Variables:
 * - VITE_FLOOR_WIDTH: Floor plan width in meters (default: 50)
 * - VITE_FLOOR_LENGTH: Floor plan length in meters (default: 30)
 * - VITE_ZONE_ID: Optional zone identifier
 * - VITE_ZONE_POSITION: Zone reference position as JSON: [lon, lat]
 *   Example: "[7.815694, 48.130216]"
 * - VITE_GROUND_CONTROL_POINTS: Array of GCPs as JSON string
 *   Example: '[{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]}]'
 * - VITE_DEMO_FENCES: Array of fence definitions as JSON string
 *   Example: '[{"id":"fence-1","name":"Test Fence","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]'
 * 
 * Simple .env example:
 * ```
 * VITE_FLOOR_WIDTH=50
 * VITE_FLOOR_LENGTH=30
 * VITE_ZONE_POSITION=[7.815694, 48.130216]
 * VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]
 * VITE_DEMO_FENCES=[{"id":"fence-1","name":"Test Fence","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]
 * ```
 */

// ============================================================================
// DEFAULT CONFIGURATION (Fallback values)
// ============================================================================

const DEFAULT_FLOOR_WIDTH = 50; // meters
const DEFAULT_FLOOR_LENGTH = 30; // meters
const DEFAULT_ZONE_ID: string | undefined = undefined;

const DEFAULT_ZONE_POSITION: Point = {
  type: 'Point',
  coordinates: [7.815694, 48.130216], // [longitude, latitude] in WGS84
};

const DEFAULT_GROUND_CONTROL_POINTS: GroundControlPoint[] = [
  // Bottom-left corner
  {
    wgs84: [7.815694, 48.130216],
    local: [0, 0],
  },
  // Bottom-right corner
  {
    wgs84: [7.816551, 48.130216],
    local: [50, 0],
  },
  // Top-left corner
  {
    wgs84: [7.815694, 48.13031],
    local: [0, 30],
  },
  // Top-right corner
  {
    wgs84: [7.816551, 48.13031],
    local: [50, 30],
  },
];

const DEFAULT_DEMO_FENCES: Fence[] = [
  {
    id: 'fence-1',
    name: 'Test Fence 1',
    region: {
      type: 'Polygon',
      coordinates: [
        [
          [15, 5],
          [35, 5],
          [35, 15],
          [15, 15],
          [15, 5],
        ],
      ],
    } as Polygon,
    floor: 0,
    crs: 'local',
  }
];

// ============================================================================
// ENVIRONMENT-BASED CONFIGURATION
// ============================================================================

/**
 * Parse floor plan width from environment or use default
 */
function getFloorWidth(): number {
  const envValue = import.meta.env.VITE_FLOOR_WIDTH;
  if (envValue) {
    const parsed = parseFloat(envValue);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`📐 Floor width from env: ${parsed}m`);
      return parsed;
    }
  }
  return DEFAULT_FLOOR_WIDTH;
}

/**
 * Parse floor plan length from environment or use default
 */
function getFloorLength(): number {
  const envValue = import.meta.env.VITE_FLOOR_LENGTH;
  if (envValue) {
    const parsed = parseFloat(envValue);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`📐 Floor length from env: ${parsed}m`);
      return parsed;
    }
  }
  return DEFAULT_FLOOR_LENGTH;
}

/**
 * Parse zone ID from environment or use default
 */
function getZoneId(): string | undefined {
  const envValue = import.meta.env.VITE_ZONE_ID;
  if (envValue && envValue.trim()) {
    console.log(`🏷️ Zone ID from env: ${envValue}`);
    return envValue;
  }
  return DEFAULT_ZONE_ID;
}

/**
 * Parse zone position from environment or use default
 */
function getZonePosition(): Point {
  const envValue = import.meta.env.VITE_ZONE_POSITION;
  if (envValue) {
    try {
      const parsed = JSON.parse(envValue);
      if (Array.isArray(parsed) && parsed.length === 2) {
        console.log(`📍 Zone position from env: [${parsed[0]}, ${parsed[1]}]`);
        return {
          type: 'Point',
          coordinates: [parsed[0], parsed[1]],
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse VITE_ZONE_POSITION, using default:', error);
    }
  }
  return DEFAULT_ZONE_POSITION;
}

/**
 * Parse ground control points from environment or use default
 */
function getGroundControlPoints(): GroundControlPoint[] {
  const envValue = import.meta.env.VITE_GROUND_CONTROL_POINTS;
  if (envValue) {
    try {
      const parsed = JSON.parse(envValue);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        // Validate structure
        const valid = parsed.every(
          (gcp: any) =>
            gcp.wgs84 &&
            Array.isArray(gcp.wgs84) &&
            gcp.wgs84.length === 2 &&
            gcp.local &&
            Array.isArray(gcp.local) &&
            gcp.local.length === 2
        );
        if (valid) {
          console.log(`📍 Ground control points from env: ${parsed.length} GCPs loaded`);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse VITE_GROUND_CONTROL_POINTS, using default:', error);
    }
  }
  return DEFAULT_GROUND_CONTROL_POINTS;
}

/**
 * Parse demo fences from environment or use default
 */
function getDemoFences(): Fence[] {
  const envValue = import.meta.env.VITE_DEMO_FENCES;
  if (envValue) {
    try {
      const parsed = JSON.parse(envValue);
      if (Array.isArray(parsed)) {
        // Basic validation - check for required fence properties
        const valid = parsed.every(
          (fence: any) =>
            fence.id &&
            fence.region &&
            fence.region.type
        );
        if (valid) {
          console.log(`🚧 Demo fences from env: ${parsed.length} fence(s) loaded`);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse VITE_DEMO_FENCES, using default:', error);
    }
  }
  return DEFAULT_DEMO_FENCES;
}

// ============================================================================
// EXPORTED CONFIGURATION
// ============================================================================

export const FLOOR_PLAN_WIDTH = getFloorWidth();
export const FLOOR_PLAN_LENGTH = getFloorLength();

export const ZONE_GEOREFERENCE: ZoneGeoreference = {
  zoneId: getZoneId(),
  position: getZonePosition(),
  groundControlPoints: getGroundControlPoints(),
};

export const HARDCODED_FENCES = getDemoFences();

// Log configuration on module load
console.log('🗺️ Floor configuration loaded:');
console.log(`   Width: ${FLOOR_PLAN_WIDTH}m`);
console.log(`   Length: ${FLOOR_PLAN_LENGTH}m`);
console.log(`   Zone ID: ${ZONE_GEOREFERENCE.zoneId || 'none'}`);
console.log(`   GCPs: ${ZONE_GEOREFERENCE.groundControlPoints.length} points`);
console.log(`   Demo Fences: ${HARDCODED_FENCES.length} fence(s)`);

