import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface StatusPanelProps {
  isConnected: boolean;
  providerCount: number;
  trackableCount: number;
  fenceCount: number;
  lastUpdate: Date | null;
}

export default function StatusPanel({
  isConnected,
  providerCount,
  trackableCount,
  fenceCount,
  lastUpdate,
}: StatusPanelProps) {
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Connection Status
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isConnected ? (
            <CheckCircle color="success" fontSize="small" />
          ) : (
            <ErrorIcon color="error" fontSize="small" />
          )}
          <Typography variant="body1">
            {isConnected ? 'Receiving Location Updates' : 'Not Receiving Updates'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Location data is pushed to the application in real-time.
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        Entity Summary
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Location Providers
          </Typography>
          <Chip label={providerCount} size="small" color="primary" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Trackables
          </Typography>
          <Chip label={trackableCount} size="small" color="secondary" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Geofences
          </Typography>
          <Chip label={fenceCount} size="small" />
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Last Update
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatLastUpdate()}
      </Typography>
    </Box>
  );
}
