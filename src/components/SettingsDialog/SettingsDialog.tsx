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
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  animateMovement: boolean;
  onAnimateMovementChange: (animate: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  showGrid,
  onShowGridChange,
  animateMovement,
  onAnimateMovementChange,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Settings
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Display Settings Section */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
            Display Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={showGrid}
                  onChange={(e) => onShowGridChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Grid & Labels
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show coordinate grid and anchor point labels on the floor plan
                  </Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={animateMovement}
                  onChange={(e) => onAnimateMovementChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Animate Movement
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Smoothly animate markers when positions update
                  </Typography>
                </Box>
              }
              sx={{ mt: 2 }}
            />
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          {/* Future settings sections can be added here */}
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            More settings can be added here in future updates
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};


