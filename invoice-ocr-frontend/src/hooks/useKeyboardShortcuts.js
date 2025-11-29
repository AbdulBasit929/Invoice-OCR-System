// src/hooks/useKeyboardShortcuts.js - KEYBOARD SHORTCUTS HOOK
// Comprehensive keyboard shortcuts for power users

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Keyboard shortcuts configuration
 */
const shortcuts = {
  // Navigation
  'ctrl+k': { action: 'search', description: 'Focus search' },
  'ctrl+/': { action: 'shortcuts', description: 'Show shortcuts help' },
  'ctrl+h': { action: 'home', description: 'Go to dashboard' },
  'ctrl+i': { action: 'invoices', description: 'Go to invoices' },
  'ctrl+u': { action: 'upload', description: 'Upload invoice' },
  'ctrl+a': { action: 'analytics', description: 'Go to analytics' },
  
  // Actions
  'ctrl+n': { action: 'new', description: 'New invoice' },
  'ctrl+s': { action: 'save', description: 'Save current form' },
  'ctrl+f': { action: 'filter', description: 'Open filters' },
  'ctrl+r': { action: 'refresh', description: 'Refresh data' },
  'esc': { action: 'escape', description: 'Close modal/dialog' },
  
  // Selection
  'ctrl+shift+a': { action: 'selectAll', description: 'Select all items' },
  'delete': { action: 'delete', description: 'Delete selected items' },
  
  // View
  'ctrl+1': { action: 'tableView', description: 'Table view' },
  'ctrl+2': { action: 'gridView', description: 'Grid view' },
};

/**
 * Hook for keyboard shortcuts
 * @param {object} handlers - Custom action handlers
 * @param {boolean} enabled - Enable/disable shortcuts
 */
export const useKeyboardShortcuts = (handlers = {}, enabled = true) => {
  const navigate = useNavigate();

  const handleKeyPress = useCallback(
    (event) => {
      if (!enabled) return;

      // Don't trigger if user is typing in an input/textarea
      const target = event.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Build shortcut key string
      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');
      
      let key = event.key.toLowerCase();
      if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
        keys.push(key);
      }

      const shortcut = keys.join('+');
      const shortcutConfig = shortcuts[shortcut];

      if (shortcutConfig) {
        event.preventDefault();
        const action = shortcutConfig.action;

        // Execute custom handler if provided
        if (handlers[action]) {
          handlers[action](event);
          return;
        }

        // Default handlers
        switch (action) {
          case 'search':
            focusSearch();
            break;
          case 'shortcuts':
            showShortcutsHelp();
            break;
          case 'home':
            navigate('/dashboard');
            break;
          case 'invoices':
            navigate('/invoices');
            break;
          case 'upload':
            navigate('/invoices/upload');
            break;
          case 'analytics':
            navigate('/analytics');
            break;
          case 'new':
            navigate('/invoices/upload');
            break;
          case 'escape':
            handleEscape();
            break;
          default:
            console.log('Shortcut triggered:', action);
        }
      }
    },
    [enabled, handlers, navigate]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);

  return shortcuts;
};

/**
 * Focus search input
 */
const focusSearch = () => {
  const searchInput = document.querySelector('input[type="search"]') ||
                      document.querySelector('input[placeholder*="Search"]') ||
                      document.querySelector('input[placeholder*="search"]');
  
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }
};

/**
 * Show shortcuts help dialog
 */
const showShortcutsHelp = () => {
  // Dispatch custom event that components can listen to
  window.dispatchEvent(new CustomEvent('showShortcutsHelp'));
};

/**
 * Handle Escape key
 */
const handleEscape = () => {
  // Close any open modals/dialogs
  const closeButtons = document.querySelectorAll('[aria-label="close"]');
  if (closeButtons.length > 0) {
    closeButtons[0].click();
    return;
  }

  // Blur active element
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
};

/**
 * Get all shortcuts
 * @returns {object} All available shortcuts
 */
export const getShortcuts = () => shortcuts;

/**
 * Format shortcut for display
 * @param {string} shortcut - Shortcut key combination
 * @returns {string} Formatted shortcut
 */
export const formatShortcut = (shortcut) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return shortcut
    .replace('ctrl', isMac ? '⌘' : 'Ctrl')
    .replace('shift', isMac ? '⇧' : 'Shift')
    .replace('alt', isMac ? '⌥' : 'Alt')
    .split('+')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(isMac ? '' : '+');
};

export default useKeyboardShortcuts;