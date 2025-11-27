# GitHub Environment Setup Guide

This guide explains how to configure GitHub repository settings for the automated CI/CD pipeline.

## Overview

The deployment pipeline uses GitHub **Environments** to separate production and development configurations. Each environment has its own set of variables that control the application configuration baked into the Docker image.

## Prerequisites

- Repository admin access
- AWS OIDC configured for GitHub Actions
- AWS App Runner services created for prod and dev

## Environment Setup

### 1. Create Environments

Go to: **Repository Settings → Environments**

Create two environments:
1. **Production** - for `main` branch
2. **Development** - for `dev` branch

### 2. Configure Environment Protection Rules (Optional)

**Production Environment:**
- ☑️ Required reviewers (recommended)
- ☑️ Deployment branches: `main` only

**Development Environment:**
- ☑️ Deployment branches: `dev` only

## Required Secrets

Both environments need:

### AWS_OIDC_ROLE_ARN
Your AWS IAM role ARN for GitHub OIDC authentication.

**Example:**
```
arn:aws:iam::123456789012:role/github-actions-role
```

**Where to set:** Environment → Secrets → Add secret

## Required Variables

### Common Variables (Both Environments)

#### ECR_REPOSITORY
Your Amazon ECR repository name.

**Example:** `demo-ui`

#### APP_RUNNER_SERVICE_ARN
Your AWS App Runner service ARN.

**Production Example:**
```
arn:aws:apprunner:eu-central-1:123456789012:service/demo-ui-prod/xxxxxxxxxxxxx
```

**Development Example:**
```
arn:aws:apprunner:eu-central-1:123456789012:service/demo-ui-dev/xxxxxxxxxxxxx
```

### Configuration Variables

These control the application configuration. All are **optional** - if not set, defaults will be used.

**Note:** Variable names are the **same for both environments**. Each environment has its own set of values.

#### FLOOR_WIDTH
Floor plan width in meters.

**Type:** Number  
**Default:** `50`  
**Example Production:** `50`  
**Example Development:** `100`

#### FLOOR_LENGTH
Floor plan length in meters.

**Type:** Number  
**Default:** `30`  
**Example Production:** `30`  
**Example Development:** `60`

#### LOAD_INITIAL_DATA
Whether to load demo providers and trackables on startup.

**Type:** Boolean string  
**Default:** `true`  
**Values:** `true` or `false`  
**Example Production:** `true`  
**Example Development:** `true`

#### ZONE_POSITION
Zone reference position as [longitude, latitude].

**Type:** JSON array  
**Default:** `[7.815694, 48.130216]`  
**Example:**
```json
[7.815694, 48.130216]
```

#### GROUND_CONTROL_POINTS
Ground control points mapping WGS84 to local coordinates.

**Type:** JSON array of objects  
**Default:** See below  
**Example:**
```json
[{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]
```

#### FENCES
Geofence definitions for the floor plan.

**Type:** JSON array of fence objects  
**Default:** See below  
**Example:**
```json
[{"id":"fence-1","name":"Test Fence 1","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]
```

## Step-by-Step Configuration

### Step 1: Go to Repository Settings

Navigate to: **Your Repository → Settings → Secrets and variables → Actions**

### Step 2: Create Environments

Click **"Environments"** in the left sidebar.

**Create Production Environment:**
1. Click "New environment"
2. Name: `Production`
3. Click "Configure environment"

**Create Development Environment:**
1. Click "New environment"
2. Name: `Development`
3. Click "Configure environment"

### Step 3: Add Secrets

For **each environment**:

1. Go to environment settings
2. Click "Add secret" under "Environment secrets"
3. Add `AWS_OIDC_ROLE_ARN` with your AWS role ARN

### Step 4: Add Variables

For **each environment**:

1. Click "Add variable" under "Environment variables"
2. Add the following:

**Production Environment:**
```
Name: ECR_REPOSITORY
Value: demo-ui

Name: APP_RUNNER_SERVICE_ARN
Value: arn:aws:apprunner:eu-central-1:123456789012:service/demo-ui-prod/xxxxx

Name: FLOOR_WIDTH
Value: 50

Name: FLOOR_LENGTH
Value: 30

Name: LOAD_INITIAL_DATA
Value: true

Name: ZONE_POSITION
Value: [7.815694, 48.130216]

Name: GROUND_CONTROL_POINTS
Value: [{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]

Name: FENCES
Value: [{"id":"fence-1","name":"Production Zone","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]
```

**Development Environment:**
```
Name: ECR_REPOSITORY
Value: demo-ui

Name: APP_RUNNER_SERVICE_ARN
Value: arn:aws:apprunner:eu-central-1:123456789012:service/demo-ui-dev/xxxxx

Name: FLOOR_WIDTH
Value: 50

Name: FLOOR_LENGTH
Value: 30

Name: LOAD_INITIAL_DATA
Value: true

Name: ZONE_POSITION
Value: [7.815694, 48.130216]

Name: GROUND_CONTROL_POINTS
Value: [{"wgs84":[7.815694,48.130216],"local":[0,0]},{"wgs84":[7.816551,48.130216],"local":[50,0]},{"wgs84":[7.815694,48.13031],"local":[0,30]},{"wgs84":[7.816551,48.13031],"local":[50,30]}]

Name: FENCES
Value: [{"id":"fence-dev-1","name":"Dev Test Zone","region":{"type":"Polygon","coordinates":[[[10,10],[40,10],[40,25],[10,25],[10,10]]]},"floor":0,"crs":"local"}]
```

**Note:** Same variable names in both environments - GitHub automatically uses the right ones based on which environment is active!

## Verification

### Test the Pipeline

1. Make a commit to the `dev` branch
2. Go to **Actions** tab
3. Watch the workflow run
4. Verify deployment to App Runner

### Verify Configuration

After deployment:

```bash
# Get your App Runner URL from AWS Console
curl https://your-app-runner-url.awsapprunner.com/api/config | jq
```

You should see your configured values in the response.

## Updating Configuration

### To change production config:

1. Go to **Repository Settings → Environments → Production**
2. Edit the relevant variables (e.g., `FLOOR_WIDTH`)
3. Commit any change to `main` branch to trigger deployment

### To change development config:

1. Go to **Repository Settings → Environments → Development**
2. Edit the relevant variables (e.g., `FLOOR_WIDTH`)
3. Commit any change to `dev` branch to trigger deployment

## Configuration Templates

### Minimal Configuration (Empty Floor)

```
FLOOR_WIDTH: 100
FLOOR_LENGTH: 60
LOAD_INITIAL_DATA: false
FENCES: []
```

### Demo Configuration (With Sample Data)

```
FLOOR_WIDTH: 50
FLOOR_LENGTH: 30
LOAD_INITIAL_DATA: true
FENCES: [{"id":"fence-1","name":"Demo Zone","region":{"type":"Polygon","coordinates":[[[15,5],[35,5],[35,15],[15,15],[15,5]]]},"floor":0,"crs":"local"}]
```

### Warehouse Configuration (Multiple Zones)

```
FLOOR_WIDTH: 120
FLOOR_LENGTH: 80
LOAD_INITIAL_DATA: false
FENCES: [{"id":"zone-a","name":"Zone A","region":{"type":"Polygon","coordinates":[[[10,10],[50,10],[50,30],[10,30],[10,10]]]},"floor":0,"crs":"local"},{"id":"zone-b","name":"Zone B","region":{"type":"Polygon","coordinates":[[[60,10],[100,10],[100,30],[60,30],[60,10]]]},"floor":0,"crs":"local"}]
```

## Troubleshooting

### Workflow fails at "Prepare environment-specific config"

**Issue:** Invalid JSON in configuration variables

**Solution:**
1. Validate your JSON using an online validator
2. Ensure arrays use `[]` and objects use `{}`
3. Check for missing commas or quotes

### Workflow fails at "Build Docker image"

**Issue:** Config validation failed

**Solution:**
1. Check GitHub Actions logs for JSON syntax errors
2. Verify all required fields are present
3. Use `jq` to validate: `echo 'YOUR_JSON' | jq`

### App Runner shows old configuration

**Issue:** Cached image or deployment not complete

**Solution:**
1. Wait for deployment to fully complete (check Actions tab)
2. Force refresh in browser (Ctrl+Shift+R)
3. Verify via API: `curl .../api/config`

### Variables not found / using defaults

**Issue:** Variables not set or wrong environment

**Solution:**
1. Verify variables are set in the correct environment
2. Check variable names (no PROD_ or DEV_ prefix needed)
3. Ensure branch matches environment (main → Production, dev → Development)

## Best Practices

1. **Use meaningful fence IDs**: `warehouse-zone-a` instead of `fence-1`
2. **Document your GCPs**: Keep a record of where your ground control points are physically located
3. **Version your configs**: Consider keeping config templates in a separate repository
4. **Test in development first**: Always test config changes in dev before deploying to production
5. **Use JSON validators**: Validate complex JSON before adding to GitHub variables
6. **Keep secrets secure**: Never commit AWS credentials or sensitive data

## Support

For issues with:
- **GitHub setup**: Check GitHub Actions documentation
- **AWS permissions**: Review IAM roles and policies
- **Configuration syntax**: See [`config/README.md`](../config/README.md)
- **Deployment issues**: Check [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md)


