// src/components/analytics/AnalyticsCard.jsx - Mobile-Optimized Card Components
// Reusable card components for analytics with mobile responsiveness

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  InfoOutlined,
} from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * Metric Card - Displays key metrics with trend
 */
export const MetricCard = ({
  title,
  value,
  change,
  trend = 'up',
  icon: Icon,
  color = '#3B82F6',
  loading = false,
  onClick,
  subtitle,
  badge,
}) => {
  const { isMobile } = useResponsive();
  const theme = useTheme();

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: 1,
        borderColor: 'divider',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: color,
        } : {},
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          alignItems={isMobile ? 'flex-start' : 'center'}
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                color="text.secondary"
                noWrap
              >
                {title}
              </Typography>
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: alpha(color, 0.1),
                    color: color,
                  }}
                />
              )}
            </Stack>

            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              fontWeight="bold"
              sx={{ color: color }}
              noWrap
            >
              {value}
            </Typography>

            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            )}

            {change && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                {trend === 'up' ? (
                  <TrendingUp fontSize="small" sx={{ color: '#10B981' }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: '#10B981' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: '#10B981' }}
                  fontWeight="bold"
                >
                  {change}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Stack>
            )}
          </Box>

          {!isMobile && Icon && (
            <Avatar
              sx={{
                bgcolor: alpha(color, 0.1),
                width: 48,
                height: 48,
              }}
            >
              <Icon sx={{ color: color }} />
            </Avatar>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Progress Card - Displays progress with bar
 */
export const ProgressCard = ({
  title,
  value,
  percentage,
  color = 'primary',
  icon: Icon,
  subtitle,
  loading = false,
}) => {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
          <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          {Icon && !isMobile && (
            <Avatar sx={{ bgcolor: `${color}.lighter` }}>
              <Icon sx={{ color: `${color}.main` }} />
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? 'caption' : 'body2'}
              color="text.secondary"
            >
              {title}
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {percentage}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={color}
            sx={{ height: isMobile ? 6 : 8, borderRadius: 1 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Stat Card - Simple stat display
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  color = '#3B82F6',
  loading = false,
  compact = false,
}) => {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" height={30} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: compact ? 1.5 : 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {Icon && (
          <Box
            sx={{
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              sx={{
                color: color,
                fontSize: isMobile ? 18 : 24,
              }}
            />
          </Box>
        )}
        <Box>
          <Typography
            variant={compact || isMobile ? 'caption' : 'body2'}
            color="text.secondary"
          >
            {label}
          </Typography>
          <Typography
            variant={compact || isMobile ? 'body1' : 'h6'}
            fontWeight="bold"
            sx={{ color: color }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Chart Card - Wrapper for charts with header
 */
export const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  children,
  actions,
  loading = false,
  color = '#3B82F6',
  fullHeight = false,
}) => {
  const { isMobile } = useResponsive();

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        height: fullHeight ? '100%' : 'auto',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {Icon && !isMobile && (
              <Avatar sx={{ bgcolor: alpha(color, 0.1) }}>
                <Icon sx={{ color: color }} />
              </Avatar>
            )}
            <Box>
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                fontWeight="bold"
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          {actions && <Box>{actions}</Box>}
        </Stack>

        {loading ? (
          <Skeleton
            variant="rectangular"
            height={isMobile ? 250 : 350}
            sx={{ borderRadius: 2 }}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Info Card - Displays informational content
 */
export const InfoCard = ({
  title,
  description,
  icon: Icon,
  color = 'info',
  action,
  loading = false,
}) => {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: `${color}.main`,
        bgcolor: alpha(color === 'info' ? '#3B82F6' : '#10B981', 0.05),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {Icon && (
            <Avatar
              sx={{
                bgcolor: `${color}.main`,
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
              }}
            >
              <Icon fontSize={isMobile ? 'small' : 'medium'} />
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? 'body2' : 'subtitle1'}
              fontWeight="bold"
              gutterBottom
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? 'caption' : 'body2'}
              color="text.secondary"
            >
              {description}
            </Typography>
            {action && <Box sx={{ mt: 2 }}>{action}</Box>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Comparison Card - Show comparison between two values
 */
export const ComparisonCard = ({
  label,
  current,
  previous,
  unit = '',
  color = 'primary',
  loading = false,
}) => {
  const { isMobile } = useResponsive();
  const change = previous ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" height={30} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1.5 : 2 }}>
      <Typography
        variant={isMobile ? 'caption' : 'body2'}
        color="text.secondary"
        gutterBottom
      >
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          fontWeight="bold"
          sx={{ color: `${color}.main` }}
        >
          {current}{unit}
        </Typography>
        <Chip
          icon={isPositive ? <TrendingUp /> : <TrendingDown />}
          label={`${isPositive ? '+' : ''}${change.toFixed(1)}%`}
          size="small"
          color={isPositive ? 'success' : 'error'}
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Previous: {previous}{unit}
      </Typography>
    </Box>
  );
};

export default {
  MetricCard,
  ProgressCard,
  StatCard,
  ChartCard,
  InfoCard,
  ComparisonCard,
};