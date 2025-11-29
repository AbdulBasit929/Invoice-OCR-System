// src/services/api.js - Fixed API Configuration with Blob Support

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 240000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // ✅ CRITICAL FIX: Don't unwrap blob responses
    // If responseType is 'blob', return the full response object
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // For regular responses, return response.data
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // FIXED: Only redirect on 401 if NOT already on login/auth pages
        // This prevents infinite redirect loops
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
          path => currentPath.includes(path)
        );
        
        if (!isAuthPage) {
          // Clear token
          localStorage.removeItem('token');
          
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(currentPath);
          window.location.href = `/login?redirect=${returnUrl}`;
        }
      }
      
      if (status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access forbidden:', data.message);
      }
      
      if (status === 429) {
        // Too many requests
        console.error('Rate limit exceeded. Please try again later.');
      }
      
      if (status >= 500) {
        // Server error
        console.error('Server error:', data.message || 'Internal server error');
      }
      
      // Return error data for handling
      return Promise.reject(error.response.data);
    } 
    else if (error.request) {
      // Network error - no response received
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      });
    } 
    else {
      // Other errors (request setup, etc.)
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        error: 'UNKNOWN_ERROR',
      });
    }
  }
);

export default api;