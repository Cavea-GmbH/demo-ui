import type { Fence, FenceEvent } from '../../types/omlox';
import { transformToSVG } from '../../utils/coordinateTransform';
import { MouseEvent, useState, useEffect } from 'react';

interface FenceLayerProps {
  fences: Fence[];
  padding?: number;
  events?: FenceEvent[];
  showProviders?: boolean;
  showTrackables?: boolean;
  onFenceClick?: (fence: Fence, screenX: number, screenY: number) => void;
  selectedFenceId?: string | null;
}

// Default fence colors (neutral gray)
const DEFAULT_FILL = 'rgba(158, 158, 158, 0.15)'; // Light gray with low opacity
const DEFAULT_STROKE = '#9e9e9e'; // Medium gray

// Event-based colors (decent shades)
const ENTRY_FILL = 'rgba(76, 175, 80, 0.25)'; // Green with transparency
const ENTRY_STROKE = '#4caf50'; // Material green
const EXIT_FILL = 'rgba(244, 67, 54, 0.25)'; // Red with transparency
const EXIT_STROKE = '#f44336'; // Material red

// Time window for "recent" events (3 seconds)
const RECENT_EVENT_WINDOW_MS = 3000;

/**
 * Determine fence color based on recent events
 * Returns the most recent event color if within the time window
 * Only considers events from entities that are currently visible
 */
function getFenceColors(
  fenceId: string, 
  events: FenceEvent[], 
  showProviders: boolean, 
  showTrackables: boolean
): { fill: string; stroke: string } {
  const now = Date.now();
  
  // Find recent events for this fence (within last 3 seconds)
  // Only include events from visible entities
  const recentEvents = events.filter((event) => {
    if (event.fence_id !== fenceId) return false;
    
    // Filter by entity visibility
    const isProviderEvent = !!event.provider_id;
    const isTrackableEvent = !!event.trackable_id;
    
    // Skip if the entity type is hidden
    if (isProviderEvent && !showProviders) return false;
    if (isTrackableEvent && !showTrackables) return false;
    
    const eventTime = new Date(event.entry_time || event.exit_time || '').getTime();
    const timeDiff = now - eventTime;
    
    return timeDiff >= 0 && timeDiff <= RECENT_EVENT_WINDOW_MS;
  });

  // If no recent events, use default colors
  if (recentEvents.length === 0) {
    return { fill: DEFAULT_FILL, stroke: DEFAULT_STROKE };
  }

  // Get the most recent event
  const mostRecentEvent = recentEvents.reduce((latest, current) => {
    const latestTime = new Date(latest.entry_time || latest.exit_time || '').getTime();
    const currentTime = new Date(current.entry_time || current.exit_time || '').getTime();
    return currentTime > latestTime ? current : latest;
  });

  // Return color based on event type
  if (mostRecentEvent.event_type === 'region_entry') {
    return { fill: ENTRY_FILL, stroke: ENTRY_STROKE };
  } else {
    return { fill: EXIT_FILL, stroke: EXIT_STROKE };
  }
}

export default function FenceLayer({ 
  fences, 
  padding = 0, 
  events = [], 
  showProviders = true, 
  showTrackables = true,
  onFenceClick,
  selectedFenceId = null
}: FenceLayerProps) {
  // Force re-render to update fence colors after event time window expires
  const [, setTick] = useState(0);

  useEffect(() => {
    // Find the oldest recent event that's still within the time window
    const now = Date.now();
    let oldestRecentEventTime: number | null = null;

    events.forEach((event) => {
      const eventTime = new Date(event.entry_time || event.exit_time || '').getTime();
      const timeDiff = now - eventTime;
      
      // If event is within time window
      if (timeDiff >= 0 && timeDiff <= RECENT_EVENT_WINDOW_MS) {
        if (oldestRecentEventTime === null || eventTime < oldestRecentEventTime) {
          oldestRecentEventTime = eventTime;
        }
      }
    });

    // If we have a recent event, set a timer to update when it expires
    if (oldestRecentEventTime !== null) {
      const timeUntilExpiry = RECENT_EVENT_WINDOW_MS - (now - oldestRecentEventTime);
      
      if (timeUntilExpiry > 0) {
        const timer = setTimeout(() => {
          setTick(tick => tick + 1); // Force re-render
        }, timeUntilExpiry + 100); // Add 100ms buffer to ensure event has expired

        return () => clearTimeout(timer);
      }
    }
  }, [events]);

  return (
    <g id="fence-layer">
      {fences.map((fence) => {
        const colors = getFenceColors(fence.id, events, showProviders, showTrackables);
        
        if (fence.region.type === 'Point' && fence.radius) {
          // Circular fence
          const [cx, cy] = transformToSVG(fence.region, undefined, undefined, padding);
          const availableWidth = 800 - (padding * 2);
          const radiusPx = fence.radius * (availableWidth / 50); // Scale radius to pixels

          return (
            <g 
              key={fence.id}
              style={{ cursor: onFenceClick ? 'pointer' : 'default' }}
              onClick={(e: MouseEvent) => {
                if (onFenceClick) {
                  e.stopPropagation();
                  onFenceClick(fence, e.clientX, e.clientY);
                }
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={radiusPx}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="2"
              />
              {fence.name && (
                <text
                  x={cx}
                  y={cy - radiusPx - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill={colors.stroke}
                  fontWeight="bold"
                >
                  {fence.name}
                </text>
              )}
            </g>
          );
        } else if (fence.region.type === 'Polygon') {
          // Polygon fence
          const polygon = fence.region;
          const rings = polygon.coordinates;
          
          if (rings.length === 0) return null;

          // Use the first ring (exterior ring)
          const ring = rings[0];
          const points = ring
            .map((coord) => {
              const point = { type: 'Point' as const, coordinates: [coord[0], coord[1]] as [number, number] };
              const [x, y] = transformToSVG(point, undefined, undefined, padding);
              return `${x},${y}`;
            })
            .join(' ');

          // Calculate center for label
          let sumX = 0;
          let sumY = 0;
          ring.forEach((coord) => {
            sumX += coord[0];
            sumY += coord[1];
          });
          const centerX = sumX / ring.length;
          const centerY = sumY / ring.length;
          const [labelX, labelY] = transformToSVG({
            type: 'Point',
            coordinates: [centerX, centerY],
          }, undefined, undefined, padding);

          return (
            <g 
              key={fence.id}
              style={{ cursor: onFenceClick ? 'pointer' : 'default' }}
              onClick={(e: MouseEvent) => {
                if (onFenceClick) {
                  e.stopPropagation();
                  onFenceClick(fence, e.clientX, e.clientY);
                }
              }}
            >
              <polygon
                points={points}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="2"
              />
              {fence.name && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fill={colors.stroke}
                  fontWeight="bold"
                >
                  {fence.name}
                </text>
              )}
              
              {/* Point labels when fence is selected */}
              {selectedFenceId === fence.id && ring.slice(0, -1).map((coord, idx) => {
                // Skip the last point as it's the same as the first (closing point)
                const point = { type: 'Point' as const, coordinates: [coord[0], coord[1]] as [number, number] };
                const [px, py] = transformToSVG(point, undefined, undefined, padding);
                
                return (
                  <g key={`point-${idx}`}>
                    {/* Point circle with number inside */}
                    <circle
                      cx={px}
                      cy={py}
                      r="6"
                      fill="#ffffff"
                      stroke={colors.stroke}
                      strokeWidth="1.5"
                    />
                    {/* Point label inside circle */}
                    <text
                      x={px}
                      y={py + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fill={colors.stroke}
                      fontWeight="600"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        }

        return null;
      })}
    </g>
  );
}

