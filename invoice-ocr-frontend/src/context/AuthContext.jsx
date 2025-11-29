// src/context/AuthContext.jsx - Improved Authentication Context

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get current user
      const userData = await authService.getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // No user data returned
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // Clear invalid token
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (!response || !response.token || !response.user) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      const { token, user: userData } = response;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update authentication state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check if there's a redirect URL
      const params = new URLSearchParams(location.search);
      const redirectUrl = params.get('redirect') || '/dashboard';
      
      // Navigate to destination
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
      }, 100);
      
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (!response.token || !response.user) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      const { token, user: newUser } = response;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Update state
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = () => {
    // Call logout service (optional - clears server-side session if any)
    authService.logout().catch(err => {
      console.error('Logout service error:', err);
    });
    
    // Clear local storage
    localStorage.removeItem('token');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login', { replace: true });
  };

  const updateUser = (userData) => {
    setUser((prevUser) => ({ ...prevUser, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};