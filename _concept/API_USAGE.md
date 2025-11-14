# API Usage Guide

## Provider Location Updates

### Endpoint
```
POST http://localhost:3001/api/providers/{providerId}/location
```

### Important: Provider ID Validation

**The `provider_id` in the request body is optional. If provided, it MUST match the URL parameter. If not provided, the URL parameter will be used.**

### Coordinate Reference Systems (CRS)

The application supports two coordinate systems:

1. **Local coordinates** (`crs: "local"` or omitted): Coordinates in meters relative to the floor plan
   - Format: `[x, y]` where x and y are in meters
   - Example: `[25, 15]` means 25 meters east, 15 meters north from the floor plan origin

2. **WGS84 coordinates** (`crs: "EPSG:4326"`): Geographic coordinates (longitude, latitude)
   - Format: `[longitude, latitude]` in decimal degrees
   - Example: `[7.815694, 48.130216]` means 7.815694°E, 48.130216°N
   - The application automatically converts WGS84 to local coordinates using georeferencing

**Correct Usage - Local Coordinates:**
```http
POST http://localhost:3001/api/providers/0080E126/location
Content-Type: application/json

{
  "position": {
    "type": "Point",
    "coordinates": [20, 12]  // x, y in meters
  },
  "source": "zone-1",
  "provider_type": "ble-aoa",
  "provider_id": "0080E126",  // ← Optional: if provided, must match URL parameter
  "crs": "local",  // ← Optional: defaults to "local" if omitted
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

**Correct Usage - WGS84 Coordinates:**
```http
POST http://localhost:3001/api/providers/0080E126/location
Content-Type: application/json

{
  "position": {
    "type": "Point",
    "coordinates": [7.816000, 48.130250]  // [longitude, latitude] in decimal degrees
  },
  "source": "zone-1",
  "provider_type": "gps",
  "provider_id": "0080E126",
  "crs": "EPSG:4326",  // ← WGS84 coordinate system
  "floor": 0,
  "accuracy": 5.0,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

**Note:** When using WGS84 coordinates, the application automatically transforms them to local coordinates using the configured ground control points. The floor plan must be georeferenced (see configuration in `src/config/constants.ts`).

**Error Example - Mismatched IDs:**
```http
POST http://localhost:3001/api/providers/12346/location
Content-Type: application/json

{
  "provider_id": "0080E126",  // ← Different from URL parameter
  ...
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Provider ID mismatch",
  "message": "URL parameter provider_id (12346) does not match body provider_id (0080E126). They must be identical.",
  "urlProviderId": "12346",
  "bodyProviderId": "0080E126"
}
```

### Validation Rules

1. **`provider_id` is optional** in the request body
2. **If `provider_id` is provided in the body, it MUST match the URL parameter exactly**
3. **If `provider_id` is omitted from the body, the URL parameter will be used**
4. Requests with mismatched IDs return **400 Bad Request**

### Georeferencing

The floor plan is georeferenced using ground control points that map WGS84 coordinates to local coordinates. The georeferencing configuration is defined in `src/config/constants.ts`:

- **Zone Position**: The zone's position in WGS84 (EPSG:4326)
- **Ground Control Points**: Array of mappings between WGS84 (lon, lat) and local (x, y) coordinates

When a location update is received with `crs: "EPSG:4326"`, the application:
1. Transforms the WGS84 coordinates to local coordinates using the ground control points
2. Updates the location's `crs` field to `"local"`
3. Displays the position on the floor plan using the transformed local coordinates

## Trackable Location Updates

### Endpoint
```
POST http://localhost:3001/api/trackables/{trackableId}/location
```

For trackables, the URL parameter is used as the trackable identifier since the Location object doesn't contain a trackable_id field.

**Example:**
```http
POST http://localhost:3001/api/trackables/aff39ab4-1234-5678-90ab-cdef12345678/location
Content-Type: application/json

{
  "position": {
    "type": "Point",
    "coordinates": [30, 20]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0
}
```

## Why This Design?

According to the Omlox API specification:
- The Location object contains a `provider_id` field that identifies which provider generated this location
- The URL parameter `{provider_id}` is used for RESTful resource identification
- The body's `provider_id` is the authoritative source since it's part of the Location data model
- This allows the same endpoint to handle location updates where the provider_id in the body is the source of truth

## Error Handling

### Provider ID Mismatch

If `provider_id` is provided in the body but doesn't match the URL parameter:
```json
{
  "success": false,
  "error": "Provider ID mismatch",
  "message": "URL parameter provider_id (12346) does not match body provider_id (0080E126). They must be identical when body provider_id is provided.",
  "urlProviderId": "12346",
  "bodyProviderId": "0080E126"
}
```

### Unsupported CRS

If an unsupported coordinate reference system is used, the application will log a warning and attempt to use the coordinates as-is. Supported CRS:
- `"local"` (default if omitted)
- `"EPSG:4326"` (WGS84)

### Georeferencing Errors

If WGS84 coordinates are provided but the floor plan is not properly georeferenced (insufficient ground control points), the transformation may be inaccurate. Ensure at least 2 ground control points are configured.

