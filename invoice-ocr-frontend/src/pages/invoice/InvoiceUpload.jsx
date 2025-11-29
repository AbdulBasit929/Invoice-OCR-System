// src/pages/invoice/InvoiceUpload.jsx - MODERN DRAG & DROP UPLOAD
// Phase 1: Complete Implementation with Preview and Progress

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Close,
  InsertDriveFile,
  Image as ImageIcon,
  PictureAsPdf,
  Refresh,
  Delete,
  Visibility,
  Description,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Confetti from 'react-confetti';
import { uploadInvoice, getInvoiceStatus } from '../../services/invoiceService';

const InvoiceUpload = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // State management
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Upload options
  const [uploadOptions, setUploadOptions] = useState({
    asyncProcessing: true,
    useCache: true,
    useValidation: true,
    autoCorrect: false,
    priority: 'normal',
  });

  // File validation
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 25MB limit.' };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: 'pending',
          progress: 0,
          error: null,
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFileSelect(event.target.files);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  // Remove file from list
  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // Upload single file
  const uploadSingleFile = async (fileData) => {
    try {
      // Update file status
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === fileData.id ? { ...f, status: 'uploading', progress: 10 } : f))
      );

      // Create form data
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('asyncProcessing', uploadOptions.asyncProcessing.toString());
      formData.append('priority', uploadOptions.priority);
      formData.append('useCache', uploadOptions.useCache.toString());
      formData.append('useValidation', uploadOptions.useValidation.toString());
      formData.append('autoCorrect', uploadOptions.autoCorrect.toString());

      // Upload
      const response = await uploadInvoice(formData);

      // Extract invoice ID
      let invoiceId = null;
      if (response?.data?._id) {
        invoiceId = response.data._id;
      } else if (response?._id) {
        invoiceId = response._id;
      }

      if (!invoiceId) {
        throw new Error('No invoice ID in response');
      }

      // Update to processing
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === fileData.id ? { ...f, status: 'processing', progress: 50, invoiceId } : f))
      );

      // Poll for status if async
      if (uploadOptions.asyncProcessing) {
        await pollInvoiceStatus(fileData.id, invoiceId);
      } else {
        // Immediate success for sync
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, status: 'success', progress: 100 } : f))
        );
      }

      return { success: true, invoiceId };
    } catch (error) {
      console.error('Upload error:', error);
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: 'error', progress: 0, error: error.message || 'Upload failed' }
            : f
        )
      );
      return { success: false, error: error.message };
    }
  };

  // Poll invoice status
  const pollInvoiceStatus = async (fileId, invoiceId, maxAttempts = 60) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await getInvoiceStatus(invoiceId);
        const status = statusResponse?.data?.status || statusResponse?.status;
        const progress = statusResponse?.data?.progress || statusResponse?.progress || 50;

        // Update progress
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: Math.min(progress, 95) } : f))
        );

        // Check if completed
        if (['processed', 'validated', 'approved'].includes(status)) {
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: 'success', progress: 100 } : f))
          );
          return true;
        }

        if (['failed', 'rejected'].includes(status)) {
          throw new Error('Processing failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'error', progress: 0, error: 'Processing failed' }
              : f
          )
        );
        return false;
      }
    }

    // Timeout
    setSelectedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: 'error', progress: 0, error: 'Processing timeout' }
          : f
      )
    );
    return false;
  };

  // Upload all files
  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select files to upload', { variant: 'warning' });
      return;
    }

    setUploading(true);
    setProcessing(true);

    const results = [];
    for (const file of selectedFiles) {
      if (file.status === 'pending') {
        const result = await uploadSingleFile(file);
        results.push(result);
      }
    }

    setUploading(false);
    setProcessing(false);

    // Check results
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      enqueueSnackbar(`${successCount} invoice(s) uploaded successfully`, { variant: 'success' });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    if (failCount > 0) {
      enqueueSnackbar(`${failCount} invoice(s) failed to upload`, { variant: 'error' });
    }

    setUploadResults(results);
  };

  // Clear all files
  const handleClearAll = () => {
    selectedFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setUploadResults([]);
  };

  // View uploaded invoice
  const handleViewInvoice = (invoiceId) => {
    navigate(`/app/invoices/${invoiceId}`);
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type === 'application/pdf') {
      return <PictureAsPdf sx={{ color: '#EF4444', fontSize: 40 }} />;
    }
    if (type.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#3B82F6', fontSize: 40 }} />;
    }
    return <InsertDriveFile sx={{ color: '#6B7280', fontSize: 40 }} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Upload Invoices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload your invoice files and let our AI extract the data automatically
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} lg={8}>
          {/* Drag & Drop Zone */}
          <Paper
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              p: 6,
              mb: 3,
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              bgcolor: dragActive ? alpha('#3B82F6', 0.05) : 'background.paper',
              borderRadius: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha('#3B82F6', 0.02),
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & drop files here
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Supported formats: JPG, PNG, WEBP, PDF • Max size: 25MB
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </Paper>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleClearAll}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </Box>

                <List>
                  {selectedFiles.map((file, index) => (
                    <React.Fragment key={file.id}>
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'background.default',
                        }}
                      >
                        <ListItemIcon>
                          {file.preview ? (
                            <Box
                              component="img"
                              src={file.preview}
                              alt={file.name}
                              sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            getFileIcon(file.type)
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {file.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(file.size)}
                              </Typography>
                              {file.status !== 'pending' && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={file.progress}
                                    color={getStatusColor(file.status)}
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {file.status === 'uploading' && 'Uploading...'}
                                    {file.status === 'processing' && 'Processing...'}
                                    {file.status === 'success' && 'Completed'}
                                    {file.status === 'error' && file.error}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            {file.status === 'success' && file.invoiceId && (
                              <Tooltip title="View invoice">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewInvoice(file.invoiceId)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                            {file.status === 'success' && <CheckCircle color="success" />}
                            {file.status === 'error' && <ErrorIcon color="error" />}
                            {file.status === 'pending' && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(file.id)}
                                disabled={uploading}
                              >
                                <Close />
                              </IconButton>
                            )}
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < selectedFiles.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={handleClearAll} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUploadAll}
                    disabled={uploading || selectedFiles.every((f) => f.status !== 'pending')}
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                    sx={{
                      px: 4,
                      background: 'linear-gradient(45deg, #3B82F6 30%, #8B5CF6 90%)',
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Upload All'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Options Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Upload Options
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={uploadOptions.asyncProcessing}
                      onChange={(e) =>
                        setUploadOptions({ ...uploadOptions, asyncProcessing: e.target.checked })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Async Processing
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Process in background for faster uploads
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={uploadOptions.useCache}
                      onChange={(e) =>
                        setUploadOptions({ ...uploadOptions, useCache: e.target.checked })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Use Cache
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Speed up processing for duplicate invoices
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={uploadOptions.useValidation}
                      onChange={(e) =>
                        setUploadOptions({ ...uploadOptions, useValidation: e.target.checked })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Validation
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Validate extracted data automatically
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={uploadOptions.autoCorrect}
                      onChange={(e) =>
                        setUploadOptions({ ...uploadOptions, autoCorrect: e.target.checked })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Auto-Correct
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically fix common errors
                      </Typography>
                    </Box>
                  }
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Tips for best results:
                </Typography>
                <Typography variant="caption" component="div">
                  • Use clear, high-quality scans
                </Typography>
                <Typography variant="caption" component="div">
                  • Ensure good lighting for photos
                </Typography>
                <Typography variant="caption" component="div">
                  • Avoid blurry or rotated images
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvoiceUpload;