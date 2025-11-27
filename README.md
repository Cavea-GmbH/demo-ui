# Omlox RTLS Demo UI

A lightweight, real-time demo UI for showcasing indoor Real-Time Location Systems (RTLS) technologies. This application visualizes trackables and location providers on a floor plan, displays geofences, and handles fence entry/exit events using the Omlox Hub API specification.

**Live Demo**: [https://vipmm8ztjz.eu-central-1.awsapprunner.com/](https://vipmm8ztjz.eu-central-1.awsapprunner.com/)

## Features

### Core Visualization
- **Interactive Floor Plan**: SVG-based floor plan with configurable grid (1m, 2.5m, 5m) and dimensions
- **Runtime Configuration**: Deploy different floor plans per instance via JSON configuration files (see [`config/README.md`](config/README.md))
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

## Deployment Options

This application supports flexible deployment with **runtime configuration**:

### 📦 Demo Instance (Automated CI/CD)
- **Production & Development environments** with GitHub Actions
- Automatic deployment to AWS App Runner
- Environment-specific configs via GitHub variables
- See: [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md)

### 🏢 Customer Instances (Manual)
- **Docker-based deployment** with custom configuration files
- Same image for all customers, different configs via volume mounts
- Works on-premises, cloud, or anywhere Docker runs
- See: [`docs/CUSTOMER_DEPLOYMENT.md`](docs/CUSTOMER_DEPLOYMENT.md)

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Application (Optional)

The application uses runtime configuration. For local development:

**Option A:** Use default configuration (no setup needed)
```bash
# Just run - uses built-in defaults
npm run dev:all
```

**Option B:** Create custom local configuration
```bash
# Copy example config
cp config/app-config.example.json config/app-config.json

# Edit with your values
nano config/app-config.json

# Run with custom config
npm run dev:all
```

See [`config/README.md`](config/README.md) for detailed configuration options.

### 3. Environment Variables (Optional)

For local development, you can optionally set:

```env
# Backend Proxy Configuration
PROXY_PORT=3001  # Default port for backend server
```

**Note**: 
- The application uses **runtime configuration** via JSON files (see `config/README.md`)
- The backend is **standalone** - it maintains all data in-memory (no external Hub needed)
- No `VITE_*` environment variables needed for local development

### 4. Start Development Servers

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

### 5. Send Location Data

Send location updates via the proxy server using Postman, cURL, or any HTTP client:

```bash
# Provider location (local coordinates)
curl -X PUT http://localhost:3001/api/providers/0080E126/location \
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
curl -X PUT http://localhost:3001/api/providers/0080E128/location \
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
curl -X PUT http://localhost:3001/api/trackables/550e8400-e29b-41d4-a716-446655440001/location \
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

### 6. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

### Quick Start with Docker

```bash
# Build the Docker image
docker build -t demo-ui .

# Run with default configuration
docker run -p 80:80 demo-ui

# Run with custom configuration
docker run -p 80:80 \
  -v $(pwd)/config/my-config.json:/config/app-config.json:ro \
  demo-ui
```

The application will be available at `http://localhost`

### Architecture

The Docker container runs two processes managed by Supervisor:
- **Nginx** (port 80): Serves the React frontend and proxies `/api/*` and `/events` to the Node.js backend
- **Node.js Express** (port 3001): Receives location data via POST and forwards to frontend via SSE

### Deployment Guides

- **Customer Deployments**: See [`docs/CUSTOMER_DEPLOYMENT.md`](docs/CUSTOMER_DEPLOYMENT.md) for detailed Docker deployment instructions
- **AWS Deployment**: See [`docs/AWS_SETUP.md`](docs/AWS_SETUP.md) for AWS ECS/Fargate and App Runner setup
- **General Guide**: See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for all deployment options

## Production Deployment (Automated CI/CD)

The demo instance is automatically deployed to AWS App Runner using GitHub Actions.

### Deployment Flow

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   - Triggered on push to `dev` or `main` branches
   - Authenticates with AWS using OIDC (no long-lived credentials needed)
   - Generates environment-specific config from GitHub variables
   - Builds Docker image with config baked in
   - Pushes image to Amazon ECR (`frontend/cavea-demo-ui`)
   - Triggers AWS App Runner service update

2. **AWS Resources**:
   - **ECR Repository**: `116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui`
   - **App Runner Service**: `cavea-demo-ui-dev` (dev environment)
   - **Service URL**: [https://vipmm8ztjz.eu-central-1.awsapprunner.com/](https://vipmm8ztjz.eu-central-1.awsapprunner.com/)

3. **IAM Role**: `GitHub-ECS-Deploy-Role-Dev`
   - Trusted entity: GitHub OIDC (`token.actions.githubusercontent.com`)
   - Permissions: ECR push, App Runner update
   - Repository: `Cavea-GmbH/demo-ui`

### Environment-Specific Configuration

Configuration is managed via GitHub environment variables (Production/Development):

```
FLOOR_WIDTH, FLOOR_LENGTH, LOAD_INITIAL_DATA
ZONE_POSITION, GROUND_CONTROL_POINTS, FENCES
```

See [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md) for complete setup instructions.

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

The application uses **runtime configuration** via JSON files. See [`config/README.md`](config/README.md) for detailed configuration options.

### Quick Start

```bash
# Copy example config
cp config/app-config.example.json config/app-config.json

# Edit with your values
nano config/app-config.json
```

### Configuration Schema

```json
{
  "floor": { "width": 50, "length": 30 },
  "zone": {
    "id": "zone-1",
    "position": [longitude, latitude],
    "groundControlPoints": [...]
  },
  "fences": [...],
  "initialData": {
    "loadInitialData": true,
    "providers": [...],
    "trackables": [...],
    "locations": {...}
  }
}
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PROXY_PORT` | Port for the Node.js backend server | `3001` | No |

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

### Location Update Endpoints (PUT)

The demo server (`server.js`) exposes these endpoints to receive location data:

- `PUT /api/providers/{provider_id}/location` - Update provider location (Omlox spec)
- `PUT /api/trackables/{trackable_id}/location` - Update trackable location (demo extension)

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

