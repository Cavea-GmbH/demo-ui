# Omlox RTLS Demo UI

A lightweight React-based demo UI for showcasing indoor Real-Time Location Systems (RTLS) technologies. This application visualizes trackables and location providers on a floor plan, displays geofences, and handles fence entry/exit events using the Omlox Hub API.

## Features

- **Floor Plan Visualization**: SVG-based floor plan with configurable dimensions
- **Real-time Tracking**: Display current positions of BLE, UWB, and Wirepas tags
- **Location Providers & Trackables**: Visualize both location providers and trackable items
- **Geofencing**: Display fences on the floor plan and detect entry/exit events
- **Event Logging**: Real-time event log for fence entry/exit events
- **Status Monitoring**: Connection status, entity counts, and polling controls

## Technology Stack

- **React 18** + **Vite** - Fast development and lightweight build
- **Material-UI (MUI)** - Modern UI components
- **TypeScript** - Type safety
- **Axios** - HTTP client for API calls
- **Docker** - Containerized deployment

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Omlox Hub API endpoint (default: `http://127.0.0.1/v2`)

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** (optional):
   Create a `.env` file:
   ```env
   VITE_OMLOX_API_URL=http://127.0.0.1/v2
   VITE_OMLOX_AUTH_TOKEN=your-token-here
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Docker Deployment

### Build and run with Docker Compose:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`.

### Build Docker image manually:

```bash
docker build -t omlox-demo-ui .
docker run -p 3000:80 -e VITE_OMLOX_API_URL=http://your-api-url/v2 omlox-demo-ui
```

## Configuration

### Floor Plan Dimensions

Edit `src/config/constants.ts` to adjust:
- Floor plan width and height (in meters)
- Polling interval
- Hardcoded fences

### API Configuration

The API base URL can be configured via:
- Environment variable: `VITE_OMLOX_API_URL`
- Default: `http://127.0.0.1/v2`

For authentication, set `VITE_OMLOX_AUTH_TOKEN` environment variable.

## Project Structure

```
demo-ui/
├── src/
│   ├── components/        # React components
│   │   ├── FloorPlan/     # Floor plan visualization
│   │   ├── EventLog/      # Event log component
│   │   └── StatusPanel/   # Status panel component
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── config/            # Configuration constants
├── public/                # Static assets
├── Dockerfile             # Docker build configuration
├── docker-compose.yml     # Docker Compose configuration
└── package.json           # Dependencies
```

## API Integration

The application uses the Omlox Hub API v2. Key endpoints:

- `GET /providers/summary` - Get all location providers
- `GET /providers/locations` - Get all provider locations
- `GET /trackables/summary` - Get all trackables
- `GET /trackables/{id}/location` - Get trackable location
- `GET /fences/summary` - Get all fences

## Fence Detection

The application automatically detects when trackables or providers enter or exit fences. Events are displayed in the Event Log component.

Fences can be:
- **Circular**: Defined by a Point and radius
- **Polygonal**: Defined by a Polygon geometry

## Future Enhancements

- WebSocket integration for real-time updates
- Historical position trails
- Multiple floor support
- Image-based floor plan overlay
- Interactive fence editing

## License

This is a demo application for sales and support purposes.

