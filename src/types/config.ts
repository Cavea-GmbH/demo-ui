import type { LocationProvider, Trackable, Location, Fence } from './omlox';

/**
 * Ground Control Point - maps WGS84 coordinates to local coordinate system
 */
export interface GroundControlPoint {
  wgs84: [number, number]; // [longitude, latitude]
  local: [number, number];  // [x, y] in meters
}

/**
 * Zone Georeference Configuration
 */
export interface ZoneGeoreference {
  id?: string | null;
  position: [number, number]; // [longitude, latitude]
  groundControlPoints: GroundControlPoint[];
}

/**
 * Floor Configuration
 */
export interface FloorConfig {
  width: number;  // meters
  length: number; // meters
}

/**
 * Initial Data Configuration - optional demo data to load on startup
 */
export interface InitialDataConfig {
  loadInitialData: boolean;
  providers: LocationProvider[];
  trackables: Trackable[];
  locations: Record<string, Location>;
}

/**
 * Complete Application Configuration
 * This is loaded at runtime from config file or environment
 */
export interface AppConfig {
  floor: FloorConfig;
  zone: ZoneGeoreference;
  fences: Fence[];
  initialData: InitialDataConfig;
}



