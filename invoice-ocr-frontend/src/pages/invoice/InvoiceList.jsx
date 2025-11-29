// src/pages/invoice/InvoiceList.jsx - PHASE 2: ENHANCED WITH FILTERS
// Advanced filtering, grid/table views, bulk operations, and working action menus

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Checkbox,
  Stack,
  Card,
  CardContent,
  CardActions,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  Divider,
  Badge,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  Slider,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Search,
  Visibility,
  Delete,
  FilterList,
  MoreVert,
  Edit,
  FileDownload,
  Refresh,
  ViewList,
  ViewModule,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Receipt,
  Warning,
  CloudUpload,
  GetApp,
  Close,
  TrendingUp,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import invoiceService from '../../services/invoiceService';
import { formatCurrency, formatDate } from '../../lib/utils';
import AdvancedSearch from '../../components/common/AdvancedSearch';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const statusFilter = searchParams.get('status');

  // State Management
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Advanced Filters State
  const [filters, setFilters] = useState({
    status: statusFilter || [],
    startDate: null,
    endDate: null,
    minAmount: 0,
    maxAmount: 100000,
    company: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch invoices when filters change
  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, searchQuery, filters]);

  // Fetch Invoices Function
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        includeUnprocessed: 'true',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      // Add filters
      if (filters.status && filters.status.length > 0) {
        params.status = Array.isArray(filters.status) ? filters.status.join(',') : filters.status;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString();
      }
      if (filters.minAmount > 0) {
        params.minAmount = filters.minAmount;
      }
      if (filters.maxAmount < 100000) {
        params.maxAmount = filters.maxAmount;
      }
      if (filters.company) {
        params.company = filters.company;
      }
      
      const response = await invoiceService.getInvoices(params);
      
      if (response && response.data) {
        const invoicesData = response.data.invoices || response.data;
        const paginationData = response.data.pagination || response.pagination;
        
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setTotalCount(paginationData?.total || invoicesData.length || 0);
      } else if (response && response.invoices) {
        setInvoices(response.invoices);
        setTotalCount(response.pagination?.total || response.invoices.length);
      } else if (Array.isArray(response)) {
        setInvoices(response);
        setTotalCount(response.length);
      } else {
        setInvoices([]);
        setTotalCount(0);
      }

    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
      setInvoices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      startDate: null,
      endDate: null,
      minAmount: 0,
      maxAmount: 100000,
      company: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchQuery('');
    setPage(0);
    searchParams.delete('status');
    setSearchParams(searchParams);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount > 0 || filters.maxAmount < 100000) count++;
    if (filters.company) count++;
    return count;
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Navigation
  const handleViewInvoice = (id) => {
    navigate(`/app/invoices/${id}`);
  };

  // Menu Handlers
  const handleMenuOpen = (event, invoice) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  // Delete Handlers
  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleting(true);
      await invoiceService.deleteInvoice(invoiceToDelete._id);
      enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err) {
      console.error('Delete error:', err);
      enqueueSnackbar('Failed to delete invoice', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Edit Handler
  const handleEdit = () => {
    if (selectedInvoice) {
      navigate(`/app/invoices/${selectedInvoice._id}/edit`);
      handleMenuClose();
    }
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (selectedInvoice) {
      try {
        await invoiceService.exportInvoicePDF(selectedInvoice._id);
        enqueueSnackbar('PDF downloaded successfully', { variant: 'success' });
      } catch (err) {
        enqueueSnackbar('Failed to download PDF', { variant: 'error' });
      }
      handleMenuClose();
    }
  };

  // Selection Handlers
  const handleSelectInvoice = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map((inv) => inv._id));
    }
  };

  // Export Handler
  const handleExport = async () => {
    try {
      if (selectedInvoices.length === 0) {
        enqueueSnackbar('Please select invoices to export', { variant: 'warning' });
        return;
      }
      await invoiceService.exportInvoicesExcel(selectedInvoices);
      enqueueSnackbar('Invoices exported successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to export invoices', { variant: 'error' });
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    try {
      if (selectedInvoices.length === 0) {
        enqueueSnackbar('Please select invoices to delete', { variant: 'warning' });
        return;
      }
      
      await Promise.all(selectedInvoices.map(id => invoiceService.deleteInvoice(id)));
      
      enqueueSnackbar('Invoices deleted successfully', { variant: 'success' });
      setSelectedInvoices([]);
      fetchInvoices();
    } catch (err) {
      enqueueSnackbar('Failed to delete invoices', { variant: 'error' });
    }
  };

  // Status Helpers
  const getStatusColor = (status) => {
    const colors = {
      uploaded: 'default',
      pending: 'warning',
      processing: 'info',
      processed: 'success',
      validated: 'success',
      failed: 'error',
      exported: 'primary',
      requires_review: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      processed: <CheckCircle fontSize="small" />,
      validated: <CheckCircle fontSize="small" />,
      failed: <ErrorIcon fontSize="small" />,
      pending: <HourglassEmpty fontSize="small" />,
      processing: <HourglassEmpty fontSize="small" />,
      requires_review: <Warning fontSize="small" />,
    };
    return icons[status] || <Receipt fontSize="small" />;
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <TableCell key={i}>
                <Skeleton variant="text" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[1, 2, 3, 4, 5].map((row) => (
            <TableRow key={row}>
              {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                <TableCell key={cell}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Empty State
  const EmptyState = () => (
    <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
      <Receipt sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        No invoices found
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {getActiveFilterCount() > 0 || searchQuery
          ? 'Try adjusting your filters or search criteria'
          : 'Get started by uploading your first invoice'}
      </Typography>
      {(getActiveFilterCount() > 0 || searchQuery) && (
        <Button variant="outlined" onClick={handleClearFilters} sx={{ mt: 2, mr: 2 }}>
          Clear Filters
        </Button>
      )}
      <Button
        variant="contained"
        size="large"
        startIcon={<CloudUpload />}
        onClick={() => navigate('/app/invoices/upload')}
        sx={{ mt: 2 }}
      >
        Upload Invoice
      </Button>
    </Paper>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Invoices
              {getActiveFilterCount() > 0 && (
                <Chip 
                  label={`${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active`}
                  color="primary"
                  size="small"
                  onDelete={handleClearFilters}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track all your invoices • {totalCount} total
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh list">
              <span>
                <IconButton 
                  onClick={fetchInvoices} 
                  disabled={loading} 
                  color="primary" 
                  sx={{ border: 1, borderColor: 'divider' }}
                >
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/invoices/upload')} size="large">
              Upload Invoice
            </Button>
          </Stack>
        </Box>

        {/* Advanced Search */}
        <Box sx={{ mb: 3 }}>
          <AdvancedSearch
            onSearch={(query) => {
              setSearchQuery(query);
              setPage(0);
            }}
            onSelect={(id) => navigate(`/app/invoices/${id}`)}
          />
        </Box>

        {/* Filters Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <ToggleButtonGroup value={viewMode} exclusive onChange={(e, newMode) => newMode && setViewMode(newMode)} size="small">
                <ToggleButton value="table">
                  <Tooltip title="Table View"><ViewList /></Tooltip>
                </ToggleButton>
                <ToggleButton value="grid">
                  <Tooltip title="Grid View"><ViewModule /></Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              <Badge badgeContent={getActiveFilterCount()} color="primary">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setFilterDrawerOpen(true)}
                >
                  Filters
                </Button>
              </Badge>
            </Stack>
          </Stack>
        </Paper>

        {/* Bulk Actions Bar */}
        {selectedInvoices.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Typography variant="body1" fontWeight="medium">
                {selectedInvoices.length} invoice(s) selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleExport}
                  sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                >
                  Export
                </Button>
                <Button size="small" variant="contained" startIcon={<Delete />} onClick={handleBulkDelete} color="error">
                  Delete
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedInvoices([])}
                  sx={{ borderColor: 'white', color: 'white' }}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : invoices.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'table' ? (
          <>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                        indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Invoice #</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Company</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Date</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Amount</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Created</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice._id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => handleViewInvoice(invoice._id)}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice._id)}
                          onChange={() => handleSelectInvoice(invoice._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="primary">
                          {invoice.invoiceNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{invoice.companyName || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(invoice.invoiceDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(invoice.status)}
                          label={invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('_', ' ') : 'Unknown'}
                          size="small"
                          color={getStatusColor(invoice.status)}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invoice.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, invoice)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Paper elevation={0} sx={{ mt: 2, border: 1, borderColor: 'divider' }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </>
        ) : (
          <>
            <Grid container spacing={3}>
              {invoices.map((invoice) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={invoice._id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: 1,
                      borderColor: 'divider',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: 'primary.main' },
                    }}
                    onClick={() => handleViewInvoice(invoice._id)}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Receipt sx={{ color: 'primary.main', fontSize: 28 }} />
                        </Box>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectInvoice(invoice._id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom noWrap fontWeight="bold">
                        {invoice.invoiceNumber || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                        {invoice.companyName || 'N/A'}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(invoice.status)}
                        label={invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('_', ' ') : 'Unknown'}
                        size="small"
                        color={getStatusColor(invoice.status)}
                        sx={{ mt: 1, fontWeight: 500 }}
                      />
                    </CardContent>
                    <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(invoice.invoiceDate)}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, invoice); }}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Paper elevation={0} sx={{ mt: 3, border: 1, borderColor: 'divider' }}>
              <TablePagination
                rowsPerPageOptions={[8, 12, 24, 48]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </>
        )}

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ elevation: 3, sx: { minWidth: 200 } }}>
          <MenuItem onClick={() => { handleViewInvoice(selectedInvoice?._id); handleMenuClose(); }}>
            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDownloadPDF}>
            <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
            <ListItemText>Export PDF</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleDeleteClick(selectedInvoice)} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Filter Drawer */}
        <Drawer anchor="right" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
          <Box sx={{ width: 350, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Filters</Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)}><Close /></IconButton>
            </Box>

            <Stack spacing={3}>
              {/* Status Filter */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="validated">Validated</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="requires_review">Requires Review</MenuItem>
                </Select>
              </FormControl>

              {/* Date Range */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
                <Stack spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Stack>
              </Box>

              {/* Amount Range */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Amount Range: {formatCurrency(filters.minAmount)} - {formatCurrency(filters.maxAmount)}
                </Typography>
                <Slider
                  value={[filters.minAmount, filters.maxAmount]}
                  onChange={(e, newValue) => {
                    handleFilterChange('minAmount', newValue[0]);
                    handleFilterChange('maxAmount', newValue[1]);
                  }}
                  min={0}
                  max={100000}
                  step={1000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => formatCurrency(value)}
                />
              </Box>

              {/* Sort Options */}
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={filters.sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                  <MenuItem value="createdAt">Created Date</MenuItem>
                  <MenuItem value="invoiceDate">Invoice Date</MenuItem>
                  <MenuItem value="totalAmount">Amount</MenuItem>
                  <MenuItem value="companyName">Company</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select value={filters.sortOrder} label="Sort Order" onChange={(e) => handleFilterChange('sortOrder', e.target.value)}>
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>

              <Divider />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" fullWidth onClick={handleClearFilters}>Clear All</Button>
                <Button variant="contained" fullWidth onClick={() => setFilterDrawerOpen(false)}>Apply</Button>
              </Stack>
            </Stack>
          </Box>
        </Drawer>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography variant="h6" fontWeight="bold">Delete Invoice?</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
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
    </LocalizationProvider>
  );
};

export default InvoiceList;