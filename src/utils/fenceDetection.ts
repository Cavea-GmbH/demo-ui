import type { Point, Polygon, Fence } from '../types/omlox';

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(point: Point, polygon: Polygon): boolean {
  const [x, y] = point.coordinates;
  const rings = polygon.coordinates;
  
  if (rings.length === 0) return false;
  
  // Use the first ring (exterior ring)
  const ring = rings[0];
  let inside = false;
  
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if a point is inside a circular fence (Point + radius)
 */
function pointInCircle(
  point: Point,
  center: Point,
  radius: number
): boolean {
  const [x1, y1] = point.coordinates;
  const [x2, y2] = center.coordinates;
  
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance <= radius;
}

/**
 * Check if a point is inside a fence
 */
export function isPointInFence(point: Point, fence: Fence): boolean {
  if (fence.region.type === 'Point') {
    // Circular fence
    if (fence.radius) {
      return pointInCircle(point, fence.region, fence.radius);
    }
    // Point fence without radius - treat as point equality
    const [x1, y1] = point.coordinates;
    const [x2, y2] = fence.region.coordinates;
    return x1 === x2 && y1 === y2;
  } else {
    // Polygon fence
    return pointInPolygon(point, fence.region);
  }
}

/**
 * Get all fences that contain a point
 */
export function getFencesContainingPoint(
  point: Point,
  fences: Fence[]
): Fence[] {
  return fences.filter((fence) => isPointInFence(point, fence));
}

