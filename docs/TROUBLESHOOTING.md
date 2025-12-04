# Troubleshooting

## Quick Checks

```bash
# Container running?
docker ps

# Health check
curl http://localhost/health

# View logs
docker logs demo-ui

# Check config
curl http://localhost/api/config
```

---

## Common Issues

### SSE / Real-time Updates Not Working

**Symptoms:** "Event Server: Disconnected", no live updates

**Check browser console:**
- Look for `SSE connection opened` message
- Check for connection errors

**Fixes:**
1. Verify proxy server is running (`npm run dev:proxy` for dev)
2. Check browser console for CORS errors
3. Try refreshing the page
4. Check firewall isn't blocking port 3001

### Location Updates Not Appearing

**Check:**
```bash
# Verify health shows connected clients
curl http://localhost/health
# Should show: "clientsConnected": 1 or more
```

**Fixes:**
1. Coordinates must be within floor bounds (check `/api/config` for dimensions)
2. Make sure frontend is connected (check browser console)
3. Verify JSON format in request

### Container Won't Start

```bash
# Check logs
docker logs demo-ui

# Common issues:
# - Port 80 already in use: use -p 8080:80 instead
# - Invalid config JSON: validate with jq
```

### Config Not Loading

```bash
# Check if config is mounted
docker exec demo-ui ls -la /config

# Validate JSON
cat config.json | jq .
```

**If using volume mount:**
- Path must be absolute or use `$(pwd)/`
- File must exist before container starts

### UI Shows Default Values

- Volume mount not working - check docker run command
- Config file has JSON errors - validate with `jq`
- Restart container after config changes

### Authentication Issues

**"Invalid password":**
- Check `auth.uiPassword` in config
- Passwords are case-sensitive
- Restart container after config changes

**Login page doesn't appear:**
- `uiPassword` is `null` - auth is disabled (intended behavior)

### ECR Login Fails

```bash
# Re-authenticate (tokens expire after 12 hours)
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.eu-central-1.amazonaws.com
```

---

## Debug Checklist

Development:
- [ ] Proxy server running (`npm run dev:proxy`)
- [ ] Frontend running (`npm run dev`)
- [ ] Browser console shows "SSE connection opened"
- [ ] `/health` shows `clientsConnected: 1`

Docker:
- [ ] Container running (`docker ps`)
- [ ] Logs show no errors (`docker logs demo-ui`)
- [ ] Port accessible (`curl http://localhost/health`)
- [ ] Config loaded (`curl http://localhost/api/config`)

---

## Get Help

1. Check container/browser logs first
2. Validate configuration JSON
3. Review this guide
4. Contact development team
