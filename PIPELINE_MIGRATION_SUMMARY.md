# CI/CD Pipeline Migration Summary

## Overview

Successfully adapted the CI/CD pipeline to work with the new runtime configuration system while maintaining automated deployments to AWS App Runner for the demo instance.

## What Was Changed

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

**Changes:**
- ✅ Removed build-time `VITE_*` build args
- ✅ Added environment-specific config generation at build time
- ✅ Config is now created from GitHub environment variables
- ✅ Supports separate prod/dev configurations
- ✅ Config validation with `jq` before build
- ✅ Automatic cleanup of modified config files
- ✅ Better logging and status messages

**How it works:**
1. Workflow detects branch (`main` = Production, `dev` = Development)
2. Reads environment-specific variables from GitHub
3. Generates `config/default-config.json` with those values
4. Builds Docker image with environment config baked in
5. Pushes to ECR with multiple tags (`latest`, `prod`/`dev`, commit SHA)
6. Deploys to App Runner
7. Cleans up (restores original default config)

### 2. New Documentation Files

#### `docs/CUSTOMER_DEPLOYMENT.md`
Complete guide for deploying to customer instances:
- Docker pull/load instructions
- Configuration customization
- Multiple deployment options (standalone, Docker Compose, reverse proxy, systemd)
- Multiple instance support
- Troubleshooting guide
- Production best practices

#### `docs/GITHUB_SETUP.md`
Step-by-step guide for setting up GitHub environments:
- How to create environments (Production/Development)
- Required secrets and variables
- Configuration examples
- Variable reference
- Common issues and solutions

#### `PIPELINE_MIGRATION_SUMMARY.md` (this file)
Summary of pipeline changes and migration notes.

### 3. Updated README.md

- Added "Deployment Options" section at top
- Clear distinction between Demo (automated) and Customer (manual) deployments
- Updated Docker instructions for runtime config
- Links to all deployment guides
- Simplified local development instructions

## Deployment Architecture

### Demo Instance (Automated)
```
GitHub Push → Workflow Triggered
    ↓
Environment Variables Read → Config Generated
    ↓
Docker Build (with env config) → Push to ECR
    ↓
Deploy to App Runner → Done ✅
```

**Environments:**
- **Production**: `main` branch → App Runner prod service
- **Development**: `dev` branch → App Runner dev service

**Configuration:** Baked into image at build time from GitHub variables

### Customer Instances (Manual)
```
Pull Image from ECR (or load .tar)
    ↓
Create custom-config.json
    ↓
docker run -v ./custom-config.json:/config/app-config.json demo-ui
    ↓
Running ✅
```

**Configuration:** Mounted as volume at runtime

## GitHub Environment Setup

### Required Secrets (Both Environments)

```
AWS_OIDC_ROLE_ARN
  Production: arn:aws:iam::ACCOUNT:role/github-actions-role
  Development: arn:aws:iam::ACCOUNT:role/github-actions-role
```

### Required Variables (Both Environments)

**Common:**
```
ECR_REPOSITORY = demo-ui
APP_RUNNER_SERVICE_ARN = arn:aws:apprunner:...
```

**Production Environment:**
```
FLOOR_WIDTH = 50
FLOOR_LENGTH = 30
LOAD_INITIAL_DATA = true
ZONE_POSITION = [7.815694, 48.130216]
GROUND_CONTROL_POINTS = [{"wgs84":[...], "local":[...]}]
FENCES = [{"id":"fence-1", ...}]
```

**Development Environment:**
```
FLOOR_WIDTH = 50
FLOOR_LENGTH = 30
LOAD_INITIAL_DATA = true
ZONE_POSITION = [7.815694, 48.130216]
GROUND_CONTROL_POINTS = [...]
FENCES = [...]
```

**Note:** Same variable names in both environments - GitHub automatically uses the right ones!

## Benefits

### For Demo Instance
✅ **Automated deployment** - Push to git, auto-deploy  
✅ **Environment separation** - Different configs for prod/dev  
✅ **No manual steps** - Fully automated via GitHub Actions  
✅ **Easy config updates** - Change GitHub variables, push to trigger deploy  
✅ **Version control** - Config changes tracked in GitHub

### For Customer Instances
✅ **Same Docker image** - No rebuilds needed  
✅ **Simple deployment** - Just mount config file  
✅ **Flexible** - Works anywhere Docker runs  
✅ **Easy updates** - Edit config, restart container  
✅ **Multi-instance friendly** - Different configs per customer

## Migration Checklist

### ✅ Completed
- [x] Updated GitHub Actions workflow
- [x] Created customer deployment guide
- [x] Created GitHub setup guide
- [x] Updated README with deployment options
- [x] Tested workflow syntax (YAML valid)
- [x] Config validation in pipeline
- [x] Cleanup steps in pipeline
- [x] Multiple tag support (latest, dev/prod, SHA)

### 📋 Next Steps (For You)

1. **Set up GitHub environments:**
   - Go to Repository Settings → Environments
   - Create "Production" and "Development" environments
   - Add secrets and variables (see `docs/GITHUB_SETUP.md`)

2. **Test the pipeline:**
   - Make a test commit to `dev` branch
   - Watch GitHub Actions run
   - Verify deployment to App Runner
   - Check config via `/api/config` endpoint

3. **Update production:**
   - Set production variables in GitHub
   - Make a commit to `main` branch
   - Verify production deployment

4. **Document for customers:**
   - Add your ECR repository URL to customer guide
   - Provide image pull instructions
   - Share `docs/CUSTOMER_DEPLOYMENT.md` with customers

## Example Workflow Run

```bash
# What happens when you push to 'main':

1. GitHub Actions starts
2. Checkout code
3. Login to AWS via OIDC
4. Read PROD_* variables
5. Generate config/default-config.json with prod values
6. Validate JSON with jq
7. Build Docker image (config baked in)
8. Tag as: <SHA>, latest, prod
9. Push to ECR
10. Deploy to App Runner production service
11. Restore default config file
12. Done! ✅

Time: ~3-5 minutes
```

## Testing

### Test Demo Deployment
```bash
# 1. Set up GitHub environments (see docs/GITHUB_SETUP.md)

# 2. Push to dev branch
git checkout dev
git commit --allow-empty -m "test: trigger deployment"
git push origin dev

# 3. Watch GitHub Actions
# Go to: Repository → Actions → Latest workflow run

# 4. Verify deployment
curl https://your-dev-app.awsapprunner.com/api/config | jq
```

### Test Customer Deployment
```bash
# 1. Pull image from ECR
aws ecr get-login-password | docker login ...
docker pull <ecr-repo>/demo-ui:latest

# 2. Create custom config
cp config/app-config.example.json customer-test.json
# Edit customer-test.json

# 3. Run container
docker run -p 80:80 \
  -v $(pwd)/customer-test.json:/config/app-config.json:ro \
  demo-ui:latest

# 4. Verify
curl http://localhost/api/config | jq
```

## Troubleshooting

### Pipeline Issues

**Q: Workflow fails at "Prepare environment-specific config"**  
A: Check JSON syntax in GitHub variables. Use a JSON validator.

**Q: Config validation fails**  
A: Ensure `jq` validation passes. Test locally: `echo 'YOUR_JSON' | jq`

**Q: Variables not found**  
A: Verify variables are set in correct environment (Production vs Development)

### Deployment Issues

**Q: App shows wrong config**  
A: Clear browser cache. Verify via API: `curl .../api/config`

**Q: Customer instance not loading config**  
A: Check volume mount path. Verify with: `docker exec <container> ls /config`

## Support

- **Pipeline issues**: Check `.github/workflows/deploy.yml` and `docs/GITHUB_SETUP.md`
- **Customer deployment**: See `docs/CUSTOMER_DEPLOYMENT.md`
- **Config questions**: See `config/README.md`
- **AWS setup**: See `docs/AWS_SETUP.md`

## Summary

🎉 **Migration Complete!**

- ✅ Demo instance: Automated CI/CD with environment-specific configs
- ✅ Customer instances: Manual deployment with custom configs
- ✅ Same Docker image for everyone
- ✅ No more build-time dependencies on env vars
- ✅ Fully documented with guides

The pipeline now supports both automated demo deployments (with per-environment configs) and manual customer deployments (with custom config files), using the same Docker image base!


