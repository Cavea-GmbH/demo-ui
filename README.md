# Omlox RTLS Demo UI

A lightweight, real-time demo UI for showcasing indoor Real-Time Location Systems (RTLS) technologies. This application visualizes trackables and location providers on a floor plan, displays geofences, and handles fence entry/exit events using the Omlox Hub API specification.

**Live Demo**: [https://vipmm8ztjz.eu-central-1.awsapprunner.com/](https://vipmm8ztjz.eu-central-1.awsapprunner.com/)

## Features

### Core Visualization
- **Interactive Floor Plan**: SVG-based floor plan with 5x5m grid overlay and configurable dimensions (50m x 30m)
- **Real-time Tracking**: Display positions of BLE, UWB, Wirepas, and GPS tags with live updates
- **Dual Coordinate Support**: Handle both local (x,y) and WGS84 (lat/lon) coordinates with automatic georeferencing
- **Location Providers & Trackables**: Visualize and toggle between location providers and trackable items
- **Geofencing**: Display polygonal and circular fences with dynamic entry/exit event coloring

### Entity Management
- **CRUD Operations**: Create, edit, and delete location providers and trackables via UI
- **Provider-Trackable Relationships**: Associate multiple providers with trackables following Omlox specification
- **Auto-generated IDs**: UUID v4 for trackables, MAC-like hex IDs for providers

### Real-time Updates
- **Server-Sent Events (SSE)**: Push-based location updates via proxy server
- **Event Logging**: Real-time fence entry/exit event log with entity filtering
- **Interactive Tooltips**: Click entities or fences to see detailed coordinates and info
- **Context Menu**: Right-click anywhere on the floor plan to see local and WGS84 coordinates

### UI/UX
- **Material-UI Design**: Modern, responsive interface with dark/light theme support
- **Collapsible Sidebar**: Entity management, status panel, and event log in organized tabs
- **Filter Controls**: Toggle visibility of providers, trackables, fences, and grid/labels
- **Status Indicators**: Connection status, entity counts, and last update timestamp

## Technology Stack

### Frontend
- **React 18** + **Vite 5** - Fast development with HMR
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Modern UI components
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** + **Express** - Standalone demo server with in-memory storage
- **Server-Sent Events (SSE)** - Real-time push updates to frontend
- **In-Memory Storage** - No external database required (Maps for providers, trackables, locations, fences)
- **Omlox API** - Compliant REST endpoints for CRUD operations

### Infrastructure
- **Docker** - Multi-stage containerized build
- **Nginx** - Static file serving and reverse proxy
- **Supervisor** - Process management for Nginx + Node.js
- **AWS App Runner** - Fully managed container deployment
- **Amazon ECR** - Docker image registry
- **GitHub Actions** - CI/CD pipeline with OIDC authentication

## Prerequisites

- **Node.js 18+** and npm
- **Docker** (for containerized deployment)
- **AWS Account** with appropriate permissions (for production deployment)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Frontend Configuration (embedded at build time)
# ================================================

# Control whether to load initial demo data (trackables & providers)
VITE_LOAD_INITIAL_DATA=true

# Omlox API URL - frontend makes requests to this URL (proxied via /api/)
VITE_OMLOX_API_URL=/api


# Backend Proxy Configuration (runtime environment variables)
# ============================================================

# Proxy server port (default: 3001)
# PROXY_PORT=3001
```

**Note**: 
- `VITE_*` variables are embedded into the frontend build at compile time
- The backend is **standalone** - it maintains all data in-memory (no external Hub needed)

### 3. Start Development Servers

Run both the frontend and backend proxy concurrently:

```bash
npm run dev:all
```

Or start them separately:

```bash
# Terminal 1: Frontend (Vite dev server on port 5173)
npm run dev

# Terminal 2: Backend proxy (Express on port 3001)
npm run dev:proxy
```

The application will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend Proxy**: `http://localhost:3001`
- **SSE Events**: `http://localhost:3001/events`

### 4. Send Location Data

Send location updates via the proxy server using Postman, cURL, or any HTTP client:

```bash
# Provider location (local coordinates)
curl -X POST http://localhost:3001/api/providers/0080E126/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": { "type": "Point", "coordinates": [25, 15] },
    "provider_id": "0080E126",
    "provider_type": "uwb",
    "source": "zone-1",
    "crs": "local",
    "floor": 0,
    "accuracy": 1.5,
    "timestamp_generated": "2024-01-15T10:30:00.000Z"
  }'

# Provider location (WGS84 coordinates)
curl -X POST http://localhost:3001/api/providers/0080E128/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": { "type": "Point", "coordinates": [7.81600, 48.130286] },
    "provider_id": "0080E128",
    "provider_type": "gps",
    "source": "zone-1",
    "crs": "EPSG:4326",
    "floor": 0,
    "accuracy": 5.0,
    "timestamp_generated": "2024-01-15T10:30:00.000Z"
  }'

# Trackable location
curl -X POST http://localhost:3001/api/trackables/550e8400-e29b-41d4-a716-446655440001/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": { "type": "Point", "coordinates": [30, 20] },
    "source": "zone-1",
    "crs": "local",
    "floor": 0,
    "accuracy": 2.0,
    "timestamp_generated": "2024-01-15T10:31:00.000Z"
  }'
```

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

### Local Docker Build and Run

The Docker image uses a multi-stage build that includes:
1. **Builder stage**: Builds the React frontend
2. **Production stage**: Sets up Nginx, Node.js proxy, and Supervisor

```bash
# Build the Docker image
docker build -t cavea-demo-ui .

# Run the container
docker run -p 80:80 -p 3001:3001 cavea-demo-ui
```

The application will be available at:
- **Frontend**: `http://localhost`
- **Backend Proxy**: `http://localhost:3001`

### Architecture

The Docker container runs two processes managed by Supervisor:
- **Nginx** (port 80): Serves the React frontend and proxies `/api/*` and `/events` to the Node.js backend
- **Node.js Express** (port 3001): Receives location data via POST and forwards to frontend via SSE

## Production Deployment (AWS App Runner)

The application is automatically deployed to AWS App Runner using GitHub Actions on every push to the `dev` or `main` branch.

### Deployment Flow

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   - Triggered on push to `dev` or `main` branches
   - Authenticates with AWS using OIDC (no long-lived credentials needed)
   - Builds Docker image with production environment variables
   - Pushes image to Amazon ECR (`frontend/cavea-demo-ui`)
   - Updates AWS App Runner service with new image
   - Waits for deployment to complete

2. **AWS Resources**:
   - **ECR Repository**: `116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui`
   - **App Runner Service**: `cavea-demo-ui-dev` (dev environment)
   - **Service URL**: [https://vipmm8ztjz.eu-central-1.awsapprunner.com/](https://vipmm8ztjz.eu-central-1.awsapprunner.com/)

3. **IAM Role**: `GitHub-ECS-Deploy-Role-Dev`
   - Trusted entity: GitHub OIDC (`token.actions.githubusercontent.com`)
   - Permissions: ECR push, App Runner update
   - Repository: `Cavea-GmbH/demo-ui`

### Environment Variables (Production)

Set in `.github/workflows/deploy.yml`:

```bash
VITE_OMLOX_API_URL=not_used
VITE_BUILD_NUMBER=${GITHUB_RUN_NUMBER}-${GITHUB_SHA::7}
VITE_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
VITE_LOAD_INITIAL_DATA=true  # Set to 'false' for production without demo data
```

### Manual Deployment

If needed, you can manually deploy:

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 116981770603.dkr.ecr.eu-central-1.amazonaws.com

# Build and tag
docker build -t cavea-demo-ui .
docker tag cavea-demo-ui:latest 116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Push to ECR
docker push 116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Update App Runner service
aws apprunner update-service \
  --service-arn arn:aws:apprunner:eu-central-1:116981770603:service/cavea-demo-ui-dev/a846c46c6d724d3fa51dbccd3be40cb9 \
  --source-configuration "ImageRepository={ImageIdentifier=116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest,ImageRepositoryType=ECR,ImageConfiguration={Port=80}}" \
  --region eu-central-1
```

## Configuration

### Environment Variables

#### Frontend (Build-time - `VITE_*`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_LOAD_INITIAL_DATA` | Load demo trackables/providers on startup | `true` | No |
| `VITE_OMLOX_API_URL` | Omlox API endpoint for frontend (proxied via `/api/`) | `/api` | Yes |
| `VITE_BUILD_NUMBER` | Build number (auto-generated in CI/CD) | - | No |
| `VITE_BUILD_TIME` | Build timestamp (auto-generated in CI/CD) | - | No |

#### Backend (Runtime - Node.js Server)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PROXY_PORT` | Port for the standalone demo server | `3001` | No |

### Floor Plan Configuration

Edit `src/config/constants.ts`:

```typescript
// Floor plan dimensions (meters)
export const FLOOR_PLAN_WIDTH = 50;
export const FLOOR_PLAN_HEIGHT = 30;

// Grid cell size (meters)
export const GRID_CELL_SIZE = 5;

// Default zone ID
export const DEFAULT_ZONE_ID = 'zone-1';

// Georeferencing: Map WGS84 coordinates to local coordinates
export const ZONE_GEOREFERENCE = {
  zoneId: DEFAULT_ZONE_ID,
  groundControlPoints: [
    { local: [0, 0], wgs84: [7.815, 48.13] },      // Bottom-left
    { local: [50, 0], wgs84: [7.816, 48.13] },     // Bottom-right
    { local: [50, 30], wgs84: [7.816, 48.1305] },  // Top-right
    { local: [0, 30], wgs84: [7.815, 48.1305] },   // Top-left
  ]
};

// Hardcoded fences (polygonal)
export const HARDCODED_FENCES: Fence[] = [
  {
    id: 'fence-1',
    name: 'Demo Fence',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [15, 5], [35, 5], [35, 15], [15, 15], [15, 5]  // Closed polygon
      ]]
    }
  }
];

// Initial demo data (loaded if VITE_LOAD_INITIAL_DATA=true)
export const HARDCODED_PROVIDERS: LocationProvider[] = [...];
export const HARDCODED_TRACKABLES: Trackable[] = [...];
export const HARDCODED_LOCATIONS: Record<string, Location> = {...};
```

## Project Structure

```
demo-ui/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD pipeline
├── src/
│   ├── components/                 # React components
│   │   ├── FloorPlan/              # Floor plan visualization
│   │   │   ├── FloorPlan.tsx       # Main floor plan component with SVG
│   │   │   ├── FenceLayer.tsx      # Fence rendering with event coloring
│   │   │   └── TagLayer.tsx        # Provider/trackable marker rendering
│   │   ├── TopBar/                 # Top bar with filters and stats
│   │   ├── Sidebar/                # Collapsible sidebar with tabs
│   │   ├── StatusPanel/            # Connection status and metrics
│   │   ├── EventLog/               # Fence event log
│   │   └── EntityManagement/       # CRUD components
│   │       ├── ProviderManager.tsx # Location provider management
│   │       └── TrackableManager.tsx # Trackable management
│   ├── hooks/                      # Custom React hooks
│   │   ├── useLocationReceiver.ts  # Location data management with SSE
│   │   └── useFenceEvents.ts       # Fence entry/exit detection
│   ├── services/                   # API and SSE clients
│   │   ├── omloxApi.ts             # Axios-based API client (CRUD)
│   │   ├── sseClient.ts            # SSE connection to proxy
│   │   └── locationPushReceiver.ts # SSE message handler
│   ├── types/                      # TypeScript type definitions
│   │   └── omlox.ts                # Omlox API types
│   ├── utils/                      # Utility functions
│   │   ├── coordinateTransform.ts  # SVG coordinate transformations
│   │   ├── coordinateNormalize.ts  # WGS84 to local conversion
│   │   ├── georeferencing.ts       # Affine transformation math
│   │   └── uuid.ts                 # UUID/ID generation
│   ├── config/                     # Configuration
│   │   └── constants.ts            # Floor plan, fences, demo data
│   ├── App.tsx                     # Root application component
│   └── main.tsx                    # Application entry point
├── public/                         # Static assets
├── server.js                       # Express proxy server (SSE + POST)
├── nginx.conf                      # Nginx configuration (reverse proxy)
├── Dockerfile                      # Multi-stage Docker build
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## API Integration

### Location Update Endpoints (POST)

The proxy server (`server.js`) exposes these endpoints to receive location data:

- `POST /api/providers/{provider_id}/location` - Update provider location
- `POST /api/trackables/{trackable_id}/location` - Update trackable location

**Request Body** (Omlox `Location` schema):

```json
{
  "position": {
    "type": "Point",
    "coordinates": [x, y]  // or [lon, lat] for WGS84
  },
  "provider_id": "string",      // Required, must match URL parameter
  "provider_type": "string",    // e.g., "uwb", "ble-mesh", "gps"
  "source": "string",           // e.g., "zone-1"
  "crs": "local" | "EPSG:4326", // Coordinate reference system
  "floor": 0,
  "accuracy": 1.5,
  "timestamp_generated": "2024-01-15T10:30:00.000Z"
}
```

### CRUD Endpoints (In-Memory Storage)

The standalone demo server maintains **in-memory storage** and exposes Omlox-compliant API endpoints:

**Providers:**
- `GET /api/providers/summary` - Get all providers
- `GET /api/providers/{id}` - Get provider by ID
- `POST /api/providers` - Create provider
- `PUT /api/providers/{id}` - Update provider
- `DELETE /api/providers/{id}` - Delete provider
- `GET /api/providers/{id}/location` - Get provider location
- `GET /api/providers/locations` - Get all provider locations

**Trackables:**
- `GET /api/trackables/summary` - Get all trackables
- `GET /api/trackables/{id}` - Get trackable by ID
- `POST /api/trackables` - Create trackable
- `PUT /api/trackables/{id}` - Update trackable
- `DELETE /api/trackables/{id}` - Delete trackable
- `GET /api/trackables/{id}/location` - Get trackable location

**Fences:**
- `GET /api/fences/summary` - Get all fences
- `POST /api/fences` - Create fence

**Auto-creation**: When you send a location update for a non-existent provider or trackable, it will be automatically created.

### Server-Sent Events (SSE)

- `GET /events` - SSE stream for real-time location updates
- Messages: `provider-location` and `trackable-location` events with JSON payload

## Geofencing and Event Detection

### Fence Types

1. **Polygonal Fences**: Defined by a closed polygon (first and last point must be identical)
2. **Circular Fences**: Defined by a Point and radius

### Event Detection

The application uses point-in-polygon algorithms to detect when entities enter or exit fences:
- **Entry Events**: Fence border turns **green** for 5 seconds
- **Exit Events**: Fence border turns **red** for 5 seconds
- Events are filtered based on visible entities (hidden entities don't trigger visual changes)

All fence events are logged in the **Event Log** with timestamps and entity details.

## Coordinate Systems

### Local Coordinates (CRS: `local`)
- Origin: Bottom-left corner (0, 0)
- Units: Meters
- Range: X: [0, 50], Y: [0, 30] (configurable)

### WGS84 Coordinates (CRS: `EPSG:4326`)
- Format: [longitude, latitude]
- Automatically converted to local coordinates using affine transformation
- Ground control points defined in `constants.ts`

### Georeferencing

The application uses 4 ground control points to map WGS84 coordinates to the local floor plan. Edit `ZONE_GEOREFERENCE` in `constants.ts` to match your real-world location.

## Development Notes

### Key Technologies

- **Vite HMR**: Hot module replacement for fast development
- **TypeScript strict mode**: Full type safety
- **Material-UI theming**: Customizable theme in `App.tsx`
- **SVG rendering**: Performant vector graphics for floor plan
- **SSE reconnection logic**: Auto-reconnect with exponential backoff

### Testing Location Updates

1. Start the dev servers: `npm run dev:all`
2. Use the UI to create providers/trackables, or let initial demo data load
3. Send POST requests to `http://localhost:3001/api/providers/{id}/location`
4. Watch the markers move in real-time on the floor plan

### Troubleshooting

- **SSE not connecting**: Check browser console for errors, ensure proxy server is running on port 3001
- **Markers not appearing**: Check that `VITE_LOAD_INITIAL_DATA=true` or create entities via UI
- **Coordinates off**: Verify georeferencing settings in `constants.ts` match your location
- **Build errors**: Run `npm ci` to install exact dependency versions

## Future Enhancements

- [ ] WebSocket support as alternative to SSE
- [ ] Historical position trails and playback
- [ ] Multiple floor support with floor selector
- [ ] Image-based floor plan overlay (upload custom floor plan)
- [ ] Interactive fence creation and editing via UI
- [ ] Export/import configuration (fences, entities, georeferencing)
- [ ] Real-time analytics dashboard (heatmaps, dwell time)
- [ ] Integration with actual Omlox Hub API for persistent storage

## License

This is a demo application for sales and support purposes by Cavea GmbH.

## Contributing

This project is maintained internally. For questions or issues, contact the development team.

---

**Repository**: [https://github.com/Cavea-GmbH/demo-ui](https://github.com/Cavea-GmbH/demo-ui)  
**Live Demo**: [https://vipmm8ztjz.eu-central-1.awsapprunner.com/](https://vipmm8ztjz.eu-central-1.awsapprunner.com/)

