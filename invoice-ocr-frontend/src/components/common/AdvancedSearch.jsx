import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Search,
  Close,
  History,
  TrendingUp,
  Receipt,
  Business,
  AttachMoney,
  CalendarToday,
  Clear,
} from '@mui/icons-material';
import { debounce } from '../../lib/utils';
import invoiceService from '../../services/invoiceService';

const AdvancedSearch = ({ onSelect, onSearch, placeholder = 'Search invoices...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus on Ctrl+K
  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Searching for:', searchQuery);
        
        // ✅ FIXED: Use searchInvoices method
        const response = await invoiceService.searchInvoices(searchQuery);
        console.log('✅ Search response:', response);
        
        // Handle different response structures
        let results = [];
        if (response?.data?.invoices) {
          results = response.data.invoices;
        } else if (response?.invoices) {
          results = response.invoices;
        } else if (Array.isArray(response?.data)) {
          results = response.data;
        } else if (Array.isArray(response)) {
          results = response;
        }

        console.log('📄 Search results:', results);

        // Format suggestions
        const formatted = results
          .slice(0, 5)
          .map((invoice) => ({
            id: invoice._id,
            type: 'invoice',
            title: invoice.invoiceNumber || 'N/A',
            subtitle: invoice.companyName || 'Unknown Company',
            amount: invoice.totalAmount,
            currency: invoice.currency || 'USD',
            date: invoice.invoiceDate,
          }));

        console.log('✨ Formatted suggestions:', formatted);
        setSuggestions(formatted);
      } catch (error) {
        console.error('❌ Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  // Handle input change
  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    
    console.log('📝 Query changed:', value);
    
    if (value.length >= 2) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSubmit = (searchQuery = query) => {
    console.log('🚀 Submitting search:', searchQuery);
    if (searchQuery.trim()) {
      // Save to recent searches
      saveRecentSearch(searchQuery);
      
      // Execute search
      if (onSearch) {
        onSearch(searchQuery);
      }
      
      // Close suggestions
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  // Save recent search
  const saveRecentSearch = (searchQuery) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    console.log('👆 Suggestion clicked:', suggestion);
    if (suggestion.type === 'invoice' && onSelect) {
      onSelect(suggestion.id);
    }
    setQuery('');
    setSuggestions([]);
    setFocused(false);
  };

  // Handle recent search click
  const handleRecentClick = (search) => {
    console.log('🕒 Recent search clicked:', search);
    setQuery(search);
    handleSubmit(search);
  };

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'invoice':
        return <Receipt />;
      case 'company':
        return <Business />;
      case 'amount':
        return <AttachMoney />;
      default:
        return <Search />;
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return '—';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  const showSuggestions = focused && (suggestions.length > 0 || query.length >= 2 || recentSearches.length > 0);

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={inputRef}
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} />}
              {query && !loading && (
                <IconButton size="small" onClick={handleClear}>
                  <Close fontSize="small" />
                </IconButton>
              )}
              <Chip
                label="Ctrl+K"
                size="small"
                sx={{
                  ml: 1,
                  height: 24,
                  fontSize: '0.7rem',
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: 'background.paper',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: 2,
            },
            '&.Mui-focused': {
              boxShadow: 4,
            },
          },
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
            borderRadius: 2,
          }}
        >
          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <>
              <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Recent Searches
                </Typography>
                <IconButton size="small" onClick={handleClearRecent}>
                  <Clear fontSize="small" />
                </IconButton>
              </Box>
              <List sx={{ py: 0 }}>
                {recentSearches.map((search, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => handleRecentClick(search)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        bgcolor: alpha('#3B82F6', 0.05),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <History fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={search}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <>
              {query.length < 2 && recentSearches.length > 0 && <Divider />}
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Suggestions
                </Typography>
              </Box>
              <List sx={{ py: 0 }}>
                {suggestions.map((suggestion) => (
                  <ListItem
                    key={suggestion.id}
                    button
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        bgcolor: alpha('#3B82F6', 0.05),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getSuggestionIcon(suggestion.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="600">
                            {suggestion.title}
                          </Typography>
                          {suggestion.amount && (
                            <Chip
                              label={formatCurrency(suggestion.amount, suggestion.currency)}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={suggestion.subtitle}
                      primaryTypographyProps={{
                        component: 'div',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* No Results */}
          {query.length >= 2 && !loading && suggestions.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No results found for "{query}"
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Try searching by invoice number or company name
              </Typography>
            </Box>
          )}

          {/* Loading */}
          {loading && suggestions.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Searching...
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AdvancedSearch;