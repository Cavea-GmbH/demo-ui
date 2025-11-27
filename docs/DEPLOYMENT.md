# Deployment Guide

This guide explains how to deploy the demo-ui application in various environments. The application is packaged as a Docker image with runtime configuration, allowing the same image to be used across multiple instances with different settings.

## Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Standalone Docker](#standalone-docker)
- [Docker Compose](#docker-compose)
- [AWS ECS/Fargate](#aws-ecsfargate)
- [AWS App Runner](#aws-app-runner)
- [Kubernetes](#kubernetes)
- [On-Premises](#on-premises)

## Overview

### Architecture

The application consists of:
- **Frontend**: React SPA served by Nginx (port 80)
- **Backend**: Node.js proxy server for SSE and API (port 3001)
- **Supervisor**: Process manager running both services in the container

### Configuration Approach

- Configuration is loaded at **runtime** from JSON files
- **Built-in default config** included in the Docker image
- **Custom config** can be provided via volume mount
- **Single Docker image** for all deployments

## Configuration

See [config/README.md](config/README.md) for detailed configuration documentation.

### Quick Start

1. Copy the example config:
   ```bash
   cp config/app-config.example.json config/app-config.json
   ```

2. Edit `config/app-config.json` with your values

3. Use the config in your deployment (see platform-specific sections below)

## Local Development

### With Docker Compose

```bash
# Copy and customize config
cp config/app-config.example.json config/app-config.json
nano config/app-config.json

# Run application
docker-compose up
```

Access at: http://localhost:3000

### Without Docker (Development Mode)

```bash
# Install dependencies
npm install

# Start backend server (loads config from file)
npm run dev:proxy

# In another terminal, start frontend
npm run dev
```

Access at: http://localhost:3000 (frontend) and http://localhost:3001 (backend)

## Standalone Docker

### Using Built-in Default Config

```bash
# Build image
docker build -t demo-ui:latest .

# Run with default config
docker run -p 80:80 demo-ui:latest
```

### Using Custom Config

```bash
# Run with volume-mounted config
docker run -p 80:80 \
  -v $(pwd)/config/app-config.json:/config/app-config.json:ro \
  demo-ui:latest
```

### Multiple Instances

Run multiple instances with different configs:

```bash
# Instance 1 - Customer A
docker run -d --name demo-ui-customer-a \
  -p 8001:80 \
  -v $(pwd)/config/customer-a.json:/config/app-config.json:ro \
  demo-ui:latest

# Instance 2 - Customer B
docker run -d --name demo-ui-customer-b \
  -p 8002:80 \
  -v $(pwd)/config/customer-b.json:/config/app-config.json:ro \
  demo-ui:latest

# Instance 3 - Demo (default config)
docker run -d --name demo-ui-demo \
  -p 8003:80 \
  demo-ui:latest
```

## Docker Compose

### Basic Setup

```yaml
version: '3.8'

services:
  demo-ui:
    image: demo-ui:latest
    ports:
      - "3000:80"
    volumes:
      - ./config/app-config.json:/config/app-config.json:ro
    restart: unless-stopped
```

### Multiple Instances

```yaml
version: '3.8'

services:
  demo-ui-instance-1:
    image: demo-ui:latest
    ports:
      - "8001:80"
    volumes:
      - ./config/instance1.json:/config/app-config.json:ro
    restart: unless-stopped

  demo-ui-instance-2:
    image: demo-ui:latest
    ports:
      - "8002:80"
    volumes:
      - ./config/instance2.json:/config/app-config.json:ro
    restart: unless-stopped
```

## AWS ECS/Fargate

### Prerequisites

- AWS CLI configured
- ECR repository created
- ECS cluster created

### Build and Push Image

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1.amazonaws.com

# Build and tag image
docker build -t demo-ui:latest .
docker tag demo-ui:latest <account-id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ui:latest

# Push to ECR
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ui:latest
```

### ECS Task Definition

Create a task definition JSON:

```json
{
  "family": "demo-ui",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "demo-ui",
      "image": "<account-id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ui:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/demo-ui",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Option 1: Using Default Config

No additional configuration needed - uses built-in default config.

### Option 2: Using EFS for Config

1. Create EFS file system
2. Mount EFS to task
3. Upload config to EFS

Task definition with EFS:

```json
{
  "volumes": [
    {
      "name": "config",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxxxxx",
        "rootDirectory": "/configs/instance1"
      }
    }
  ],
  "containerDefinitions": [
    {
      ...
      "mountPoints": [
        {
          "sourceVolume": "config",
          "containerPath": "/config",
          "readOnly": true
        }
      ]
    }
  ]
}
```

### Create ECS Service

```bash
aws ecs create-service \
  --cluster demo-ui-cluster \
  --service-name demo-ui-instance1 \
  --task-definition demo-ui:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## AWS App Runner

App Runner can still be used but has limitations with volume mounts. Configuration must be embedded in the image or passed via environment variables.

See [_concept/AWS_SETUP.md](_concept/AWS_SETUP.md) for App Runner-specific instructions.

## Kubernetes

### ConfigMap Approach

1. Create ConfigMap from config file:

```bash
kubectl create configmap demo-ui-config \
  --from-file=app-config.json=config/app-config.json
```

2. Create Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-ui
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo-ui
  template:
    metadata:
      labels:
        app: demo-ui
    spec:
      containers:
      - name: demo-ui
        image: demo-ui:latest
        ports:
        - containerPort: 80
        volumeMounts:
        - name: config
          mountPath: /config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: demo-ui-config
---
apiVersion: v1
kind: Service
metadata:
  name: demo-ui
spec:
  selector:
    app: demo-ui
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

3. Deploy:

```bash
kubectl apply -f deployment.yaml
```

### Multiple Instances

Create separate ConfigMaps and Deployments for each instance:

```bash
# Instance 1
kubectl create configmap demo-ui-config-instance1 \
  --from-file=app-config.json=config/instance1.json

# Instance 2
kubectl create configmap demo-ui-config-instance2 \
  --from-file=app-config.json=config/instance2.json
```

## On-Premises

### Systemd Service

1. Create systemd service file `/etc/systemd/system/demo-ui.service`:

```ini
[Unit]
Description=Demo UI Application
After=docker.service
Requires=docker.service

[Service]
TimeoutStartSec=0
Restart=always
ExecStartPre=-/usr/bin/docker stop demo-ui
ExecStartPre=-/usr/bin/docker rm demo-ui
ExecStart=/usr/bin/docker run \
  --name demo-ui \
  -p 80:80 \
  -v /opt/demo-ui/config/app-config.json:/config/app-config.json:ro \
  demo-ui:latest
ExecStop=/usr/bin/docker stop demo-ui

[Install]
WantedBy=multi-user.target
```

2. Place config file:

```bash
mkdir -p /opt/demo-ui/config
cp config/app-config.json /opt/demo-ui/config/
```

3. Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable demo-ui
sudo systemctl start demo-ui
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  demo-ui:
    image: demo-ui:latest
    container_name: demo-ui
    ports:
      - "80:80"
    volumes:
      - /opt/demo-ui/config/app-config.json:/config/app-config.json:ro
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Monitoring and Logging

### Health Check

The application exposes a health check endpoint:

```bash
curl http://localhost:80/health
```

Response:
```json
{
  "status": "ok",
  "configLoaded": true,
  "clientsConnected": 2,
  "providersCount": 3,
  "trackablesCount": 1
}
```

### View Logs

**Docker:**
```bash
docker logs <container-name>
```

**Docker Compose:**
```bash
docker-compose logs -f
```

**Kubernetes:**
```bash
kubectl logs deployment/demo-ui
```

### Configuration Verification

Check loaded configuration:

```bash
curl http://localhost:80/api/config
```

## Troubleshooting

### Container won't start
- Check logs: `docker logs <container>`
- Verify config file syntax: `cat config/app-config.json | jq`
- Ensure config file is valid JSON

### Config not loading
- Verify volume mount: `docker exec <container> ls -la /config`
- Check file permissions: config file must be readable
- View loaded config: `docker exec <container> cat /app/config/default-config.json`

### Port already in use
- Check what's using the port: `lsof -i :80` (Linux/Mac) or `netstat -ano | findstr :80` (Windows)
- Use a different port mapping: `-p 8080:80`

### Application shows default config
- Volume mount may not be working - check docker-compose.yml or docker run command
- Config file may have validation errors - check console output

## Security Considerations

1. **Config Files**: Ensure config files contain no sensitive data (API keys, passwords)
2. **Volume Mounts**: Use read-only mounts (`:ro`)
3. **Network**: Run behind reverse proxy (Nginx, Traefik) with HTTPS
4. **Updates**: Regularly update the Docker image for security patches

## Performance Tuning

### Resource Limits

```yaml
services:
  demo-ui:
    ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Scaling

Run multiple replicas behind a load balancer:

```bash
docker-compose up --scale demo-ui=3
```

## Next Steps

- Review [config/README.md](config/README.md) for configuration details
- Check [_concept/AWS_SETUP.md](_concept/AWS_SETUP.md) for AWS-specific guidance
- Set up monitoring and alerting for production deployments

