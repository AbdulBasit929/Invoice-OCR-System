// src/theme.js
import { createTheme } from '@mui/material/styles';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0A66C2', light: '#1E88E5', dark: '#0A4D99' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#059669' },
    accent: { main: '#F59E0B' },
    purple: { main: '#8B5CF6' },
    cyan: { main: '#06B6D4' },
    dark: { main: '#0F172A', light: '#1E293B' },
    gray: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 16 },
  spacing: 8,                     // 8-pt grid
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
    h2: { fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.015em' },
    h3: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 },
    h4: { fontSize: '1.75rem', fontWeight: 700 },
    subtitle1: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.6 },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiContainer: { defaultProps: { maxWidth: 'xl' } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          '&:hover': { transform: 'translateY(-2px)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
    },
  },
});

export default theme;