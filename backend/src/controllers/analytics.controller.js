const analyticsService = require('../services/analytics.service');
const Invoice = require('../models/Invoice');
const { AppError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

/**
 * @desc    Get overview statistics
 * @route   GET /api/analytics/overview
 * @access  Private
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    // Calculate date range based on period
    const dateRange = calculateDateRange(period);
    
    const stats = await analyticsService.getInvoiceStatistics(userId, dateRange);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(`Overview error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get status distribution
 * @route   GET /api/analytics/status-distribution
 * @access  Private
 */
exports.getStatusDistribution = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const query = { isDeleted: false };
    if (userId) {
      query.userId = userId;
    }

    const distribution = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    logger.error(`Status distribution error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get top vendors
 * @route   GET /api/analytics/top-vendors
 * @access  Private
 */
exports.getTopVendors = async (req, res, next) => {
  try {
    const { sortBy = 'count', limit = 10 } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const vendors = await analyticsService.getTopVendors(
      userId,
      sortBy,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    logger.error(`Top vendors error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get invoices over time
 * @route   GET /api/analytics/invoices-over-time
 * @access  Private
 */
exports.getInvoicesOverTime = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const query = { isDeleted: false };
    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Determine grouping format
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default: // day
        dateFormat = '%Y-%m-%d';
    }

    const timeSeries = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: timeSeries.map(item => ({
        date: item._id,
        count: item.count,
        totalAmount: item.totalAmount || 0,
      })),
    });
  } catch (error) {
    logger.error(`Invoices over time error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get field accuracy
 * @route   GET /api/analytics/field-accuracy
 * @access  Private
 */
exports.getFieldAccuracy = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const accuracy = await analyticsService.getFieldAccuracy(userId);

    res.json({
      success: true,
      data: accuracy,
    });
  } catch (error) {
    logger.error(`Field accuracy error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get processing time statistics
 * @route   GET /api/analytics/processing-time
 * @access  Private
 */
exports.getProcessingTimeStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const query = {
      isDeleted: false,
      processingTime: { $exists: true, $ne: null },
    };
    if (userId) {
      query.userId = userId;
    }

    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' },
          minTime: { $min: '$processingTime' },
          maxTime: { $max: '$processingTime' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        count: 0,
      },
    });
  } catch (error) {
    logger.error(`Processing time stats error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get amount statistics
 * @route   GET /api/analytics/amount-statistics
 * @access  Private
 */
exports.getAmountStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const query = {
      isDeleted: false,
      totalAmount: { $exists: true, $ne: null },
    };
    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          average: { $avg: '$totalAmount' },
          min: { $min: '$totalAmount' },
          max: { $max: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0,
      },
    });
  } catch (error) {
    logger.error(`Amount statistics error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get validation errors
 * @route   GET /api/analytics/validation-errors
 * @access  Private
 */
exports.getValidationErrors = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const query = {
      isDeleted: false,
      'validation.errors': { $exists: true, $ne: [] },
    };
    if (userId) {
      query.userId = userId;
    }

    const invoices = await Invoice.find(query)
      .select('validation.errors')
      .limit(1000);

    // Aggregate error types
    const errorCounts = {};
    invoices.forEach(invoice => {
      const errors = invoice.validation?.errors || [];
      errors.forEach(error => {
        const field = error.field || 'unknown';
        errorCounts[field] = (errorCounts[field] || 0) + 1;
      });
    });

    // Convert to array and sort
    const errorStats = Object.entries(errorCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: errorStats,
    });
  } catch (error) {
    logger.error(`Validation errors error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get user activity
 * @route   GET /api/analytics/user-activity
 * @access  Private
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId: targetUserId, startDate, endDate, days = 30 } = req.query;
    const userId = req.user.role === 'admin' && targetUserId ? targetUserId : req.user.id;

    const activity = await analyticsService.getUserActivity(userId, parseInt(days));

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    logger.error(`User activity error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Export analytics report
 * @route   POST /api/analytics/export
 * @access  Private
 */
exports.exportReport = async (req, res, next) => {
  try {
    const { reportType, filters = {} } = req.body;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    // This is a placeholder - implement actual export logic
    // For now, just return success
    res.json({
      success: true,
      message: 'Export functionality coming soon',
      data: {
        reportType,
        filters,
        userId,
      },
    });
  } catch (error) {
    logger.error(`Export report error: ${error.message}`);
    next(error);
  }
};

/**
 * Helper function to calculate date range based on period
 */
function calculateDateRange(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      return {};
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate,
    endDate: now,
  };
}

// Export all functions
module.exports = {
  getOverview: exports.getOverview,
  getStatusDistribution: exports.getStatusDistribution,
  getTopVendors: exports.getTopVendors,
  getInvoicesOverTime: exports.getInvoicesOverTime,
  getFieldAccuracy: exports.getFieldAccuracy,
  getProcessingTimeStats: exports.getProcessingTimeStats,
  getAmountStatistics: exports.getAmountStatistics,
  getValidationErrors: exports.getValidationErrors,
  getUserActivity: exports.getUserActivity,
  exportReport: exports.exportReport,
};