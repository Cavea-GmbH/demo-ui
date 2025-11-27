/**
 * Application Constants - Runtime Configuration
 * 
 * This module has been updated to use runtime configuration.
 * Most constants are now loaded from config files via ConfigContext.
 * 
 * NOTE: The exports here are maintained for backward compatibility.
 * New code should use the useConfig() hook directly from ConfigContext.
 */

import type { LocationProvider, Trackable, Location } from '../types/omlox';

// Re-export floor configuration from floorConfig module (backward compatibility)
export { FLOOR_PLAN_WIDTH, FLOOR_PLAN_LENGTH, ZONE_GEOREFERENCE, HARDCODED_FENCES } from './floorConfig';

// Polling interval (milliseconds) - this remains a static constant
export const POLLING_INTERVAL = 2000; // 2 seconds

// Default values for backward compatibility
// These are maintained during migration but should not be used in new code
// Use config.initialData from useConfig() hook instead

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

export const HARDCODED_TRACKABLES: Trackable[] = [
  {
    id: 'trackable-asset-001',
    type: 'omlox',
    name: 'Asset #001',
    location_providers: ['provider-uwb-001', 'provider-ble-001'],
  },
];

export const HARDCODED_LOCATIONS: { [key: string]: Location } = {
  'provider-uwb-001': {
    position: {
      type: 'Point',
      coordinates: [10, 20],
    },
    source: 'demo-zone',
    provider_type: 'uwb',
    provider_id: 'provider-uwb-001',
    crs: 'local',
    floor: 0,
    accuracy: 0.5,
    trackables: ['trackable-asset-001'],
  },
  'provider-ble-001': {
    position: {
      type: 'Point',
      coordinates: [30, 20],
    },
    source: 'demo-zone',
    provider_type: 'ble-mesh',
    provider_id: 'provider-ble-001',
    crs: 'local',
    floor: 0,
    accuracy: 1.5,
    trackables: ['trackable-asset-001'],
  },
  'trackable-asset-001': {
    position: {
      type: 'Point',
      coordinates: [5, 5],
    },
    source: 'demo-zone',
    provider_type: 'uwb',
    provider_id: 'provider-uwb-001',
    crs: 'local',
    floor: 0,
    accuracy: 0.5,
  },
};

