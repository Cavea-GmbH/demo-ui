# Authentication Guide

The Cavea Demo UI includes basic but secure authentication to protect both the web interface and API endpoints.

## Overview

The authentication system provides:
- **UI Password Protection**: Password-only login for the web interface (no username required)
- **API Token Protection**: Token-based authentication for incoming location data
- **Long Sessions**: Configurable session duration (default: 30 days)
- **Per-Instance Configuration**: Different credentials for each deployment instance

## Configuration

Authentication is configured via the runtime configuration file (`config/app-config.json`):

```json
{
  "auth": {
    "uiPassword": "your-secure-password-here",
    "apiToken": "your-secure-api-token-here",
    "sessionDurationHours": 720
  }
}
```

### Configuration Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `uiPassword` | string \| null | Password for UI access. Set to `null` to disable UI authentication. | `null` |
| `apiToken` | string \| null | Token for API access. Set to `null` to disable API authentication. | `null` |
| `sessionDurationHours` | number | How long the UI session stays active (in hours) | `720` (30 days) |

## UI Authentication

### How It Works

1. When `uiPassword` is configured, users must log in to access the web interface
2. Password is entered on a login screen (no username required)
3. Upon successful login, a session cookie is created
4. Session remains valid for the configured duration
5. Users can manually logout using the logout button in the top bar

### Enabling UI Authentication

Update your `config/app-config.json`:

```json
{
  "auth": {
    "uiPassword": "MySecureP@ssw0rd123",
    "apiToken": null,
    "sessionDurationHours": 720
  }
}
```

### Disabling UI Authentication

Set `uiPassword` to `null`:

```json
{
  "auth": {
    "uiPassword": null,
    "apiToken": null,
    "sessionDurationHours": 720
  }
}
```

### Session Management

- **Session Duration**: Configurable via `sessionDurationHours` (default: 720 hours = 30 days)
- **Automatic Logout**: Sessions expire after the configured duration
- **Manual Logout**: Click the logout button in the top-right corner of the interface
- **Session Cookie**: Stored as HTTP-only cookie for security

## API Authentication

### How It Works

1. When `apiToken` is configured, incoming API requests must include the token as a query parameter
2. Requests without a valid token receive a `401 Unauthorized` response
3. The token is validated on every request

### Protected Endpoints

The following endpoints require API token authentication when enabled:

- `PUT /api/providers/:providerId/location` - Update provider location
- `PUT /api/trackables/:trackableId/location` - Update trackable location

### Enabling API Authentication

Update your `config/app-config.json`:

```json
{
  "auth": {
    "uiPassword": null,
    "apiToken": "your-very-long-random-token-here-minimum-32-characters",
    "sessionDurationHours": 720
  }
}
```

**Security Best Practice**: Use a long, random token (minimum 32 characters).

```bash
# Generate a secure token (Linux/macOS):
openssl rand -hex 32

# Generate a secure token (Windows PowerShell):
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Using the API Token

Add the token as a query parameter `token` to your requests:

**cURL Example:**
```bash
curl -X PUT "http://localhost:3001/api/providers/provider-001/location?token=your-api-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"type": "Point", "coordinates": [25, 15]},
    "source": "zone-1",
    "provider_type": "uwb",
    "provider_id": "provider-001",
    "crs": "local",
    "floor": 0
  }'
```

**Postman Example:**
1. Create/Edit your request
2. Go to the "Params" tab
3. Add a query parameter:
   - Key: `token`
   - Value: `your-api-token-here`

**JavaScript/Axios Example:**
```javascript
await axios.put(
  'http://localhost:3001/api/providers/provider-001/location',
  locationData,
  {
    params: { token: 'your-api-token-here' }
  }
);
```

### Disabling API Authentication

Set `apiToken` to `null`:

```json
{
  "auth": {
    "uiPassword": null,
    "apiToken": null,
    "sessionDurationHours": 720
  }
}
```

## Security Considerations

### Password Strength

- Use strong passwords (minimum 12 characters)
- Include uppercase, lowercase, numbers, and special characters
- Avoid common words or patterns
- Use a password manager to generate and store secure passwords

### API Token Security

- Generate long, random tokens (minimum 32 characters)
- Never commit tokens to version control
- Rotate tokens periodically
- Use different tokens for different environments (dev, staging, prod)

### HTTPS Recommendation

For production deployments, always use HTTPS:

1. The authentication system uses cookies and query parameters
2. Without HTTPS, credentials can be intercepted
3. Update the `secure` cookie flag in `server.js` when using HTTPS:

```javascript
cookie: {
  secure: true, // Set to true when using HTTPS
  httpOnly: true,
  maxAge: sessionMaxAge,
  sameSite: 'lax'
}
```

### Network Security

- Deploy behind a firewall when possible
- Use VPN for remote access
- Consider IP whitelisting for API endpoints
- Monitor failed login attempts

## Deployment Examples

### Development (No Auth)

```json
{
  "auth": {
    "uiPassword": null,
    "apiToken": null,
    "sessionDurationHours": 720
  }
}
```

### Staging (UI Auth Only)

```json
{
  "auth": {
    "uiPassword": "StagingP@ssw0rd123",
    "apiToken": null,
    "sessionDurationHours": 168
  }
}
```

### Production (Full Auth)

```json
{
  "auth": {
    "uiPassword": "VerySecureProductionP@ssw0rd!2024",
    "apiToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "sessionDurationHours": 720
  }
}
```

### Customer Instance (UI Auth + API Token)

```json
{
  "auth": {
    "uiPassword": "CustomerA-SecureP@ss2024",
    "apiToken": "customer-a-unique-api-token-32-chars-minimum-here",
    "sessionDurationHours": 720
  }
}
```

## Docker Deployment with Authentication

### Docker Run

```bash
docker run -p 80:80 \
  -v /path/to/your-config.json:/config/app-config.json:ro \
  demo-ui:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  demo-ui:
    image: demo-ui:latest
    ports:
      - "80:80"
    volumes:
      - ./config-prod.json:/config/app-config.json:ro
    restart: unless-stopped
```

Ensure your `config-prod.json` includes authentication configuration.

## Troubleshooting

### UI Login Issues

**Problem**: "Invalid password" error

- Verify the password in your config file
- Check for typos (passwords are case-sensitive)
- Ensure config file is properly mounted in Docker

**Problem**: Login page doesn't appear

- Check if `uiPassword` is set in config
- If `null`, authentication is disabled (no login required)

**Problem**: Session expires too quickly

- Increase `sessionDurationHours` in config
- Default is 720 hours (30 days)

### API Authentication Issues

**Problem**: "API token required" error

- Ensure you're including the `token` query parameter
- Format: `?token=your-token-here`

**Problem**: "Invalid API token" error

- Verify the token matches exactly what's in your config
- Check for extra spaces or characters
- Tokens are case-sensitive

**Problem**: API works without token

- Check if `apiToken` is set in config
- If `null`, authentication is disabled

### General Issues

**Problem**: Can't access config endpoint

- UI authentication protects `/api/config`
- Log in first before accessing config

**Problem**: Authentication not working after config change

- Restart the server to load new config
- For Docker: `docker restart <container>`
- For development: Stop and restart `npm run dev:proxy`

## API Reference

### POST /api/auth/login

Login to the web interface.

**Request Body:**
```json
{
  "password": "your-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "sessionDuration": 720
}
```

**Response (Error):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid password"
}
```

### POST /api/auth/logout

Logout from the web interface.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /api/auth/status

Check authentication status.

**Response:**
```json
{
  "authRequired": true,
  "authenticated": true,
  "sessionDuration": 720
}
```

## Best Practices

1. **Always use authentication in production**
2. **Use HTTPS for production deployments**
3. **Generate strong, random passwords and tokens**
4. **Never commit credentials to version control**
5. **Use different credentials per environment**
6. **Rotate tokens periodically**
7. **Monitor and log authentication attempts**
8. **Keep sessions reasonably short for sensitive data**
9. **Use environment-specific config files**
10. **Document your auth setup for team members**

## See Also

- [Configuration Guide](../config/README.md) - Full configuration schema
- [Deployment Guide](DEPLOYMENT.md) - Deployment strategies
- [Customer Deployment Guide](CUSTOMER_DEPLOYMENT.md) - Customer-specific deployments
- [API Usage Guide](API_USAGE.md) - API endpoint documentation

