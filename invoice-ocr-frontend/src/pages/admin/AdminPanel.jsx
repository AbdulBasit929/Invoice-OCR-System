// src/pages/admin/AdminPanel.jsx - PROFESSIONAL ADMIN PANEL

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  MoreVert,
  PersonAdd,
  Edit,
  Delete,
  Block,
  CheckCircle,
  AdminPanelSettings,
  People,
  Description,
  Settings,
  Visibility,
  Refresh,
  Shield,
  Warning,
  Download,
  Clear,
  Assessment,
  Storage,
  Speed,
  Memory,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import adminService from '../../services/adminService';
import { formatDateTime, getInitials } from '../../lib/utils';

const AdminPanel = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 0) {
      fetchUsers();
    } else if (activeTab === 1) {
      fetchLogs();
    } else if (activeTab === 2) {
      fetchSystemStats();
    }
  }, [activeTab, page, rowsPerPage, searchQuery]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await adminService.getAllUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });

      const usersData = response.data?.users || response.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotalUsers(response.pagination?.total || response.total || usersData.length);

    } catch (err) {
      console.error('Fetch users error:', err);
      enqueueSnackbar('Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch system logs
  const fetchLogs = async () => {
    try {
      setLoading(true);

      const response = await adminService.getSystemLogs({
        page: page + 1,
        limit: rowsPerPage,
      });

      const logsData = response.data?.logs || response.logs || response.data || [];
      setLogs(Array.isArray(logsData) ? logsData : []);

    } catch (err) {
      console.error('Fetch logs error:', err);
      enqueueSnackbar('Failed to load system logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch system statistics
  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      const response = await adminService.getSystemStats();
      setSystemStats(response.data || response);

    } catch (err) {
      console.error('Fetch stats error:', err);
      enqueueSnackbar('Failed to load system stats', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Menu handlers
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // User actions
  const handleToggleUserStatus = async (user) => {
    try {
      const action = user.isActive ? 'deactivate' : 'activate';
      await adminService.toggleUserStatus(user._id, !user.isActive);
      
      enqueueSnackbar(`User ${action}d successfully`, { variant: 'success' });
      fetchUsers();
      handleMenuClose();
    } catch (err) {
      enqueueSnackbar(`Failed to ${user.isActive ? 'deactivate' : 'activate'} user`, { variant: 'error' });
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await adminService.deleteUser(userToDelete._id);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    try {
      await adminService.clearCache();
      enqueueSnackbar('Cache cleared successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to clear cache', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
              <AdminPanelSettings />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Admin Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage users, monitor system, and configure settings
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            if (activeTab === 0) fetchUsers();
            else if (activeTab === 1) fetchLogs();
            else fetchSystemStats();
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* System Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {totalUsers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.lighter' }}>
                  <People sx={{ color: 'primary.main' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    System Status
                  </Typography>
                  <Chip label="Operational" color="success" size="small" sx={{ mt: 1, fontWeight: 'bold' }} />
                </Box>
                <Avatar sx={{ bgcolor: 'success.lighter' }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Sessions
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    23
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.lighter' }}>
                  <Assessment sx={{ color: 'info.main' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    System Health
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    98%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.lighter' }}>
                  <Speed sx={{ color: 'success.main' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<People />} label="User Management" iconPosition="start" />
          <Tab icon={<Description />} label="System Logs" iconPosition="start" />
          <Tab icon={<Settings />} label="System Settings" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          {/* Search Bar */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={handleSearch}
                size="small"
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="contained" startIcon={<PersonAdd />}>
                Add User
              </Button>
            </Stack>
          </Box>

          {/* Users Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <People sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No users found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">User</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">Email</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">Role</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">Created</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight="bold">Last Login</Typography></TableCell>
                      <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getInitials(user.name)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="600">
                              {user.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.role === 'admin' ? <Shield /> : <People />}
                            label={user.role === 'admin' ? 'Admin' : 'User'}
                            size="small"
                            color={user.role === 'admin' ? 'error' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.isActive ? <CheckCircle /> : <Block />}
                            label={user.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(user.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            System Logs
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Description sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No logs available
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {logs.map((log, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="600">
                        {log.action || 'Action'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.description || 'No description'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(log.createdAt)}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Cache Management */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'warning.lighter' }}>
                  <Memory sx={{ color: 'warning.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Cache Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage system cache and memory
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cache Size
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    2.4 GB
                  </Typography>
                </Box>

                <Divider />

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Delete />}
                  onClick={handleClearCache}
                  fullWidth
                >
                  Clear Cache
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Database Management */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'info.lighter' }}>
                  <Storage sx={{ color: 'info.main' }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Database
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Database status and management
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Connection Status</Typography>
                  <Chip label="Connected" size="small" color="success" />
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Total Documents</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    12,456
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Database Size</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    8.7 GB
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* System Settings */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                System Configuration
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable user registration"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Email notifications"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Automatic backups"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Maintenance mode"
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleToggleUserStatus(selectedUser)}>
          <ListItemIcon>
            {selectedUser?.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{selectedUser?.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedUser && handleDeleteClick(selectedUser)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Warning color="error" />
            <Typography variant="h6" fontWeight="bold">
              Delete User?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;