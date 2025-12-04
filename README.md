# Cavea Demo UI

A real-time RTLS visualization demo for indoor tracking. Displays trackables and location providers on a floor plan with geofencing support.

**Live Demo**: [https://demo.cavea-dev.net/](https://demo.cavea-dev.net/)

## Features

- **Real-time Tracking**: Visualize BLE, UWB, Wirepas, and GPS tags
- **Geofencing**: Polygonal/circular fences with entry/exit events
- **Runtime Config**: Different floor plans per deployment via JSON files
- **Optional Auth**: Password-protected UI

## Quick Start

### Run with Docker (Recommended)

```bash
# Pull the latest image
docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Run with default config
docker run -p 80:80 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Run with custom config
docker run -p 80:80 \
  -v $(pwd)/my-config.json:/config/app-config.json:ro \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

Open http://localhost in your browser.

### Local Development

```bash
# Install dependencies
npm install

# Start dev servers (frontend + backend)
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Send Location Updates

```bash
curl -X PUT http://localhost:3001/api/providers/TAG001/location \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"type": "Point", "coordinates": [25, 15]},
    "provider_type": "uwb",
    "crs": "local",
    "floor": 0
  }'
```

## Configuration

Configuration is loaded at runtime from JSON files. See `config/app-config.example.json` for the full schema.

```json
{
  "floor": { "width": 50, "length": 30 },
  "zone": {
    "position": [7.815694, 48.130216],
    "groundControlPoints": [...]
  },
  "fences": [...],
  "auth": {
    "uiPassword": null
  }
}
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Deployment](docs/DEPLOYMENT.md) | Pull and run Docker image on EC2/local |
| [API Reference](docs/API.md) | Location update endpoints |
| [CI/CD Setup](docs/CI_CD.md) | GitHub Actions pipeline |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Configuration](config/README.md) | Full config schema |

## Docker Image Repositories

| Environment | ECR Repository |
|-------------|----------------|
| **Production** | `343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest` |
| **Development** | `116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:dev` |

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Material-UI
- **Backend**: Node.js, Express, SSE
- **Infrastructure**: Docker, Nginx, AWS App Runner

## License

Internal demo application by Cavea GmbH.
