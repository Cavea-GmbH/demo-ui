# Troubleshooting Guide

## Issue: No Location Providers Appearing on Floor Plan

### Problem: `clientsConnected: 0` in Postman Response

This means the frontend app is **not connected** to the proxy server.

### Solution Steps:

1. **Check if Proxy Server is Running**
   ```bash
   # In terminal 1
   npm run dev:proxy
   ```
   You should see:
   ```
   📍 Location Proxy Server running on http://localhost:3001
   ```

2. **Check if Frontend App is Running**
   ```bash
   # In terminal 2
   npm run dev
   ```
   The app should open at `http://localhost:5173` (or similar)

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for these messages:
     - `🔌 Connecting to SSE server: http://localhost:3001/events`
     - `✅ SSE connection opened successfully`
     - `✅ Connected to proxy server`

4. **If You See Connection Errors:**
   - **CORS Error**: Make sure proxy server has CORS enabled (it should)
   - **Connection Refused**: Proxy server not running
   - **404 Not Found**: Wrong URL - proxy server should be on `http://localhost:3001/events`

5. **Test Connection Manually**
   - Open browser and go to: `http://localhost:3001/health`
   - Should return: `{"status":"ok","clientsConnected":1}` (if frontend is connected)

### Quick Test:

1. Start proxy server: `npm run dev:proxy`
2. Start frontend: `npm run dev`
3. Open browser console - you should see connection messages
4. Send Postman request - `clientsConnected` should be `1` or more
5. Check browser console for: `📍 Received provider location: 0080E126`

---

## Issue: Location Updates Received But Not Displayed

### Check:

1. **Coordinates are valid:**
   - Coordinates should be within your configured floor dimensions
   - Example: For a 50m x 30m floor, X: 0-50 meters, Y: 0-30 meters
   - Check your config at `/api/config` to see your floor dimensions

2. **Check Browser Console:**
   - Should see: `📍 Updating provider location: 0080E126`
   - Should see: `➕ Auto-creating provider: 0080E126`

3. **Check Provider Count:**
   - Look at top bar - should show "Providers: 1" after sending request
   - If still 0, location update didn't reach the app

---

## Pre-Registered Providers/Trackables

**There are NO pre-registered providers or trackables.**

They are **auto-created** when you send the first location update for a provider/trackable ID.

### How It Works:

1. Send POST request with `provider_id: "0080E126"`
2. App receives location update
3. App automatically creates provider entry if it doesn't exist
4. Provider appears on floor plan at the specified coordinates

### Example Flow:

```
Postman Request → Proxy Server → SSE → Frontend App
                                    ↓
                            Auto-create Provider
                                    ↓
                            Update Floor Plan
```

---

## Common Issues:

### 1. Frontend Not Connected
- **Symptom**: `clientsConnected: 0`
- **Fix**: Make sure frontend app is running and check browser console

### 2. Wrong Port
- **Symptom**: Connection errors
- **Fix**: Check proxy server is on port 3001

### 3. CORS Issues
- **Symptom**: Browser console shows CORS error
- **Fix**: Proxy server should handle CORS, but check server.js has `app.use(cors())`

### 4. Coordinates Out of Bounds
- **Symptom**: Provider created but not visible
- **Fix**: Check your floor dimensions via `/api/config` and ensure coordinates are within bounds

---

## Debug Checklist:

- [ ] Proxy server running (`npm run dev:proxy`)
- [ ] Frontend app running (`npm run dev`)
- [ ] Browser console shows "SSE connection opened"
- [ ] Postman response shows `clientsConnected: 1` (or more)
- [ ] Browser console shows "Received provider location"
- [ ] Browser console shows "Auto-creating provider"
- [ ] Top bar shows provider count > 0
- [ ] Coordinates are within your configured floor bounds (check `/api/config`)

