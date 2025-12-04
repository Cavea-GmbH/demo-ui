# API Reference

## Location Update Endpoints

### Update Provider Location

```
PUT /api/providers/{providerId}/location
```

**Example:**
```bash
curl -X PUT http://localhost:3001/api/providers/TAG001/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"type": "Point", "coordinates": [25, 15]},
    "provider_type": "uwb",
    "crs": "local",
    "floor": 0,
    "accuracy": 1.5
  }'
```

### Update Trackable Location

```
PUT /api/trackables/{trackableId}/location
```

**Example:**
```bash
curl -X PUT http://localhost:3001/api/trackables/asset-001/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"type": "Point", "coordinates": [30, 20]},
    "provider_type": "ble",
    "crs": "local",
    "floor": 0
  }'
```

---

## Coordinate Systems

### Local Coordinates (`crs: "local"`)
- Format: `[x, y]` in meters
- Origin: Bottom-left corner of floor plan
- Example: `[25, 15]` = 25m east, 15m north

### WGS84 Coordinates (`crs: "EPSG:4326"`)
- Format: `[longitude, latitude]`
- Automatically converted to local using ground control points
- Example: `[7.815694, 48.130216]`

---

## Request Body Schema

```json
{
  "position": {
    "type": "Point",
    "coordinates": [x, y]    // [lon, lat] for WGS84
  },
  "provider_id": "TAG001",   // Optional, must match URL if provided
  "provider_type": "uwb",    // uwb, ble, gps, wirepas
  "source": "zone-1",        // Optional
  "crs": "local",            // local or EPSG:4326
  "floor": 0,
  "accuracy": 1.5,           // Optional, in meters
  "timestamp_generated": "2024-01-15T10:30:00.000Z"  // Optional
}
```

---

## CRUD Endpoints

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/summary` | List all providers |
| GET | `/api/providers/{id}` | Get provider by ID |
| POST | `/api/providers` | Create provider |
| DELETE | `/api/providers/{id}` | Delete provider |

### Trackables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trackables/summary` | List all trackables |
| GET | `/api/trackables/{id}` | Get trackable by ID |
| POST | `/api/trackables` | Create trackable |
| DELETE | `/api/trackables/{id}` | Delete trackable |

### Fences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fences/summary` | List all fences |
| POST | `/api/fences` | Create fence |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get current configuration |
| GET | `/health` | Health check |
| GET | `/events` | SSE stream for real-time updates |

---

## Postman Setup

1. Create collection "Demo UI"
2. Add environment variable: `base_url` = `http://localhost:3001`

**Provider Location Update:**
- Method: PUT
- URL: `{{base_url}}/api/providers/TAG001/location`
- Body: Raw JSON (see examples above)

---

## Testing Fence Events

Send location updates to trigger fence entry/exit:

```bash
# Outside fence
curl -X PUT http://localhost:3001/api/providers/TAG001/location \
  -H "Content-Type: application/json" \
  -d '{"position": {"type": "Point", "coordinates": [5, 5]}, "crs": "local", "floor": 0}'

# Inside fence (triggers entry event)
curl -X PUT http://localhost:3001/api/providers/TAG001/location \
  -H "Content-Type: application/json" \
  -d '{"position": {"type": "Point", "coordinates": [20, 10]}, "crs": "local", "floor": 0}'

# Back outside (triggers exit event)
curl -X PUT http://localhost:3001/api/providers/TAG001/location \
  -H "Content-Type: application/json" \
  -d '{"position": {"type": "Point", "coordinates": [5, 5]}, "crs": "local", "floor": 0}'
```

Watch the Event Log panel for entry/exit events.

