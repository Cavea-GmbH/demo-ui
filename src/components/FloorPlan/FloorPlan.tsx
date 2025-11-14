import { Box, Paper, Typography } from '@mui/material';
import { useState, MouseEvent } from 'react';
import { getSVGViewBox, SVG_WIDTH, SVG_HEIGHT, transformToSVG, screenToSVG } from '../../utils/coordinateTransform';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT, ZONE_GEOREFERENCE } from '../../config/constants';
import { localToWgs84 } from '../../utils/georeferencing';
import FenceLayer from './FenceLayer';
import TagLayer from './TagLayer';
import type { Fence, Location, LocationProvider, Trackable } from '../../types/omlox';

interface FloorPlanProps {
  fences: Fence[];
  providers: LocationProvider[];
  trackables: Trackable[];
  providerLocations: Map<string, Location>;
  trackableLocations: Map<string, Location>;
  showProviders: boolean;
  showTrackables: boolean;
  showFences: boolean;
  showGrid: boolean;
  fenceEvents?: import('../../types/omlox').FenceEvent[];
}

export default function FloorPlan({
  fences,
  providers,
  trackables,
  providerLocations,
  trackableLocations,
  showProviders,
  showTrackables,
  showFences,
  showGrid,
  fenceEvents = [],
}: FloorPlanProps) {
  // Tooltip state for coordinate display
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    localX: number;
    localY: number;
    lon: number;
    lat: number;
    entityName?: string;
    entityType?: string;
  } | null>(null);

  // Padding around the floor plan (in SVG pixels)
  const padding = 20;
  
  // Calculate floor plan bounds in SVG coordinates with padding
  // The floor plan area is smaller to leave grey space around all edges
  const floorPlanX = padding; // Left edge with padding
  const floorPlanY = padding; // Top edge with padding
  const floorPlanWidth = SVG_WIDTH - (padding * 2); // Width minus padding on both sides
  const floorPlanHeight = SVG_HEIGHT - (padding * 2); // Height minus padding on both sides

  // Grid cell size in meters (5m grid)
  const gridCellSizeMeters = 5;
  const gridCellSizePixelsX = (gridCellSizeMeters / FLOOR_PLAN_WIDTH) * floorPlanWidth;
  const gridCellSizePixelsY = (gridCellSizeMeters / FLOOR_PLAN_HEIGHT) * floorPlanHeight;

  // Handle right-click on floor plan
  const handleContextMenu = (event: MouseEvent<SVGSVGElement>) => {
    event.preventDefault();

    // Convert screen coordinates to SVG viewBox coordinates
    const [svgX, svgY] = screenToSVG(event.clientX, event.clientY, event.currentTarget);

    // Check if click is within the floor plan area (not in padding)
    if (
      svgX < floorPlanX ||
      svgX > floorPlanX + floorPlanWidth ||
      svgY < floorPlanY ||
      svgY > floorPlanY + floorPlanHeight
    ) {
      setTooltip(null);
      return;
    }

    // Convert SVG coordinates to local (meters) coordinates
    // Reverse the transformToSVG calculation
    const scaleToLocalX = FLOOR_PLAN_WIDTH / floorPlanWidth;
    const scaleToLocalY = FLOOR_PLAN_HEIGHT / floorPlanHeight;
    
    const localX = (svgX - floorPlanX) * scaleToLocalX;
    // Y-axis is flipped in SVG (top = 0, bottom = max)
    const localY = (floorPlanY + floorPlanHeight - svgY) * scaleToLocalY;

    // Convert local to WGS84
    const wgs84Result = localToWgs84(
      { type: 'Point', coordinates: [localX, localY] },
      ZONE_GEOREFERENCE
    );

    const [lon, lat] = wgs84Result.coordinates as [number, number];

    setTooltip({
      x: event.clientX,
      y: event.clientY,
      localX,
      localY,
      lon,
      lat,
    });
  };

  // Hide tooltip on regular click or when mouse leaves
  const handleClick = () => {
    setTooltip(null);
  };

  // Handle click on provider/trackable icon
  const handleEntityClick = (location: Location, entityName: string, entityType: string, screenX: number, screenY: number) => {
    const [localX, localY] = location.position.coordinates as [number, number];
    
    // Convert local to WGS84
    const wgs84Result = localToWgs84(location.position, ZONE_GEOREFERENCE);
    const [lon, lat] = wgs84Result.coordinates as [number, number];

    setTooltip({
      x: screenX,
      y: screenY,
      localX,
      localY,
      lon,
      lat,
      entityName,
      entityType,
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={getSVGViewBox()}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', cursor: 'crosshair' }}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        <defs>
          {/* 5x5 meter grid pattern - aligned to bottom-left corner of floor plan */}
          <pattern
            id="grid-5m"
            width={gridCellSizePixelsX}
            height={gridCellSizePixelsY}
            patternUnits="userSpaceOnUse"
            x={floorPlanX}
            y={floorPlanY + floorPlanHeight}
          >
            <path
              d={`M ${gridCellSizePixelsX} 0 L 0 0 0 ${gridCellSizePixelsY}`}
              fill="none"
              stroke="#d0d0d0"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Layer 1: Grey background container (padding area) - darker for better contrast */}
        <rect width="100%" height="100%" fill="#e0e0e0" />

        {/* Layer 2: Floor plan (white background + grid) */}
        <g id="floor-plan-area">
          {/* White background */}
          <rect
            x={floorPlanX}
            y={floorPlanY}
            width={floorPlanWidth}
            height={floorPlanHeight}
            fill="#ffffff"
          />
          
          {/* 5x5 meter grid - starts at bottom left (0,0 in local coordinates) */}
          {showGrid && (
            <rect
              x={floorPlanX}
              y={floorPlanY}
              width={floorPlanWidth}
              height={floorPlanHeight}
              fill="url(#grid-5m)"
            />
          )}
        </g>

        {/* Ground Control Point Labels - shown outside the floor plan in padding area */}
        {showGrid && (
          <g id="gcp-labels" style={{ fontSize: '9px', fill: '#666', fontFamily: 'monospace' }}>
            {/* Bottom-left corner (0, 0) */}
            {ZONE_GEOREFERENCE.groundControlPoints[0] && (
              <g>
                <text x={floorPlanX - 5} y={floorPlanY + floorPlanHeight + 10} textAnchor="end" style={{ fontSize: '8px' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[0].local[0]}, {ZONE_GEOREFERENCE.groundControlPoints[0].local[1]}m
                </text>
                <text x={floorPlanX - 5} y={floorPlanY + floorPlanHeight + 18} textAnchor="end" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[0].wgs84[1].toFixed(6)}°N
                </text>
                <text x={floorPlanX - 5} y={floorPlanY + floorPlanHeight + 25} textAnchor="end" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[0].wgs84[0].toFixed(6)}°E
                </text>
              </g>
            )}

            {/* Bottom-right corner (50, 0) */}
            {ZONE_GEOREFERENCE.groundControlPoints[1] && (
              <g>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY + floorPlanHeight + 10} textAnchor="start" style={{ fontSize: '8px' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[1].local[0]}, {ZONE_GEOREFERENCE.groundControlPoints[1].local[1]}m
                </text>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY + floorPlanHeight + 18} textAnchor="start" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[1].wgs84[1].toFixed(6)}°N
                </text>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY + floorPlanHeight + 25} textAnchor="start" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[1].wgs84[0].toFixed(6)}°E
                </text>
              </g>
            )}

            {/* Top-left corner (0, 30) */}
            {ZONE_GEOREFERENCE.groundControlPoints[2] && (
              <g>
                <text x={floorPlanX - 5} y={floorPlanY - 10} textAnchor="end" style={{ fontSize: '8px' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[2].local[0]}, {ZONE_GEOREFERENCE.groundControlPoints[2].local[1]}m
                </text>
                <text x={floorPlanX - 5} y={floorPlanY - 2} textAnchor="end" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[2].wgs84[1].toFixed(6)}°N
                </text>
                <text x={floorPlanX - 5} y={floorPlanY + 6} textAnchor="end" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[2].wgs84[0].toFixed(6)}°E
                </text>
              </g>
            )}

            {/* Top-right corner (50, 30) */}
            {ZONE_GEOREFERENCE.groundControlPoints[3] && (
              <g>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY - 10} textAnchor="start" style={{ fontSize: '8px' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[3].local[0]}, {ZONE_GEOREFERENCE.groundControlPoints[3].local[1]}m
                </text>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY - 2} textAnchor="start" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[3].wgs84[1].toFixed(6)}°N
                </text>
                <text x={floorPlanX + floorPlanWidth + 5} y={floorPlanY + 6} textAnchor="start" style={{ fontSize: '7px', fill: '#999' }}>
                  {ZONE_GEOREFERENCE.groundControlPoints[3].wgs84[0].toFixed(6)}°E
                </text>
              </g>
            )}
          </g>
        )}

        {/* Content layers - need custom transform to account for padding */}
        <g id="content-layers">
          {/* Fence layer */}
          {showFences && (
            <FenceLayer 
              fences={fences} 
              padding={padding} 
              events={fenceEvents}
              showProviders={showProviders}
              showTrackables={showTrackables}
            />
          )}

          {/* Tag layer (providers and trackables) */}
          <TagLayer
            providers={providers}
            trackables={trackables}
            providerLocations={providerLocations}
            trackableLocations={trackableLocations}
            showProviders={showProviders}
            showTrackables={showTrackables}
            padding={padding}
            onEntityClick={handleEntityClick}
          />
        </g>
      </svg>

      {/* Coordinate Tooltip */}
      {tooltip && (
        <Paper
          sx={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            padding: 1.5,
            zIndex: 2000,
            pointerEvents: 'none',
            boxShadow: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            minWidth: 180,
          }}
        >
          {tooltip.entityName && (
            <Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5, color: 'primary.main' }}>
              {tooltip.entityName}
            </Typography>
          )}
          {tooltip.entityType && (
            <Typography variant="caption" component="div" sx={{ fontSize: '9px', mb: 0.5, color: 'text.secondary', textTransform: 'uppercase' }}>
              {tooltip.entityType}
            </Typography>
          )}
          <Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5, mt: tooltip.entityName ? 0.5 : 0, color: 'text.primary' }}>
            Coordinates
          </Typography>
          <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            Local: {tooltip.localX.toFixed(2)}m, {tooltip.localY.toFixed(2)}m
          </Typography>
          <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '10px' }}>
            Lat: {tooltip.lat.toFixed(6)}°N
          </Typography>
          <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '10px' }}>
            Lon: {tooltip.lon.toFixed(6)}°E
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
