import type { Point } from '../types/omlox';

/**
 * Ground Control Point: Maps WGS84 (lon, lat) to local (x, y)
 */
export interface GroundControlPoint {
  wgs84: [number, number]; // [longitude, latitude]
  local: [number, number]; // [x, y] in meters
}

/**
 * Zone georeferencing configuration
 */
export interface ZoneGeoreference {
  zoneId?: string;
  position?: Point; // Zone position in WGS84
  groundControlPoints: GroundControlPoint[];
}

/**
 * Convert WGS84 coordinates to local coordinates using ground control points
 * Uses affine transformation (translation, rotation, scale)
 */
export function wgs84ToLocal(
  wgs84Point: Point,
  georeference: ZoneGeoreference
): Point {
  const [lon, lat] = wgs84Point.coordinates as [number, number];
  const gcp = georeference.groundControlPoints;

  if (gcp.length < 2) {
    throw new Error('At least 2 ground control points are required for transformation');
  }

  // Calculate average latitude for meters-per-degree conversion
  const avgLat = gcp.reduce((sum, p) => sum + p.wgs84[1], 0) / gcp.length;
  const metersPerDegreeLat = 111320; // meters per degree latitude (constant)
  const metersPerDegreeLon = 111320 * Math.cos(avgLat * Math.PI / 180);

  // For 2 points: use simple translation + scale (if they define both axes)
  if (gcp.length === 2) {
    const [gcp1, gcp2] = gcp;
    
    const wgs84Dx = gcp2.wgs84[0] - gcp1.wgs84[0];
    const wgs84Dy = gcp2.wgs84[1] - gcp1.wgs84[1];
    const localDx = gcp2.local[0] - gcp1.local[0];
    const localDy = gcp2.local[1] - gcp1.local[1];

    // Check if both axes are defined (non-zero deltas)
    const wgs84DistX = Math.abs(wgs84Dx * metersPerDegreeLon);
    const wgs84DistY = Math.abs(wgs84Dy * metersPerDegreeLat);

    // If one axis is not defined, we can't use 2-point transformation
    if (wgs84DistX < 0.001 || wgs84DistY < 0.001) {
      throw new Error('2-point transformation requires GCPs that define both X and Y axes. Use 3+ GCPs or ensure GCPs are not aligned.');
    }

    const scaleX = localDx / (wgs84Dx * metersPerDegreeLon);
    const scaleY = localDy / (wgs84Dy * metersPerDegreeLat);

    // Transform relative to first GCP
    const relLon = lon - gcp1.wgs84[0];
    const relLat = lat - gcp1.wgs84[1];

    const localX = gcp1.local[0] + relLon * metersPerDegreeLon * scaleX;
    const localY = gcp1.local[1] + relLat * metersPerDegreeLat * scaleY;

    return {
      type: 'Point',
      coordinates: [localX, localY],
    };
  }

  // 3+ points: Use affine transformation
  // Find GCPs that define X and Y axes separately
  // Use one GCP as origin, find one that defines X-axis, one that defines Y-axis
  
  const gcp1 = gcp[0]; // Use first as origin
  const lon0 = gcp1.wgs84[0];
  const lat0 = gcp1.wgs84[1];
  const x0 = gcp1.local[0];
  const y0 = gcp1.local[1];

  // Find GCP that defines X-axis (different longitude, same or similar latitude)
  let gcpX = gcp.find(p => Math.abs(p.wgs84[0] - lon0) > 0.0001);
  if (!gcpX) gcpX = gcp[1]; // Fallback to second GCP

  // Find GCP that defines Y-axis (different latitude, same or similar longitude)
  let gcpY = gcp.find(p => Math.abs(p.wgs84[1] - lat0) > 0.0001);
  if (!gcpY) gcpY = gcp[gcp.length > 2 ? 2 : 1]; // Fallback

  // Calculate scale factors from X and Y axis GCPs
  const wgs84Dx = gcpX.wgs84[0] - lon0;
  const wgs84Dy = gcpY.wgs84[1] - lat0;
  
  const localDx = gcpX.local[0] - x0;
  const localDy = gcpY.local[1] - y0;

  // Convert WGS84 deltas to meters
  const wgs84DistX = wgs84Dx * metersPerDegreeLon;
  const wgs84DistY = wgs84Dy * metersPerDegreeLat;

  // Calculate scale factors
  const scaleX = wgs84DistX !== 0 ? localDx / wgs84DistX : 1;
  const scaleY = wgs84DistY !== 0 ? localDy / wgs84DistY : 1;

  // Transform input point
  const relLon = lon - lon0;
  const relLat = lat - lat0;
  const relLonM = relLon * metersPerDegreeLon;
  const relLatM = relLat * metersPerDegreeLat;

  const localX = x0 + relLonM * scaleX;
  const localY = y0 + relLatM * scaleY;

  return {
    type: 'Point',
    coordinates: [localX, localY],
  };
}

/**
 * Convert local coordinates to WGS84 coordinates
 * Inverse transformation of wgs84ToLocal
 */
export function localToWgs84(
  localPoint: Point,
  georeference: ZoneGeoreference
): Point {
  const [x, y] = localPoint.coordinates as [number, number];
  const gcp = georeference.groundControlPoints;

  if (gcp.length < 2) {
    throw new Error('At least 2 ground control points are required for transformation');
  }

  // Calculate average latitude for meters-per-degree conversion
  const avgLat = gcp.reduce((sum, p) => sum + p.wgs84[1], 0) / gcp.length;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(avgLat * Math.PI / 180);

  // Use first GCP as origin
  const origin = gcp[0];
  
  // Find GCP that defines X-axis (different local X from origin)
  const xAxisGcp = gcp.find(p => Math.abs(p.local[0] - origin.local[0]) > 0.1) || gcp[1];
  
  // Find GCP that defines Y-axis (different local Y from origin)
  const yAxisGcp = gcp.find(p => Math.abs(p.local[1] - origin.local[1]) > 0.1) || (gcp.length > 2 ? gcp[2] : gcp[1]);

  // Calculate scale factors for X and Y axes
  const localDxX = xAxisGcp.local[0] - origin.local[0];
  const wgs84DLonX = xAxisGcp.wgs84[0] - origin.wgs84[0];
  const wgs84DLatX = xAxisGcp.wgs84[1] - origin.wgs84[1];

  const localDyY = yAxisGcp.local[1] - origin.local[1];
  const wgs84DLonY = yAxisGcp.wgs84[0] - origin.wgs84[0];
  const wgs84DLatY = yAxisGcp.wgs84[1] - origin.wgs84[1];

  // Calculate inverse scales for each axis
  const scaleLonX = localDxX !== 0 ? wgs84DLonX / localDxX : 0;
  const scaleLatX = localDxX !== 0 ? wgs84DLatX / localDxX : 0;
  const scaleLonY = localDyY !== 0 ? wgs84DLonY / localDyY : 0;
  const scaleLatY = localDyY !== 0 ? wgs84DLatY / localDyY : 0;

  // Transform local to WGS84 using inverse affine transformation
  const dx = x - origin.local[0];
  const dy = y - origin.local[1];

  const lon = origin.wgs84[0] + (dx * scaleLonX) + (dy * scaleLonY);
  const lat = origin.wgs84[1] + (dx * scaleLatX) + (dy * scaleLatY);

  return {
    type: 'Point',
    coordinates: [lon, lat],
  };
}

