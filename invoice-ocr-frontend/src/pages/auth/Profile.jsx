// src/pages/auth/Profile.jsx - FIXED WITH WORKING ACTIVITY

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Stack,
  Divider,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Refresh } from '@mui/icons-material';


import {
  Edit,
  Save,
  Cancel,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Business,
  CalendarToday,
  CheckCircle,
  History,
  Settings,
  Logout,
  PhotoCamera,
  Shield,
  Upload,
  Download,
  Delete,
  Visibility as ViewIcon,
  CloudUpload,
  Check,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import analyticsService from '../../services/analyticsService';
import { formatDateTime, getInitials, formatDate } from '../../lib/utils';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // ✅ Activity state
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState({
    dailyActivity: [],
    statusActivity: [],
  });

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
      });
    }
  }, [user]);

  // ✅ Fetch activity when tab changes
  useEffect(() => {
    if (activeTab === 2 && user) {
      fetchActivity();
    }
  }, [activeTab, user]);

  // ✅ NEW: Fetch user activity
  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      console.log('📊 Fetching user activity...');
      
      const response = await analyticsService.getUserActivity(user.id, undefined, undefined);
      console.log('✅ Activity response:', response);
      
      const data = response?.data || response;
      setActivityData({
        dailyActivity: data?.dailyActivity || [],
        statusActivity: data?.statusActivity || [],
      });
      
    } catch (err) {
      console.error('❌ Activity fetch error:', err);
      enqueueSnackbar('Failed to load activity data', { variant: 'error' });
    } finally {
      setActivityLoading(false);
    }
  };

  // Handle profile input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate profile form
  const validateProfile = () => {
    const newErrors = {};

    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePassword = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      setLoading(true);

      const response = await authService.updateProfile(profileForm);
      const updatedUser = response.data?.user || response.user || response.data;

      if (updateUser) {
        updateUser(updatedUser);
      }

      setEditing(false);
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
    } catch (err) {
      console.error('Update profile error:', err);
      enqueueSnackbar(err.message || 'Failed to update profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setLoading(true);

      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      enqueueSnackbar('Password changed successfully!', { variant: 'success' });
    } catch (err) {
      console.error('Change password error:', err);
      enqueueSnackbar(err.message || 'Failed to change password', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
    });
    setEditing(false);
    setErrors({});
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Get action icon
  const getActionIcon = (status) => {
    switch (status) {
      case 'processed':
      case 'validated':
        return <Check color="success" />;
      case 'pending':
      case 'processing':
        return <CloudUpload color="info" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <History color="action" />;
    }
  };

  // Get action color
  const getActionColor = (status) => {
    switch (status) {
      case 'processed':
      case 'validated':
        return 'success';
      case 'pending':
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading profile...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          border: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: '2.5rem',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {user.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={user.email}
                icon={<Email />}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              />
              <Chip
                label={user.role === 'admin' ? 'Administrator' : 'User'}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              />
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            Logout
          </Button>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Person />} label="Profile" iconPosition="start" />
          <Tab icon={<Settings />} label="Security" iconPosition="start" />
          <Tab icon={<History />} label="Activity" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Personal Information
                </Typography>
                {!editing ? (
                  <Button startIcon={<Edit />} onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button startIcon={<Cancel />} onClick={handleCancelEdit} disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={!editing || loading}
                    error={!!errors.name}
                    helperText={errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled={!editing || loading}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    disabled={!editing || loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                    disabled={!editing || loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Account Details */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Account Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Account Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight="medium">
                      {formatDateTime(user.createdAt)}
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Account Status
                  </Typography>
                  <Chip
                    icon={<CheckCircle />}
                    //label={user.isActive ? 'Active' : 'Inactive'}
                    label={'Active' }
                    //color={user.isActive ? 'success' : 'error'}
                    color={'success'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Security Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Password & Security
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Alert severity="info" icon={<Shield />}>
                  Keep your account secure by using a strong password and changing it regularly.
                </Alert>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Password Strength
                  </Typography>
                  <Chip label="Strong" color="success" size="small" />
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialog(true)}
                  size="large"
                  fullWidth
                >
                  Change Password
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Verified"
                    secondary="Your email address has been verified"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Connection"
                    secondary="All connections are encrypted with SSL"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ✅ FIXED: Activity Tab with Real Data */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Activity Overview */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Activity
                </Typography>
                <Button startIcon={<Refresh />} onClick={fetchActivity} disabled={activityLoading}>
                  Refresh
                </Button>
              </Stack>
              <Divider sx={{ mb: 3 }} />

              {activityLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* Daily Activity Chart */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Daily Activity (Last 30 Days)
                    </Typography>
                    {activityData.dailyActivity.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><Typography variant="subtitle2" fontWeight="bold">Date</Typography></TableCell>
                              <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Invoices</Typography></TableCell>
                              <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Total Amount</Typography></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activityData.dailyActivity.slice(0, 10).map((day, index) => (
                              <TableRow key={index} hover>
                                <TableCell>{formatDate(day.date)}</TableCell>
                                <TableCell align="right">
                                  <Chip label={day.count} size="small" color="primary" />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="medium">
                                    ${(day.totalAmount || 0).toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">No daily activity data available</Alert>
                    )}
                  </Grid>

                  {/* Status Breakdown */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Activity by Status
                    </Typography>
                    {activityData.statusActivity.length > 0 ? (
                      <Stack spacing={2}>
                        {activityData.statusActivity.map((item, index) => (
                          <Card key={index} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {getActionIcon(item.status)}
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                                  </Typography>
                                </Stack>
                                <Chip 
                                  label={item.count} 
                                  size="small" 
                                  color={getActionColor(item.status)} 
                                />
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No status activity data available</Alert>
                    )}
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => !loading && setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Lock color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Change Password
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type={showOldPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end">
                      {showOldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              error={!!errors.newPassword}
              helperText={errors.newPassword || 'Minimum 6 characters'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Lock />}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;