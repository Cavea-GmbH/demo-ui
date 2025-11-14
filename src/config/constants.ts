import type { Fence, Polygon, LocationProvider, Trackable, Location } from '../types/omlox';
import type { ZoneGeoreference } from '../utils/georeferencing';

// Floor plan dimensions (in meters)
export const FLOOR_PLAN_WIDTH = 50; // meters
export const FLOOR_PLAN_HEIGHT = 30; // meters

// Polling interval (milliseconds)
export const POLLING_INTERVAL = 2000; // 2 seconds

// Default zone ID (if needed)
export const DEFAULT_ZONE_ID: string | undefined = undefined;

// Zone georeferencing configuration
// Ground control points map WGS84 (lon, lat) to local (x, y) coordinates
// 
// IMPORTANT: Configure these values based on your actual floor plan georeferencing!
// You need at least 2 ground control points (GCPs) that map known WGS84 coordinates
// to known local coordinates on your floor plan.
//
// How to configure:
// 1. Identify at least 2 points on your floor plan with known WGS84 coordinates
//    (e.g., corners of the building, known landmarks)
// 2. Measure or know the local (x, y) coordinates of these points in meters
// 3. Add them to the groundControlPoints array below
//
// Example: If the bottom-left corner of your floor is at WGS84 [7.815694, 48.130216]
//          and that corresponds to local coordinates [0, 0], add:
//          { wgs84: [7.815694, 48.130216], local: [0, 0] }
//
// For better accuracy, use 3-4 GCPs covering different areas of the floor plan.
export const ZONE_GEOREFERENCE: ZoneGeoreference = {
  zoneId: DEFAULT_ZONE_ID,
  // Zone position in WGS84 (optional, can be center or reference point)
  position: {
    type: 'Point',
    coordinates: [7.815694, 48.130216], // [longitude, latitude] in WGS84
  },
  groundControlPoints: [
    // Bottom-left corner: WGS84 -> local (0, 0)
    {
      wgs84: [7.815694, 48.130216], // [lon, lat]
      local: [0, 0], // [x, y] in meters
    },
    // Bottom-right corner: WGS84 -> local (50, 0)
    {
      wgs84: [7.816551, 48.130216], // Approx 50m east (adjust based on your floor plan)
      local: [50, 0],
    },
    // Top-left corner: WGS84 -> local (0, 30)
    {
      wgs84: [7.815694, 48.13031], // Approx 30m north (adjust based on your floor plan)
      local: [0, 30],
    },
    // Top-right corner: WGS84 -> local (50, 30)
    {
      wgs84: [7.816551, 48.13031],
      local: [50, 30],
    },
  ],
};

// Hardcoded fences for demo
export const HARDCODED_FENCES: Fence[] = [
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

// Hardcoded location providers for demo
export const HARDCODED_PROVIDERS: LocationProvider[] = [
  {
    id: 'provider-uwb-001',
    type: 'uwb',
    name: 'UWB Tag 1',
  },
  {
    id: 'provider-ble-001',
    type: 'ble-aoa',
    name: 'BLE Tag 1',
  },
];

// Hardcoded trackables for demo
export const HARDCODED_TRACKABLES: Trackable[] = [
  {
    id: 'trackable-asset-001',
    type: 'omlox',
    name: 'Asset #001',
    location_providers: ['provider-uwb-001', 'provider-ble-001'], // Linked to both providers
  },
];

// Initial locations for hardcoded entities
export const HARDCODED_LOCATIONS: { [key: string]: Location } = {
  'provider-uwb-001': {
    position: {
      type: 'Point',
      coordinates: [10, 20], // Grid-aligned position (5x5 grid)
    },
    source: 'demo-zone',
    provider_type: 'uwb',
    provider_id: 'provider-uwb-001',
    crs: 'local',
    floor: 0,
    accuracy: 0.5,
    timestamp_generated: new Date().toISOString(),
    trackables: ['trackable-asset-001'], // This provider tracks this trackable
  },
  'provider-ble-001': {
    position: {
      type: 'Point',
      coordinates: [30, 20], // Grid-aligned position (5x5 grid)
    },
    source: 'demo-zone',
    provider_type: 'ble-mesh',
    provider_id: 'provider-ble-001',
    crs: 'local',
    floor: 0,
    accuracy: 1.5,
    timestamp_generated: new Date().toISOString(),
    trackables: ['trackable-asset-001'], // This provider tracks this trackable
  },
  // Trackable gets its location from one of the providers (typically the more accurate one)
  'trackable-asset-001': {
    position: {
      type: 'Point',
      coordinates: [5, 5], // Same as UWB provider (more accurate)
    },
    source: 'demo-zone',
    provider_type: 'uwb',
    provider_id: 'provider-uwb-001',
    crs: 'local',
    floor: 0,
    accuracy: 0.5,
    timestamp_generated: new Date().toISOString(),
  },
};

