import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { Trackable, TrackableType } from '../../types/omlox';
import { omloxApi } from '../../services/omloxApi';
import { generateUUID } from '../../utils/uuid';

interface TrackableManagerProps {
  trackables: Trackable[];
  providers: { id: string; name?: string }[];
  onTrackableAdded: (trackable: Trackable) => void;
  onTrackableUpdated: (trackable: Trackable) => void;
  onTrackableDeleted: (trackableId: string) => void;
}

const TRACKABLE_TYPES: TrackableType[] = ['omlox', 'virtual'];

export default function TrackableManager({
  trackables,
  providers,
  onTrackableAdded,
  onTrackableUpdated,
  onTrackableDeleted,
}: TrackableManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingTrackable, setEditingTrackable] = useState<Trackable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Trackable>>({
    id: '',
    type: 'omlox',
    name: '',
    location_providers: [],
  });
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const handleOpen = (trackable?: Trackable) => {
    if (trackable) {
      setEditingTrackable(trackable);
      setFormData(trackable);
      setSelectedProviders(trackable.location_providers || []);
    } else {
      setEditingTrackable(null);
      // Generate a suggested UUID for new trackables
      setFormData({ id: generateUUID(), type: 'omlox', name: '', location_providers: [] });
      setSelectedProviders([]);
    }
    setError(null);
    setOpen(true);
  };

  const handleGenerateNewId = () => {
    setFormData({ ...formData, id: generateUUID() });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTrackable(null);
    setFormData({ id: '', type: 'omlox', name: '', location_providers: [] });
    setSelectedProviders([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.type) {
      setError('ID and Type are required');
      return;
    }

    try {
      setError(null);
      const trackable: Trackable = {
        id: formData.id,
        type: formData.type,
        name: formData.name,
        location_providers: selectedProviders.length > 0 ? selectedProviders : undefined,
        radius: formData.radius,
        properties: formData.properties,
      };

      if (editingTrackable) {
        await omloxApi.updateTrackable(editingTrackable.id, trackable);
        onTrackableUpdated(trackable);
      } else {
        const created = await omloxApi.createTrackable(trackable);
        onTrackableAdded(created);
      }
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save trackable');
      console.error('Error saving trackable:', err);
    }
  };

  const handleDelete = async (trackableId: string) => {
    if (!window.confirm(`Delete trackable ${trackableId}?`)) {
      return;
    }

    try {
      await omloxApi.deleteTrackable(trackableId);
      onTrackableDeleted(trackableId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete trackable');
      console.error('Error deleting trackable:', err);
    }
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
          Trackables
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ fontWeight: 600 }}
        >
          Add
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-message': { fontWeight: 500 },
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <List dense sx={{ p: 0 }}>
        {trackables.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(100, 206, 255, 0.04)',
              border: '1px solid rgba(100, 206, 255, 0.1)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No trackables yet. Click 'Add' to create your first trackable object.
            </Typography>
          </Box>
        ) : (
          trackables.map((trackable) => (
            <ListItem 
              key={trackable.id}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: 'rgba(100, 206, 255, 0.04)',
                border: '1px solid rgba(100, 206, 255, 0.08)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(100, 206, 255, 0.08)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {trackable.name || trackable.id}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mb: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1,
                          py: 0.25,
                          bgcolor: 'secondary.main',
                          color: 'white',
                          borderRadius: 1,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {trackable.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {trackable.id.slice(0, 16)}...
                      </Typography>
                    </Box>
                    {trackable.location_providers && trackable.location_providers.length > 0 && (
                      <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {trackable.location_providers.map((providerId) => (
                          <Chip
                            key={providerId}
                            label={providerId.slice(0, 8)}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              bgcolor: 'rgba(10, 77, 140, 0.08)',
                              color: 'primary.main',
                              border: '1px solid rgba(10, 77, 140, 0.15)',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleOpen(trackable)}
                  sx={{
                    mr: 0.5,
                    bgcolor: 'rgba(100, 206, 255, 0.08)',
                    '&:hover': { bgcolor: 'rgba(100, 206, 255, 0.15)' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleDelete(trackable.id)}
                  sx={{
                    bgcolor: 'rgba(230, 57, 70, 0.08)',
                    color: 'error.main',
                    '&:hover': { bgcolor: 'rgba(230, 57, 70, 0.15)' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 48px rgba(10, 77, 140, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #64CEFF 0%, #8FDBFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {editingTrackable ? 'Edit Trackable' : 'Create Trackable'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Trackable ID (UUID)"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              disabled={!!editingTrackable}
              helperText={editingTrackable ? "ID cannot be changed" : "Unique identifier (suggested UUID, you can change it)"}
              fullWidth
              InputProps={{
                endAdornment: !editingTrackable && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleGenerateNewId}
                      title="Generate new UUID"
                      edge="end"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Type"
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TrackableType })}
              required
              fullWidth
            >
              {TRACKABLE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Radius (meters)"
              type="number"
              value={formData.radius || ''}
              onChange={(e) =>
                setFormData({ ...formData, radius: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              helperText="Optional: Radius for circular geometry"
              fullWidth
            />
            <Box>
              <Typography 
                variant="subtitle2" 
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Location Providers
              </Typography>
              {providers.length === 0 ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(10, 77, 140, 0.04)',
                    border: '1px solid rgba(10, 77, 140, 0.1)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No providers available. Create providers first.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {providers.map((provider) => (
                    <Chip
                      key={provider.id}
                      label={provider.name || provider.id.slice(0, 12)}
                      onClick={() => toggleProvider(provider.id)}
                      sx={{
                        fontWeight: 500,
                        cursor: 'pointer',
                        bgcolor: selectedProviders.includes(provider.id) ? 'primary.main' : 'rgba(10, 77, 140, 0.08)',
                        color: selectedProviders.includes(provider.id) ? 'white' : 'primary.main',
                        border: '1px solid',
                        borderColor: selectedProviders.includes(provider.id) ? 'primary.main' : 'rgba(10, 77, 140, 0.2)',
                        '&:hover': {
                          bgcolor: selectedProviders.includes(provider.id) ? 'primary.dark' : 'rgba(10, 77, 140, 0.12)',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              flex: 1,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              flex: 1,
              fontWeight: 600,
            }}
          >
            {editingTrackable ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

