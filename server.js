/**
 * Simple proxy server to receive POST requests from Postman
 * and forward location updates to the frontend app via Server-Sent Events
 */

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Store connected clients for SSE
const clients = new Set();

// SSE endpoint for frontend to connect
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  clients.add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Clean up on client disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Endpoint to receive provider location updates from Postman
app.post('/api/providers/:providerId/location', (req, res) => {
  const { providerId: urlProviderId } = req.params;
  const location = req.body;

  // provider_id is mandatory in Omlox API - validate it exists and matches URL parameter
  const bodyProviderId = location.provider_id;

  if (!bodyProviderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing provider_id',
      message: 'The location object must contain a provider_id field',
    });
  }

  // Both IDs must match
  if (urlProviderId !== bodyProviderId) {
    return res.status(400).json({
      success: false,
      error: 'Provider ID mismatch',
      message: `URL parameter provider_id (${urlProviderId}) does not match body provider_id (${bodyProviderId}). They must be identical.`,
      urlProviderId,
      bodyProviderId,
    });
  }

  console.log(`Received location update for provider: ${bodyProviderId}`, location);

  // Forward to all connected clients
  const message = {
    type: 'provider_location',
    providerId: bodyProviderId,
    location,
  };

  clients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Error sending to client:', error);
      clients.delete(client);
    }
  });

  res.status(200).json({
    success: true,
    message: `Location update forwarded for provider ${bodyProviderId}`,
    clientsConnected: clients.size,
  });
});

// Endpoint to receive trackable location updates from Postman
app.post('/api/trackables/:trackableId/location', (req, res) => {
  const { trackableId: urlTrackableId } = req.params;
  const location = req.body;

  // For trackables, we need to identify which trackable this location belongs to
  // The location object doesn't have a trackable_id field directly, but it may have trackables array
  // or we use the URL parameter. However, trackable locations are typically sent directly to a trackable endpoint.
  // We'll use the URL parameter as the trackable identifier since that's the RESTful way.

  console.log(`Received location update for trackable: ${urlTrackableId}`, location);

  // Forward to all connected clients
  const message = {
    type: 'trackable_location',
    trackableId: urlTrackableId,
    location,
  };

  clients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Error sending to client:', error);
      clients.delete(client);
    }
  });

  res.status(200).json({
    success: true,
    message: `Location update forwarded for trackable ${urlTrackableId}`,
    clientsConnected: clients.size,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clientsConnected: clients.size,
  });
});

const PORT = process.env.PROXY_PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n📍 Location Proxy Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/providers/:providerId/location`);
  console.log(`   POST http://localhost:${PORT}/api/trackables/:trackableId/location`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`\n💡 Connect frontend to: http://localhost:${PORT}/events\n`);
});

