import { Drawer, Box, Tabs, Tab, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import StatusPanel from '../StatusPanel/StatusPanel';
import EventLog from '../EventLog/EventLog';
import ProviderManager from '../EntityManagement/ProviderManager';
import TrackableManager from '../EntityManagement/TrackableManager';
import type { FenceEvent, LocationProvider, Trackable } from '../../types/omlox';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  tabValue: number;
  onTabChange: (value: number) => void;
  isConnected: boolean;
  providerCount: number;
  trackableCount: number;
  fenceCount: number;
  lastUpdate: Date | null;
  events: FenceEvent[];
  onClearEvents: () => void;
  providers: LocationProvider[];
  trackables: Trackable[];
  onProviderAdded: (provider: LocationProvider) => void;
  onProviderUpdated: (provider: LocationProvider) => void;
  onProviderDeleted: (providerId: string) => void;
  onTrackableAdded: (trackable: Trackable) => void;
  onTrackableUpdated: (trackable: Trackable) => void;
  onTrackableDeleted: (trackableId: string) => void;
}

export default function Sidebar({
  open,
  onClose,
  tabValue,
  onTabChange,
  isConnected,
  providerCount,
  trackableCount,
  fenceCount,
  lastUpdate,
  events,
  onClearEvents,
  providers,
  trackables,
  onProviderAdded,
  onProviderUpdated,
  onProviderDeleted,
  onTrackableAdded,
  onTrackableUpdated,
  onTrackableDeleted,
}: SidebarProps) {
  const drawerWidth = 420;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Information</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => onTabChange(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Status" />
          <Tab label="Events" />
          <Tab label="Providers" />
          <Tab label="Trackables" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tabValue === 0 && (
            <Box sx={{ p: 2, overflow: 'auto' }}>
              <StatusPanel
                isConnected={isConnected}
                providerCount={providerCount}
                trackableCount={trackableCount}
                fenceCount={fenceCount}
                lastUpdate={lastUpdate}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <EventLog events={events} onClear={onClearEvents} />
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ p: 2, overflow: 'auto' }}>
              <ProviderManager
                providers={providers}
                onProviderAdded={onProviderAdded}
                onProviderUpdated={onProviderUpdated}
                onProviderDeleted={onProviderDeleted}
              />
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ p: 2, overflow: 'auto' }}>
              <TrackableManager
                trackables={trackables}
                providers={providers}
                onTrackableAdded={onTrackableAdded}
                onTrackableUpdated={onTrackableUpdated}
                onTrackableDeleted={onTrackableDeleted}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
