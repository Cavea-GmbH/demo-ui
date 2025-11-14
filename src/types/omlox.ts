// TypeScript types generated from Omlox Hub API specification

export type ProviderType =
  | 'uwb'
  | 'gps'
  | 'wifi'
  | 'rfid'
  | 'ibeacon'
  | 'ble-aoa'
  | 'ble-mesh'
  | 'virtual'
  | 'unknown';

export type TrackableType = 'omlox' | 'virtual';

export type FenceEventType = 'region_entry' | 'region_exit';

export type ElevationRef = 'floor' | 'wgs84';

// GeoJSON Point geometry
export interface Point {
  type: 'Point';
  coordinates: [number, number] | [number, number, number]; // [x, y] or [x, y, z]
}

// GeoJSON Polygon geometry
export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings, each ring is array of [x, y] or [x, y, z]
}

// Location object
export interface Location {
  position: Point;
  source: string;
  provider_type: ProviderType;
  provider_id: string;
  timestamp_generated?: string;
  timestamp_sent?: string;
  crs?: string;
  associated?: boolean;
  accuracy?: number;
  floor?: number;
  true_heading?: number;
  magnetic_heading?: number;
  heading_accuracy?: number;
  elevation_ref?: ElevationRef;
  speed?: number;
  course?: number;
  trackables?: string[];
  properties?: Record<string, unknown>;
}

// Location Provider
export interface LocationProvider {
  id: string;
  type: ProviderType;
  name?: string;
  sensors?: unknown;
  fence_timeout?: number;
  exit_tolerance?: number;
  tolerance_timeout?: number;
  exit_delay?: number;
  properties?: Record<string, unknown>;
}

// Trackable
export interface Trackable {
  id: string;
  type: TrackableType;
  name?: string;
  geometry?: Polygon;
  extrusion?: number;
  location_providers?: string[];
  fence_timeout?: number;
  exit_tolerance?: number;
  tolerance_timeout?: number;
  exit_delay?: number;
  radius?: number;
  properties?: Record<string, unknown>;
  locating_rules?: LocatingRule[];
}

// Locating Rule
export interface LocatingRule {
  expression: string;
  priority: number;
}

// Fence
export interface Fence {
  id: string;
  region: Point | Polygon;
  radius?: number;
  extrusion?: number;
  floor?: number;
  foreign_id?: string;
  name?: string;
  timeout?: number;
  exit_tolerance?: number;
  tolerance_timeout?: number;
  exit_delay?: number;
  crs?: string;
  zone_id?: string;
  elevation_ref?: ElevationRef;
  properties?: Record<string, unknown>;
}

// Fence Event
export interface FenceEvent {
  id: string;
  event_type: FenceEventType;
  fence_id: string;
  provider_id?: string;
  trackable_id?: string;
  trackables?: string[];
  foreign_id?: string;
  entry_time?: string;
  exit_time?: string;
  properties?: Record<string, unknown>;
}

// Trackable Motion
export interface TrackableMotion {
  id: string;
  location: Location;
  name?: string;
  extrusion?: number;
  geometry?: Polygon;
  properties?: Record<string, unknown>;
}

// Zone
export interface Zone {
  id: string;
  type: string;
  foreign_id?: string;
  position?: Point;
  radius?: number;
  ground_control_points?: number[][];
  incomplete_configuration?: boolean;
  measurement_timestamp?: string;
  site?: string;
  building?: string;
  floor?: number;
  name?: string;
  description?: string;
  address?: string;
  properties?: Record<string, unknown>;
  wgs84_height?: number;
}

// Error response
export interface Error {
  type: string;
  code: number;
  message?: string;
}

