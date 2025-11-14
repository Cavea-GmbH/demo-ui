import type { Location, LocationProvider, Trackable } from '../../types/omlox';
import { transformToSVG, SVG_WIDTH } from '../../utils/coordinateTransform';
import { MouseEvent } from 'react';

interface TagLayerProps {
  providers: LocationProvider[];
  trackables: Trackable[];
  providerLocations: Map<string, Location>;
  trackableLocations: Map<string, Location>;
  showProviders: boolean;
  showTrackables: boolean;
  padding?: number;
  onEntityClick: (location: Location, entityName: string, entityType: string, screenX: number, screenY: number) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  uwb: '#2196f3',
  ble: '#9c27b0',
  'ble-aoa': '#9c27b0',
  'ble-mesh': '#9c27b0',
  rfid: '#f44336',
  ibeacon: '#ff9800',
  wifi: '#4caf50',
  gps: '#00bcd4',
  virtual: '#9e9e9e',
  unknown: '#757575',
};

export default function TagLayer({
  providers,
  trackables,
  providerLocations,
  trackableLocations,
  showProviders,
  showTrackables,
  padding = 0,
  onEntityClick,
}: TagLayerProps) {
  return (
    <g id="tag-layer">
      {/* Render providers */}
      {showProviders &&
        providers.map((provider) => {
          const location = providerLocations.get(provider.id);
          if (!location) return null;

          // Validate coordinates are valid numbers
          const [x, y] = transformToSVG(location.position, undefined, undefined, padding);
          if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
            console.error(`Invalid coordinates for provider ${provider.id}:`, location.position);
            return null;
          }

          // Check if coordinates are within reasonable bounds (allow some margin for off-floor positions)
          if (x < -100 || x > 900 || y < -100 || y > 580) {
            console.warn(`Provider ${provider.id} coordinates out of bounds: [${x.toFixed(2)}, ${y.toFixed(2)}]`);
            console.warn(`  Location:`, location);
          }

          const color = PROVIDER_COLORS[provider.type] || PROVIDER_COLORS.unknown;

          return (
            <g 
              key={`provider-${provider.id}`}
              style={{ cursor: 'pointer' }}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onEntityClick(location, provider.name || provider.id, `Provider: ${provider.type}`, e.clientX, e.clientY);
              }}
            >
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
              />
              {(provider.name || provider.id) && (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={color}
                  fontWeight="bold"
                >
                  {provider.name || provider.id.slice(0, 8)}
                </text>
              )}
              <text
                x={x}
                y={y + 20}
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                {provider.type}
              </text>
            </g>
          );
        })}

      {/* Render trackables */}
      {showTrackables &&
        trackables.map((trackable) => {
          const location = trackableLocations.get(trackable.id);
          if (!location) return null;

          // Validate coordinates are valid numbers
          const [x, y] = transformToSVG(location.position, undefined, undefined, padding);
          if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
            console.error(`Invalid coordinates for trackable ${trackable.id}:`, location.position);
            return null;
          }

          // Check if coordinates are within reasonable bounds
          if (x < -100 || x > 900 || y < -100 || y > 580) {
            console.warn(`Trackable ${trackable.id} coordinates out of bounds: [${x.toFixed(2)}, ${y.toFixed(2)}]`);
            console.warn(`  Location:`, location);
          }

          const availableWidth = SVG_WIDTH - (padding * 2);
          const radius = trackable.radius ? trackable.radius * (availableWidth / 50) : 10;

          return (
            <g 
              key={`trackable-${trackable.id}`}
              style={{ cursor: 'pointer' }}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onEntityClick(location, trackable.name || trackable.id, `Trackable: ${trackable.type}`, e.clientX, e.clientY);
              }}
            >
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="rgba(33, 150, 243, 0.3)"
                stroke="#2196f3"
                strokeWidth="2"
              />
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="#2196f3"
                stroke="#fff"
                strokeWidth="2"
              />
              {(trackable.name || trackable.id) && (
                <text
                  x={x}
                  y={y - radius - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#2196f3"
                  fontWeight="bold"
                >
                  {trackable.name || trackable.id.slice(0, 8)}
                </text>
              )}
            </g>
          );
        })}
    </g>
  );
}
