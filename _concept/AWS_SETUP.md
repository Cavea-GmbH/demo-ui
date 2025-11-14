# AWS App Runner Deployment Setup

This guide explains how to set up AWS App Runner to deploy the demo-ui application.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with OIDC configured for AWS

## Step 1: Create ECR Repository

Create an Amazon ECR repository to store Docker images:

```bash
aws ecr create-repository \
  --repository-name demo-ui \
  --region eu-central-1
```

Note the repository URI (e.g., `123456789012.dkr.ecr.eu-central-1.amazonaws.com/demo-ui`)

## Step 2: Create App Runner Service

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

## Step 3: Configure GitHub Secrets and Variables

Add the following to your GitHub repository's environment (Production/Development):

### Secrets:
- `AWS_OIDC_ROLE_ARN` - Your AWS IAM role ARN for GitHub OIDC

### Variables:
- `ECR_REPOSITORY` - ECR repository name (e.g., `demo-ui`)
- `APP_RUNNER_SERVICE_ARN` - App Runner service ARN from Step 2
- `VITE_OMLOX_API_URL` - Your Omlox Hub API URL (if needed)

## Step 4: IAM Permissions

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
    }
  ]
}
```

## Architecture

The deployed application includes:

- **Nginx** (Port 80): Serves the React frontend
- **Node.js Proxy** (Port 3001): Handles SSE for real-time location updates
- **Supervisor**: Manages both processes in the container

## Accessing the Application

After deployment, App Runner provides a URL like:
```
https://xxxxx.eu-central-1.awsapprunner.com
```

The frontend is served on port 80, and the proxy server runs on port 3001 (internal).

## Cost Estimation

App Runner pricing (eu-central-1):
- **Compute**: ~$0.064/vCPU-hour + $0.007/GB-hour
- **1 vCPU, 2 GB**: ~$0.078/hour = ~$56/month (if running 24/7)
- Plus data transfer costs

## Monitoring

View logs in:
- **AWS App Runner Console** → Your service → Logs
- **CloudWatch Logs** → `/aws/apprunner/demo-ui-prod/application`

## Cleanup

To remove resources:

```bash
# Delete App Runner service
aws apprunner delete-service \
  --service-arn YOUR_SERVICE_ARN \
  --region eu-central-1

# Delete ECR repository
aws ecr delete-repository \
  --repository-name demo-ui \
  --force \
  --region eu-central-1
```

## Troubleshooting

### Container fails to start
- Check CloudWatch logs for errors
- Verify Dockerfile builds locally: `docker build -t demo-ui .`
- Test container locally: `docker run -p 80:80 -p 3001:3001 demo-ui`

### Deployment timeout
- Increase App Runner health check grace period
- Check if ports 80 and 3001 are properly exposed

### SSE not working
- Verify proxy server is running (check logs)
- Ensure App Runner security allows outbound connections
- Check browser console for connection errors

