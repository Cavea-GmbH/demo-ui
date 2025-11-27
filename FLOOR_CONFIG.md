# Floor Plan Configuration Guide

This guide explains how to configure your floor plan georeferencing using environment variables for different deployments.

## Overview

The Cavea Demo UI supports environment-based floor plan configuration, allowing you to deploy the same application with different floor plans across multiple servers. If no environment variables are set, the application falls back to sensible default values.

## Configuration Files

- **Source**: `src/config/floorConfig.ts` - Handles environment variable parsing and fallback logic
- **Export**: `src/config/constants.ts` - Re-exports configuration for use throughout the app
- **Environment**: `.env` or deployment environment variables

## Environment Variables

### Required Variables (with defaults)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_FLOOR_WIDTH` | Floor plan width in meters | `50` | `50` |
| `VITE_FLOOR_LENGTH` | Floor plan length in meters | `30` | `30` |
| `VITE_ZONE_POSITION` | Reference position in WGS84 [lon, lat] | `[7.815694, 48.130216]` | `[7.815694, 48.130216]` |
| `VITE_GROUND_CONTROL_POINTS` | Array of GCPs mapping WGS84 to local coordinates | See below | See below |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_ZONE_ID` | Optional zone identifier | `undefined` | `building-1-floor-0` |
| `VITE_DEMO_FENCES` | Array of fence definitions (for demo/testing) | Single test fence | See below |

## Ground Control Points (GCPs)

Ground control points are the key to accurate georeferencing. They map known GPS (WGS84) coordinates to local meter-based coordinates on your floor plan.

### Requirements

- **Minimum**: 2 GCPs (e.g., two opposite corners)
- **Recommended**: 4 GCPs (all four corners for best accuracy)

### GCP Structure

```json
{
  "wgs84": [longitude, latitude],
  "local": [x, y]
}
```

- `wgs84`: GPS coordinates in WGS84 format [longitude, latitude]
- `local`: Local coordinates in meters [x, y] from floor plan origin (0, 0)

## Configuration Examples

### Example 1: Default Floor (50m × 30m)

```bash
# .env
VITE_FLOOR_WIDTH=50
VITE_FLOOR_LENGTH=30
VITE_ZONE_POSITION=[7.815694, 48.130216]
VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]
```

### Example 2: Larger Warehouse (100m × 60m)

```bash
# .env
VITE_FLOOR_WIDTH=100
VITE_FLOOR_LENGTH=60
VITE_ZONE_ID=warehouse-a
VITE_ZONE_POSITION=[7.820000, 48.135000]
VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.820000,48.135000],"local":[0,0]},{"wgs84":[7.821500,48.135000],"local":[100,0]},{"wgs84":[7.820000,48.135600],"local":[0,60]},{"wgs84":[7.821500,48.135600],"local":[100,60]}]
```

### Example 3: Compact Office (20m × 15m)

```bash
# .env
VITE_FLOOR_WIDTH=20
VITE_FLOOR_LENGTH=15
VITE_ZONE_ID=office-building-2-floor-3
VITE_ZONE_POSITION=[7.817000, 48.132000]
VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.817000,48.132000],"local":[0,0]},{"wgs84":[7.817200,48.132000],"local":[20,0]},{"wgs84":[7.817000,48.132150],"local":[0,15]},{"wgs84":[7.817200,48.132150],"local":[20,15]}]
```

## Demo Fences (Optional)

You can optionally configure demo fences to be loaded on startup. This is useful for testing and demonstration purposes.

### Fence Structure

```json
{
  "id": "fence-1",
  "name": "Test Fence",
  "region": {
    "type": "Polygon",
    "coordinates": [[[x1,y1], [x2,y2], [x3,y3], [x4,y4], [x1,y1]]]
  },
  "floor": 0,
  "crs": "local"
}
```

### Example: Single Rectangle Fence

```bash
VITE_DEMO_FENCES=[{"id":"fence-1","name":"Test Fence 1","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]
```

### Example: Multiple Fences

```bash
VITE_DEMO_FENCES=[{"id":"fence-1","name":"Storage Area","region":{"type":"Polygon","coordinates":[[[10,10],[30,10],[30,20],[10,20],[10,10]]]},"floor":0,"crs":"local"},{"id":"fence-2","name":"Loading Zone","region":{"type":"Polygon","coordinates":[[[35,5],[45,5],[45,15],[35,15],[35,5]]]},"floor":0,"crs":"local"}]
```

**Notes:**
- Coordinates are in local meters (x, y)
- For polygons, the first and last coordinate must be the same (closed loop)
- `crs` should be `"local"` for meter-based coordinates
- If not set, a default test fence will be loaded

## How to Configure Your Floor

### Step 1: Measure Floor Dimensions

Determine the width and length of your floor plan in meters.

```bash
VITE_FLOOR_WIDTH=50
VITE_FLOOR_LENGTH=30
```

### Step 2: Identify Ground Control Points

Find at least 2 (preferably 4) points on your floor with known GPS coordinates. Good candidates:
- Building corners
- Entrance/exit points
- Landmarks visible on satellite imagery

### Step 3: Map GPS to Local Coordinates

For each GCP, determine:
1. **GPS Coordinates**: Use GPS device, Google Maps, or building plans
2. **Local Coordinates**: Measure distance from floor plan origin (usually bottom-left = 0,0)

### Step 4: Create GCP JSON

Format your GCPs as a JSON array:

```json
[
  {"wgs84": [7.815694, 48.130216], "local": [0, 0]},
  {"wgs84": [7.816551, 48.130216], "local": [50, 0]},
  {"wgs84": [7.815694, 48.13031], "local": [0, 30]},
  {"wgs84": [7.816551, 48.13031], "local": [50, 30]}
]
```

**Important**: Minify the JSON (remove line breaks) for the environment variable:

```bash
VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]
```

### Step 5: Set Zone Position

Choose a reference position for the zone (typically the center or bottom-left corner):

```bash
VITE_ZONE_POSITION=[7.815694, 48.130216]
```

## Deployment

### Docker Deployment

Pass environment variables to the Docker container:

```bash
docker run -d \
  -e VITE_FLOOR_WIDTH=50 \
  -e VITE_FLOOR_LENGTH=30 \
  -e VITE_ZONE_POSITION='[7.815694, 48.130216]' \
  -e VITE_GROUND_CONTROL_POINTS='[{"wgs84":[7.815694,48.130216],"local":[0,0]},...]' \
  cavea-demo-ui
```

### AWS App Runner

Set environment variables in the App Runner service configuration via AWS Console or CLI.

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  demo-ui:
    image: cavea-demo-ui
    environment:
      - VITE_FLOOR_WIDTH=50
      - VITE_FLOOR_LENGTH=30
      - VITE_ZONE_POSITION=[7.815694, 48.130216]
      - VITE_GROUND_CONTROL_POINTS=[{"wgs84":[7.815694,48.130216],"local":[0,0]},...]
```

### GitHub Actions

Update `.github/workflows/deploy.yml` to set build-time environment variables:

```yaml
- name: Build Docker image
  run: |
    docker build \
      --build-arg VITE_FLOOR_WIDTH=50 \
      --build-arg VITE_FLOOR_LENGTH=30 \
      --build-arg VITE_ZONE_POSITION='[7.815694, 48.130216]' \
      --build-arg VITE_GROUND_CONTROL_POINTS='[...]' \
      -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
```

**Note**: You may also need to update your Dockerfile to accept build args:

```dockerfile
ARG VITE_FLOOR_WIDTH
ARG VITE_FLOOR_LENGTH
ARG VITE_ZONE_POSITION
ARG VITE_GROUND_CONTROL_POINTS
ENV VITE_FLOOR_WIDTH=$VITE_FLOOR_WIDTH
ENV VITE_FLOOR_LENGTH=$VITE_FLOOR_LENGTH
ENV VITE_ZONE_POSITION=$VITE_ZONE_POSITION
ENV VITE_GROUND_CONTROL_POINTS=$VITE_GROUND_CONTROL_POINTS
```

## Fallback Behavior

If environment variables are not set, the application uses these default values:

- **Floor Width**: 50 meters
- **Floor Length**: 30 meters
- **Zone Position**: [7.815694, 48.130216]
- **GCPs**: 4 corner points forming a 50m × 30m rectangle

This ensures the application works out-of-the-box without configuration.

## Validation

The configuration module validates environment variables and logs warnings if:
- Values cannot be parsed
- GCP structure is invalid
- Required fields are missing

Check browser console (Development) or logs (Production) for configuration status:

```
🗺️ Floor configuration loaded:
   Width: 50m
   Length: 30m
   Zone ID: none
   GCPs: 4 points
```

## Troubleshooting

### GCPs not loading from environment

- Ensure JSON is properly minified (no line breaks)
- Escape quotes if needed for your shell/deployment tool
- Verify JSON structure with a validator

### Georeferencing inaccurate

- Add more GCPs (4 corners recommended)
- Verify GPS coordinates are correct
- Check local coordinate measurements
- Ensure local coordinates match floor plan dimensions

### Changes not applying

- **Development**: Restart Vite dev server
- **Production**: Rebuild Docker image with new env vars
- **Browser**: Clear cache and hard refresh

## Support

For questions or issues with floor configuration, refer to:
- Main README: `README.md`
- Georeferencing source: `src/utils/georeferencing.ts`
- Configuration source: `src/config/floorConfig.ts`

