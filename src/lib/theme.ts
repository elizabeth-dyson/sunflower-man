'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#795548',
      light: '#a1887f',
      dark: '#4e342e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#e8f5e9',
      dark: '#1b5e20',
    },
    warning: {
      main: '#f57c00',
      light: '#fff3e0',
    },
    error: {
      main: '#c62828',
      light: '#ffebee',
    },
    background: {
      default: '#f8faf8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2e1a',
      secondary: '#546e54',
    },
    divider: '#e0e8e0',
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#546e54' },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5, color: '#546e54' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 6px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
    '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    '0 6px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    '0 12px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
    '0 16px 40px rgba(0,0,0,0.1), 0 6px 16px rgba(0,0,0,0.06)',
    '0 20px 48px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
    '0 24px 56px rgba(0,0,0,0.14)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
          },
        },
        outlined: {
          borderColor: '#c8d6c8',
          '&:hover': {
            borderColor: '#2e7d32',
            backgroundColor: '#f1f8f1',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e8efe8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1b5e20',
          paddingBottom: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#d4ddd4',
            },
            '&:hover fieldset': {
              borderColor: '#4caf50',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2e7d32',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
