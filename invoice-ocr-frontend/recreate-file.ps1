# recreate-file.ps1 - Recreate invoiceService.js from scratch

Write-Host "🔥 RECREATING invoiceService.js FROM SCRATCH..." -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "D:\invoice-ocr-system\invoice-ocr-frontend"

# Step 1: Delete old file
Write-Host "Step 1: Deleting old file..." -ForegroundColor Yellow
if (Test-Path "src\services\invoiceService.js") {
    Remove-Item "src\services\invoiceService.js" -Force
    Write-Host "  ✅ Old file deleted" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  File doesn't exist" -ForegroundColor Gray
}

# Step 2: Create new file with correct content
Write-Host ""
Write-Host "Step 2: Creating new file..." -ForegroundColor Yellow

$content = @'
// src/services/invoiceService.js - Enhanced Invoice Service (Vite Compatible)

import api from './api';

/**
 * Upload and process invoice
 * @param {FormData} formData - Form data with file and options
 * @returns {Promise} Response with invoice data
 */
export const uploadInvoice = async (formData) => {
  const response = await api.post('/invoices/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Batch upload multiple invoices
 * @param {FormData} formData - Form data with multiple files
 * @returns {Promise} Response with batch results
 */
export const batchUploadInvoices = async (formData) => {
  const response = await api.post('/invoices/batch-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get invoice processing status
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Status data with progress
 */
export const getInvoiceStatus = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}/status`);
  return response.data;
};

/**
 * Stream processing events (Server-Sent Events)
 * @param {string} invoiceId - Invoice ID
 * @param {Function} onMessage - Callback for messages
 * @param {Function} onError - Callback for errors
 * @returns {EventSource} EventSource instance
 */
export const streamInvoiceEvents = (invoiceId, onMessage, onError) => {
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const eventSource = new EventSource(`${apiUrl}/invoices/${invoiceId}/events?token=${token}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
    if (onError) onError(error);
  };

  return eventSource;
};

/**
 * Retry failed invoice processing
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Retry response
 */
export const retryInvoice = async (invoiceId) => {
  const response = await api.post(`/invoices/${invoiceId}/retry`);
  return response.data;
};

/**
 * Get all invoices with filters
 * @param {Object} params - Query parameters
 * @returns {Promise} Invoices list with pagination
 */
export const getInvoices = async (params = {}) => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

/**
 * Get single invoice details
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Invoice data
 */
export const getInvoice = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}`);
  return response.data;
};

/**
 * Update invoice data
 * @param {string} invoiceId - Invoice ID
 * @param {Object} data - Updated fields
 * @returns {Promise} Updated invoice
 */
export const updateInvoice = async (invoiceId, data) => {
  const response = await api.put(`/invoices/${invoiceId}`, data);
  return response.data;
};

/**
 * Delete invoice (soft delete)
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Delete confirmation
 */
export const deleteInvoice = async (invoiceId) => {
  const response = await api.delete(`/invoices/${invoiceId}`);
  return response.data;
};

/**
 * Export invoice to PDF
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} PDF file
 */
export const exportInvoicePDF = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}/export/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice_${invoiceId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  return response.data;
};

/**
 * Export multiple invoices to Excel
 * @param {Array} invoiceIds - Array of invoice IDs
 * @returns {Promise} Excel file
 */
export const exportInvoicesExcel = async (invoiceIds) => {
  const response = await api.post('/invoices/export/excel', { invoiceIds }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoices_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  return response.data;
};

/**
 * Get invoice history (corrections, exports, activities)
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} History data
 */
export const getInvoiceHistory = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}/history`);
  return response.data;
};

/**
 * Approve invoice (admin only)
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Approval confirmation
 */
export const approveInvoice = async (invoiceId) => {
  const response = await api.post(`/invoices/${invoiceId}/approve`);
  return response.data;
};

/**
 * Reject invoice (admin only)
 * @param {string} invoiceId - Invoice ID
 * @param {string} reason - Rejection reason
 * @returns {Promise} Rejection confirmation
 */
export const rejectInvoice = async (invoiceId, reason) => {
  const response = await api.post(`/invoices/${invoiceId}/reject`, { reason });
  return response.data;
};

/**
 * Get invoice statistics
 * @param {Object} params - Query parameters (startDate, endDate)
 * @returns {Promise} Statistics data
 */
export const getInvoiceStats = async (params = {}) => {
  const response = await api.get('/invoices/stats', { params });
  return response.data;
};

export default {
  uploadInvoice,
  batchUploadInvoices,
  getInvoiceStatus,
  streamInvoiceEvents,
  retryInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  exportInvoicePDF,
  exportInvoicesExcel,
  getInvoiceHistory,
  approveInvoice,
  rejectInvoice,
  getInvoiceStats,
};
'@

# Write the file
$content | Out-File -FilePath "src\services\invoiceService.js" -Encoding UTF8

Write-Host "  ✅ New file created" -ForegroundColor Green

# Step 3: Verify file
Write-Host ""
Write-Host "Step 3: Verifying new file..." -ForegroundColor Yellow
if (Test-Path "src\services\invoiceService.js") {
    $newFile = Get-Item "src\services\invoiceService.js"
    Write-Host "  ✅ File exists" -ForegroundColor Green
    Write-Host "  📏 Size: $($newFile.Length) bytes" -ForegroundColor White
    Write-Host "  📝 First line:" -ForegroundColor White
    Write-Host "     $(Get-Content 'src\services\invoiceService.js' -Head 1)" -ForegroundColor Gray
} else {
    Write-Host "  ❌ File creation failed!" -ForegroundColor Red
}

# Step 4: Fix imports with .js extension
Write-Host ""
Write-Host "Step 4: Fixing imports..." -ForegroundColor Yellow

# Fix InvoiceList.jsx
if (Test-Path "src\pages\invoice\InvoiceList.jsx") {
    $list = Get-Content "src\pages\invoice\InvoiceList.jsx" -Raw
    $list = $list -replace 'from "\.\./\.\./services/invoiceService"', 'from "../../services/invoiceService.js"'
    $list = $list -replace 'from "\.\./services/invoiceService"', 'from "../services/invoiceService.js"'
    $list | Set-Content "src\pages\invoice\InvoiceList.jsx" -Encoding UTF8
    Write-Host "  ✅ Fixed InvoiceList.jsx" -ForegroundColor Green
}

# Fix InvoiceUpload.jsx
if (Test-Path "src\pages\invoice\InvoiceUpload.jsx") {
    $upload = Get-Content "src\pages\invoice\InvoiceUpload.jsx" -Raw
    $upload = $upload -replace 'from "\.\./\.\./services/invoiceService"', 'from "../../services/invoiceService.js"'
    $upload = $upload -replace 'from "\.\./services/invoiceService"', 'from "../services/invoiceService.js"'
    $upload | Set-Content "src\pages\invoice\InvoiceUpload.jsx" -Encoding UTF8
    Write-Host "  ✅ Fixed InvoiceUpload.jsx" -ForegroundColor Green
}

# Fix InvoiceDetail.jsx
if (Test-Path "src\pages\invoice\InvoiceDetail.jsx") {
    $detail = Get-Content "src\pages\invoice\InvoiceDetail.jsx" -Raw
    $detail = $detail -replace 'from "\.\./\.\./services/invoiceService"', 'from "../../services/invoiceService.js"'
    $detail = $detail -replace 'from "\.\./services/invoiceService"', 'from "../services/invoiceService.js"'
    $detail | Set-Content "src\pages\invoice\InvoiceDetail.jsx" -Encoding UTF8
    Write-Host "  ✅ Fixed InvoiceDetail.jsx" -ForegroundColor Green
}

# Step 5: Final message
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ FILE RECREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "NOW RUN:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "This should work now!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")