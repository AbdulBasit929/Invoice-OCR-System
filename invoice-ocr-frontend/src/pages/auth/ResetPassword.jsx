// src/pages/auth/ResetPassword.jsx - COMPACT VIEWPORT-FIT DESIGN

import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  Alert, CircularProgress, Stack, alpha, IconButton, LinearProgress,
} from '@mui/material';
import {
  Lock, ArrowForward, Layers, Visibility, VisibilityOff, CheckCircle,
  AutoAwesome, Bolt, Shield,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import authService from '../../services/authService';

const resetPasswordSchema = Yup.object({
  password: Yup.string().required('Password required').min(6, 'Min 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must have uppercase, lowercase & number'),
  confirmPassword: Yup.string().required('Confirm password').oneOf([Yup.ref('password')], 'Passwords must match'),
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    accent: '#F59E0B',
  };

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await authService.resetPassword(token, values.password);
        setSuccess(true);
        enqueueSnackbar('Password reset! 🎉', { variant: 'success' });
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to reset password';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordStrength = () => {
    const pw = formik.values.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s += 25;
    if (pw.length >= 10) s += 25;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 25;
    if (/\d/.test(pw)) s += 25;
    return s;
  };

  const getStrengthColor = () => {
    const s = passwordStrength();
    if (s <= 50) return colors.accent;
    if (s <= 75) return colors.primary;
    return colors.secondary;
  };

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
            Secure Your
            <br />Account
          </Typography>

          <Typography sx={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: alpha('#fff', 0.7),
            mb: 4,
          }}>
            Create a strong password to protect your invoice data and automation workflows
          </Typography>

          <Stack spacing={2}>
            {[
              { icon: AutoAwesome, text: 'Enhanced protection' },
              { icon: Bolt, text: 'Instant activation' },
              { icon: Shield, text: 'Bank-level security' },
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
                  Set new password
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', color: colors.gray }}>
                  Create a strong password for your account
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <form onSubmit={formik.handleSubmit}>
                <Stack spacing={2}>
                  <Box>
                    <TextField
                      fullWidth
                      id="password"
                      name="password"
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={formik.touched.password && formik.errors.password}
                      disabled={formik.isSubmitting}
                      autoFocus
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
                              size="small"
                              disabled={formik.isSubmitting}
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
                    {formik.values.password && (
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength()}
                        sx={{
                          mt: 1,
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(colors.gray, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getStrengthColor(),
                            borderRadius: 2,
                          },
                        }}
                      />
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                            disabled={formik.isSubmitting}
                          >
                            {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
                    {formik.isSubmitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Reset Password'}
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
                Password reset!
              </Typography>

              <Typography sx={{
                fontSize: '0.95rem',
                color: colors.gray,
                mb: 3,
              }}>
                Your password has been successfully reset.
                <br />
                Redirecting to sign in...
              </Typography>

              <CircularProgress size={32} thickness={4} sx={{ color: colors.primary }} />
            </Box>
          )}

          {!success && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.gray }}>
                Remember your password?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: colors.primary,
                    fontWeight: 700,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;