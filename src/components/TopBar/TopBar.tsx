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
    <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 2, minHeight: '64px !important' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 3, fontWeight: 600 }}>
          Cavea RTLS Demo
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isConnected ? (
              <CheckCircle color="success" fontSize="small" />
            ) : (
              <ErrorIcon color="error" fontSize="small" />
            )}
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              {isConnected ? 'Receiving' : 'Disconnected'}
            </Typography>
          </Box>

          <Chip
            label={`Providers: ${providerCount}`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Trackables: ${trackableCount}`}
            size="small"
            variant="outlined"
            color="secondary"
          />
          <Chip
            label={`Fences: ${fenceCount}`}
            size="small"
            variant="outlined"
          />

          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Last: {formatLastUpdate()}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Show:
          </Typography>
          <ToggleButtonGroup size="small" sx={{ height: 32 }}>
            <ToggleButton
              value="providers"
              selected={showProviders}
              onChange={() => onShowProvidersChange(!showProviders)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showProviders ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                <Typography variant="caption">Providers</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton
              value="trackables"
              selected={showTrackables}
              onChange={() => onShowTrackablesChange(!showTrackables)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showTrackables ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                <Typography variant="caption">Trackables</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton
              value="fences"
              selected={showFences}
              onChange={() => onShowFencesChange(!showFences)}
              sx={{ px: 1.5, textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showFences ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                <Typography variant="caption">Fences</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <IconButton
          color="inherit"
          aria-label="open settings"
          onClick={onSettingsClick}
          sx={{ ml: 1 }}
        >
          <SettingsIcon />
        </IconButton>

        <IconButton
          edge="end"
          color="inherit"
          aria-label="open info panel"
          onClick={onMenuClick}
          sx={{ ml: 1 }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
