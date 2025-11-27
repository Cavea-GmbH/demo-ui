/**
 * Floor Configuration - Runtime Configuration
 * 
 * This module has been updated to use runtime configuration loaded from config files.
 * The configuration is now managed by the ConfigContext and loaded at application startup.
 * 
 * NOTE: This file is maintained for backward compatibility during migration.
 * New code should use the useConfig() hook directly from ConfigContext.
 */

// These exports are maintained for backward compatibility
// They will be populated with default values and should not be used in new code
// Use useConfig() hook instead
export const FLOOR_PLAN_WIDTH = 50;
export const FLOOR_PLAN_LENGTH = 30;

export const ZONE_GEOREFERENCE = {
  zoneId: undefined,
  position: {
    type: 'Point' as const,
    coordinates: [7.815694, 48.130216] as [number, number],
  },
  groundControlPoints: [
    {
      wgs84: [7.815694, 48.130216] as [number, number],
      local: [0, 0] as [number, number],
    },
    {
      wgs84: [7.816551, 48.130216] as [number, number],
      local: [50, 0] as [number, number],
    },
    {
      wgs84: [7.815694, 48.13031] as [number, number],
      local: [0, 30] as [number, number],
    },
    {
      wgs84: [7.816551, 48.13031] as [number, number],
      local: [50, 30] as [number, number],
    },
  ],
};

export const HARDCODED_FENCES = [
  {
    id: 'fence-1',
    name: 'Test Fence 1',
    region: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [15, 5],
          [35, 5],
          [35, 15],
          [15, 15],
          [15, 5],
        ],
      ],
    },
    floor: 0,
    crs: 'local',
  },
];

console.warn('⚠️ floorConfig.ts is deprecated - use useConfig() hook from ConfigContext instead');

