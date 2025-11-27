# Customer Deployment Guide

This guide explains how to deploy the demo-ui application for customer-specific instances with custom configurations.

## Overview

The application is distributed as a Docker image that can be deployed anywhere Docker runs. Each customer instance can have its own configuration by mounting a custom config file, without requiring a rebuild of the Docker image.

### Docker Image Repositories

We maintain two separate ECR repositories for different purposes:

- **Production (stable releases)**: `343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest`
  - Use this for customer deployments
  - Built from `main` branch
  - Tested and stable releases only

- **Development (preview/testing)**: `116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:dev`
  - For internal testing and preview features
  - Built from `dev` branch
  - May contain experimental features

> **For customer deployments, always use the Production repository with the `latest` tag.**

## Prerequisites

- Docker installed (version 20.10 or later)
- Access to the Docker image (via AWS ECR or provided image file)
- Custom configuration file prepared
- Port 80 available (or use a different port mapping)

## Quick Start

### 1. Prepare Your Configuration

Copy the example configuration and customize it for your environment:

```bash
cp config/app-config.example.json customer-config.json
```

Edit `customer-config.json` with your specific values:
- **Floor dimensions**: Width and length in meters
- **Zone coordinates**: Geographic reference points and ground control points
- **Fences**: Geofence definitions for your floor plan
- **Initial demo data**: Optional providers and trackables for testing

See [`config/README.md`](../config/README.md) for detailed configuration schema and examples.

### 2. Obtain the Docker Image

#### Option A: Pull from AWS ECR (if you have access)

**Production (stable releases):**
```bash
# Configure AWS credentials
aws configure

# Login to ECR (Production account)
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 343218205164.dkr.ecr.eu-central-1.amazonaws.com

# Pull the latest stable image
docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

**Development (testing/preview features):**
```bash
# Login to ECR (Development account)
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 116981770603.dkr.ecr.eu-central-1.amazonaws.com

# Pull the development image
docker pull 116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:dev
```

> **Note:** For customer deployments, use the **Production** image (`343218205164`) tagged with `latest` for stable, tested releases.

#### Option B: Load from provided image file

If you received a Docker image file (`.tar` or `.tar.gz`):

```bash
# Load the image
docker load -i demo-ui-latest.tar

# Verify the image
docker images | grep demo-ui
```

### 3. Run the Application

#### Basic deployment (standalone):

```bash
docker run -d \
  --name demo-ui-customer \
  -p 80:80 \
  -v $(pwd)/customer-config.json:/config/app-config.json:ro \
  --restart unless-stopped \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

**Parameters explained:**
- `-d`: Run in detached mode (background)
- `--name demo-ui-customer`: Container name for easy reference
- `-p 80:80`: Map port 80 (host) to port 80 (container)
- `-v $(pwd)/customer-config.json:/config/app-config.json:ro`: Mount your config (read-only)
- `--restart unless-stopped`: Auto-restart on system reboot
- Image: Production ECR repository with `latest` tag

#### Alternative port (if port 80 is in use):

```bash
docker run -d \
  --name demo-ui-customer \
  -p 8080:80 \
  -v $(pwd)/customer-config.json:/config/app-config.json:ro \
  --restart unless-stopped \
  demo-ui:latest
```

Access at: `http://localhost:8080`

### 4. Verify Deployment

Check that the application is running correctly:

```bash
# Check container status
docker ps | grep demo-ui

# View logs
docker logs demo-ui-customer

# Test health endpoint
curl http://localhost/health

# Verify your config is loaded
curl http://localhost/api/config | jq
```

Expected health response:
```json
{
  "status": "ok",
  "configLoaded": true,
  "clientsConnected": 0,
  "providersCount": 2,
  "trackablesCount": 1
}
```

### 5. Access the Application

Open your web browser and navigate to:
- **Local deployment**: `http://localhost`
- **Server deployment**: `http://<server-ip-or-domain>`

You should see the floor plan with your configured dimensions, fences, and any initial demo data.

## Configuration Updates

To update the configuration without rebuilding:

```bash
# 1. Edit your config file
nano customer-config.json

# 2. Validate the JSON syntax
cat customer-config.json | jq . > /dev/null && echo "✅ Valid JSON"

# 3. Restart the container to load new config
docker restart demo-ui-customer

# 4. Verify the new config is loaded
curl http://localhost/api/config | jq '.floor'
```

The application will reload the configuration on restart.

## Deployment Options

### Option A: Standalone Docker Container

Perfect for single-server deployments or testing.

```bash
# Create a directory for your deployment
mkdir -p /opt/demo-ui
cd /opt/demo-ui

# Place your config file
cp customer-config.json /opt/demo-ui/config.json

# Run the container
docker run -d \
  --name demo-ui \
  -p 80:80 \
  -v /opt/demo-ui/config.json:/config/app-config.json:ro \
  --restart always \
  demo-ui:latest

# View logs
docker logs -f demo-ui
```

### Option B: Docker Compose

Recommended for easier management and reproducibility.

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  demo-ui:
    image: 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
    container_name: demo-ui-customer
    ports:
      - "80:80"
    volumes:
      - ./customer-config.json:/config/app-config.json:ro
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Deploy:

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Restart after config changes
docker-compose restart
```

### Option C: Behind Reverse Proxy (Production)

For production deployments, use a reverse proxy for HTTPS and better security.

#### Using Nginx:

```nginx
# /etc/nginx/sites-available/demo-ui
server {
    listen 80;
    server_name demo.customer.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name demo.customer.com;
    
    ssl_certificate /etc/ssl/certs/demo.customer.com.crt;
    ssl_certificate_key /etc/ssl/private/demo.customer.com.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (for SSE)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/demo-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option D: Systemd Service (Linux)

For automatic startup on system boot.

Create `/etc/systemd/system/demo-ui.service`:

```ini
[Unit]
Description=Demo UI Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/demo-ui
ExecStartPre=-/usr/bin/docker stop demo-ui
ExecStartPre=-/usr/bin/docker rm demo-ui
ExecStart=/usr/bin/docker run \
  --name demo-ui \
  -p 80:80 \
  -v /opt/demo-ui/config.json:/config/app-config.json:ro \
  --restart unless-stopped \
  demo-ui:latest
ExecStop=/usr/bin/docker stop demo-ui

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable demo-ui
sudo systemctl start demo-ui
sudo systemctl status demo-ui
```

## Multiple Customer Instances

To run multiple instances on the same server (for testing or multi-tenant):

```bash
# Customer A on port 8001
docker run -d \
  --name demo-ui-customer-a \
  -p 8001:80 \
  -v $(pwd)/customer-a-config.json:/config/app-config.json:ro \
  demo-ui:latest

# Customer B on port 8002
docker run -d \
  --name demo-ui-customer-b \
  -p 8002:80 \
  -v $(pwd)/customer-b-config.json:/config/app-config.json:ro \
  demo-ui:latest

# Test instance on port 8003 (using default config)
docker run -d \
  --name demo-ui-test \
  -p 8003:80 \
  demo-ui:latest
```

## Backup and Recovery

### Backup your configuration:

```bash
# Backup config file
cp customer-config.json customer-config.backup.$(date +%Y%m%d).json

# Backup with versioning
mkdir -p backups
cp customer-config.json backups/config-$(date +%Y%m%d-%H%M%S).json
```

### Disaster recovery:

```bash
# Stop the current container
docker stop demo-ui-customer

# Restore configuration from backup
cp backups/config-20240101-120000.json customer-config.json

# Start the container
docker start demo-ui-customer
```

## Monitoring and Maintenance

### View logs:

```bash
# Follow logs in real-time
docker logs -f demo-ui-customer

# View last 100 lines
docker logs --tail 100 demo-ui-customer

# View logs with timestamps
docker logs -t demo-ui-customer
```

### Check resource usage:

```bash
# Container stats
docker stats demo-ui-customer

# Detailed inspection
docker inspect demo-ui-customer
```

### Update to newer version:

```bash
# Pull latest image (Production)
docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Stop and remove old container
docker stop demo-ui-customer
docker rm demo-ui-customer

# Start with new image
docker run -d \
  --name demo-ui-customer \
  -p 80:80 \
  -v $(pwd)/customer-config.json:/config/app-config.json:ro \
  --restart unless-stopped \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker logs demo-ui-customer

# Common issues:
# - Port already in use: Change port mapping (-p 8080:80)
# - Config file not found: Check volume mount path
# - Invalid JSON: Validate with: cat customer-config.json | jq
```

### Configuration not loading

```bash
# Verify config file is mounted
docker exec demo-ui-customer ls -la /config

# Check config file contents in container
docker exec demo-ui-customer cat /config/app-config.json | jq

# Verify config is loaded via API
curl http://localhost/api/config | jq
```

### Application not accessible

```bash
# Check if container is running
docker ps | grep demo-ui

# Check port bindings
docker port demo-ui-customer

# Test locally
curl -v http://localhost/health

# Check firewall (Linux)
sudo ufw status
sudo ufw allow 80/tcp

# Check Docker network
docker network inspect bridge
```

### Application shows default values

- Config file may have validation errors (check container logs)
- Volume mount may not be working correctly (verify path)
- Config file syntax errors (validate with `jq`)

### Performance issues

```bash
# Check resource limits
docker stats demo-ui-customer

# Increase resources (if needed)
docker update --memory 2g --cpus 2 demo-ui-customer

# Restart container
docker restart demo-ui-customer
```

## Security Best Practices

1. **Use read-only mounts**: Always mount config files as read-only (`:ro`)
2. **Run behind reverse proxy**: Use Nginx/Traefik with HTTPS in production
3. **Firewall configuration**: Only expose necessary ports
4. **Regular updates**: Pull and deploy updated images regularly
5. **Secure config files**: Restrict file permissions on config files
   ```bash
   chmod 600 customer-config.json
   chown root:root customer-config.json
   ```
6. **Network isolation**: Use Docker networks for better isolation
7. **Log management**: Implement log rotation and monitoring

## Support and Resources

### Documentation:
- [`config/README.md`](../config/README.md) - Configuration schema and examples
- [`DEPLOYMENT.md`](../DEPLOYMENT.md) - General deployment guide
- [`docs/AWS_SETUP.md`](AWS_SETUP.md) - AWS-specific deployment
- [`docs/API_USAGE.md`](API_USAGE.md) - API documentation
- [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) - Troubleshooting guide

### Getting Help:
- Check container logs first: `docker logs demo-ui-customer`
- Validate your configuration file
- Review the troubleshooting section above
- Contact support: [your-support-email]

## Example Configuration Files

### Minimal Configuration:

```json
{
  "floor": {
    "width": 100,
    "length": 50
  },
  "zone": {
    "id": "warehouse-1",
    "position": [7.815694, 48.130216],
    "groundControlPoints": [
      {"wgs84": [7.815694, 48.130216], "local": [0, 0]},
      {"wgs84": [7.816551, 48.130216], "local": [100, 0]},
      {"wgs84": [7.815694, 48.13031], "local": [0, 50]},
      {"wgs84": [7.816551, 48.13031], "local": [100, 50]}
    ]
  },
  "fences": [],
  "initialData": {
    "loadInitialData": false,
    "providers": [],
    "trackables": [],
    "locations": {}
  }
}
```

### Production Configuration with Fences:

See `config/app-config.example.json` for a complete example with fences and demo data.

## Changelog

### Version 1.0 (Latest)
- Runtime configuration support
- Volume-mounted config files
- Improved deployment flexibility
- Better multi-instance support





