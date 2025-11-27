import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0A4D8C', // Cavea deep blue
      light: '#1E88E5',
      dark: '#062F55',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#64CEFF', // Cavea corporate cyan
      light: '#8FDBFF',
      dark: '#3DB8F0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2332',
      secondary: '#5F6F87',
    },
    success: {
      main: '#64CEFF',
      light: '#8FDBFF',
      dark: '#3DB8F0',
    },
    error: {
      main: '#E63946',
      light: '#FF5A65',
      dark: '#C1121F',
    },
    divider: 'rgba(10, 77, 140, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    body1: {
      letterSpacing: '-0.01em',
    },
    body2: {
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(10, 77, 140, 0.15)',
          },
        },
        contained: {
          background: '#0A4D8C',
          '&:hover': {
            background: '#062F55',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(10, 77, 140, 0.06)',
        },
        elevation3: {
          boxShadow: '0 4px 16px rgba(10, 77, 140, 0.12)',
        },
      },
    },
  },
});

