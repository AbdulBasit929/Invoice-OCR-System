// src/components/common/ShortcutsDialog.jsx - KEYBOARD SHORTCUTS HELP DIALOG
// Beautiful modal showing all available keyboard shortcuts

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import { Close, Keyboard } from '@mui/icons-material';
import { getShortcuts, formatShortcut } from '../../hooks/useKeyboardShortcuts';

const ShortcutsDialog = () => {
  const [open, setOpen] = useState(false);
  const shortcuts = getShortcuts();

  useEffect(() => {
    const handleShow = () => setOpen(true);
    window.addEventListener('showShortcutsHelp', handleShow);
    return () => window.removeEventListener('showShortcutsHelp', handleShow);
  }, []);

  const handleClose = () => setOpen(false);

  // Group shortcuts by category
  const shortcutGroups = {
    Navigation: ['ctrl+h', 'ctrl+i', 'ctrl+u', 'ctrl+a'],
    Actions: ['ctrl+n', 'ctrl+s', 'ctrl+f', 'ctrl+r', 'esc'],
    'Search & Selection': ['ctrl+k', 'ctrl+shift+a', 'delete'],
    View: ['ctrl+1', 'ctrl+2'],
    Help: ['ctrl+/'],
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Keyboard sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Keyboard Shortcuts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Boost your productivity with these shortcuts
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {Object.entries(shortcutGroups).map(([category, keys]) => (
            <Grid item xs={12} key={category}>
              <Typography
                variant="overline"
                fontWeight="bold"
                color="primary.main"
                sx={{ letterSpacing: 1 }}
              >
                {category}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {keys.map((key) => {
                  const shortcut = shortcuts[key];
                  if (!shortcut) return null;

                  return (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        px: 2,
                        borderRadius: 1.5,
                        bgcolor: alpha('#000', 0.02),
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha('#3B82F6', 0.05),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {shortcut.description}
                      </Typography>
                      <ShortcutKeys shortcut={key} />
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha('#3B82F6', 0.05),
            border: 1,
            borderColor: alpha('#3B82F6', 0.2),
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Keyboard fontSize="small" />
            <strong>Pro Tip:</strong> Press <ShortcutKeys shortcut="ctrl+/" inline /> anywhere to open this help
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Shortcut keys display component
 */
const ShortcutKeys = ({ shortcut, inline = false }) => {
  const formatted = formatShortcut(shortcut);
  const keys = formatted.split('+');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && !inline && (
            <Typography variant="caption" sx={{ mx: 0.5, color: 'text.secondary' }}>
              +
            </Typography>
          )}
          <Chip
            label={key}
            size="small"
            sx={{
              height: inline ? 20 : 28,
              fontSize: inline ? '0.7rem' : '0.75rem',
              fontWeight: 600,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              '& .MuiChip-label': {
                px: inline ? 0.75 : 1.5,
              },
            }}
          />
        </React.Fragment>
      ))}
    </Box>
  );
};

export default ShortcutsDialog;