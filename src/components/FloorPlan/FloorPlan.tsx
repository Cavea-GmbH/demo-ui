import { Box, Paper, Typography } from '@mui/material';
import { useState, MouseEvent } from 'react';
import { getSVGViewBox, SVG_WIDTH, SVG_HEIGHT, screenToSVG } from '../../utils/coordinateTransform';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT, ZONE_GEOREFERENCE } from '../../config/constants';
import { localToWgs84 } from '../../utils/georeferencing';
import FenceLayer from './FenceLayer';
import TagLayer from './TagLayer';
import type { Fence, Location, LocationProvider, Trackable } from '../../types/omlox';
import type { LabelDisplayMode } from '../SettingsDialog/SettingsDialog';

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
  animateMovement: boolean;
  labelDisplay: LabelDisplayMode;
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
  animateMovement,
  labelDisplay,
  fenceEvents = [],
}: FloorPlanProps) {
  // Tooltip state for coordinate display
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    localX?: number;
    localY?: number;
    lon?: number;
    lat?: number;
    entityName?: string;
    entityType?: string;
    fenceCoordinates?: string;
  } | null>(null);

  // Selected fence for showing point labels
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);

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
    setSelectedFenceId(null);
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

  // Handle click on fence
  const handleFenceClick = (fence: Fence, screenX: number, screenY: number) => {
    let coordinatesStr = '';
    
    if (fence.region.type === 'Polygon') {
      // Format polygon coordinates
      const ring = fence.region.coordinates[0];
      coordinatesStr = ring
        .map((coord, idx) => `Point ${idx + 1}: [${coord[0]}, ${coord[1]}]m`)
        .join('\n');
    } else if (fence.region.type === 'Point' && fence.radius) {
      // Format circular fence
      const [x, y] = fence.region.coordinates as [number, number];
      coordinatesStr = `Center: [${x}, ${y}]m\nRadius: ${fence.radius}m`;
    }

    // Set selected fence to show point labels
    setSelectedFenceId(fence.id);

    setTooltip({
      x: screenX,
      y: screenY,
      entityName: fence.name || fence.id,
      entityType: fence.region.type === 'Polygon' ? 'Polygon Fence' : 'Circular Fence',
      fenceCoordinates: coordinatesStr,
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #E8EEF2 0%, #F0F4F8 100%)',
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
              stroke="rgba(10, 77, 140, 0.12)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </pattern>
        </defs>

        {/* Layer 1: Background container with subtle gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#E8EEF2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F0F4F8', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGradient)" />

        {/* Layer 2: Floor plan with modern styling */}
        <g id="floor-plan-area">
          {/* White background with subtle shadow effect */}
          <rect
            x={floorPlanX}
            y={floorPlanY}
            width={floorPlanWidth}
            height={floorPlanHeight}
            fill="#FFFFFF"
            rx={8}
            ry={8}
          />
          
          {/* Inner shadow effect */}
          <rect
            x={floorPlanX}
            y={floorPlanY}
            width={floorPlanWidth}
            height={floorPlanHeight}
            fill="none"
            stroke="rgba(10, 77, 140, 0.08)"
            strokeWidth="1"
            rx={8}
            ry={8}
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
          <g id="gcp-labels" style={{ fontSize: '9px', fill: '#5F6F87', fontFamily: 'Inter, monospace', fontWeight: 500 }}>
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
              onFenceClick={handleFenceClick}
              selectedFenceId={selectedFenceId}
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
            animateMovement={animateMovement}
            labelDisplay={labelDisplay}
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
            padding: 2,
            zIndex: 2000,
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(10, 77, 140, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(10, 77, 140, 0.12)',
            borderRadius: 3,
            minWidth: 200,
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
          {tooltip.fenceCoordinates ? (
            <>
              <Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5, mt: 0.5, color: 'text.primary' }}>
                Coordinates
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '10px', color: 'text.secondary', whiteSpace: 'pre-line' }}>
                {tooltip.fenceCoordinates}
              </Box>
            </>
          ) : (
            <>
              <Typography variant="caption" component="div" sx={{ fontWeight: 600, mb: 0.5, mt: tooltip.entityName ? 0.5 : 0, color: 'text.primary' }}>
                Coordinates
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                Local: {tooltip.localX?.toFixed(2)}m, {tooltip.localY?.toFixed(2)}m
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '10px' }}>
                Lat: {tooltip.lat?.toFixed(6)}°N
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '10px' }}>
                Lon: {tooltip.lon?.toFixed(6)}°E
              </Typography>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
