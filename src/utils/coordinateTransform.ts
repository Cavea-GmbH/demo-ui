import type { Point } from '../types/omlox';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT } from '../config/constants';

// SVG viewport dimensions (pixels)
const SVG_WIDTH = 800;
const SVG_HEIGHT = 480;

/**
 * Transform a coordinate from API space (meters) to SVG pixel space
 * @param padding Optional padding in pixels to account for floor plan padding
 */
export function transformToSVG(
  point: Point, 
  floorWidth: number = FLOOR_PLAN_WIDTH, 
  floorHeight: number = FLOOR_PLAN_HEIGHT,
  padding: number = 0
): [number, number] {
  const [x, y] = point.coordinates;
  
  // Calculate available space (accounting for padding)
  const availableWidth = SVG_WIDTH - (padding * 2);
  const availableHeight = SVG_HEIGHT - (padding * 2);
  
  // Scale factors
  const scaleX = availableWidth / floorWidth;
  const scaleY = availableHeight / floorHeight;
  
  // Transform: API coordinates (meters) -> SVG pixels
  const svgX = padding + (x * scaleX);
  const svgY = padding + (availableHeight - (y * scaleY)); // Flip Y axis (SVG origin is top-left)
  
  return [svgX, svgY];
}

/**
 * Transform a coordinate from SVG pixel space to API space (meters)
 */
export function transformFromSVG(svgX: number, svgY: number, floorWidth: number = FLOOR_PLAN_WIDTH, floorHeight: number = FLOOR_PLAN_HEIGHT): [number, number] {
  const scaleX = SVG_WIDTH / floorWidth;
  const scaleY = SVG_HEIGHT / floorHeight;
  
  const x = svgX / scaleX;
  const y = (SVG_HEIGHT - svgY) / scaleY; // Flip Y axis
  
  return [x, y];
}

/**
 * Convert screen/browser coordinates to SVG viewBox coordinates
 * Accounts for preserveAspectRatio="xMidYMid meet" which centers and scales the SVG
 * 
 * @param screenX - X coordinate relative to browser viewport
 * @param screenY - Y coordinate relative to browser viewport
 * @param svgElement - The SVG element to get coordinates for
 * @returns [svgX, svgY] - Coordinates in SVG viewBox space
 */
export function screenToSVG(screenX: number, screenY: number, svgElement: SVGSVGElement): [number, number] {
  const rect = svgElement.getBoundingClientRect();
  
  // Calculate click position relative to SVG container
  const clickX = screenX - rect.left;
  const clickY = screenY - rect.top;

  // Convert screen coordinates to SVG viewBox coordinates
  // Account for preserveAspectRatio="xMidYMid meet"
  const viewBoxAspect = SVG_WIDTH / SVG_HEIGHT;
  const rectAspect = rect.width / rect.height;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (rectAspect > viewBoxAspect) {
    // Container is wider than viewBox aspect - letterbox on sides
    scale = rect.height / SVG_HEIGHT;
    offsetX = (rect.width - SVG_WIDTH * scale) / 2;
  } else {
    // Container is taller than viewBox aspect - letterbox on top/bottom
    scale = rect.width / SVG_WIDTH;
    offsetY = (rect.height - SVG_HEIGHT * scale) / 2;
  }

  // Convert to SVG coordinates
  const svgX = (clickX - offsetX) / scale;
  const svgY = (clickY - offsetY) / scale;

  return [svgX, svgY];
}

/**
 * Get SVG viewBox string
 */
export function getSVGViewBox(): string {
  return `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`;
}

export { SVG_WIDTH, SVG_HEIGHT };

