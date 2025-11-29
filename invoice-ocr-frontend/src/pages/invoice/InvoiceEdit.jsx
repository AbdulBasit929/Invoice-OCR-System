// src/pages/invoice/InvoiceEdit.jsx - INVOICE EDIT PAGE
// Comprehensive invoice editing with form validation and auto-save

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Cancel,
  Edit,
  Delete,
  Add,
  NavigateNext,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getInvoice, updateInvoice } from '../../services/invoiceService';
import { formatCurrency, formatDate, getErrorMessage } from '../../lib/utils';

const InvoiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: null,
    dueDate: null,
    companyName: '',
    companyAddress: '',
    customerName: '',
    customerAddress: '',
    totalAmount: '',
    subtotal: '',
    taxAmount: '',
    taxRate: '',
    currency: 'USD',
    poNumber: '',
    notes: '',
    paymentTerms: '',
    status: 'pending',
  });

  // Line items
  const [lineItems, setLineItems] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({});

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

      console.log('📦 Fetched invoice for edit:', invoiceData);

      setInvoice(invoiceData);

      // Populate form
      setFormData({
        invoiceNumber: invoiceData.invoiceNumber || '',
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : null,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
        companyName: invoiceData.companyName || '',
        companyAddress: invoiceData.companyAddress || '',
        customerName: invoiceData.customerName || '',
        customerAddress: invoiceData.customerAddress || '',
        totalAmount: invoiceData.totalAmount || '',
        subtotal: invoiceData.subtotal || '',
        taxAmount: invoiceData.taxAmount || '',
        taxRate: invoiceData.taxRate || '',
        currency: invoiceData.currency || 'USD',
        poNumber: invoiceData.poNumber || '',
        notes: invoiceData.notes || '',
        paymentTerms: invoiceData.paymentTerms || '',
        status: invoiceData.status || 'pending',
      });

      // Populate line items
      if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
        setLineItems(invoiceData.lineItems);
      }
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setError(getErrorMessage(err));
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Auto-calculate totals if amounts change
    if (name === 'subtotal' || name === 'taxAmount') {
      calculateTotals({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle date change
  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
    setHasChanges(true);
  };

  // Calculate totals
  const calculateTotals = (data = formData) => {
    const subtotal = parseFloat(data.subtotal) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    const total = subtotal + taxAmount;

    setFormData((prev) => ({
      ...prev,
      totalAmount: total.toFixed(2),
    }));
  };

  // Line item handlers
  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][field] = value;

    // Calculate amount if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
      updatedItems[index].amount = (quantity * unitPrice).toFixed(2);
    }

    setLineItems(updatedItems);
    setHasChanges(true);

    // Recalculate subtotal
    recalculateSubtotal(updatedItems);
  };

  const recalculateSubtotal = (items = lineItems) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
    }));

    calculateTotals({
      ...formData,
      subtotal: subtotal.toFixed(2),
    });
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
    setHasChanges(true);
  };

  const handleRemoveLineItem = (index) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
    setHasChanges(true);
    recalculateSubtotal(updatedItems);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoiceNumber) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }
    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    // Validate
    if (!validateForm()) {
      enqueueSnackbar('Please fix validation errors', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      // Prepare data
      const updateData = {
        ...formData,
        invoiceDate: formData.invoiceDate ? formData.invoiceDate.toISOString() : null,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
        lineItems: lineItems,
      };

      console.log('💾 Saving invoice:', updateData);

      const response = await updateInvoice(id, updateData);
      const updatedInvoice = response.data || response;

      console.log('✅ Invoice updated:', updatedInvoice);

      enqueueSnackbar('Invoice updated successfully!', { variant: 'success' });
      setHasChanges(false);

      // Navigate back to detail page after short delay
      setTimeout(() => {
        navigate(`/app/invoices/${id}`);
      }, 1000);
    } catch (err) {
      console.error('❌ Error saving invoice:', err);
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/app/invoices/${id}`);
      }
    } else {
      navigate(`/app/invoices/${id}`);
    }
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
          <Warning sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
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
            <Button variant="outlined" onClick={fetchInvoice}>
              Retry
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          <MuiLink
            underline="hover"
            color="inherit"
            href={`/invoices/${id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/app/invoices/${id}`);
            }}
            sx={{ cursor: 'pointer' }}
          >
            {invoice?.invoiceNumber || 'Invoice Detail'}
          </MuiLink>
          <Typography color="text.primary" fontWeight="medium">
            Edit
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Edit Invoice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice?.invoiceNumber || 'N/A'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Box>
          {hasChanges && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<Warning />}>
              You have unsaved changes
            </Alert>
          )}
        </Paper>

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} lg={8}>
            {/* Basic Information */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    error={!!errors.invoiceNumber}
                    helperText={errors.invoiceNumber}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="processed">Processed</MenuItem>
                      <MenuItem value="validated">Validated</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Invoice Date"
                    value={formData.invoiceDate}
                    onChange={(date) => handleDateChange('invoiceDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.invoiceDate,
                        helperText: errors.invoiceDate,
                        required: true,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(date) => handleDateChange('dueDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PO Number"
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    placeholder="e.g., Net 30"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Company Information */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Company Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    error={!!errors.companyName}
                    helperText={errors.companyName}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Company Address"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Customer Address"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Line Items */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Line Items
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddLineItem} variant="outlined">
                  Add Item
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {lineItems.length === 0 ? (
                <Alert severity="info">No line items. Click "Add Item" to add items.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="right" width={100}><strong>Qty</strong></TableCell>
                        <TableCell align="right" width={120}><strong>Unit Price</strong></TableCell>
                        <TableCell align="right" width={120}><strong>Amount</strong></TableCell>
                        <TableCell align="center" width={80}><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${parseFloat(item.amount || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(index)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            {/* Notes */}
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Additional Notes
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes or comments..."
              />
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Amount Summary */}
            <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Amount Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Subtotal"
                    name="subtotal"
                    type="number"
                    value={formData.subtotal}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Tax Amount"
                    name="taxAmount"
                    type="number"
                    value={formData.taxAmount}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    name="taxRate"
                    type="number"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="currency"
                      value={formData.currency}
                      label="Currency"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                      <MenuItem value="PKR">PKR - Pakistani Rupee</MenuItem>
                      <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                      <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                      <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {formatCurrency(formData.totalAmount, formData.currency)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(`/app/invoices/${id}`)}
                    startIcon={<ArrowBack />}
                  >
                    View Details
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default InvoiceEdit;