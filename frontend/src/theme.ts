import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f766e', // Teal 700
      light: '#14b8a6', // Teal 500
      dark: '#115e59', // Teal 800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0ea5e9', // Sky 500
      light: '#38bdf8', // Sky 400
      dark: '#0369a1', // Sky 700
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate 800
      secondary: '#64748b', // Slate 500
    },
    success: {
      main: '#10b981', // Emerald 500
    },
    warning: {
      main: '#f59e0b', // Amber 500
    },
    error: {
      main: '#ef4444', // Red 500
    },
    info: {
      main: '#6366f1', // Indigo 500
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #f1f5f9',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8fafc',
          color: '#475569',
          fontWeight: 600,
        },
      },
    },
    // Force 16px input text so iOS Safari never auto-zooms the page on field focus
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: '1rem',
        },
      },
    },
  },
});

export default theme;
