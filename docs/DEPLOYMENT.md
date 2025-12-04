# Deployment Guide

This guide shows how to pull and run the Docker image on any machine (EC2, local, on-premises).

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- AWS CLI configured (for ECR access) or Docker image file provided

## Docker Image Repositories

| Environment | Repository | Use For |
|-------------|------------|---------|
| **Production** | `343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest` | Stable releases, customer deployments |
| **Development** | `116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:dev` | Testing, preview features |

---

## Quick Start

### 1. Login to AWS ECR

```bash
# Production account
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 343218205164.dkr.ecr.eu-central-1.amazonaws.com

# Development account
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 116981770603.dkr.ecr.eu-central-1.amazonaws.com
```

### 2. Pull the Image

```bash
# Production (stable)
docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Development (testing)
docker pull 116981770603.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:dev
```

### 3. Run the Container

**With default configuration:**
```bash
docker run -d --name demo-ui -p 80:80 --restart unless-stopped \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

**With custom configuration:**
```bash
docker run -d --name demo-ui -p 80:80 --restart unless-stopped \
  -v /path/to/your-config.json:/config/app-config.json:ro \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

### 4. Verify Deployment

```bash
# Check container is running
docker ps

# Check health
curl http://localhost/health

# View logs
docker logs demo-ui
```

Open http://localhost (or your server's IP) in a browser.

---

## Custom Configuration

Create a config file based on `config/app-config.example.json`:

```json
{
  "floor": {
    "width": 100,
    "length": 60
  },
  "zone": {
    "id": "warehouse-1",
    "position": [7.815694, 48.130216],
    "groundControlPoints": [
      {"wgs84": [7.815694, 48.130216], "local": [0, 0]},
      {"wgs84": [7.816551, 48.130216], "local": [100, 0]},
      {"wgs84": [7.815694, 48.13031], "local": [0, 60]},
      {"wgs84": [7.816551, 48.13031], "local": [100, 60]}
    ]
  },
  "fences": [],
  "auth": {
    "uiPassword": "YourSecurePassword123",
    "sessionDurationHours": 720
  },
  "initialData": {
    "loadInitialData": false
  }
}
```

Mount as volume when running:
```bash
docker run -p 80:80 -v ./my-config.json:/config/app-config.json:ro demo-ui:latest
```

---

## EC2 Deployment

### Step-by-Step

1. **Launch EC2 Instance**
   - Amazon Linux 2023 or Ubuntu 22.04
   - t3.micro is sufficient
   - Security group: Allow inbound HTTP (80) and SSH (22)

2. **Connect to EC2**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. **Install Docker**
   ```bash
   # Amazon Linux
   sudo yum install -y docker
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user
   
   # Log out and back in for group change
   exit
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

4. **Install AWS CLI** (if not pre-installed)
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

5. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, Region (eu-central-1)
   ```

6. **Pull and Run**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region eu-central-1 | \
     docker login --username AWS --password-stdin 343218205164.dkr.ecr.eu-central-1.amazonaws.com
   
   # Pull image
   docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
   
   # Run container
   docker run -d --name demo-ui -p 80:80 --restart unless-stopped \
     343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
   ```

7. **Access the Application**
   - Open `http://your-ec2-public-ip` in browser

---

## Docker Compose

For easier management, use Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  demo-ui:
    image: 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
    container_name: demo-ui
    ports:
      - "80:80"
    volumes:
      - ./config.json:/config/app-config.json:ro
    restart: unless-stopped
```

```bash
docker-compose up -d
docker-compose logs -f
```

---

## Update to New Version

```bash
# Pull latest image
docker pull 343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Stop and remove old container
docker stop demo-ui
docker rm demo-ui

# Start with new image
docker run -d --name demo-ui -p 80:80 --restart unless-stopped \
  -v ./config.json:/config/app-config.json:ro \
  343218205164.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
```

---

## Without AWS Access (Image File)

If you received a Docker image file:

```bash
# Load the image
docker load -i demo-ui-latest.tar

# Verify
docker images | grep demo-ui

# Run
docker run -d --name demo-ui -p 80:80 --restart unless-stopped demo-ui:latest
```

---

## Troubleshooting

**Container won't start:**
```bash
docker logs demo-ui
```

**Port already in use:**
```bash
docker run -p 8080:80 ...  # Use different port
```

**Config not loading:**
```bash
# Verify mount
docker exec demo-ui ls -la /config

# Check config via API
curl http://localhost/api/config
```

**ECR login expired:**
```bash
# Re-authenticate (tokens expire after 12 hours)
aws ecr get-login-password --region eu-central-1 | docker login ...
```
