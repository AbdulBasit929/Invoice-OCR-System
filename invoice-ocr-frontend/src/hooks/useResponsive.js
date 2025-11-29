// src/hooks/useResponsive.js - Responsive Utility Hooks
// Custom hooks for handling responsive layouts and mobile features

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * Get responsive breakpoint values
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.down('md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    isXL: useMediaQuery(theme.breakpoints.up('xl')),
  };
};

/**
 * Get screen size category
 */
export const useScreenSize = () => {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const sm = useMediaQuery(theme.breakpoints.only('sm'));
  const md = useMediaQuery(theme.breakpoints.only('md'));
  const lg = useMediaQuery(theme.breakpoints.only('lg'));
  const xl = useMediaQuery(theme.breakpoints.only('xl'));

  if (xs) return 'xs';
  if (sm) return 'sm';
  if (md) return 'md';
  if (lg) return 'lg';
  if (xl) return 'xl';
  return 'md';
};

/**
 * Get window dimensions
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Detect mobile device
 */
export const useIsMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

/**
 * Detect tablet device
 */
export const useIsTablet = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
};

/**
 * Detect touch device
 */
export const useIsTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
};

/**
 * Get responsive column count for grids
 */
export const useResponsiveColumns = (config = {}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { xs = 1, sm = 2, md = 3, lg = 4 } = config;

  if (isMobile) return xs;
  if (isTablet) return sm;
  if (isDesktop) return md;
  return lg;
};

/**
 * Get responsive spacing
 */
export const useResponsiveSpacing = (config = {}) => {
  const { isMobile, isTablet } = useResponsive();
  const { xs = 2, sm = 3, md = 4 } = config;

  if (isMobile) return xs;
  if (isTablet) return sm;
  return md;
};

/**
 * Detect orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', updateOrientation);
    updateOrientation();

    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
};

/**
 * Get responsive font size
 */
export const useResponsiveFontSize = (config = {}) => {
  const { isMobile, isTablet } = useResponsive();
  const { xs = '0.875rem', sm = '1rem', md = '1.125rem' } = config;

  if (isMobile) return xs;
  if (isTablet) return sm;
  return md;
};

/**
 * Detect if user prefers dark mode
 */
export const usePrefersDarkMode = () => {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDarkMode(mediaQuery.matches);

    const handleChange = (e) => setPrefersDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersDarkMode;
};

/**
 * Get safe area insets for iOS notch/island
 */
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0'),
        right: parseInt(style.getPropertyValue('--sar') || '0'),
        bottom: parseInt(style.getPropertyValue('--sab') || '0'),
        left: parseInt(style.getPropertyValue('--sal') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

/**
 * Detect if app is in standalone mode (PWA)
 */
export const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }, []);

  return isStandalone;
};

/**
 * Get network information
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkStatus((prev) => ({ ...prev, online: navigator.onLine }));
    };

    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setNetworkStatus((prev) => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return networkStatus;
};

/**
 * Get responsive table display mode
 */
export const useResponsiveTableMode = () => {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) return 'cards';
  if (isTablet) return 'compact';
  return 'full';
};

/**
 * Get responsive chart height
 */
export const useResponsiveChartHeight = (config = {}) => {
  const { isMobile, isTablet } = useResponsive();
  const { xs = 250, sm = 300, md = 400 } = config;

  if (isMobile) return xs;
  if (isTablet) return sm;
  return md;
};

export default {
  useResponsive,
  useScreenSize,
  useWindowSize,
  useIsMobile,
  useIsTablet,
  useIsTouch,
  useResponsiveColumns,
  useResponsiveSpacing,
  useOrientation,
  useResponsiveFontSize,
  usePrefersDarkMode,
  useSafeAreaInsets,
  useIsStandalone,
  useNetworkStatus,
  useResponsiveTableMode,
  useResponsiveChartHeight,
};