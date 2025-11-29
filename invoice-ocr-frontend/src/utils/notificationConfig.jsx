// src/utils/notificationConfig.jsx - FIXED VERSION
// Toast notification configuration with proper React components

import React from 'react';
import { SnackbarProvider } from 'notistack';
import {
  CheckCircleOutlined,
  ErrorOutlined,
  InfoOutlined,
  WarningAmberOutlined,
  Close,
} from '@mui/icons-material';
import { IconButton, Box } from '@mui/material';

// Custom notification styles
const notificationStyles = {
  success: {
    '& .SnackbarItem-message': {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .SnackbarItem-variantSuccess': {
      backgroundColor: '#10B981',
    },
  },
  error: {
    '& .SnackbarItem-message': {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .SnackbarItem-variantError': {
      backgroundColor: '#EF4444',
    },
  },
  warning: {
    '& .SnackbarItem-message': {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .SnackbarItem-variantWarning': {
      backgroundColor: '#F59E0B',
    },
  },
  info: {
    '& .SnackbarItem-message': {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    '& .SnackbarItem-variantInfo': {
      backgroundColor: '#3B82F6',
    },
  },
};

// Custom notification component with icon
const NotificationContent = ({ variant, message }) => {
  const icons = {
    success: <CheckCircleOutlined />,
    error: <ErrorOutlined />,
    warning: <WarningAmberOutlined />,
    info: <InfoOutlined />,
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icons[variant]}
      <span>{message}</span>
    </Box>
  );
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={3000}
      preventDuplicate
      dense={false}
      action={(snackbarKey) => (
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={() => {
            // Close snackbar
            if (window.closeSnackbar) {
              window.closeSnackbar(snackbarKey);
            }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      )}
      sx={{
        '& .SnackbarItem-variantSuccess': {
          backgroundColor: '#10B981',
          color: '#fff',
          fontWeight: 500,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        '& .SnackbarItem-variantError': {
          backgroundColor: '#EF4444',
          color: '#fff',
          fontWeight: 500,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        '& .SnackbarItem-variantWarning': {
          backgroundColor: '#F59E0B',
          color: '#fff',
          fontWeight: 500,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        '& .SnackbarItem-variantInfo': {
          backgroundColor: '#3B82F6',
          color: '#fff',
          fontWeight: 500,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      {children}
    </SnackbarProvider>
  );
};

// Export notification utilities
export const showNotification = (message, variant = 'info', enqueueSnackbar) => {
  if (enqueueSnackbar) {
    enqueueSnackbar(message, {
      variant,
      persist: false,
    });
  }
};

export default NotificationProvider;