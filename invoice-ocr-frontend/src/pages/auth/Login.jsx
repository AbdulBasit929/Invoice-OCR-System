// src/pages/auth/Login.jsx - COMPACT VIEWPORT-FIT DESIGN

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  IconButton, Alert, CircularProgress, Stack, alpha,
  Checkbox, FormControlLabel,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, ArrowForward,
  Layers, AutoAwesome, Bolt, Shield,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email required'),
  password: Yup.string().required('Password required'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const colors = {
    primary: '#0A66C2',
    secondary: '#10B981',
    purple: '#8B5CF6',
    dark: '#0F172A',
    slate: '#1E293B',
    gray: '#64748B',
  };

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const result = await login(values.email, values.password);
        if (result?.success) {
          enqueueSnackbar('Welcome back! 🎉', { variant: 'success' });
          setTimeout(() => navigate('/app/dashboard', { replace: true }), 500);
        } else {
          const errorMessage = result?.error || 'Login failed';
          setError(errorMessage);
          enqueueSnackbar(errorMessage, { variant: 'error' });
        }
      } catch (err) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: '#F8FAFC',
    }}>
      {/* Left - Branding (30%) */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '35%',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 5,
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.slate} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid Pattern */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(${alpha('#fff', 0.05)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha('#fff', 0.05)} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
              InvoiceAI
            </Typography>
          </Stack>

          {/* Headline */}
          <Typography sx={{
            fontSize: '2rem',
            fontWeight: 900,
            lineHeight: 1.2,
            color: '#fff',
            mb: 2,
          }}>
            AI-Powered Invoice
            <br />Processing
          </Typography>

          <Typography sx={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: alpha('#fff', 0.7),
            mb: 4,
          }}>
            Extract data from invoices instantly with advanced OCR and machine learning
          </Typography>

          {/* Features */}
          <Stack spacing={2}>
            {[
              { icon: AutoAwesome, text: 'Smart data extraction' },
              { icon: Bolt, text: 'Process in seconds' },
              { icon: Shield, text: 'Enterprise security' },
            ].map((feature, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha('#fff', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <feature.icon sx={{ fontSize: 16, color: colors.secondary }} />
                </Box>
                <Typography sx={{
                  fontSize: '0.9rem',
                  color: alpha('#fff', 0.9),
                  fontWeight: 500,
                }}>
                  {feature.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Right - Form (70%) */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile Logo */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}
          >
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: colors.dark }}>
              InvoiceAI
            </Typography>
          </Stack>

          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{
              fontSize: '2rem',
              fontWeight: 900,
              color: colors.dark,
              mb: 1,
            }}>
              Sign in
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: colors.gray }}>
              Welcome back! Please enter your details
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                placeholder="you@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 20, color: colors.gray }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#fff',
                    '& fieldset': { borderColor: '#E2E8F0', borderWidth: 1.5 },
                    '&:hover fieldset': { borderColor: colors.primary },
                    '&.Mui-focused fieldset': { borderColor: colors.primary, borderWidth: 1.5 },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.primary, fontWeight: 600 },
                  '& .MuiOutlinedInput-input': { py: 1.5 },
                }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 20, color: colors.gray }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={formik.isSubmitting}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#fff',
                    '& fieldset': { borderColor: '#E2E8F0', borderWidth: 1.5 },
                    '&:hover fieldset': { borderColor: colors.primary },
                    '&.Mui-focused fieldset': { borderColor: colors.primary, borderWidth: 1.5 },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.primary, fontWeight: 600 },
                  '& .MuiOutlinedInput-input': { py: 1.5 },
                }}
              />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      disabled={formik.isSubmitting}
                      sx={{ color: colors.primary, '&.Mui-checked': { color: colors.primary } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.85rem', color: colors.gray, fontWeight: 500 }}>Remember me</Typography>}
                />
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    fontSize: '0.85rem',
                    color: colors.primary,
                    textDecoration: 'none',
                    fontWeight: 700,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Link>
              </Stack>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
                endIcon={formik.isSubmitting ? null : <ArrowForward fontSize="small" />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(colors.primary, 0.35)}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 12px 28px ${alpha(colors.primary, 0.4)}`,
                  },
                  '&:disabled': { background: '#E2E8F0', color: colors.gray },
                  transition: 'all 0.2s',
                }}
              >
                {formik.isSubmitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </Stack>
          </form>

          {/* Sign Up Link */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', color: colors.gray }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: colors.primary,
                  fontWeight: 700,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;