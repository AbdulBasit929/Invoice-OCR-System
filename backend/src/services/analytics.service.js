// src/services/analytics.service.js - ENHANCED Analytics Service

const Invoice = require('../models/Invoice');
const Log = require('../models/Log');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class AnalyticsService {
  /**
   * Get comprehensive invoice statistics
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @param {object} dateRange - Date range filter
   * @returns {Promise<object>} Statistics
   */
  async getInvoiceStatistics(userId = null, dateRange = {}) {
    try {
      const query = { isDeleted: false };
      
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }

      if (dateRange.startDate || dateRange.endDate) {
        query.createdAt = {};
        if (dateRange.startDate) {
          query.createdAt.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          query.createdAt.$lte = new Date(dateRange.endDate);
        }
      }

      console.log('📊 Analytics query:', JSON.stringify(query, null, 2));

      // Get comprehensive stats in parallel
      const [
        totalInvoices,
        statusCounts,
        amountStats,
        processingStats,
        validationStats,
      ] = await Promise.all([
        // Total count
        Invoice.countDocuments(query),

        // Status counts
        Invoice.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // Amount statistics
        Invoice.aggregate([
          { $match: { ...query, totalAmount: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$totalAmount' },
              avgAmount: { $avg: '$totalAmount' },
              minAmount: { $min: '$totalAmount' },
              maxAmount: { $max: '$totalAmount' },
            },
          },
        ]),

        // Processing time statistics
        Invoice.aggregate([
          { $match: { ...query, processingTime: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: null,
              avgProcessingTime: { $avg: '$processingTime' },
              minProcessingTime: { $min: '$processingTime' },
              maxProcessingTime: { $max: '$processingTime' },
            },
          },
        ]),

        // Validation statistics
        Invoice.aggregate([
          { $match: { ...query, 'validation.score': { $exists: true } } },
          {
            $group: {
              _id: null,
              avgScore: { $avg: '$validation.score' },
              minScore: { $min: '$validation.score' },
              maxScore: { $max: '$validation.score' },
            },
          },
        ]),
      ]);

      // Process status counts
      const statusMap = {};
      statusCounts.forEach(item => {
        statusMap[item._id] = item.count;
      });

      // Calculate success rate
      const processedCount = (statusMap.processed || 0) + 
                            (statusMap.validated || 0) + 
                            (statusMap.approved || 0);
      const successRate = totalInvoices > 0 
        ? Math.round((processedCount / totalInvoices) * 100) 
        : 0;

      const result = {
        totalInvoices,
        processedInvoices: statusMap.processed || 0,
        validatedInvoices: statusMap.validated || 0,
        pendingInvoices: (statusMap.pending || 0) + (statusMap.processing || 0),
        failedInvoices: statusMap.failed || 0,
        totalAmount: amountStats[0]?.totalAmount || 0,
        avgAmount: amountStats[0]?.avgAmount || 0,
        minAmount: amountStats[0]?.minAmount || 0,
        maxAmount: amountStats[0]?.maxAmount || 0,
        avgProcessingTime: processingStats[0]?.avgProcessingTime || 0,
        minProcessingTime: processingStats[0]?.minProcessingTime || 0,
        maxProcessingTime: processingStats[0]?.maxProcessingTime || 0,
        avgValidationScore: validationStats[0]?.avgScore || 0,
        successRate,
        statusDistribution: statusCounts,
      };

      console.log('✅ Analytics result:', result);
      return result;

    } catch (error) {
      logger.error(`Statistics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get invoices processed over time
   * @param {string} userId - User ID (optional)
   * @param {string} period - Period (day, week, month)
   * @param {number} limit - Number of data points
   * @returns {Promise<Array>} Time series data
   */
  async getInvoicesOverTime(userId = null, period = 'day', limit = 30) {
    try {
      const query = { isDeleted: false };
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }

      let dateFormat;
      switch (period) {
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
        { $sort: { createdAt: -1 } },
        { $limit: limit * 100 }, // Get enough data
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            avgProcessingTime: { $avg: '$processingTime' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: limit },
      ]);

      return timeSeries.map(item => ({
        date: item._id,
        count: item.count,
        totalAmount: item.totalAmount || 0,
        avgProcessingTime: item.avgProcessingTime || 0,
      }));
    } catch (error) {
      logger.error(`Time series error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top vendors by invoice count or amount
   * @param {string} userId - User ID (optional)
   * @param {string} sortBy - Sort by 'count' or 'amount'
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top vendors
   */
  async getTopVendors(userId = null, sortBy = 'count', limit = 10) {
    try {
      const query = { 
        isDeleted: false, 
        companyName: { $exists: true, $ne: null, $ne: '' } 
      };
      
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }

      const sortStage = sortBy === 'amount' 
        ? { totalAmount: -1 } 
        : { count: -1 };

      const vendors = await Invoice.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$companyName',
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
            avgAmount: { $avg: { $ifNull: ['$totalAmount', 0] } },
          },
        },
        { $sort: sortStage },
        { $limit: parseInt(limit) },
      ]);

      return vendors;
    } catch (error) {
      logger.error(`Top vendors error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get field accuracy statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<object>} Field accuracy stats
   */
  async getFieldAccuracy(userId = null) {
    try {
      const query = { 
        isDeleted: false, 
        'confidence.breakdown': { $exists: true } 
      };
      
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }

      const invoices = await Invoice.find(query)
        .select('confidence.breakdown validation')
        .limit(1000);

      const fieldStats = {
        invoice_number: { total: 0, avgConfidence: 0, sum: 0 },
        total_amount: { total: 0, avgConfidence: 0, sum: 0 },
        invoice_date: { total: 0, avgConfidence: 0, sum: 0 },
        company_name: { total: 0, avgConfidence: 0, sum: 0 },
      };

      invoices.forEach(invoice => {
        const breakdown = invoice.confidence?.breakdown || {};
        Object.keys(fieldStats).forEach(field => {
          if (breakdown[field] !== undefined && breakdown[field] !== null) {
            fieldStats[field].total++;
            fieldStats[field].sum += breakdown[field];
          }
        });
      });

      // Calculate averages
      Object.keys(fieldStats).forEach(field => {
        const stats = fieldStats[field];
        stats.avgConfidence = stats.total > 0 
          ? (stats.sum / stats.total) 
          : 0;
        delete stats.sum; // Remove temporary sum field
      });

      return fieldStats;
    } catch (error) {
      logger.error(`Field accuracy error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user activity statistics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<object>} Activity statistics
   */
  async getUserActivity(userId = null, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = { 
        createdAt: { $gte: startDate },
        isDeleted: false,
      };
      
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }

      const [dailyActivity, statusActivity] = await Promise.all([
        // Daily upload activity
        Invoice.aggregate([
          { $match: query },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Activity by status
        Invoice.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

      return {
        dailyActivity: dailyActivity.map(item => ({
          date: item._id,
          count: item.count,
          totalAmount: item.totalAmount || 0,
        })),
        statusActivity: statusActivity.map(item => ({
          status: item._id,
          count: item.count,
        })),
      };
    } catch (error) {
      logger.error(`User activity error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();