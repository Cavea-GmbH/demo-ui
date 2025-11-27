# AWS Deployment Setup

This guide explains how to deploy the demo-ui application to AWS. The application now uses runtime configuration, allowing you to deploy the same Docker image to multiple instances with different configurations.

## Architecture Changes

**Previous Approach (Build-Time Config):**
- Configuration baked into Docker image at build time via `VITE_*` env vars
- New image required for each configuration change
- Different images for different deployments

**Current Approach (Runtime Config):**
- Configuration loaded at runtime from JSON files or environment
- Same Docker image for all deployments
- Config changes without rebuilding

## Deployment Options

### Option 1: AWS ECS/Fargate (Recommended)
Best for: Multiple instances, flexible configuration, production workloads

**Pros:**
- Easy config management via EFS or task definition
- Supports volume mounts for config files
- Auto-scaling and load balancing
- Full container orchestration

**Cons:**
- Slightly more complex setup than App Runner
- More configuration options to manage

See [ECS/Fargate Deployment](#ecsfargate-deployment) section below.

### Option 2: AWS App Runner (Simpler Alternative)
Best for: Single instances, simple deployments, quick setup

**Pros:**
- Very simple setup
- Fully managed
- Auto-scaling included

**Cons:**
- Limited volume mount support
- Uses built-in default config (harder to customize)

See [App Runner Deployment](#app-runner-deployment) section below.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with OIDC configured for AWS (for CI/CD)

## Common Setup (All Options)

### Step 1: Create ECR Repository

Create an Amazon ECR repository to store Docker images:

```bash
aws ecr create-repository \
  --repository-name demo-ui \
  --region eu-central-1
```

Note the repository URI (e.g., `123456789012.dkr.ecr.eu-central-1.amazonaws.com/demo-ui`)

### Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1.amazonaws.com

# Build image (generic build, no config baked in)
docker build -t demo-ui:latest .

# Tag image
docker tag demo-ui:latest <account-id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ui:latest

# Push to ECR
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ui:latest
```

## ECS/Fargate Deployment

### Architecture

- ECS Tasks run Docker containers
- Configuration via EFS volume or embedded in task definition
- Application Load Balancer for HTTPS/routing
- CloudWatch for logging

### Setup Steps

#### 1. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name demo-ui-cluster \
  --region eu-central-1
```

#### 2. Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/demo-ui \
  --region eu-central-1
```

#### 3. Create Task Execution Role

Create IAM role for ECS task execution:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach policies:
- `AmazonECSTaskExecutionRolePolicy`
- `AmazonElasticFileSystemClientReadWriteAccess` (if using EFS)

#### 4. Configuration Options

**Option A: Using Built-in Default Config (Simplest)**

No additional setup needed. The Docker image includes default config.

**Option B: Using EFS for Config Files (Recommended)**

1. Create EFS file system:

```bash
aws efs create-file-system \
  --performance-mode generalPurpose \
  --throughput-mode bursting \
  --encrypted \
  --tags Key=Name,Value=demo-ui-configs \
  --region eu-central-1
```

2. Create mount targets in your VPC subnets

3. Upload config files to EFS:

```bash
# Mount EFS locally
sudo mount -t efs -o tls fs-xxxxxxxxx:/ /mnt/efs

# Create config directories
sudo mkdir -p /mnt/efs/instance1
sudo mkdir -p /mnt/efs/instance2

# Upload configs
sudo cp config/instance1.json /mnt/efs/instance1/app-config.json
sudo cp config/instance2.json /mnt/efs/instance2/app-config.json
```

#### 5. Create Task Definition

**With EFS Config:**

```json
{
  "family": "demo-ui",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
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
      "mountPoints": [
        {
          "sourceVolume": "config",
          "containerPath": "/config",
          "readOnly": true
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/demo-ui",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "config",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxxxxx",
        "rootDirectory": "/instance1",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 6. Create ECS Service

```bash
aws ecs create-service \
  --cluster demo-ui-cluster \
  --service-name demo-ui-instance1 \
  --task-definition demo-ui:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-central-1
```

#### 7. Multiple Instances

Create separate services with different EFS paths:

```bash
# Instance 1
aws ecs create-service \
  --cluster demo-ui-cluster \
  --service-name demo-ui-instance1 \
  ... \
  --region eu-central-1

# Instance 2 (use different task definition with /instance2 EFS path)
aws ecs create-service \
  --cluster demo-ui-cluster \
  --service-name demo-ui-instance2 \
  ... \
  --region eu-central-1
```

### Configuration Updates

To update configuration:

1. Upload new config to EFS
2. Restart ECS service:

```bash
aws ecs update-service \
  --cluster demo-ui-cluster \
  --service demo-ui-instance1 \
  --force-new-deployment \
  --region eu-central-1
```

### Cost Estimation

ECS/Fargate pricing (eu-central-1):
- **vCPU**: ~$0.04048/vCPU-hour
- **Memory**: ~$0.004445/GB-hour
- **0.5 vCPU, 1 GB**: ~$0.0247/hour = ~$18/month (if running 24/7)
- **EFS**: $0.30/GB-month + $0.03/GB data transfer
- Plus data transfer and load balancer costs

## App Runner Deployment

### Note on Configuration

App Runner has limited support for volume mounts, so the application will use the **built-in default configuration**. To customize config for App Runner, you would need to rebuild the image with different defaults or use environment variables (more complex).

**Recommendation:** Use ECS/Fargate if you need easy per-instance configuration.

### Create App Runner Service

Create an App Runner service using the AWS Console or CLI:

### Using AWS Console:

1. Go to **AWS App Runner** in the AWS Console
2. Click **Create service**
3. **Source**: Container registry → Amazon ECR
4. **Container image URI**: Use the ECR repository URI from Step 1
5. **Deployment settings**: Automatic
6. **Service name**: `demo-ui-prod` (or `demo-ui-dev`)
7. **Virtual CPU & memory**: 1 vCPU, 2 GB (adjust as needed)
8. **Port**: 80
9. **Environment variables**: Add if needed
   - `NODE_ENV=production`
10. Click **Create & deploy**

### Using AWS CLI:

```bash
aws apprunner create-service \
  --service-name demo-ui-prod \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "YOUR_ECR_URI:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "80"
      }
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "1024",
    "Memory": "2048"
  }' \
  --region eu-central-1
```

Note the **Service ARN** from the output.

### Configure GitHub Secrets and Variables

Add the following to your GitHub repository's environment (Production/Development):

#### Secrets:
- `AWS_OIDC_ROLE_ARN` - Your AWS IAM role ARN for GitHub OIDC

#### Variables:
- `ECR_REPOSITORY` - ECR repository name (e.g., `demo-ui`)
- `APP_RUNNER_SERVICE_ARN` - App Runner service ARN
- `ECS_CLUSTER` - ECS cluster name (if using ECS)
- `ECS_SERVICE` - ECS service name (if using ECS)

## IAM Permissions

### For GitHub Actions (CI/CD)

Ensure your GitHub OIDC role has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:UpdateService",
        "apprunner:DescribeService"
      ],
      "Resource": "arn:aws:apprunner:eu-central-1:*:service/demo-ui-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "arn:aws:ecs:eu-central-1:*:service/demo-ui-*"
    }
  ]
}
```

### For ECS Tasks

ECS task execution role needs:
- `AmazonECSTaskExecutionRolePolicy` (managed policy)
- `AmazonElasticFileSystemClientReadWriteAccess` (if using EFS)

## Application Architecture

The deployed application includes:

- **Nginx** (Port 80): Serves the React frontend
- **Node.js Proxy** (Port 3001): Handles SSE and API endpoints
- **Supervisor**: Manages both processes in the container
- **Configuration**: Loaded at runtime from volume or built-in default

## Accessing the Application

**ECS/Fargate:**
Access via Application Load Balancer DNS or custom domain.

**App Runner:**
App Runner provides a URL like: `https://xxxxx.eu-central-1.awsapprunner.com`

### Health Check

```bash
curl https://your-endpoint/health
```

### View Configuration

```bash
curl https://your-endpoint/api/config
```

## Monitoring and Logging

### ECS/Fargate Logs

View logs in CloudWatch:
- Log Group: `/ecs/demo-ui`
- Or via CLI: `aws logs tail /ecs/demo-ui --follow`

### App Runner Logs

View logs in:
- **AWS App Runner Console** → Your service → Logs
- **CloudWatch Logs** → `/aws/apprunner/demo-ui-prod/application`

### Metrics

Monitor via CloudWatch:
- CPU utilization
- Memory utilization
- Request count
- Error rates

## Configuration Management

### Updating Configuration

**ECS with EFS:**
1. Upload new config to EFS
2. Force new deployment: `aws ecs update-service --cluster ... --service ... --force-new-deployment`

**App Runner:**
- Configuration is baked into image (limited customization)
- For config changes, rebuild image with updated default config

### Version Control

Store config files in git (separate repository for security):
```
configs/
  ├── production/
  │   ├── instance1.json
  │   └── instance2.json
  └── staging/
      └── instance1.json
```

## Cleanup

To remove resources:

**ECS/Fargate:**
```bash
# Delete ECS service
aws ecs delete-service \
  --cluster demo-ui-cluster \
  --service demo-ui-instance1 \
  --force \
  --region eu-central-1

# Delete ECS cluster
aws ecs delete-cluster \
  --cluster demo-ui-cluster \
  --region eu-central-1

# Delete EFS (if used)
aws efs delete-file-system \
  --file-system-id fs-xxxxxxxxx \
  --region eu-central-1
```

**App Runner:**
```bash
# Delete App Runner service
aws apprunner delete-service \
  --service-arn YOUR_SERVICE_ARN \
  --region eu-central-1
```

**Common:**
```bash
# Delete ECR repository
aws ecr delete-repository \
  --repository-name demo-ui \
  --force \
  --region eu-central-1

# Delete CloudWatch log groups
aws logs delete-log-group \
  --log-group-name /ecs/demo-ui \
  --region eu-central-1
```

## Troubleshooting

### Container fails to start
- Check CloudWatch logs for errors
- Verify Dockerfile builds locally: `docker build -t demo-ui .`
- Test container locally: `docker run -p 80:80 demo-ui`
- Check config validation: Look for config errors in logs

### Configuration not loading
- **ECS**: Verify EFS mount is working: `aws ecs describe-tasks`
- Check file exists: Connect to container and verify `/config/app-config.json`
- Validate JSON syntax: Use JSON validator on config file
- Check logs for config loading messages

### Application shows default values
- Volume mount may not be working - check ECS task definition
- Config file may have validation errors - check container logs
- Verify EFS path is correct in task definition

### Deployment timeout
- Increase health check grace period
- Check if ports 80 is properly exposed
- Verify security groups allow inbound traffic

### SSE not working
- Verify proxy server is running (check logs for port 3001)
- Check browser console for connection errors
- Ensure Nginx proxy configuration is correct

### Performance issues
- Increase CPU/memory allocation in task definition
- Check CloudWatch metrics for resource constraints
- Enable auto-scaling if needed

