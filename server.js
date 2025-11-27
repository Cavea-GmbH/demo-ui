/**
 * Simple proxy server to receive POST requests from Postman
 * and forward location updates to the frontend app via Server-Sent Events
 * 
 * Also maintains in-memory state of providers, trackables, and locations
 * for standalone demo operation (no external Cavea Hub required)
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ============================================================================
// Configuration Loading
// ============================================================================

let appConfig = null;

/**
 * Load application configuration from file system
 * Priority: 1) Volume-mounted config, 2) Local config (dev), 3) Built-in default config
 */
function loadConfig() {
  // 1. Try volume-mounted config first (for Docker deployments)
  const volumeConfigPath = '/config/app-config.json';
  if (fs.existsSync(volumeConfigPath)) {
    console.log('📁 Loading config from volume: /config/app-config.json');
    try {
      const configData = fs.readFileSync(volumeConfigPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Error reading volume config:', error.message);
      console.log('⚠️ Falling back to next config source');
    }
  }
  
  // 2. Try local config file (for local development)
  const localConfigPath = path.join(__dirname, 'config', 'app-config.json');
  if (fs.existsSync(localConfigPath)) {
    console.log('📝 Loading local config: ./config/app-config.json');
    try {
      const configData = fs.readFileSync(localConfigPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Error reading local config:', error.message);
      console.log('⚠️ Falling back to default config');
    }
  }
  
  // 3. Fall back to built-in default config
  const defaultConfigPath = path.join(__dirname, 'config', 'default-config.json');
  if (fs.existsSync(defaultConfigPath)) {
    console.log('📦 Loading built-in default config');
    try {
      const configData = fs.readFileSync(defaultConfigPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Error reading default config:', error.message);
      throw new Error('No valid configuration found!');
    }
  }
  
  throw new Error('No configuration file found! Expected /config/app-config.json, ./config/app-config.json, or built-in default.');
}

// Load config on startup
try {
  appConfig = loadConfig();
  console.log('✅ Configuration loaded successfully');
  console.log(`   Floor: ${appConfig.floor.width}m x ${appConfig.floor.length}m`);
  console.log(`   Zone: ${appConfig.zone.id || 'default'}`);
  console.log(`   Fences: ${appConfig.fences.length}`);
  console.log(`   Initial data: ${appConfig.initialData.loadInitialData ? 'enabled' : 'disabled'}`);
} catch (error) {
  console.error('❌ Failed to load configuration:', error.message);
  console.error('   Application cannot start without valid configuration');
  process.exit(1);
}

// Store connected clients for SSE
const clients = new Set();

// In-memory storage for demo purposes
const providers = new Map(); // providerId -> LocationProvider
const trackables = new Map(); // trackableId -> Trackable
const providerLocations = new Map(); // providerId -> Location
const trackableLocations = new Map(); // trackableId -> Location
const fences = new Map(); // fenceId -> Fence

// SSE endpoint for frontend to connect
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  clients.add(res);
  console.log(`✅ SSE client connected. Total clients: ${clients.size}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Send heartbeat every 15 seconds to keep connection alive
  // This prevents timeouts from proxies, load balancers, and browsers
  const heartbeatInterval = setInterval(() => {
    try {
      // Send SSE comment (ignored by client but keeps connection alive)
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (error) {
      console.error('❌ Error sending heartbeat:', error.message);
      clearInterval(heartbeatInterval);
      clients.delete(res);
    }
  }, 15000); // 15 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(res);
    console.log(`❌ SSE client disconnected. Total clients: ${clients.size}`);
  });
});

// PUT /api/providers/:providerId/location - Update provider location (Omlox API)
app.put('/api/providers/:providerId/location', (req, res) => {
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

  // Auto-create provider if it doesn't exist
  if (!providers.has(bodyProviderId)) {
    const newProvider = {
      id: bodyProviderId,
      type: location.provider_type || 'unknown',
      name: `Provider ${bodyProviderId}`,
    };
    providers.set(bodyProviderId, newProvider);
    console.log(`Auto-created provider: ${bodyProviderId}`);
  }

  // Store location
  providerLocations.set(bodyProviderId, location);

  // Forward to all connected clients via SSE
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

  res.status(204).send();
});

// PUT /api/trackables/:trackableId/location - Update trackable location (Demo extension - not in Omlox spec)
app.put('/api/trackables/:trackableId/location', (req, res) => {
  const { trackableId: urlTrackableId } = req.params;
  const location = req.body;

  console.log(`Received location update for trackable: ${urlTrackableId}`, location);

  // Auto-create trackable if it doesn't exist
  if (!trackables.has(urlTrackableId)) {
    const newTrackable = {
      id: urlTrackableId,
      type: 'omlox',
      name: `Trackable ${urlTrackableId}`,
      location_providers: location.provider_id ? [location.provider_id] : [],
    };
    trackables.set(urlTrackableId, newTrackable);
    console.log(`Auto-created trackable: ${urlTrackableId}`);
  }

  // Store location
  trackableLocations.set(urlTrackableId, location);

  // Forward to all connected clients via SSE
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

  res.status(204).send();
});

// Configuration endpoint - serves runtime config to frontend
app.get('/api/config', (req, res) => {
  if (!appConfig) {
    return res.status(500).json({
      error: 'Configuration not loaded',
      message: 'Server configuration is not available',
    });
  }
  
  res.json(appConfig);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    configLoaded: !!appConfig,
    clientsConnected: clients.size,
    providersCount: providers.size,
    trackablesCount: trackables.size,
  });
});

// ============================================================================
// Provider Endpoints (Omlox API)
// ============================================================================

// GET /api/providers/summary - Get all providers
app.get('/api/providers/summary', (req, res) => {
  const providerList = Array.from(providers.values());
  console.log(`GET /api/providers/summary - Returning ${providerList.length} providers`);
  res.json(providerList);
});

// GET /api/providers - Get all provider IDs
app.get('/api/providers', (req, res) => {
  const providerIds = Array.from(providers.keys());
  console.log(`GET /api/providers - Returning ${providerIds.length} provider IDs`);
  res.json(providerIds);
});

// GET /api/providers/:providerId - Get provider by ID
app.get('/api/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const provider = providers.get(providerId);
  
  if (!provider) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Provider with id ${providerId} not found`,
    });
  }
  
  res.json(provider);
});

// POST /api/providers - Create provider
app.post('/api/providers', (req, res) => {
  const provider = req.body;
  
  if (!provider.id || !provider.type) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Provider must have id and type fields',
    });
  }
  
  providers.set(provider.id, provider);
  console.log(`Created provider: ${provider.id} (type: ${provider.type})`);
  
  res.status(201).json(provider);
});

// PUT /api/providers/:providerId - Update provider
app.put('/api/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const provider = req.body;
  
  if (!providers.has(providerId)) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Provider with id ${providerId} not found`,
    });
  }
  
  providers.set(providerId, { ...provider, id: providerId });
  console.log(`Updated provider: ${providerId}`);
  
  res.status(204).send();
});

// DELETE /api/providers/:providerId - Delete provider
app.delete('/api/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  
  if (!providers.has(providerId)) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Provider with id ${providerId} not found`,
    });
  }
  
  providers.delete(providerId);
  providerLocations.delete(providerId);
  console.log(`Deleted provider: ${providerId}`);
  
  res.status(204).send();
});

// GET /api/providers/:providerId/location - Get provider location
app.get('/api/providers/:providerId/location', (req, res) => {
  const { providerId } = req.params;
  const location = providerLocations.get(providerId);
  
  if (!location) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No location found for provider ${providerId}`,
    });
  }
  
  res.json(location);
});

// GET /api/providers/locations - Get all provider locations
app.get('/api/providers/locations', (req, res) => {
  const locations = Array.from(providerLocations.values());
  console.log(`GET /api/providers/locations - Returning ${locations.length} locations`);
  res.json(locations);
});

// ============================================================================
// Trackable Endpoints (Omlox API)
// ============================================================================

// GET /api/trackables/summary - Get all trackables
app.get('/api/trackables/summary', (req, res) => {
  const trackableList = Array.from(trackables.values());
  console.log(`GET /api/trackables/summary - Returning ${trackableList.length} trackables`);
  res.json(trackableList);
});

// GET /api/trackables - Get all trackable IDs
app.get('/api/trackables', (req, res) => {
  const trackableIds = Array.from(trackables.keys());
  console.log(`GET /api/trackables - Returning ${trackableIds.length} trackable IDs`);
  res.json(trackableIds);
});

// GET /api/trackables/:trackableId - Get trackable by ID
app.get('/api/trackables/:trackableId', (req, res) => {
  const { trackableId } = req.params;
  const trackable = trackables.get(trackableId);
  
  if (!trackable) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Trackable with id ${trackableId} not found`,
    });
  }
  
  res.json(trackable);
});

// POST /api/trackables - Create trackable
app.post('/api/trackables', (req, res) => {
  const trackable = req.body;
  
  if (!trackable.id || !trackable.type) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Trackable must have id and type fields',
    });
  }
  
  trackables.set(trackable.id, trackable);
  console.log(`Created trackable: ${trackable.id} (type: ${trackable.type})`);
  
  res.status(201).json(trackable);
});

// PUT /api/trackables/:trackableId - Update trackable
app.put('/api/trackables/:trackableId', (req, res) => {
  const { trackableId } = req.params;
  const trackable = req.body;
  
  if (!trackables.has(trackableId)) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Trackable with id ${trackableId} not found`,
    });
  }
  
  trackables.set(trackableId, { ...trackable, id: trackableId });
  console.log(`Updated trackable: ${trackableId}`);
  
  res.status(204).send();
});

// DELETE /api/trackables/:trackableId - Delete trackable
app.delete('/api/trackables/:trackableId', (req, res) => {
  const { trackableId } = req.params;
  
  if (!trackables.has(trackableId)) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Trackable with id ${trackableId} not found`,
    });
  }
  
  trackables.delete(trackableId);
  trackableLocations.delete(trackableId);
  console.log(`Deleted trackable: ${trackableId}`);
  
  res.status(204).send();
});

// GET /api/trackables/:trackableId/location - Get trackable location
app.get('/api/trackables/:trackableId/location', (req, res) => {
  const { trackableId } = req.params;
  const location = trackableLocations.get(trackableId);
  
  if (!location) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No location found for trackable ${trackableId}`,
    });
  }
  
  res.json(location);
});

// ============================================================================
// Fence Endpoints (Omlox API)
// ============================================================================

// GET /api/fences/summary - Get all fences
app.get('/api/fences/summary', (req, res) => {
  const fenceList = Array.from(fences.values());
  console.log(`GET /api/fences/summary - Returning ${fenceList.length} fences`);
  res.json(fenceList);
});

// POST /api/fences - Create fence
app.post('/api/fences', (req, res) => {
  const fence = req.body;
  
  if (!fence.id || !fence.region) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Fence must have id and region fields',
    });
  }
  
  fences.set(fence.id, fence);
  console.log(`Created fence: ${fence.id}`);
  
  res.status(201).json(fence);
});

const PORT = process.env.PROXY_PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n📍 Standalone Demo Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   PUT    /api/providers/:providerId/location  - Update provider location`);
  console.log(`   PUT    /api/trackables/:trackableId/location - Update trackable location (demo extension)`);
  console.log(`   GET    /api/providers/summary               - Get all providers`);
  console.log(`   GET    /api/trackables/summary              - Get all trackables`);
  console.log(`   GET    /api/fences/summary                  - Get all fences`);
  console.log(`   GET    /events                              - SSE stream`);
  console.log(`   GET    /health                              - Health check`);
  console.log(`\n💡 In-memory storage: Providers, Trackables, Locations, Fences`);
  console.log(`📊 Current state: ${providers.size} providers, ${trackables.size} trackables\n`);
});

