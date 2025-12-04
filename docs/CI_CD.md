# CI/CD Setup

The GitHub Actions pipeline automatically builds and deploys on push to `main` or `dev` branches.

## Workflow Overview

```
Push to GitHub → Build Docker Image → Push to ECR → Update App Runner
```

- **main branch** → Production ECR (`343218205164...`) + `latest` tag
- **dev branch** → Development ECR (`116981770603...`) + `dev` tag

## GitHub Setup

### 1. Create Environments

Go to **Repository Settings → Environments**

Create two environments:
- `Production` (for `main` branch)
- `Development` (for `dev` branch)

### 2. Add Secrets (per environment)

| Secret | Description |
|--------|-------------|
| `AWS_OIDC_ROLE_ARN` | AWS IAM role ARN for GitHub OIDC |
| `UI_PASSWORD` | UI password (optional, leave empty to disable) |

### 3. Add Variables (per environment)

| Variable | Example | Description |
|----------|---------|-------------|
| `ECR_REPOSITORY` | `frontend/cavea-demo-ui` | ECR repository name |
| `APP_RUNNER_SERVICE_ARN` | `arn:aws:apprunner:...` | App Runner service ARN |
| `FLOOR_WIDTH` | `50` | Floor width in meters |
| `FLOOR_LENGTH` | `30` | Floor length in meters |
| `LOAD_INITIAL_DATA` | `true` | Load demo data on startup |
| `ZONE_POSITION` | `[7.815694, 48.130216]` | Zone reference position |
| `GROUND_CONTROL_POINTS` | `[{"wgs84":...}]` | GCPs as JSON array |
| `FENCES` | `[{"id":"fence-1"...}]` | Fences as JSON array |

## AWS IAM Role

The GitHub OIDC role needs these permissions:

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
      "Resource": "arn:aws:apprunner:eu-central-1:*:service/cavea-demo-ui-*"
    }
  ]
}
```

Trust relationship:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:Cavea-GmbH/demo-ui:*"
        }
      }
    }
  ]
}
```

## Manual Deployment

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

# Build and push
docker build -t demo-ui .
docker tag demo-ui:latest ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest
docker push ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest

# Update App Runner
aws apprunner update-service \
  --service-arn YOUR_SERVICE_ARN \
  --source-configuration "ImageRepository={ImageIdentifier=ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/frontend/cavea-demo-ui:latest,ImageRepositoryType=ECR,ImageConfiguration={Port=80}}"
```

## Troubleshooting

**Pipeline fails at config step:**
- Validate JSON in GitHub variables using https://jsonlint.com

**App Runner shows old version:**
- Wait for deployment to complete (check Actions tab)
- Force refresh browser (Ctrl+Shift+R)

**Variables not found:**
- Check variable names match exactly
- Verify branch matches environment (main → Production, dev → Development)

