import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

export type LabelDisplayMode = 'full' | 'name' | 'none';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  animateMovement: boolean;
  onAnimateMovementChange: (animate: boolean) => void;
  labelDisplay: LabelDisplayMode;
  onLabelDisplayChange: (mode: LabelDisplayMode) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  showGrid,
  onShowGridChange,
  animateMovement,
  onAnimateMovementChange,
  labelDisplay,
  onLabelDisplayChange,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 48px rgba(10, 77, 140, 0.15)',
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          pt: 3,
          px: 3,
        }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'rgba(10, 77, 140, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SettingsIcon sx={{ color: 'primary.main' }} />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            color: '#0A4D8C',
          }}
        >
          Display Settings
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box sx={{ py: 1 }}>
          <FormGroup>
            <Box
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: 2,
                bgcolor: 'rgba(10, 77, 140, 0.04)',
                border: '1px solid rgba(10, 77, 140, 0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(10, 77, 140, 0.06)',
                },
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showGrid}
                    onChange={(e) => onShowGridChange(e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'primary.main',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: 'primary.main',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Grid & Coordinates
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      Show coordinate grid and anchor point labels on the floor plan
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
            
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(10, 77, 140, 0.04)',
                border: '1px solid rgba(10, 77, 140, 0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(10, 77, 140, 0.06)',
                },
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={animateMovement}
                    onChange={(e) => onAnimateMovementChange(e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'secondary.main',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: 'secondary.main',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Smooth Animation
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      Smoothly animate markers when positions update
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          {/* Marker Labels Section */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
            Marker Labels
          </Typography>

          <FormControl 
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(10, 77, 140, 0.04)',
                '&:hover': {
                  bgcolor: 'rgba(10, 77, 140, 0.06)',
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(10, 77, 140, 0.08)',
                },
              },
            }}
          >
            <InputLabel id="label-display-select-label">Display Mode</InputLabel>
            <Select
              labelId="label-display-select-label"
              id="label-display-select"
              value={labelDisplay}
              label="Display Mode"
              onChange={(e) => onLabelDisplayChange(e.target.value as LabelDisplayMode)}
            >
              <MenuItem value="full">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Full Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show name and type
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="name">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Name Only
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show only the marker name
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="none">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Hidden
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    No labels, markers only
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(100, 206, 255, 0.04)',
              border: '1px solid rgba(100, 206, 255, 0.1)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
              💡 Additional display and performance settings will be available in future updates.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          fullWidth
          sx={{
            py: 1.25,
            fontSize: '0.9375rem',
            fontWeight: 600,
          }}
        >
          Apply Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};


