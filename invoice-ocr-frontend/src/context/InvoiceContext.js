// src/context/InvoiceContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const InvoiceContext = createContext(null);

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: null,
    dateTo: null,
  });

  // Fetch all invoices with filters
  const fetchInvoices = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { ...filters, ...customFilters };
      const response = await api.get('/invoices', { params });
      
      setInvoices(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch single invoice by ID
  const fetchInvoiceById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/invoices/${id}`);
      setSelectedInvoice(response.data);
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload new invoice
  const uploadInvoice = useCallback(async (file, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
      
      const response = await api.post('/invoices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh invoices list
      await fetchInvoices();
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to upload invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Update invoice
  const updateInvoice = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/invoices/${id}`, updates);
      
      // Update local state
      setInvoices(prev =>
        prev.map(inv => (inv._id === id ? response.data : inv))
      );
      
      if (selectedInvoice?._id === id) {
        setSelectedInvoice(response.data);
      }
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedInvoice]);

  // Delete invoice
  const deleteInvoice = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/invoices/${id}`);
      
      // Update local state
      setInvoices(prev => prev.filter(inv => inv._id !== id));
      
      if (selectedInvoice?._id === id) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedInvoice]);

  // Bulk operations
  const bulkDeleteInvoices = useCallback(async (ids) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/invoices/bulk-delete', { ids });
      
      // Update local state
      setInvoices(prev => prev.filter(inv => !ids.includes(inv._id)));
      
      await fetchInvoices();
    } catch (err) {
      setError(err.message || 'Failed to delete invoices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Export invoices
  const exportInvoices = useCallback(async (ids, format = 'csv') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(
        '/invoices/export',
        { ids, format },
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoices_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.message || 'Failed to export invoices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    invoices,
    selectedInvoice,
    loading,
    error,
    filters,
    fetchInvoices,
    fetchInvoiceById,
    uploadInvoice,
    updateInvoice,
    deleteInvoice,
    bulkDeleteInvoices,
    exportInvoices,
    updateFilters,
    clearError,
    setSelectedInvoice,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};

export default InvoiceContext;
