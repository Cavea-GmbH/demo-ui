# Pushing Location Data to the Application

The application now operates in **push mode** - it receives location updates that are pushed to it, rather than fetching data from an API.

## How to Push Location Data

### Method 1: Using Global Window Functions (Browser Console)

The application exposes global functions that can be called from the browser console or from external scripts:

```javascript
// Push a provider location update
window.pushProviderLocation('provider-id-123', {
  position: {
    type: 'Point',
    coordinates: [25, 15] // x, y in meters (local coordinates)
  },
  source: 'zone-1',
  provider_type: 'uwb',
  provider_id: 'provider-id-123',
  crs: 'local',
  floor: 0,
  accuracy: 1.5,
  timestamp_generated: new Date().toISOString()
});

// Push a trackable location update
window.pushTrackableLocation('trackable-uuid-456', {
  position: {
    type: 'Point',
    coordinates: [30, 20] // x, y in meters (local coordinates)
  },
  source: 'zone-1',
  provider_type: 'uwb',
  provider_id: 'provider-id-123',
  crs: 'local',
  floor: 0,
  accuracy: 1.5,
  timestamp_generated: new Date().toISOString()
});
```

### Method 2: Backend Proxy (Recommended for Production)

Create a backend proxy that:
1. Receives PUT requests from the Omlox Hub (e.g., `PUT /providers/{provider_id}/location`)
2. Forwards the location data to the frontend via WebSocket or Server-Sent Events

Example Node.js proxy:

```javascript
const express = require('express');
const WebSocket = require('ws');
const app = express();

app.use(express.json());

// WebSocket server for pushing to frontend
const wss = new WebSocket.Server({ port: 8080 });

// Endpoint to receive location updates from Omlox Hub
app.put('/providers/:providerId/location', (req, res) => {
  const { providerId } = req.params;
  const location = req.body;
  
  // Forward to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'provider_location',
        providerId,
        location
      }));
    }
  });
  
  res.sendStatus(204);
});

app.listen(3001);
```

Then in the frontend, connect to the WebSocket and push updates:

```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'provider_location') {
    window.pushProviderLocation(data.providerId, data.location);
  }
};
```

### Method 3: Direct WebSocket Integration

If the Omlox Hub supports WebSocket subscriptions, you can connect directly:

```javascript
// Subscribe to location_updates topic
const ws = new WebSocket('ws://127.0.0.1/ws/socket');
ws.onopen = () => {
  ws.send(JSON.stringify({
    event: 'subscribe',
    topic: 'location_updates',
    params: { crs: 'local' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.event === 'message' && message.topic === 'location_updates') {
    message.payload.forEach((location) => {
      if (location.provider_id) {
        window.pushProviderLocation(location.provider_id, location);
      }
    });
  }
};
```

## Location Data Format

Location objects should follow the Omlox Location schema:

```typescript
{
  position: {
    type: 'Point',
    coordinates: [x, y] // or [x, y, z] for 3D
  },
  source: string,           // Zone ID or foreign ID
  provider_type: string,    // 'uwb', 'ble', 'rfid', etc.
  provider_id: string,      // Provider identifier
  crs?: string,             // 'local' or 'EPSG:4326'
  floor?: number,           // Floor level
  accuracy?: number,        // Accuracy in meters
  timestamp_generated?: string, // ISO 8601 timestamp
  // ... other optional fields
}
```

## Auto-Discovery

The application automatically creates provider and trackable entries when location updates are received. You don't need to manually register them first.

## Testing

You can test the push functionality by opening the browser console and running:

```javascript
// Simulate a provider moving
let x = 10;
setInterval(() => {
  window.pushProviderLocation('test-provider-1', {
    position: { type: 'Point', coordinates: [x, 15] },
    source: 'test-zone',
    provider_type: 'uwb',
    provider_id: 'test-provider-1',
    crs: 'local',
    floor: 0,
    accuracy: 1.0,
    timestamp_generated: new Date().toISOString()
  });
  x += 0.5;
  if (x > 40) x = 10;
}, 1000);
```

This will create a provider that moves across the floor plan.

