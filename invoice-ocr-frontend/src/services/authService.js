// src/services/authService.js - Enhanced with Logging

import api from './api';

const authService = {
  /**
   * Login user
   */
  login: async (email, password) => {
    try {
      console.log('🌐 [authService] Sending login request...', { email });
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ [authService] Login response:', response);
      return response;
    } catch (error) {
      console.error('❌ [authService] Login error:', error);
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      console.log('🌐 [authService] Sending registration request...');
      console.log('📤 [authService] Request data:', {
        name: userData.name,
        email: userData.email,
        company: userData.company,
        hasPassword: !!userData.password,
        passwordLength: userData.password?.length,
        passwordValue: userData.password ? '***' + userData.password.slice(-3) : 'MISSING'
      });
      
      const response = await api.post('/auth/register', userData);
      console.log('✅ [authService] Registration response:', response);
      return response;
    } catch (error) {
      console.error('❌ [authService] Registration error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response;
  },
};

export default authService;