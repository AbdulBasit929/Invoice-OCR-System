// src/services/adminService.js - Admin API Service

import api from './api';

const adminService = {
  /**
   * Get all users (admin only)
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response;
  },

  /**
   * Get single user details (admin only)
   */
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response;
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response;
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response;
  },

  /**
   * Toggle user active status (admin only)
   */
  toggleUserStatus: async (userId, isActive) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return response;
  },

  /**
   * Get all invoices (admin view)
   */
  getAllInvoices: async (params = {}) => {
    const response = await api.get('/admin/invoices', { params });
    return response;
  },

  /**
   * Get system statistics (admin only)
   */
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response;
  },

  /**
   * Get system logs (admin only)
   */
  getSystemLogs: async (params = {}) => {
    const response = await api.get('/admin/logs', { params });
    return response;
  },

  /**
   * Clear system cache (admin only)
   */
  clearCache: async () => {
    const response = await api.post('/admin/cache/clear');
    return response;
  },

  /**
   * Get system health status (admin only)
   */
  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response;
  },

  /**
   * Update system settings (admin only)
   */
  updateSystemSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response;
  },

  /**
   * Create backup (admin only)
   */
  createBackup: async () => {
    const response = await api.post('/admin/backup');
    return response;
  },

  /**
   * Get backup history (admin only)
   */
  getBackupHistory: async () => {
    const response = await api.get('/admin/backups');
    return response;
  },
};

export default adminService;