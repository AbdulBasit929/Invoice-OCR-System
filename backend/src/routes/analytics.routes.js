// src/routes/analytics.routes.js - FIXED Analytics Routes

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// ✅ FIXED: Match frontend API calls exactly

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overview statistics (matches frontend: /analytics/overview?period=30d)
 * @access  Private
 */
router.get('/overview', analyticsController.getOverview);

/**
 * @route   GET /api/analytics/status-distribution
 * @desc    Get status distribution (matches frontend: /analytics/status-distribution)
 * @access  Private
 */
router.get('/status-distribution', analyticsController.getStatusDistribution);

/**
 * @route   GET /api/analytics/top-vendors
 * @desc    Get top vendors (matches frontend: /analytics/top-vendors?limit=10)
 * @access  Private
 */
router.get('/top-vendors', analyticsController.getTopVendors);

/**
 * @route   GET /api/analytics/invoices-over-time
 * @desc    Get invoices over time
 * @access  Private
 */
router.get('/invoices-over-time', analyticsController.getInvoicesOverTime);

/**
 * @route   GET /api/analytics/field-accuracy
 * @desc    Get field accuracy statistics
 * @access  Private
 */
router.get('/field-accuracy', analyticsController.getFieldAccuracy);

/**
 * @route   GET /api/analytics/processing-time
 * @desc    Get processing time statistics
 * @access  Private
 */
router.get('/processing-time', analyticsController.getProcessingTimeStats);

/**
 * @route   GET /api/analytics/amount-statistics
 * @desc    Get amount statistics
 * @access  Private
 */
router.get('/amount-statistics', analyticsController.getAmountStatistics);

/**
 * @route   GET /api/analytics/validation-errors
 * @desc    Get validation errors
 * @access  Private
 */
router.get('/validation-errors', analyticsController.getValidationErrors);

/**
 * @route   GET /api/analytics/user-activity
 * @desc    Get user activity
 * @access  Private
 */
router.get('/user-activity', analyticsController.getUserActivity);

/**
 * @route   POST /api/analytics/export
 * @desc    Export analytics report
 * @access  Private
 */
router.post('/export', analyticsController.exportReport);

// Legacy routes (keep for backward compatibility)
router.get('/dashboard', analyticsController.getOverview);
router.get('/time-series', analyticsController.getInvoicesOverTime);
router.get('/vendors', analyticsController.getTopVendors);
router.get('/accuracy', analyticsController.getFieldAccuracy);
router.get('/activity', analyticsController.getUserActivity);

module.exports = router;