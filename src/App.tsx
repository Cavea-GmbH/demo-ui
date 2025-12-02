import { useState, useEffect, useRef } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { theme } from './theme/theme';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLocationReceiver } from './hooks/useLocationReceiver';
import { useFenceEvents } from './hooks/useFenceEvents';
import { useLocalStorage } from './hooks/useLocalStorage';
import { locationPushReceiver } from './services/locationPushReceiver';
import { sseClient } from './services/sseClient';
import FloorPlan from './components/FloorPlan/FloorPlan';
import TopBar from './components/TopBar/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import { SettingsDialog, LabelDisplayMode } from './components/SettingsDialog/SettingsDialog';
import Login from './components/Login/Login';
import type { LocationProvider, Trackable } from './types/omlox';

// Separate component to avoid hooks ordering issues
function AuthGate({ children }: { children: React.ReactNode }) {
  const { authRequired, authenticated, loading: authLoading } = useAuth();

  if (authRequired && !authenticated) {
    if (authLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Checking authentication...
          </Typography>
        </Box>
      );
    }
    return <Login />;
  }

  return <>{children}</>;
}

function MainApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Persistent visibility settings using localStorage
  const [showProviders, setShowProviders] = useLocalStorage('cavea-show-providers', true);
  const [showTrackables, setShowTrackables] = useLocalStorage('cavea-show-trackables', false);
  const [showFences, setShowFences] = useLocalStorage('cavea-show-fences', true);
  const [showGrid, setShowGrid] = useLocalStorage('cavea-show-grid', true);
  const [gridSize, setGridSize] = useLocalStorage('cavea-grid-size', 5);
  const [animateMovement, setAnimateMovement] = useLocalStorage('cavea-animate-movement', false);
  const [labelDisplay, setLabelDisplay] = useLocalStorage<LabelDisplayMode>('cavea-label-display', 'full');

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

  // Use refs to store the latest callbacks without causing SSE reconnection
  const receiveProviderLocationRef = useRef(receiveProviderLocation);
  const receiveTrackableLocationRef = useRef(receiveTrackableLocation);
  
  // Update refs when callbacks change (without disconnecting SSE)
  useEffect(() => {
    receiveProviderLocationRef.current = receiveProviderLocation;
    receiveTrackableLocationRef.current = receiveTrackableLocation;
  }, [receiveProviderLocation, receiveTrackableLocation]);

  // Connect to SSE server and register to receive pushed location updates
  // This effect only runs once on mount (no dependencies on callbacks)
  useEffect(() => {
    // Connect to SSE server
    console.log('🔌 Initializing SSE connection...');
    sseClient.connect();
    setIsConnected(true);

    // Register to receive pushed location updates using refs
    const unsubscribeProvider = locationPushReceiver.onProviderLocationUpdate(
      (providerId, location) => {
        receiveProviderLocationRef.current(providerId, location);
      }
    );

    const unsubscribeTrackable = locationPushReceiver.onTrackableLocationUpdate(
      (trackableId, location) => {
        receiveTrackableLocationRef.current(trackableId, location);
      }
    );

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      setIsConnected(sseClient.isConnected());
    }, 2000);

    return () => {
      console.log('🔌 Disconnecting SSE...');
      sseClient.disconnect();
      unsubscribeProvider();
      unsubscribeTrackable();
      clearInterval(statusInterval);
    };
  }, []); // Empty dependencies - only run once on mount

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
          onSettingsClick={() => setSettingsOpen(true)}
          showProviders={showProviders}
          showTrackables={showTrackables}
          showFences={showFences}
          onShowProvidersChange={setShowProviders}
          onShowTrackablesChange={setShowTrackables}
          onShowFencesChange={setShowFences}
        />

        {/* Main Content - Floor Plan */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(10, 77, 140, 0.08)',
              background: '#FFFFFF',
              border: '1px solid rgba(10, 77, 140, 0.08)',
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
              gridSize={gridSize}
              animateMovement={animateMovement}
              labelDisplay={labelDisplay}
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
          providerCount={providers.length}
          trackableCount={trackables.length}
          fenceCount={fences.length}
          lastUpdate={lastUpdate}
          events={events}
          onClearEvents={clearEvents}
          providers={providers}
          trackables={trackables}
          fences={fences}
          onProviderAdded={handleProviderAdded}
          onProviderUpdated={handleProviderUpdated}
          onProviderDeleted={handleProviderDeleted}
          onTrackableAdded={handleTrackableAdded}
          onTrackableUpdated={handleTrackableUpdated}
          onTrackableDeleted={handleTrackableDeleted}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          animateMovement={animateMovement}
          onAnimateMovementChange={setAnimateMovement}
          labelDisplay={labelDisplay}
          onLabelDisplayChange={setLabelDisplay}
        />
      </Box>
  );
}

function AppContent() {
  const { config, isLoading, error } = useConfig();

  // Show loading state while config is being fetched
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Loading configuration...
        </Typography>
      </Box>
    );
  }

  // Show error state if config failed to load
  if (error || !config) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Failed to Load Configuration
          </Typography>
          <Typography variant="body2">
            {error ? String(error) : 'Configuration is not available'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Please ensure the server is running and configured correctly.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return <MainApp />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthGate>
          <ConfigProvider>
            <AppContent />
          </ConfigProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
