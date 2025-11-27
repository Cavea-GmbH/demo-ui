# Runtime Configuration Migration Summary

## Overview

The application has been successfully migrated from **build-time configuration** to **runtime configuration**. This enables deploying the same Docker image to multiple instances with different configurations.

## What Changed

### Before (Build-Time Config)
- Configuration baked into Docker image via `VITE_*` environment variables
- New image required for each configuration change
- Different builds for different deployments

### After (Runtime Config)
- Configuration loaded at runtime from JSON files
- Same Docker image for all deployments
- Config changes without rebuilding
- Configuration served via `/api/config` endpoint

## Key Changes

### 1. Configuration Files Created

- **`config/default-config.json`** - Default configuration (baked into Docker image)
- **`config/app-config.example.json`** - Template for customization
- **`config/README.md`** - Configuration documentation
- **`DEPLOYMENT.md`** - Comprehensive deployment guide

### 2. Backend Changes

**`server.js`**
- Added config loading logic (priority: volume mount → built-in default)
- New `/api/config` endpoint to serve configuration to frontend
- Enhanced health check with config status
- Logs config details on startup

### 3. Frontend Changes

**New Files:**
- `src/types/config.ts` - TypeScript interfaces for configuration
- `src/services/configService.ts` - Config fetching service
- `src/contexts/ConfigContext.tsx` - React Context for runtime config

**Modified Files:**
- `src/App.tsx` - Wrapped with ConfigProvider, added loading/error states
- `src/config/floorConfig.ts` - Simplified to static exports (deprecated)
- `src/config/constants.ts` - Updated for backward compatibility
- `src/hooks/useLocationReceiver.ts` - Uses config from context
- `src/hooks/useOmloxData.ts` - Uses config from context

### 4. Docker Changes

**`Dockerfile`**
- Removed all `VITE_*` build arguments (lines 16-37)
- Generic build with no baked-in config
- Copies default config into image
- Creates `/config` directory for volume mounts

**`docker-compose.yml`**
- Added volume mount for custom config
- Removed `VITE_*` environment variables

### 5. Documentation

- **`config/README.md`** - Complete configuration schema and examples
- **`DEPLOYMENT.md`** - Deployment guide for all platforms
- **`_concept/AWS_SETUP.md`** - Updated for ECS/Fargate and App Runner
- **`.gitignore`** - Added `config/app-config.json`

## How to Use

### Quick Start

1. **Copy example config:**
   ```bash
   cp config/app-config.example.json config/app-config.json
   ```

2. **Customize config:**
   Edit `config/app-config.json` with your values

3. **Run with Docker Compose:**
   ```bash
   docker-compose up
   ```

### Deployment Options

#### Standalone Docker
```bash
docker run -p 80:80 \
  -v ./config/app-config.json:/config/app-config.json:ro \
  demo-ui:latest
```

#### Multiple Instances
```bash
# Instance 1
docker run -p 8001:80 -v ./config/customer-a.json:/config/app-config.json:ro demo-ui

# Instance 2  
docker run -p 8002:80 -v ./config/customer-b.json:/config/app-config.json:ro demo-ui

# Instance 3 (default config)
docker run -p 8003:80 demo-ui
```

#### AWS ECS/Fargate
- Use EFS volume for config files
- Same image, different EFS paths per service
- See `_concept/AWS_SETUP.md` for details

#### Kubernetes
- Use ConfigMaps for config files
- Mount as volume to `/config`
- See `DEPLOYMENT.md` for examples

## Configuration Schema

```json
{
  "floor": {
    "width": 50,      // meters
    "length": 30      // meters
  },
  "zone": {
    "id": "zone-1",
    "position": [lon, lat],
    "groundControlPoints": [
      {"wgs84": [lon, lat], "local": [x, y]}
    ]
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

## Migration Notes

### Backward Compatibility

The following exports are maintained for backward compatibility but deprecated:
- `FLOOR_PLAN_WIDTH` from `src/config/floorConfig.ts`
- `FLOOR_PLAN_LENGTH` from `src/config/floorConfig.ts`
- `ZONE_GEOREFERENCE` from `src/config/floorConfig.ts`
- `HARDCODED_*` from `src/config/constants.ts`

**Recommendation:** New code should use `useConfig()` hook instead.

### Breaking Changes

None! The application is fully backward compatible. If no custom config is provided, it uses the built-in default config with the same values as before.

### Testing Checklist

- [ ] Build Docker image: `docker build -t demo-ui:latest .`
- [ ] Run with default config: `docker run -p 80:80 demo-ui:latest`
- [ ] Test custom config: `docker run -p 80:80 -v ./config/app-config.json:/config/app-config.json:ro demo-ui`
- [ ] Verify config loading: `curl http://localhost/api/config`
- [ ] Check health: `curl http://localhost/health`
- [ ] Test multiple instances with different configs

## Benefits

✅ **Single Docker Image** - Same image for all instances  
✅ **No Rebuilds** - Config changes don't require rebuilding  
✅ **Simple Management** - Edit JSON files, not env vars  
✅ **Multi-Instance Ready** - Easy to deploy multiple instances  
✅ **Version Control** - Config files can be versioned  
✅ **Portable** - Works on-prem, AWS, Azure, GCP, Kubernetes  
✅ **Quick Start** - Default config included for immediate use  

## Troubleshooting

### Config not loading
- Check volume mount: `docker exec <container> ls -la /config`
- Validate JSON: `cat config/app-config.json | jq`
- Check logs: `docker logs <container>`

### Application shows default values
- Volume mount may not be working
- Config file may have validation errors
- Check console logs for config loading messages

### Build fails
- Ensure `config/default-config.json` exists
- Run `docker build` from project root

## Next Steps

1. Test local deployment with custom config
2. Update CI/CD pipelines (no more build-time config)
3. Prepare configs for different instances/customers
4. Deploy to production
5. Document instance-specific configs

## Support

- Configuration: See `config/README.md`
- Deployment: See `DEPLOYMENT.md`
- AWS: See `_concept/AWS_SETUP.md`
- Issues: Check container logs and validate config JSON

