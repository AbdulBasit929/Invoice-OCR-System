// src/services/invoiceService.js - Complete Invoice Service with Fixed PDF Export

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
    timeout: 300000, // 5 minutes for OCR processing
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
    timeout: 300000,
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
  
  // Get API URL from Vite env or use default
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const eventSource = new EventSource(
    `${apiUrl}/invoices/${invoiceId}/events?token=${token}`
  );

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
 * @param {Object} params - Query parameters (page, limit, status, search, etc.)
 * @returns {Promise} Invoices list with pagination
 */
export const getInvoices = async (params = {}) => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

/**
 * ✅ NEW: Search invoices with autocomplete
 * @param {string} searchQuery - Search query string
 * @returns {Promise} Search results
 */
export const searchInvoices = async (searchQuery) => {
  const response = await api.get('/invoices', {
    params: {
      search: searchQuery,
      limit: 10, // Limit results for autocomplete
      includeUnprocessed: 'true',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  });
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
 * ✅ FIXED: Export invoice to PDF with proper blob handling
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} PDF file
 */
export const exportInvoicePDF = async (invoiceId) => {
  try {
    console.log('📥 Starting PDF export for invoice:', invoiceId);
    
    // Make request with responseType: 'blob'
    const response = await api.get(`/invoices/${invoiceId}/export/pdf`, {
      responseType: 'blob',
    });
    
    console.log('✅ PDF response received:', {
      status: response.status,
      contentType: response.headers['content-type'],
      size: response.data.size,
    });

    // Verify we got a blob
    if (!(response.data instanceof Blob)) {
      console.error('❌ Response is not a Blob:', response.data);
      throw new Error('Invalid response format - expected Blob');
    }

    // Verify it's a PDF
    const contentType = response.headers['content-type'] || response.data.type;
    if (!contentType || !contentType.includes('pdf')) {
      console.error('❌ Invalid content type:', contentType);
      throw new Error('Invalid content type - expected PDF');
    }

    // Extract filename from Content-Disposition header
    let filename = `invoice_${invoiceId}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    console.log('📄 Downloading PDF as:', filename);

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    
    // Revoke URL after a short delay to ensure download starts
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      console.log('✅ PDF download complete, URL revoked');
    }, 100);
    
    return response.data;
  } catch (error) {
    console.error('❌ Export PDF error:', error);
    
    // Enhanced error handling
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      
      // If response is a blob, try to read it as text for error message
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.error('Error blob content:', text);
          throw new Error(`PDF export failed: ${text}`);
        } catch (readError) {
          console.error('Could not read error blob:', readError);
        }
      }
    }
    
    throw error;
  }
};

/**
 * Export multiple invoices to Excel
 * @param {Array} invoiceIds - Array of invoice IDs
 * @returns {Promise} Excel file
 */
export const exportInvoicesExcel = async (invoiceIds) => {
  try {
    console.log('📥 Starting Excel export for invoices:', invoiceIds);
    
    const response = await api.post(
      '/invoices/export/excel',
      { invoiceIds },
      { responseType: 'blob' }
    );
    
    console.log('✅ Excel response received:', {
      status: response.status,
      contentType: response.headers['content-type'],
      size: response.data.size,
    });

    // Verify we got a blob
    if (!(response.data instanceof Blob)) {
      console.error('❌ Response is not a Blob:', response.data);
      throw new Error('Invalid response format - expected Blob');
    }

    // Extract filename
    let filename = `invoices_${Date.now()}.xlsx`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    console.log('📄 Downloading Excel as:', filename);

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Revoke URL after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      console.log('✅ Excel download complete, URL revoked');
    }, 100);
    
    return response.data;
  } catch (error) {
    console.error('❌ Export Excel error:', error);
    throw error;
  }
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

// Default export with all functions
export default {
  uploadInvoice,
  batchUploadInvoices,
  getInvoiceStatus,
  streamInvoiceEvents,
  retryInvoice,
  getInvoices,
  searchInvoices, // ✅ Added search method
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