// src/pages/auth/Register.jsx - COMPACT VIEWPORT-FIT DESIGN

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Link, InputAdornment,
  IconButton, Alert, CircularProgress, Stack, alpha,
  Checkbox, FormControlLabel, LinearProgress,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, ArrowForward,
  Layers, Person, Business, AutoAwesome, Bolt, Shield,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const registerSchema = Yup.object({
  name: Yup.string().required('Name required').min(2, 'Too short').max(50, 'Too long'),
  email: Yup.string().email('Invalid email').required('Email required'),
  password: Yup.string().required('Password required').min(6, 'Min 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must have uppercase, lowercase & number'),
  confirmPassword: Yup.string().required('Confirm password').oneOf([Yup.ref('password')], 'Passwords must match'),
  company: Yup.string().optional(),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
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
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!acceptedTerms) {
        setError('Please accept terms and conditions');
        setSubmitting(false);
        return;
      }

      setError('');
      try {
        const result = await register({
          name: values.name,
          email: values.email,
          password: values.password,
          company: values.company,
        });

        if (result?.success) {
          enqueueSnackbar('Account created! 🎉', { variant: 'success' });
          setTimeout(() => navigate('/app/dashboard', { replace: true }), 500);
        } else {
          const errorMessage = result?.error || 'Registration failed';
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
            Intelligent Invoice
            <br />Automation
          </Typography>

          <Typography sx={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: alpha('#fff', 0.7),
            mb: 4,
          }}>
            Transform manual invoice processing into automated workflows
          </Typography>

          <Stack spacing={2}>
            {[
              { icon: AutoAwesome, text: 'AI-powered data capture' },
              { icon: Bolt, text: 'Real-time processing' },
              { icon: Shield, text: 'Secure cloud storage' },
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
        overflowY: 'auto',
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 3, display: { xs: 'flex', md: 'none' } }}
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

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: colors.dark, mb: 0.5 }}>
              Create account
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.gray }}>
              Start processing invoices with AI
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                id="name"
                name="name"
                label="Full Name"
                placeholder="John Doe"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ fontSize: 20, color: colors.gray }} />
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
                  '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
                }}
              />

              <TextField
                fullWidth
                size="small"
                id="email"
                name="email"
                label="Email"
                placeholder="you@company.com"
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
                  '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
                }}
              />

              <TextField
                fullWidth
                size="small"
                id="company"
                name="company"
                label="Company (Optional)"
                placeholder="Acme Inc."
                value={formik.values.company}
                onChange={formik.handleChange}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ fontSize: 20, color: colors.gray }} />
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
                }}
              />

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
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
                    '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
                  }}
                />
                {formik.values.password && (
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength()}
                    sx={{
                      mt: 0.5,
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
                size="small"
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
                  '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={formik.isSubmitting}
                    size="small"
                    sx={{ color: colors.primary, '&.Mui-checked': { color: colors.primary } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.8rem', color: colors.gray }}>
                    I agree to the{' '}
                    <Link href="#" sx={{ color: colors.primary, fontWeight: 600 }}>Terms</Link>
                  </Typography>
                }
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
                {formik.isSubmitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Create Account'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.gray }}>
              Already have an account?{' '}
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
        </Box>
      </Box>
    </Box>
  );
};

export default Register;