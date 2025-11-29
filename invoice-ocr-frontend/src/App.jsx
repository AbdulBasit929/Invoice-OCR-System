// src/App.jsx - Updated with Landing Page
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './utils/notificationConfig';
import './styles/mobile-responsive.css';

// Layouts
import MainLayout from './components/common/MainLayout';
import AuthLayout from './components/common/AuthLayout';

// Landing Page (not lazy loaded for fast initial render)
import LandingPage from './pages/LandingPage';

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const InvoiceList = lazy(() => import('./pages/invoice/InvoiceList'));
const InvoiceDetail = lazy(() => import('./pages/invoice/InvoiceDetail'));
const InvoiceUpload = lazy(() => import('./pages/invoice/InvoiceUpload'));
const InvoiceEdit = lazy(() => import('./pages/invoice/InvoiceEdit'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const NotFound = lazy(() => import('./pages/common/NotFound'));

// Loading component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress size={60} thickness={4} />
  </Box>
);

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <NotificationProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Landing Page - Public */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <Login />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AuthLayout>
                  <Register />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="invoices/:id/edit" element={<InvoiceEdit />} />
            <Route path="invoices/upload" element={<InvoiceUpload />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Legacy route redirects (for backward compatibility) */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/invoices/*" element={<Navigate to="/app/invoices" replace />} />
          <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </NotificationProvider>
  );
}

export default App;