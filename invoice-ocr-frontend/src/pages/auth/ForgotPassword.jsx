// src/pages/auth/ForgotPassword.jsx - COMPACT VIEWPORT-FIT DESIGN

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  Alert, CircularProgress, Stack, alpha,
} from '@mui/material';
import {
  Email, ArrowForward, Layers, ArrowBack,
  AutoAwesome, Bolt, Shield, CheckCircle,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import authService from '../../services/authService';

const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email required'),
});

const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
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
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await authService.forgotPassword(values.email);
        setSuccess(true);
        enqueueSnackbar('Reset link sent! 📧', { variant: 'success' });
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send reset link';
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
      {/* Left - Branding */}
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

          <Typography sx={{
            fontSize: '2rem',
            fontWeight: 900,
            lineHeight: 1.2,
            color: '#fff',
            mb: 2,
          }}>
            Quick Account
            <br />Recovery
          </Typography>

          <Typography sx={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: alpha('#fff', 0.7),
            mb: 4,
          }}>
            Get back to processing invoices in minutes with our secure password reset
          </Typography>

          <Stack spacing={2}>
            {[
              { icon: AutoAwesome, text: 'Instant reset link' },
              { icon: Bolt, text: 'Back online quickly' },
              { icon: Shield, text: 'Secure verification' },
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

      {/* Right - Form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
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

          {!success ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: colors.dark,
                  mb: 1,
                }}>
                  Forgot password?
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: colors.gray }}>
                  Enter your email for reset instructions
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

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
                    autoFocus
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
                    {formik.isSubmitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Send Reset Link'}
                  </Button>

                  <Button
                    fullWidth
                    component={RouterLink}
                    to="/login"
                    startIcon={<ArrowBack fontSize="small" />}
                    sx={{
                      py: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: colors.gray,
                      '&:hover': {
                        bgcolor: alpha(colors.primary, 0.05),
                        color: colors.primary,
                      },
                    }}
                  >
                    Back to Sign In
                  </Button>
                </Stack>
              </form>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
                boxShadow: `0 8px 24px ${alpha(colors.secondary, 0.3)}`,
              }}>
                <CheckCircle sx={{ fontSize: 36, color: '#fff' }} />
              </Box>

              <Typography sx={{
                fontSize: '2rem',
                fontWeight: 900,
                color: colors.dark,
                mb: 1,
              }}>
                Check your email
              </Typography>

              <Typography sx={{
                fontSize: '0.95rem',
                color: colors.gray,
                mb: 2,
              }}>
                Reset link sent to
                <br />
                <strong style={{ color: colors.dark }}>{formik.values.email}</strong>
              </Typography>

              <Alert severity="info" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Didn't receive it?{' '}
                  <Link
                    component="button"
                    onClick={() => {
                      setSuccess(false);
                      formik.resetForm();
                    }}
                    sx={{
                      color: colors.primary,
                      fontWeight: 700,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Try again
                  </Link>
                </Typography>
              </Alert>

              <Button
                fullWidth
                component={RouterLink}
                to="/login"
                variant="outlined"
                startIcon={<ArrowBack fontSize="small" />}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  color: colors.primary,
                  '&:hover': {
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    bgcolor: alpha(colors.primary, 0.05),
                  },
                }}
              >
                Back to Sign In
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;