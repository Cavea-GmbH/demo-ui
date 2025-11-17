import type { LocationProvider, Trackable, Location } from '../types/omlox';

// Re-export floor configuration from floorConfig module
// This allows environment-based configuration with fallback defaults
export { FLOOR_PLAN_WIDTH, FLOOR_PLAN_LENGTH, ZONE_GEOREFERENCE, HARDCODED_FENCES } from './floorConfig';

// Polling interval (milliseconds)
export const POLLING_INTERVAL = 2000; // 2 seconds

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

