# Postman Examples for Pushing Location Data

This guide shows you how to push location data to the application using Postman.

## Setup

1. **Start the proxy server** (in a separate terminal):
   ```bash
   npm run dev:proxy
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend app**:
   ```bash
   npm run dev
   ```
   The app will automatically connect to the proxy server via Server-Sent Events.

## Postman Request Examples

### 1. Push Provider Location Update

**Request Type:** `POST`

**URL:** 
```
http://localhost:3001/api/providers/{providerId}/location
```

**Example URL:**
```
http://localhost:3001/api/providers/0080E126/location
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "position": {
    "type": "Point",
    "coordinates": [25, 15]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location update forwarded for provider 0080E126",
  "clientsConnected": 1
}
```

---

### 2. Push Trackable Location Update

**Request Type:** `POST`

**URL:** 
```
http://localhost:3001/api/trackables/{trackableId}/location
```

**Example URL:**
```
http://localhost:3001/api/trackables/aff39ab4-1234-5678-90ab-cdef12345678/location
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "position": {
    "type": "Point",
    "coordinates": [30, 20]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0,
  "accuracy": 2.0,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location update forwarded for trackable aff39ab4-1234-5678-90ab-cdef12345678",
  "clientsConnected": 1
}
```

---

### 3. Health Check

**Request Type:** `GET`

**URL:** 
```
http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "clientsConnected": 1
}
```

---

## Example: Moving a Provider

To simulate a provider moving across the floor plan, send multiple requests with different coordinates:

**Request 1** - Provider at position (10, 15):
```json
{
  "position": {
    "type": "Point",
    "coordinates": [10, 15]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

**Request 2** - Provider at position (20, 15):
```json
{
  "position": {
    "type": "Point",
    "coordinates": [20, 15]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:05.000Z"
}
```

**Request 3** - Provider at position (30, 15):
```json
{
  "position": {
    "type": "Point",
    "coordinates": [30, 15]
  },
  "source": "zone-1",
  "provider_type": "uwb",
  "provider_id": "0080E126",
  "crs": "local",
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:10.000Z"
}
```

---

## Postman Collection Setup

1. **Create a new Collection** in Postman named "Omlox RTLS Demo"

2. **Add Environment Variables:**
   - `base_url`: `http://localhost:3001`
   - `provider_id`: `0080E126`
   - `trackable_id`: `aff39ab4-1234-5678-90ab-cdef12345678`

3. **Create Requests:**

   **Provider Location Update:**
   - Method: `POST`
   - URL: `{{base_url}}/api/providers/{{provider_id}}/location`
   - Body: Use the JSON examples above

   **Trackable Location Update:**
   - Method: `POST`
   - URL: `{{base_url}}/api/trackables/{{trackable_id}}/location`
   - Body: Use the JSON examples above

---

## Testing Fence Entry/Exit

To test fence detection, send location updates that move a provider or trackable into and out of fences:

1. **Outside fence** (e.g., coordinates [5, 5]):
   ```json
   {
     "position": { "type": "Point", "coordinates": [5, 5] },
     "source": "zone-1",
     "provider_type": "uwb",
     "provider_id": "0080E126",
     "crs": "local",
     "floor": 0
   }
   ```

2. **Inside fence** (e.g., coordinates [15, 10] - inside "Restricted Area 1"):
   ```json
   {
     "position": { "type": "Point", "coordinates": [15, 10] },
     "source": "zone-1",
     "provider_type": "uwb",
     "provider_id": "0080E126",
     "crs": "local",
     "floor": 0
   }
   ```

3. **Back outside fence** (e.g., coordinates [5, 5]):
   ```json
   {
     "position": { "type": "Point", "coordinates": [5, 5] },
     "source": "zone-1",
     "provider_type": "uwb",
     "provider_id": "0080E126",
     "crs": "local",
     "floor": 0
   }
   ```

You should see fence entry and exit events appear in the Event Log panel!

---

## Coordinate System

The floor plan uses **local coordinates** in meters:
- **X-axis**: 0 to 50 meters (left to right)
- **Y-axis**: 0 to 30 meters (bottom to top)

**Hardcoded Fences:**
- **Restricted Area 1**: Rectangle from (10, 5) to (25, 15)
- **Restricted Area 2**: Circle at (35, 20) with 5m radius
- **Entry Zone**: Rectangle from (0, 0) to (10, 10)

---

## Troubleshooting

1. **No updates appearing in UI:**
   - Check that the proxy server is running (`npm run dev:proxy`)
   - Check browser console for connection errors
   - Verify the frontend app is running and connected

2. **Connection errors:**
   - Ensure proxy server is on port 3001
   - Check CORS settings if accessing from different origin
   - Verify SSE connection in browser DevTools Network tab

3. **Location not updating:**
   - Check that coordinates are within floor plan bounds (0-50m x 0-30m)
   - Verify JSON format matches the examples
   - Check browser console for parsing errors

