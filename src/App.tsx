import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import { useLocationReceiver } from './hooks/useLocationReceiver';
import { useFenceEvents } from './hooks/useFenceEvents';
import { locationPushReceiver } from './services/locationPushReceiver';
import { sseClient } from './services/sseClient';
import FloorPlan from './components/FloorPlan/FloorPlan';
import TopBar from './components/TopBar/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import type { LocationProvider, Trackable } from './types/omlox';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
  },
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [showProviders, setShowProviders] = useState(true);
  const [showTrackables, setShowTrackables] = useState(false);
  const [showFences, setShowFences] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const {
    providers,
    trackables,
    providerLocations,
    trackableLocations,
    fences,
    lastUpdate,
    receiveProviderLocation,
    receiveTrackableLocation,
    addProvider,
    addTrackable,
    removeProvider,
    removeTrackable,
  } = useLocationReceiver();

  const { events, clearEvents } = useFenceEvents(
    providerLocations,
    trackableLocations,
    fences
  );

  // Connect to SSE server and register to receive pushed location updates
  useEffect(() => {
    // Connect to SSE server
    sseClient.connect();
    setIsConnected(true);

    // Register to receive pushed location updates
    const unsubscribeProvider = locationPushReceiver.onProviderLocationUpdate(
      (providerId, location) => {
        receiveProviderLocation(providerId, location);
      }
    );

    const unsubscribeTrackable = locationPushReceiver.onTrackableLocationUpdate(
      (trackableId, location) => {
        receiveTrackableLocation(trackableId, location);
      }
    );

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      setIsConnected(sseClient.isConnected());
    }, 2000);

    return () => {
      sseClient.disconnect();
      unsubscribeProvider();
      unsubscribeTrackable();
      clearInterval(statusInterval);
    };
  }, [receiveProviderLocation, receiveTrackableLocation]);

  // CRUD handlers
  const handleProviderAdded = (provider: LocationProvider) => {
    addProvider(provider);
  };

  const handleProviderUpdated = (provider: LocationProvider) => {
    // Update provider in local state
    addProvider(provider); // This will update if exists
  };

  const handleProviderDeleted = (providerId: string) => {
    removeProvider(providerId);
  };

  const handleTrackableAdded = (trackable: Trackable) => {
    addTrackable(trackable);
  };

  const handleTrackableUpdated = (trackable: Trackable) => {
    // Update trackable in local state
    addTrackable(trackable); // This will update if exists
  };

  const handleTrackableDeleted = (trackableId: string) => {
    removeTrackable(trackableId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Bar */}
        <TopBar
          isConnected={isConnected}
          isLoading={false}
          pollingEnabled={false}
          onPollingToggle={() => {}} // No-op since polling is disabled
          providerCount={providers.length}
          trackableCount={trackables.length}
          fenceCount={fences.length}
          lastUpdate={lastUpdate}
          onMenuClick={() => setSidebarOpen(true)}
          showProviders={showProviders}
          showTrackables={showTrackables}
          showFences={showFences}
          showGrid={showGrid}
          onShowProvidersChange={setShowProviders}
          onShowTrackablesChange={setShowTrackables}
          onShowFencesChange={setShowFences}
          onShowGridChange={setShowGrid}
        />

        {/* Main Content - Floor Plan */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <FloorPlan
              fences={fences}
              providers={providers}
              trackables={trackables}
              providerLocations={providerLocations}
              trackableLocations={trackableLocations}
              showProviders={showProviders}
              showTrackables={showTrackables}
              showFences={showFences}
              showGrid={showGrid}
              fenceEvents={events}
            />
          </Box>
        </Box>

        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          tabValue={sidebarTab}
          onTabChange={setSidebarTab}
          isConnected={isConnected}
          isLoading={false}
          pollingEnabled={false}
          onPollingToggle={() => {}} // No-op
          providerCount={providers.length}
          trackableCount={trackables.length}
          fenceCount={fences.length}
          lastUpdate={lastUpdate}
          events={events}
          onClearEvents={clearEvents}
          providers={providers}
          trackables={trackables}
          onProviderAdded={handleProviderAdded}
          onProviderUpdated={handleProviderUpdated}
          onProviderDeleted={handleProviderDeleted}
          onTrackableAdded={handleTrackableAdded}
          onTrackableUpdated={handleTrackableUpdated}
          onTrackableDeleted={handleTrackableDeleted}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
