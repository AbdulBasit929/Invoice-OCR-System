



// src/pages/LandingPage.jsx - ELITE ENTERPRISE DESIGN
// Inspired by: Stripe, Linear, Vercel, Notion - World-class SaaS design

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
  Divider,
  alpha,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowForward,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  Award,
  Users,
  BarChart3,
  Sparkles,
  ChevronRight,
  PlayCircle,
} from '@mui/icons-material';

// ELITE DESIGN SYSTEM - World-Class Standards
const theme = {
  // Perfect Color System - Sophisticated & Professional
  colors: {
    // Primary - Deep Professional Blue (like Stripe)
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      500: '#3b5bdb',
      600: '#364fc7',
      700: '#2f44ad',
      900: '#1a2744',
    },
    // Accent - Vibrant Purple (like Linear)
    accent: {
      500: '#7c3aed',
      600: '#6d28d9',
    },
    // Neutral - Perfect grayscale
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  // Perfect Typography Scale - Based on Major Third (1.250)
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    },
    // Perfect type scale
    scale: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },

  // Perfect Spacing Scale - Base 4px
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },

  // Perfect Shadows - Subtle and refined
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Perfect Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },
};

const LandingPage = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignUp = () => navigate('/register');
  const handleSignIn = () => navigate('/login');

  return (
    <Box sx={{ bgcolor: theme.colors.neutral[0], minHeight: '100vh' }}>
      {/* NAVIGATION - Refined & Minimal */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: scrolled ? alpha(theme.colors.neutral[0], 0.8) : 'transparent',
          backdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
          borderBottom: scrolled ? `1px solid ${theme.colors.neutral[200]}` : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 64, md: 72 },
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ cursor: 'pointer' }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: theme.radius.md,
                  background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.accent[500]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles sx={{ fontSize: 20, color: theme.colors.neutral[0] }} />
              </Box>
              <Typography
                sx={{
                  fontSize: theme.typography.scale.xl,
                  fontWeight: theme.typography.weight.bold,
                  color: scrolled ? theme.colors.neutral[900] : theme.colors.neutral[0],
                  letterSpacing: theme.typography.letterSpacing.tight,
                }}
              >
                InvoiceAI
              </Typography>
            </Stack>

            {/* Desktop Nav */}
            {!isMobile && (
              <Stack direction="row" spacing={1} alignItems="center">
                {['Features', 'Pricing', 'Customers', 'Docs'].map((item) => (
                  <Button
                    key={item}
                    sx={{
                      px: 3,
                      py: 1,
                      color: scrolled ? theme.colors.neutral[700] : alpha(theme.colors.neutral[0], 0.9),
                      fontSize: theme.typography.scale.sm,
                      fontWeight: theme.typography.weight.medium,
                      textTransform: 'none',
                      borderRadius: theme.radius.md,
                      '&:hover': {
                        bgcolor: scrolled
                          ? alpha(theme.colors.primary[500], 0.08)
                          : alpha(theme.colors.neutral[0], 0.12),
                      },
                    }}
                  >
                    {item}
                  </Button>
                ))}
                <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: scrolled ? theme.colors.neutral[200] : alpha(theme.colors.neutral[0], 0.2) }} />
                <Button
                  onClick={handleSignIn}
                  sx={{
                    px: 3,
                    py: 1,
                    color: scrolled ? theme.colors.neutral[700] : theme.colors.neutral[0],
                    fontSize: theme.typography.scale.sm,
                    fontWeight: theme.typography.weight.medium,
                    textTransform: 'none',
                    borderRadius: theme.radius.md,
                    '&:hover': {
                      bgcolor: scrolled
                        ? alpha(theme.colors.primary[500], 0.08)
                        : alpha(theme.colors.neutral[0], 0.12),
                    },
                  }}
                >
                  Sign in
                </Button>
                <Button
                  onClick={handleSignUp}
                  variant="contained"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    px: 4,
                    py: 1.25,
                    fontSize: theme.typography.scale.sm,
                    fontWeight: theme.typography.weight.semibold,
                    textTransform: 'none',
                    borderRadius: theme.radius.md,
                    bgcolor: theme.colors.primary[500],
                    color: theme.colors.neutral[0],
                    boxShadow: theme.shadows.sm,
                    '&:hover': {
                      bgcolor: theme.colors.primary[600],
                      boxShadow: theme.shadows.md,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Get started
                </Button>
              </Stack>
            )}

            {/* Mobile Menu */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  color: scrolled ? theme.colors.neutral[900] : theme.colors.neutral[0],
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 400,
            bgcolor: theme.colors.neutral[0],
          },
        }}
      >
        <Box sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
            <Typography sx={{ fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.bold }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2}>
            {['Features', 'Pricing', 'Customers', 'Docs'].map((item) => (
              <Button
                key={item}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  px: 3,
                  py: 2,
                  fontSize: theme.typography.scale.base,
                  fontWeight: theme.typography.weight.medium,
                  color: theme.colors.neutral[900],
                  textTransform: 'none',
                  borderRadius: theme.radius.md,
                  '&:hover': {
                    bgcolor: alpha(theme.colors.primary[500], 0.08),
                  },
                }}
              >
                {item}
              </Button>
            ))}
            <Divider sx={{ my: 3 }} />
            <Button
              onClick={handleSignIn}
              fullWidth
              variant="outlined"
              sx={{
                py: 2,
                fontSize: theme.typography.scale.base,
                fontWeight: theme.typography.weight.medium,
                textTransform: 'none',
                borderRadius: theme.radius.md,
                borderWidth: 1.5,
                borderColor: theme.colors.neutral[300],
                color: theme.colors.neutral[900],
                '&:hover': {
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary[500],
                  bgcolor: alpha(theme.colors.primary[500], 0.04),
                },
              }}
            >
              Sign in
            </Button>
            <Button
              onClick={handleSignUp}
              fullWidth
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                py: 2,
                fontSize: theme.typography.scale.base,
                fontWeight: theme.typography.weight.semibold,
                textTransform: 'none',
                borderRadius: theme.radius.md,
                bgcolor: theme.colors.primary[500],
                '&:hover': {
                  bgcolor: theme.colors.primary[600],
                },
              }}
            >
              Get started
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* HERO - Clean & Powerful */}
      <Box
        sx={{
          pt: { xs: 20, md: 24 },
          pb: { xs: 16, md: 24 },
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${theme.colors.neutral[0]} 0%, ${theme.colors.neutral[50]} 100%)`,
        }}
      >
        {/* Subtle grid background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${alpha(theme.colors.primary[500], 0.03)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha(theme.colors.primary[500], 0.03)} 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ maxWidth: 880, mx: 'auto', textAlign: 'center' }}>
            {/* Badge */}
            <Chip
              label="Introducing AI-powered automation"
              icon={<Sparkles sx={{ fontSize: 14, ml: 1 }} />}
              sx={{
                mb: 5,
                px: 2,
                py: 0.5,
                height: 32,
                bgcolor: alpha(theme.colors.primary[500], 0.08),
                borderRadius: theme.radius.full,
                border: `1px solid ${alpha(theme.colors.primary[500], 0.2)}`,
                color: theme.colors.primary[600],
                fontSize: theme.typography.scale.sm,
                fontWeight: theme.typography.weight.medium,
                '& .MuiChip-icon': {
                  color: theme.colors.primary[600],
                },
              }}
            />

            {/* Headline */}
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: theme.typography.scale['5xl'], md: theme.typography.scale['7xl'] },
                fontWeight: theme.typography.weight.extrabold,
                lineHeight: theme.typography.lineHeight.tight,
                letterSpacing: theme.typography.letterSpacing.tighter,
                color: theme.colors.neutral[900],
                mb: 4,
              }}
            >
              Invoice processing that{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.accent[500]} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                just works
              </Box>
            </Typography>

            {/* Subheadline */}
            <Typography
              sx={{
                fontSize: { xs: theme.typography.scale.lg, md: theme.typography.scale.xl },
                lineHeight: theme.typography.lineHeight.relaxed,
                color: theme.colors.neutral[600],
                mb: 6,
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              Extract data from invoices with 99.4% accuracy using AI. Process thousands of documents in minutes, not hours.
            </Typography>

            {/* CTAs */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <Button
                onClick={handleSignUp}
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: theme.typography.scale.base,
                  fontWeight: theme.typography.weight.semibold,
                  textTransform: 'none',
                  borderRadius: theme.radius.md,
                  bgcolor: theme.colors.primary[500],
                  color: theme.colors.neutral[0],
                  boxShadow: theme.shadows.lg,
                  '&:hover': {
                    bgcolor: theme.colors.primary[600],
                    boxShadow: theme.shadows.xl,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Start free trial
              </Button>
              <Button
                startIcon={<PlayCircle />}
                size="large"
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: theme.typography.scale.base,
                  fontWeight: theme.typography.weight.semibold,
                  textTransform: 'none',
                  borderRadius: theme.radius.md,
                  color: theme.colors.neutral[700],
                  '&:hover': {
                    bgcolor: alpha(theme.colors.neutral[900], 0.04),
                  },
                }}
              >
                Watch demo
              </Button>
            </Stack>

            {/* Trust indicators */}
            <Stack
              direction="row"
              spacing={4}
              justifyContent="center"
              divider={<Box sx={{ width: 1, height: 16, bgcolor: theme.colors.neutral[200] }} />}
              sx={{ flexWrap: 'wrap', gap: 2 }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: theme.typography.scale.xs, color: theme.colors.neutral[500], mb: 0.5 }}>
                  Trusted by
                </Typography>
                <Typography sx={{ fontSize: theme.typography.scale.sm, fontWeight: theme.typography.weight.semibold, color: theme.colors.neutral[900] }}>
                  2,000+ companies
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: theme.typography.scale.xs, color: theme.colors.neutral[500], mb: 0.5 }}>
                  Accuracy
                </Typography>
                <Typography sx={{ fontSize: theme.typography.scale.sm, fontWeight: theme.typography.weight.semibold, color: theme.colors.neutral[900] }}>
                  99.4% average
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: theme.typography.scale.xs, color: theme.colors.neutral[500], mb: 0.5 }}>
                  Processing time
                </Typography>
                <Typography sx={{ fontSize: theme.typography.scale.sm, fontWeight: theme.typography.weight.semibold, color: theme.colors.neutral[900] }}>
                  Under 2 seconds
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Product Screenshot/Demo */}
          <Box sx={{ mt: 12, maxWidth: 1200, mx: 'auto' }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: theme.radius.xl,
                border: `1px solid ${theme.colors.neutral[200]}`,
                bgcolor: theme.colors.neutral[0],
                boxShadow: theme.shadows['2xl'],
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: theme.radius.lg,
                  bgcolor: theme.colors.neutral[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.colors.primary[500], 0.1)} 0%, ${alpha(theme.colors.accent[500], 0.1)} 100%)`,
                }}
              >
                <Typography sx={{ color: theme.colors.neutral[400], fontSize: theme.typography.scale.lg }}>
                  Product Demo
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Continue with more sections... */}
      {/* Due to length, I'll create the remaining sections in the next part */}

    </Box>
  );
};

export default LandingPage;
