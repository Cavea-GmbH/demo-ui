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
          Location Providers
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
        {providers.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(10, 77, 140, 0.04)',
              border: '1px solid rgba(10, 77, 140, 0.1)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No providers yet. Click 'Add' to create your first location provider.
            </Typography>
          </Box>
        ) : (
          providers.map((provider) => (
            <ListItem 
              key={provider.id}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: 'rgba(10, 77, 140, 0.04)',
                border: '1px solid rgba(10, 77, 140, 0.08)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(10, 77, 140, 0.08)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {provider.name || provider.id}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        px: 1,
                        py: 0.25,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {provider.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {provider.id.slice(0, 16)}...
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleOpen(provider)}
                  sx={{
                    mr: 0.5,
                    bgcolor: 'rgba(10, 77, 140, 0.08)',
                    '&:hover': { bgcolor: 'rgba(10, 77, 140, 0.15)' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleDelete(provider.id)}
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
              color: '#0A4D8C',
            }}
          >
            {editingProvider ? 'Edit Provider' : 'Create Provider'}
          </Typography>
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
            {editingProvider ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

