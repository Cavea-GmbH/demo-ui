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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { LocationProvider, ProviderType } from '../../types/omlox';
import { omloxApi } from '../../services/omloxApi';
import { generateProviderId } from '../../utils/uuid';

interface ProviderManagerProps {
  providers: LocationProvider[];
  onProviderAdded: (provider: LocationProvider) => void;
  onProviderUpdated: (provider: LocationProvider) => void;
  onProviderDeleted: (providerId: string) => void;
}

const PROVIDER_TYPES: ProviderType[] = [
  'uwb',
  'gps',
  'wifi',
  'rfid',
  'ibeacon',
  'ble-aoa',
  'ble-mesh',
  'virtual',
  'unknown',
];

export default function ProviderManager({
  providers,
  onProviderAdded,
  onProviderUpdated,
  onProviderDeleted,
}: ProviderManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LocationProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LocationProvider>>({
    id: '',
    type: 'uwb',
    name: '',
  });

  const handleOpen = (provider?: LocationProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData(provider);
    } else {
      setEditingProvider(null);
      // Generate a suggested ID for new providers
      setFormData({ id: generateProviderId(), type: 'uwb', name: '' });
    }
    setError(null);
    setOpen(true);
  };

  const handleGenerateNewId = () => {
    setFormData({ ...formData, id: generateProviderId() });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProvider(null);
    setFormData({ id: '', type: 'uwb', name: '' });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.type) {
      setError('ID and Type are required');
      return;
    }

    try {
      setError(null);
      const provider: LocationProvider = {
        id: formData.id,
        type: formData.type,
        name: formData.name,
        properties: formData.properties,
      };

      if (editingProvider) {
        await omloxApi.updateProvider(editingProvider.id, provider);
        onProviderUpdated(provider);
      } else {
        const created = await omloxApi.createProvider(provider);
        onProviderAdded(created);
      }
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save provider');
      console.error('Error saving provider:', err);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!window.confirm(`Delete provider ${providerId}?`)) {
      return;
    }

    try {
      await omloxApi.deleteProvider(providerId);
      onProviderDeleted(providerId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete provider');
      console.error('Error deleting provider:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Location Providers</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Provider
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <List dense>
        {providers.length === 0 ? (
          <ListItem>
            <ListItemText primary="No providers" secondary="Click 'Add Provider' to create one" />
          </ListItem>
        ) : (
          providers.map((provider) => (
            <ListItem key={provider.id}>
              <ListItemText
                primary={provider.name || provider.id}
                secondary={`${provider.type} • ${provider.id}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => handleOpen(provider)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton edge="end" size="small" onClick={() => handleDelete(provider.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProvider ? 'Edit Provider' : 'Create Provider'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Provider ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
              disabled={!!editingProvider}
              helperText={editingProvider ? "ID cannot be changed" : "Unique identifier (suggested ID, you can change it)"}
              fullWidth
              InputProps={{
                endAdornment: !editingProvider && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleGenerateNewId}
                      title="Generate new ID"
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ProviderType })}
              required
              fullWidth
            >
              {PROVIDER_TYPES.map((type) => (
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProvider ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

