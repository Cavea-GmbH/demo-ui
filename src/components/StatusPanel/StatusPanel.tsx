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
      <Box 
        sx={{ 
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          bgcolor: isConnected ? 'rgba(100, 206, 255, 0.06)' : 'rgba(230, 57, 70, 0.06)',
          border: '1px solid',
          borderColor: isConnected ? 'rgba(100, 206, 255, 0.15)' : 'rgba(230, 57, 70, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          {isConnected ? (
            <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
          ) : (
            <ErrorIcon sx={{ color: 'error.main', fontSize: 24 }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isConnected ? 'System Connected' : 'System Disconnected'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Location data is pushed to the application in real-time via Server-Sent Events (SSE).
        </Typography>
      </Box>

      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600,
          mb: 2,
          color: 'text.primary',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
        }}
      >
        Entity Summary
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(10, 77, 140, 0.04)',
            border: '1px solid rgba(10, 77, 140, 0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(10, 77, 140, 0.08)',
              transform: 'translateX(4px)',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Location Providers
          </Typography>
          <Chip 
            label={providerCount} 
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              minWidth: 45,
            }}
          />
        </Box>
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(100, 206, 255, 0.04)',
            border: '1px solid rgba(100, 206, 255, 0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(100, 206, 255, 0.08)',
              transform: 'translateX(4px)',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Trackables
          </Typography>
          <Chip 
            label={trackableCount} 
            size="small"
            sx={{
              bgcolor: 'secondary.main',
              color: 'white',
              fontWeight: 600,
              minWidth: 45,
            }}
          />
        </Box>
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(95, 111, 135, 0.04)',
            border: '1px solid rgba(95, 111, 135, 0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(95, 111, 135, 0.08)',
              transform: 'translateX(4px)',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Geofences
          </Typography>
          <Chip 
            label={fenceCount} 
            size="small"
            sx={{
              bgcolor: 'text.secondary',
              color: 'white',
              fontWeight: 600,
              minWidth: 45,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: 'rgba(10, 77, 140, 0.04)',
          border: '1px solid rgba(10, 77, 140, 0.1)',
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: 'text.primary',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          }}
        >
          Last Update
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
          {formatLastUpdate()}
        </Typography>
      </Box>
    </Box>
  );
}
