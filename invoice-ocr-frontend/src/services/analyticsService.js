import api from './api';

const analyticsService = {
  /**
   * Get dashboard overview
   */
  getOverview: async (period = '30d') => {
    const response = await api.get(`/analytics/overview?period=${period}`);
    return response;
  },

  /**
   * Get invoices over time
   */
  getInvoicesOverTime: async (startDate, endDate, groupBy = 'day') => {
    const response = await api.get('/analytics/invoices-over-time', {
      params: { startDate, endDate, groupBy },
    });
    return response;
  },

  /**
   * Get top vendors
   */
  getTopVendors: async (limit = 10) => {
    const response = await api.get(`/analytics/top-vendors?limit=${limit}`);
    return response;
  },

  /**
   * Get field accuracy
   */
  getFieldAccuracy: async () => {
    const response = await api.get('/analytics/field-accuracy');
    return response;
  },

  /**
   * Get processing time statistics
   */
  getProcessingTimeStats: async () => {
    const response = await api.get('/analytics/processing-time');
    return response;
  },

  /**
   * Get status distribution
   */
  getStatusDistribution: async () => {
    const response = await api.get('/analytics/status-distribution');
    return response;
  },

  /**
   * Get amount statistics
   */
  getAmountStatistics: async (startDate, endDate) => {
    const response = await api.get('/analytics/amount-statistics', {
      params: { startDate, endDate },
    });
    return response;
  },

  /**
   * Get validation errors
   */
  getValidationErrors: async () => {
    const response = await api.get('/analytics/validation-errors');
    return response;
  },

  /**
   * Get user activity
   */
  getUserActivity: async (userId, startDate, endDate) => {
    const response = await api.get('/analytics/user-activity', {
      params: { userId, startDate, endDate },
    });
    return response;
  },

  /**
   * Export analytics report
   */
  exportReport: async (reportType, filters = {}) => {
    const response = await api.post('/analytics/export', {
      reportType,
      filters,
    }, {
      responseType: 'blob',
    });
    return response;
  },
};

export default analyticsService;