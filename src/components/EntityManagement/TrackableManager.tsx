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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Trackables</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Trackable
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <List dense>
        {trackables.length === 0 ? (
          <ListItem>
            <ListItemText primary="No trackables" secondary="Click 'Add Trackable' to create one" />
          </ListItem>
        ) : (
          trackables.map((trackable) => (
            <ListItem key={trackable.id}>
              <ListItemText
                primary={trackable.name || trackable.id}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {trackable.type} • {trackable.id.slice(0, 8)}...
                    </Typography>
                    {trackable.location_providers && trackable.location_providers.length > 0 && (
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {trackable.location_providers.map((providerId) => (
                          <Chip
                            key={providerId}
                            label={providerId.slice(0, 8)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => handleOpen(trackable)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton edge="end" size="small" onClick={() => handleDelete(trackable.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTrackable ? 'Edit Trackable' : 'Create Trackable'}
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
              <Typography variant="subtitle2" gutterBottom>
                Location Providers
              </Typography>
              {providers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No providers available. Create providers first.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {providers.map((provider) => (
                    <Chip
                      key={provider.id}
                      label={provider.name || provider.id}
                      onClick={() => toggleProvider(provider.id)}
                      color={selectedProviders.includes(provider.id) ? 'primary' : 'default'}
                      variant={selectedProviders.includes(provider.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTrackable ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

