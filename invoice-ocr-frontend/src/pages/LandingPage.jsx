// MODERN LANDING PAGE - MATCHING AUTH PAGES THEME
// Consistent color scheme: #0A66C2 (primary), #8B5CF6 (purple), #10B981 (green)
// Professional design matching Login/Register pages

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, AppBar, Toolbar,
  IconButton, Drawer, Stack, Chip, Fade, Zoom, Paper, alpha,
} from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon, ArrowForward,
  Layers, AutoAwesome, Speed, Security, Analytics,
  CheckCircle, Bolt, East, CloudUpload, Psychology,
  DocumentScanner, BarChart, TrendingUp, Shield,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const colors = {
    primary: '#0A66C2',
    secondary: '#10B981',
    purple: '#8B5CF6',
    dark: '#0F172A',
    slate: '#1E293B',
    gray: '#64748B',
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* NAVIGATION */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 3 } }}>
            {/* Logo */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`,
                }}
              >
                <Layers sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: scrolled ? colors.dark : '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                InvoiceAI
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {/* Desktop Nav */}
            {!mobileMenuOpen && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ mr: 3, display: { xs: 'none', md: 'flex' } }}
              >
                {['Features', 'Technology', 'Demo'].map((item) => (
                  <Button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    sx={{
                      px: 2.5,
                      py: 1,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: scrolled ? colors.dark : '#fff',
                      textTransform: 'none',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: scrolled
                          ? 'rgba(0, 0, 0, 0.04)'
                          : 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </Stack>
            )}

            {/* Desktop Auth Buttons */}
            <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button
                onClick={() => navigate('/login')}
                sx={{
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: scrolled ? colors.dark : '#fff',
                  textTransform: 'none',
                  borderRadius: 2,
                  border: scrolled
                    ? '1.5px solid rgba(0, 0, 0, 0.1)'
                    : '1.5px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    bgcolor: scrolled ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                variant="contained"
                sx={{
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: `0 4px 14px ${alpha(colors.primary, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 18px ${alpha(colors.primary, 0.4)}`,
                  },
                  transition: 'all 0.2s',
                }}
              >
                Get Started
              </Button>
            </Stack>

            {/* Mobile Menu Icon */}
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ color: scrolled ? colors.dark : '#fff', display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ sx: { width: '100%', maxWidth: 400, bgcolor: '#fff' } }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.dark }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1}>
            {['Features', 'Technology', 'Demo'].map((item) => (
              <Button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: colors.dark,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                }}
              >
                {item}
              </Button>
            ))}
          </Stack>
          <Stack spacing={1.5} sx={{ mt: 4 }}>
            <Button
              onClick={() => navigate('/login')}
              fullWidth
              variant="outlined"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.dark,
                borderColor: 'rgba(0, 0, 0, 0.12)',
                borderWidth: 1.5,
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: `0 4px 14px ${alpha(colors.primary, 0.3)}`,
              }}
            >
              Get Started
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* HERO SECTION */}
      <Box
        sx={{
          pt: { xs: 20, md: 28 },
          pb: { xs: 12, md: 20 },
          px: { xs: 3, md: 6 },
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.slate} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid Pattern Background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: `
              linear-gradient(${alpha('#fff', 0.05)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha('#fff', 0.05)} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}>
              {/* Badge */}
              <Chip
                label="AI-Powered Invoice Processing System"
                sx={{
                  mb: 4,
                  height: 36,
                  px: 2,
                  bgcolor: alpha('#fff', 0.1),
                  border: `1.5px solid ${alpha('#fff', 0.2)}`,
                  color: alpha('#fff', 0.95),
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              />

              {/* Main Headline */}
              <Typography
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.04em',
                  color: '#fff',
                  mb: 3,
                }}
              >
                Intelligent Invoice
                <br />
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Processing
                </Box>
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{
                  fontSize: { xs: '1.125rem', md: '1.3rem' },
                  lineHeight: 1.7,
                  color: alpha('#fff', 0.8),
                  mb: 6,
                  maxWidth: 700,
                  mx: 'auto',
                }}
              >
                Advanced MERN stack application powered by <strong>PaddleOCR</strong> and{' '}
                <strong>Nanonet</strong> with GPT-4 intelligence. Process multilingual invoices
                with 99.2% accuracy.
              </Typography>

              {/* CTA Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mb: 10 }}
              >
                <Button
                  onClick={() => navigate('/register')}
                  variant="contained"
                  endIcon={<East />}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    bgcolor: '#fff',
                    color: colors.dark,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(255, 255, 255, 0.25)',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 28px rgba(255, 255, 255, 0.3)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Try Live Demo
                </Button>
                <Button
                  onClick={() => scrollToSection('technology')}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#fff',
                    textTransform: 'none',
                    borderRadius: 2,
                    border: `1.5px solid ${alpha('#fff', 0.3)}`,
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.1),
                      borderColor: alpha('#fff', 0.4),
                    },
                  }}
                >
                  Explore Technology
                </Button>
              </Stack>

              {/* Stats Grid */}
              <Grid container spacing={3}>
                {[
                  { value: '99.2%', label: 'OCR Accuracy', icon: <TrendingUp /> },
                  { value: '15K+', label: 'Invoices Processed', icon: <BarChart /> },
                  { value: '<1s', label: 'Upload Time', icon: <Bolt /> },
                  { value: '10+', label: 'Languages', icon: <Psychology /> },
                ].map((stat, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Zoom in timeout={1000 + i * 150}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          py: 3,
                          px: 2,
                          borderRadius: 2.5,
                          bgcolor: alpha('#fff', 0.08),
                          border: `1.5px solid ${alpha('#fff', 0.15)}`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            bgcolor: alpha('#fff', 0.12),
                            borderColor: alpha('#fff', 0.25),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            bgcolor: alpha('#fff', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          {React.cloneElement(stat.icon, {
                            sx: { fontSize: 24, color: colors.secondary },
                          })}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: { xs: '2rem', md: '2.5rem' },
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '-0.02em',
                            mb: 0.5,
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.95rem',
                            color: alpha('#fff', 0.7),
                            fontWeight: 600,
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* TECHNOLOGY SECTION */}
      <Box id="technology" sx={{ py: { xs: 12, md: 20 }, px: { xs: 3, md: 6 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 10, maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: colors.dark,
                mb: 2,
              }}
            >
              Built with modern tech
            </Typography>
            <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6, color: colors.gray }}>
              Powered by enterprise-grade technologies for reliability and performance
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                title: 'OCR Engines',
                icon: <DocumentScanner />,
                techs: ['PaddleOCR', 'Nanonet OCR', 'PyTorch', 'TensorFlow'],
                desc: 'Dual OCR architecture for maximum accuracy',
              },
              {
                title: 'AI & Intelligence',
                icon: <Psychology />,
                techs: ['OpenAI GPT-4', 'Custom ML', 'NLP Processing', 'Data Extraction'],
                desc: 'GPT-4 powered intelligent extraction',
              },
              {
                title: 'Backend Stack',
                icon: <Layers />,
                techs: ['Node.js', 'Express.js', 'MongoDB', 'Redis Cache'],
                desc: 'Scalable MERN with async processing',
              },
              {
                title: 'Frontend',
                icon: <AutoAwesome />,
                techs: ['React 18', 'Material-UI', 'Recharts', 'WebSocket'],
                desc: 'Modern React with real-time updates',
              },
            ].map((item, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 2.5,
                    bgcolor: '#fff',
                    border: '1.5px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 28px ${alpha(colors.primary, 0.12)}`,
                      borderColor: alpha(colors.primary, 0.3),
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 1.5,
                        background: `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(
                          colors.purple,
                          0.1
                        )} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {React.cloneElement(item.icon, {
                        sx: { fontSize: 26, color: colors.primary },
                      })}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: colors.dark,
                          mb: 0.5,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.9rem', color: colors.gray }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {item.techs.map((tech, j) => (
                      <Chip
                        key={j}
                        label={tech}
                        size="small"
                        sx={{
                          bgcolor: alpha(colors.primary, 0.08),
                          color: colors.primary,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: `1px solid ${alpha(colors.primary, 0.15)}`,
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Box id="features" sx={{ py: { xs: 12, md: 20 }, px: { xs: 3, md: 6 }, bgcolor: '#F8FAFC' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 12, maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: colors.dark,
                mb: 2,
              }}
            >
              Everything you need
            </Typography>
            <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6, color: colors.gray }}>
              Enterprise-grade features for intelligent invoice processing
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: AutoAwesome,
                title: 'Multi-Language OCR',
                desc: 'Process invoices in Arabic, English, Urdu, and more with 99% accuracy using dual OCR engines',
              },
              {
                icon: Speed,
                title: 'Lightning Fast',
                desc: 'Upload invoices in <1 second with async background processing. No more waiting',
              },
              {
                icon: Psychology,
                title: 'GPT-4 Intelligence',
                desc: 'Advanced AI extracts and validates invoice data with human-like understanding',
              },
              {
                icon: Analytics,
                title: 'Smart Analytics',
                desc: 'Real-time dashboards with interactive charts showing spending patterns and trends',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                desc: 'Bank-grade encryption, JWT authentication, and comprehensive audit logging',
              },
              {
                icon: Bolt,
                title: 'Real-Time Updates',
                desc: 'WebSocket integration provides instant updates across all connected clients',
              },
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 2.5,
                    bgcolor: '#fff',
                    border: '1.5px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 28px ${alpha(colors.primary, 0.12)}`,
                      borderColor: alpha(colors.primary, 0.3),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 1.5,
                      background: `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(
                        colors.purple,
                        0.1
                      )} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    <feature.icon sx={{ fontSize: 26, color: colors.primary }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: colors.dark,
                      mb: 1.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: colors.gray }}>
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* DEMO SECTION */}
      <Box id="demo" sx={{ py: { xs: 12, md: 20 }, px: { xs: 3, md: 6 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: colors.dark,
                mb: 2,
              }}
            >
              See it in action
            </Typography>
            <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.6, color: colors.gray }}>
              Interactive dashboard with real-time analytics and comprehensive invoice management
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              border: '1.5px solid rgba(0, 0, 0, 0.08)',
              boxShadow: `0 12px 32px ${alpha(colors.primary, 0.08)}`,
            }}
          >
            <Grid container spacing={3}>
              {[
                { label: 'Total Invoices', value: '1,247', change: '+12%' },
                { label: 'Processing', value: '23', change: 'Live' },
                { label: 'Completed Today', value: '156', change: '+8%' },
                { label: 'Avg. Accuracy', value: '99.2%', change: '+0.3%' },
              ].map((stat, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: alpha(colors.primary, 0.04),
                      border: `1.5px solid ${alpha(colors.primary, 0.1)}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 20, color: colors.secondary }} />
                      <Chip
                        label={stat.change}
                        size="small"
                        sx={{
                          height: 24,
                          bgcolor: alpha(colors.secondary, 0.15),
                          color: colors.secondary,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: colors.dark,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: colors.gray, fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* CTA SECTION */}
      <Box
        sx={{
          py: { xs: 12, md: 18 },
          px: { xs: 3, md: 6 },
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.slate} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: `
              linear-gradient(${alpha('#fff', 0.05)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha('#fff', 0.05)} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#fff',
              mb: 3,
            }}
          >
            Ready to get started?
          </Typography>
          <Typography
            sx={{
              fontSize: '1.25rem',
              lineHeight: 1.6,
              color: alpha('#fff', 0.8),
              mb: 5,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Experience the power of AI-driven invoice processing with PaddleOCR, Nanonet, and
            GPT-4
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              onClick={() => navigate('/register')}
              variant="contained"
              endIcon={<ArrowForward />}
              sx={{
                px: 5,
                py: 2.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                bgcolor: '#fff',
                color: colors.dark,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.25)',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 28px rgba(255, 255, 255, 0.3)',
                },
                transition: 'all 0.2s',
              }}
            >
              Start Free Trial
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ py: 8, px: { xs: 3, md: 6 }, borderTop: '1.5px solid rgba(0, 0, 0, 0.08)' }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', md: 'flex-start' }}
            spacing={4}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: colors.dark }}>
                  InvoiceAI
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.9rem', color: colors.gray, mb: 2 }}>
                Enterprise-grade invoice processing powered by AI
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['PaddleOCR', 'Nanonet', 'GPT-4', 'MERN'].map((tech, i) => (
                  <Chip
                    key={i}
                    label={tech}
                    size="small"
                    sx={{
                      bgcolor: alpha(colors.primary, 0.08),
                      color: colors.primary,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(0, 0, 0, 0.08)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', color: colors.gray, mb: 1 }}>
              © 2024-2025 InvoiceAI - Final Year Project
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: alpha(colors.gray, 0.7) }}>
              Built with React • Node.js • MongoDB • PaddleOCR • Nanonet • GPT-4
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;