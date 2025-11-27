import { Box, Typography, List, ListItem, Chip, IconButton } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import type { FenceEvent } from '../../types/omlox';

interface EventLogProps {
  events: FenceEvent[];
  onClear: () => void;
}

export default function EventLog({ events, onClear }: EventLogProps) {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getEventColor = (eventType: string) => {
    // Using the same colors as fence animations
    return eventType === 'region_entry' ? '#4caf50' : '#f44336';
  };

  const getEntityName = (event: FenceEvent) => {
    if (event.provider_id) {
      return `Provider: ${event.provider_id.slice(0, 8)}`;
    }
    if (event.trackable_id) {
      return `Trackable: ${event.trackable_id.slice(0, 8)}`;
    }
    return 'Unknown';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          }}
        >
          Event History
        </Typography>
        <IconButton 
          size="small" 
          onClick={onClear} 
          disabled={events.length === 0}
          sx={{
            bgcolor: events.length > 0 ? 'rgba(230, 57, 70, 0.08)' : 'transparent',
            color: events.length > 0 ? 'error.main' : 'text.disabled',
            '&:hover': {
              bgcolor: events.length > 0 ? 'rgba(230, 57, 70, 0.15)' : 'transparent',
            },
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {events.length === 0 ? (
          <Box 
            sx={{ 
              p: 4,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              No events yet. Events will appear here when entities enter or exit geofences.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 2 }}>
            {events.map((event, index) => (
              <ListItem
                key={event.id}
                sx={{
                  borderRadius: 2,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 2,
                  px: 2,
                  mb: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(10, 77, 140, 0.04)',
                    transform: 'translateX(-4px)',
                    boxShadow: '4px 0 0 0 ' + getEventColor(event.event_type),
                  },
                  animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
                  '@keyframes slideIn': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(-10px)',
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={event.event_type.replace('_', ' ').toUpperCase()}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      bgcolor: event.event_type === 'region_entry' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                      color: getEventColor(event.event_type),
                      border: '1px solid',
                      borderColor: getEventColor(event.event_type),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {formatTime(event.entry_time || event.exit_time)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 600, color: 'text.primary' }}>
                  {getEntityName(event)}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                  }}
                >
                  Fence: {event.fence_id}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
