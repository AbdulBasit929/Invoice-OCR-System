// src/pages/invoice/InvoiceDetail.jsx - FINAL PROFESSIONAL VERSION

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Tooltip,
  LinearProgress,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Delete,
  FileDownload,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  NavigateNext,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  getInvoice,
  deleteInvoice,
  updateInvoice,
  exportInvoicePDF,
  retryInvoice,
} from '../../services/invoiceService';
import { formatCurrency, formatDate, formatDateTime, formatFileSize, getErrorMessage } from '../../lib/utils';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: details, 1: raw-text, 2: history

  // Fetch invoice on mount
  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getInvoice(id);
      const invoiceData = response.data || response;

      console.log('📦 Invoice data:', invoiceData);

      setInvoice(invoiceData);
      setEditForm({
        invoiceNumber: invoiceData.invoiceNumber || '',
        invoiceDate: invoiceData.invoiceDate ? invoiceData.invoiceDate.split('T')[0] : '',
        companyName: invoiceData.companyName || '',
        totalAmount: invoiceData.totalAmount || '',
        currency: invoiceData.currency || 'USD',
        notes: invoiceData.notes || '',
      });
    } catch (err) {
      console.error('❌ Fetch invoice error:', err);
      setError(getErrorMessage(err));
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteInvoice(id);
      enqueueSnackbar('Invoice deleted successfully!', { variant: 'success' });
      navigate('/app/invoices');
    } catch (err) {
      console.error('Delete error:', err);
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Export PDF handler
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await exportInvoicePDF(id);
      enqueueSnackbar('PDF exported successfully!', { variant: 'success' });
    } catch (err) {
      console.error('Export error:', err);
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Retry processing handler
  const handleRetry = async () => {
    try {
      setRetrying(true);
      await retryInvoice(id);
      enqueueSnackbar('Processing retry started!', { variant: 'success' });
      setTimeout(() => {
        fetchInvoice();
      }, 2000);
    } catch (err) {
      console.error('Retry error:', err);
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setRetrying(false);
    }
  };

  // Edit mode toggle
  const handleEditToggle = () => {
    if (editing) {
      setEditForm({
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '',
        companyName: invoice.companyName || '',
        totalAmount: invoice.totalAmount || '',
        currency: invoice.currency || 'USD',
        notes: invoice.notes || '',
      });
    }
    setEditing(!editing);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateInvoice(id, editForm);
      const updatedData = response.data || response;
      setInvoice(updatedData);
      setEditing(false);
      enqueueSnackbar('Invoice updated successfully!', { variant: 'success' });
    } catch (err) {
      console.error('Update error:', err);
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      processed: { color: 'success', icon: <CheckCircle />, label: 'Processed' },
      validated: { color: 'success', icon: <CheckCircle />, label: 'Validated' },
      pending: { color: 'warning', icon: <Warning />, label: 'Pending' },
      processing: { color: 'info', icon: <Info />, label: 'Processing' },
      failed: { color: 'error', icon: <ErrorIcon />, label: 'Failed' },
      requires_review: { color: 'warning', icon: <Warning />, label: 'Requires Review' },
    };
    return configs[status] || { color: 'default', icon: <Info />, label: status };
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading invoice...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Error Loading Invoice
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button variant="contained" onClick={() => navigate('/app/invoices')} startIcon={<ArrowBack />}>
              Back to Invoices
            </Button>
            <Button variant="outlined" onClick={fetchInvoice} startIcon={<Refresh />}>
              Retry
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // No invoice found
  if (!invoice) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Invoice Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The invoice you're looking for doesn't exist or has been deleted.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/app/invoices')} startIcon={<ArrowBack />}>
            Back to Invoices
          </Button>
        </Paper>
      </Container>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <MuiLink
          underline="hover"
          color="inherit"
          href="/invoices"
          onClick={(e) => {
            e.preventDefault();
            navigate('/app/invoices');
          }}
          sx={{ cursor: 'pointer' }}
        >
          Invoices
        </MuiLink>
        <Typography color="text.primary" fontWeight="medium">
          {invoice.invoiceNumber || 'Invoice Detail'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {invoice.invoiceNumber || 'N/A'}
              </Typography>
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                color={statusConfig.color}
                size="medium"
              />
              {invoice.isDuplicate && (
                <Chip icon={<Warning />} label="Duplicate" color="warning" size="small" />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Created {formatDateTime(invoice.createdAt)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Back to list">
              <IconButton onClick={() => navigate('/app/invoices')} sx={{ border: 1, borderColor: 'divider' }}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchInvoice} sx={{ border: 1, borderColor: 'divider' }}>
                <Refresh />
              </IconButton>
            </Tooltip>
            {invoice.status === 'failed' && (
              <Button
                variant="outlined"
                startIcon={retrying ? <CircularProgress size={16} /> : <Refresh />}
                onClick={handleRetry}
                disabled={retrying}
              >
                Retry
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <FileDownload />}
              onClick={handleExportPDF}
              disabled={exporting}
            >
              Export PDF
            </Button>
            {!editing ? (
              <Button variant="contained" startIcon={<Edit />} onClick={handleEditToggle}>
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save
                </Button>
                <Button variant="outlined" startIcon={<Cancel />} onClick={handleEditToggle} disabled={saving}>
                  Cancel
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Invoice Details" />
          <Tab label="Raw Text" />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Main Details */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Invoice Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice Number
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      name="invoiceNumber"
                      value={editForm.invoiceNumber}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.invoiceNumber || 'N/A'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice Date
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      type="date"
                      name="invoiceDate"
                      value={editForm.invoiceDate}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(invoice.invoiceDate)}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Company Name
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      name="companyName"
                      value={editForm.companyName}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.companyName || 'N/A'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  {editing ? (
                    <Stack direction="row" spacing={1}>
                      <TextField
                        fullWidth
                        type="number"
                        name="totalAmount"
                        value={editForm.totalAmount}
                        onChange={handleInputChange}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                      <TextField
                        name="currency"
                        value={editForm.currency}
                        onChange={handleInputChange}
                        size="small"
                        sx={{ mt: 0.5, width: 100 }}
                      />
                    </Stack>
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </Typography>
                  )}
                </Grid>

                {invoice.taxAmount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Tax Amount
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(invoice.taxAmount, invoice.currency)}
                    </Typography>
                  </Grid>
                )}

                {invoice.subtotal && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </Typography>
                  </Grid>
                )}

                {invoice.dueDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </Grid>
                )}

                {invoice.poNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      PO Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.poNumber}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="notes"
                      value={editForm.notes}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1">
                      {invoice.notes || 'No notes'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, mt: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Line Items
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="right"><strong>Quantity</strong></TableCell>
                        <TableCell align="right"><strong>Unit Price</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description || 'N/A'}</TableCell>
                          <TableCell align="right">{item.quantity || 'N/A'}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unitPrice, invoice.currency)}
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(item.amount, invoice.currency)}</strong>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* File Information */}
            <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  File Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Original Filename
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {invoice.originalFilename || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      File Size
                    </Typography>
                    <Typography variant="body2">
                      {formatFileSize(invoice.fileSize)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      File Type
                    </Typography>
                    <Typography variant="body2">{invoice.fileType || 'N/A'}</Typography>
                  </Box>
                  {invoice.processingTime && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Processing Time
                      </Typography>
                      <Typography variant="body2">{invoice.processingTime}ms</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {invoice.validation && (
              <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Validation Results
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {invoice.validation.qualityScore !== undefined && (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Quality Score
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {invoice.validation.qualityScore}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={invoice.validation.qualityScore}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    )}
                    {invoice.validation.grade && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Grade
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.validation.grade}
                        </Typography>
                      </Box>
                    )}
                    {invoice.validation.isUsable !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Usable
                        </Typography>
                        <Chip
                          label={invoice.validation.isUsable ? 'Yes' : 'No'}
                          color={invoice.validation.isUsable ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Duplicate Warning */}
            {invoice.isDuplicate && (
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Duplicate Detected
                </Typography>
                <Typography variant="body2">
                  {invoice.duplicateReason || 'This invoice appears to be a duplicate.'}
                </Typography>
              </Alert>
            )}
          </Grid>
        </Grid>
      )}

      {/* Raw Text Tab */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Extracted Text
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 3,
              borderRadius: 1,
              maxHeight: 600,
              overflow: 'auto',
            }}
          >
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {invoice.completeText || invoice.rawText || 'No text extracted'}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* History Tab */}
      {activeTab === 2 && (
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Info sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            History tracking coming soon...
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              Delete Invoice?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
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

export default InvoiceDetail;