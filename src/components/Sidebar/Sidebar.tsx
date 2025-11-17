import { Drawer, Box, Tabs, Tab, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import StatusPanel from '../StatusPanel/StatusPanel';
import EventLog from '../EventLog/EventLog';
import ProviderManager from '../EntityManagement/ProviderManager';
import TrackableManager from '../EntityManagement/TrackableManager';
import FenceList from '../EntityManagement/FenceList';
import type { FenceEvent, LocationProvider, Trackable, Fence } from '../../types/omlox';

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
  fences: Fence[];
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
  fences,
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
          borderLeft: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: '#0A4D8C',
            }}
          >
            Control Panel
          </Typography>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{
              bgcolor: 'rgba(10, 77, 140, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(10, 77, 140, 0.12)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => onTabChange(newValue)}
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 54,
              '&.Mui-selected': {
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: '#0A4D8C',
            },
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Status" />
          <Tab label="Events" />
          <Tab label="Providers" />
          <Tab label="Trackables" />
          <Tab label="Fences" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tabValue === 0 && (
            <Box sx={{ p: 3, overflow: 'auto' }}>
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
            <Box sx={{ p: 3, overflow: 'auto' }}>
              <ProviderManager
                providers={providers}
                onProviderAdded={onProviderAdded}
                onProviderUpdated={onProviderUpdated}
                onProviderDeleted={onProviderDeleted}
              />
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ p: 3, overflow: 'auto' }}>
              <TrackableManager
                trackables={trackables}
                providers={providers}
                onTrackableAdded={onTrackableAdded}
                onTrackableUpdated={onTrackableUpdated}
                onTrackableDeleted={onTrackableDeleted}
              />
            </Box>
          )}

          {tabValue === 4 && (
            <Box sx={{ p: 3, overflow: 'auto' }}>
              <FenceList fences={fences} />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
