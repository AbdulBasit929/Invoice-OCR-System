import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { parseErrorMessage } from '../utils/helpers';

/**
 * Hook for async API calls with loading and error states
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const execute = useCallback(
    async (...params) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...params);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = parseErrorMessage(err);
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, enqueueSnackbar]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return { loading, data, error, execute, setData };
};

/**
 * Hook for pagination
 */
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  const reset = () => {
    setPage(initialPage);
    setLimit(initialLimit);
  };

  return {
    page,
    limit,
    total,
    totalPages,
    setTotal,
    handlePageChange,
    handleLimitChange,
    reset,
  };
};

/**
 * Hook for search/filter functionality
 */
export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const removeFilter = (key) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    removeFilter,
  };
};

/**
 * Hook for table selection
 */
export const useSelection = () => {
  const [selected, setSelected] = useState([]);

  const handleSelectAll = (items) => {
    setSelected(items.map((item) => item._id || item.id));
  };

  const handleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const isSelected = (id) => selected.includes(id);

  const clearSelection = () => {
    setSelected([]);
  };

  const isAllSelected = (items) => {
    return items.length > 0 && selected.length === items.length;
  };

  return {
    selected,
    handleSelectAll,
    handleSelect,
    isSelected,
    clearSelection,
    isAllSelected,
  };
};

/**
 * Hook for modal state management
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const open = (modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setData(null);
  };

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
};

/**
 * Hook for debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for local storage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for window size
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Hook for detecting mobile devices
 */
export const useIsMobile = (breakpoint = 768) => {
  const { width } = useWindowSize();
  return width < breakpoint;
};

export default {
  useAsync,
  usePagination,
  useFilters,
  useSelection,
  useModal,
  useDebounce,
  useLocalStorage,
  useWindowSize,
  useIsMobile,
};