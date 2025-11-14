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
    return eventType === 'region_entry' ? 'success' : 'error';
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
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Event Log</Typography>
        <IconButton size="small" onClick={onClear} disabled={events.length === 0}>
          <ClearIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No events yet. Events will appear here when entities enter or exit fences.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {events.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 1.5,
                  px: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={event.event_type}
                    color={getEventColor(event.event_type)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(event.entry_time || event.exit_time)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  {getEntityName(event)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fence ID: {event.fence_id.slice(0, 8)}...
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
