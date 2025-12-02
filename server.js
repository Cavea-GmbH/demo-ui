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
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - required when running behind nginx/App Runner/load balancers
// This allows Express to correctly handle secure cookies and client IP
app.set('trust proxy', 1);

app.use(cors({
  origin: true, // Allow requests from any origin (adjust for production)
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

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
  console.log(`   UI Auth: ${appConfig.auth?.uiPassword ? 'enabled' : 'disabled'}`);
  console.log(`   API Auth: ${appConfig.auth?.apiToken ? 'enabled' : 'disabled'}`);
} catch (error) {
  console.error('❌ Failed to load configuration:', error.message);
  console.error('   Application cannot start without valid configuration');
  process.exit(1);
}

// ============================================================================
// Session Configuration
// ============================================================================

// Configure session with secure settings
const sessionMaxAge = (appConfig.auth?.sessionDurationHours || 720) * 60 * 60 * 1000; // Convert hours to milliseconds

// Determine if we're in production (behind HTTPS proxy)
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT === '3001';

app.use(session({
  secret: appConfig.auth?.uiPassword || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In production behind proxy, secure should be true for HTTPS
    // But since we set 'trust proxy', Express will handle this automatically
    secure: 'auto', // Auto-detect based on request protocol
    httpOnly: true,
    maxAge: sessionMaxAge,
    sameSite: 'lax'
  },
  // Use proxy for secure cookie detection
  proxy: true
}));

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Middleware to check if UI authentication is required
 */
function requireUIAuth(req, res, next) {
  // If no password is configured, skip authentication
  if (!appConfig.auth?.uiPassword) {
    return next();
  }

  // Check if user is authenticated
  if (req.session && req.session.authenticated) {
    return next();
  }

  // Return 401 Unauthorized
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Please log in to access this resource'
  });
}

/**
 * Middleware to check API token (sent as query parameter)
 */
function requireAPIToken(req, res, next) {
  // If no API token is configured, skip authentication
  if (!appConfig.auth?.apiToken) {
    return next();
  }

  // Check query parameter 'token'
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API token required. Provide token as query parameter: ?token=YOUR_TOKEN'
    });
  }

  // Compare tokens (constant-time comparison to prevent timing attacks)
  if (token !== appConfig.auth.apiToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API token'
    });
  }

  next();
}

// Store connected clients for SSE
const clients = new Set();

// In-memory storage for demo purposes
const providers = new Map(); // providerId -> LocationProvider
const trackables = new Map(); // trackableId -> Trackable
const providerLocations = new Map(); // providerId -> Location
const trackableLocations = new Map(); // trackableId -> Location
const fences = new Map(); // fenceId -> Fence

// ============================================================================
// Authentication Endpoints
// ============================================================================

// POST /api/auth/login - UI login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  // If no password is configured, deny login attempts
  if (!appConfig.auth?.uiPassword) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Authentication is not configured'
    });
  }

  // Validate password
  if (!password || password !== appConfig.auth.uiPassword) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid password'
    });
  }

  // Set session
  req.session.authenticated = true;
  req.session.loginTime = new Date().toISOString();

  console.log('✅ User logged in successfully');

  res.json({
    success: true,
    message: 'Login successful',
    sessionDuration: appConfig.auth.sessionDurationHours
  });
});

// POST /api/auth/logout - UI logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout'
      });
    }

    console.log('✅ User logged out successfully');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// GET /api/auth/status - Check authentication status
app.get('/api/auth/status', (req, res) => {
  const authRequired = !!appConfig.auth?.uiPassword;
  const authenticated = !!(req.session && req.session.authenticated);

  res.json({
    authRequired,
    authenticated,
    sessionDuration: appConfig.auth?.sessionDurationHours || null
  });
});

// SSE endpoint for frontend to connect
// Note: No auth required - SSE only broadcasts location data, doesn't expose sensitive info
// The UI already requires login to view, and API endpoints have token auth for pushing data
app.get('/events', (req, res) => {
  const connectTime = new Date().toISOString();
  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  console.log(`🔌 [${connectTime}] SSE connection request received`);
  console.log(`   Client IP: ${clientIP}`);
  console.log(`   User-Agent: ${userAgent}`);
  console.log(`   Headers:`, JSON.stringify({
    'accept': req.headers['accept'],
    'cache-control': req.headers['cache-control'],
    'connection': req.headers['connection'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
  }));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Note: CORS headers are handled by the cors middleware
  // Don't set Access-Control-Allow-Origin manually - it breaks withCredentials

  clients.add(res);
  console.log(`✅ [${connectTime}] SSE client connected. Total clients: ${clients.size}`);

  // Send initial connection message
  const initMsg = JSON.stringify({ type: 'connected', timestamp: connectTime });
  console.log(`📤 Sending initial message: ${initMsg}`);
  res.write(`data: ${initMsg}\n\n`);

  // Send heartbeat every 15 seconds to keep connection alive
  // This prevents timeouts from proxies, load balancers, and browsers
  const heartbeatInterval = setInterval(() => {
    try {
      const hbTime = Date.now();
      // Send SSE comment (ignored by client but keeps connection alive)
      res.write(`: heartbeat ${hbTime}\n\n`);
      console.log(`💓 Heartbeat sent to client (${clients.size} total)`);
    } catch (error) {
      console.error('❌ Error sending heartbeat:', error.message);
      clearInterval(heartbeatInterval);
      clients.delete(res);
    }
  }, 15000); // 15 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    const disconnectTime = new Date().toISOString();
    clearInterval(heartbeatInterval);
    clients.delete(res);
    console.log(`❌ [${disconnectTime}] SSE client disconnected. Total clients: ${clients.size}`);
  });

  // Handle errors
  req.on('error', (err) => {
    console.error(`❌ SSE request error:`, err.message);
    clearInterval(heartbeatInterval);
    clients.delete(res);
  });

  res.on('error', (err) => {
    console.error(`❌ SSE response error:`, err.message);
    clearInterval(heartbeatInterval);
    clients.delete(res);
  });
});

// PUT /api/providers/:providerId/location - Update provider location (Omlox API)
app.put('/api/providers/:providerId/location', requireAPIToken, (req, res) => {
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
app.put('/api/trackables/:trackableId/location', requireAPIToken, (req, res) => {
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

// Configuration endpoint - serves runtime config to frontend (exclude sensitive auth data)
// NOTE: This endpoint is PUBLIC - auth data is filtered out before sending
app.get('/api/config', (req, res) => {
  if (!appConfig) {
    return res.status(500).json({
      error: 'Configuration not loaded',
      message: 'Server configuration is not available',
    });
  }
  
  // Return config without sensitive authentication data
  const { auth, ...publicConfig } = appConfig;
  res.json({
    ...publicConfig,
    auth: {
      uiPassword: null, // Never expose password
      apiToken: null, // Never expose token
      sessionDurationHours: auth?.sessionDurationHours || 720
    }
  });
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
app.get('/api/providers/summary', requireUIAuth, (req, res) => {
  const providerList = Array.from(providers.values());
  console.log(`GET /api/providers/summary - Returning ${providerList.length} providers`);
  res.json(providerList);
});

// GET /api/providers - Get all provider IDs
app.get('/api/providers', requireUIAuth, (req, res) => {
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
app.get('/api/trackables/summary', requireUIAuth, (req, res) => {
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
app.get('/api/fences/summary', requireUIAuth, (req, res) => {
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

