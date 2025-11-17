import { Box, AppBar, Toolbar, Typography, Chip, IconButton, ToggleButton, ToggleButtonGroup, Divider } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Menu as MenuIcon, Settings as SettingsIcon, Visibility, VisibilityOff } from '@mui/icons-material';

interface TopBarProps {
  isConnected: boolean;
  isLoading: boolean;
  pollingEnabled: boolean;
  onPollingToggle: (enabled: boolean) => void;
  providerCount: number;
  trackableCount: number;
  fenceCount: number;
  lastUpdate: Date | null;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  showProviders: boolean;
  showTrackables: boolean;
  showFences: boolean;
  onShowProvidersChange: (show: boolean) => void;
  onShowTrackablesChange: (show: boolean) => void;
  onShowFencesChange: (show: boolean) => void;
}

export default function TopBar({
  isConnected,
  providerCount,
  trackableCount,
  fenceCount,
  lastUpdate,
  onMenuClick,
  onSettingsClick,
  showProviders,
  showTrackables,
  showFences,
  onShowProvidersChange,
  onShowTrackablesChange,
  onShowFencesChange,
}: TopBarProps) {
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
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(12px)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: 3, display: 'flex', alignItems: 'center', gap: 0 }}>
        <Box
          component="img"
          src="/cavea-logo.svg"
          alt="Cavea"
          sx={{
            height: 28,
            width: 'auto',
            mr: 2,
          }}
        />
        
        <Divider orientation="vertical" flexItem sx={{ mr: 2, my: 2.5 }} />
        
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected 
              ? '#64CEFF'
              : '#E63946',
            boxShadow: isConnected
              ? '0 0 12px rgba(100, 206, 255, 0.5)'
              : '0 0 12px rgba(230, 57, 70, 0.5)',
            animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.6 },
            },
            mr: 1,
          }}
        />
        
        <Typography 
          variant="body2" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'text.secondary',
            letterSpacing: '-0.01em',
            mr: 2,
          }}
        >
          RTLS Demo
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              bgcolor: isConnected ? 'rgba(100, 206, 255, 0.08)' : 'rgba(230, 57, 70, 0.08)',
              border: '1px solid',
              borderColor: isConnected ? 'rgba(100, 206, 255, 0.2)' : 'rgba(230, 57, 70, 0.2)',
            }}
          >
            {isConnected ? (
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>

          <Chip
            label={`${providerCount} Providers`}
            size="small"
            sx={{
              bgcolor: 'rgba(10, 77, 140, 0.08)',
              color: 'primary.main',
              fontWeight: 600,
              border: '1px solid rgba(10, 77, 140, 0.15)',
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
          <Chip
            label={`${trackableCount} Trackables`}
            size="small"
            sx={{
              bgcolor: 'rgba(100, 206, 255, 0.08)',
              color: 'secondary.main',
              fontWeight: 600,
              border: '1px solid rgba(100, 206, 255, 0.15)',
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
          <Chip
            label={`${fenceCount} Fences`}
            size="small"
            sx={{
              bgcolor: 'rgba(95, 111, 135, 0.08)',
              color: 'text.secondary',
              fontWeight: 600,
              border: '1px solid rgba(95, 111, 135, 0.15)',
              '& .MuiChip-label': { px: 1.5 },
            }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '0.75rem' }}>
            {formatLastUpdate()}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, fontWeight: 500 }}>
            Layers:
          </Typography>
          <ToggleButtonGroup 
            size="small" 
            sx={{ 
              height: 38,
              '& .MuiToggleButton-root': {
                border: '1px solid rgba(10, 77, 140, 0.12)',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton
              value="providers"
              selected={showProviders}
              onChange={() => onShowProvidersChange(!showProviders)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showProviders ? <Visibility sx={{ fontSize: 16 }} /> : <VisibilityOff sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Providers</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton
              value="trackables"
              selected={showTrackables}
              onChange={() => onShowTrackablesChange(!showTrackables)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showTrackables ? <Visibility sx={{ fontSize: 16 }} /> : <VisibilityOff sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Trackables</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton
              value="fences"
              selected={showFences}
              onChange={() => onShowFencesChange(!showFences)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showFences ? <Visibility sx={{ fontSize: 16 }} /> : <VisibilityOff sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Fences</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <IconButton
          color="inherit"
          aria-label="open settings"
          onClick={onSettingsClick}
          sx={{ 
            ml: 1,
            bgcolor: 'rgba(10, 77, 140, 0.04)',
            '&:hover': {
              bgcolor: 'rgba(10, 77, 140, 0.08)',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>

        <IconButton
          edge="end"
          color="inherit"
          aria-label="open info panel"
          onClick={onMenuClick}
          sx={{ 
            ml: 0.5,
            bgcolor: 'rgba(10, 77, 140, 0.04)',
            '&:hover': {
              bgcolor: 'rgba(10, 77, 140, 0.08)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
