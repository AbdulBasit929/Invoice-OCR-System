// src/routes/invoice.routes.js - Enhanced Invoice Routes

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { validateRequest } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiters
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads per 15 minutes
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const retryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 retries per hour
  message: 'Too many retry requests, please try again later',
});

// ======================
// UPLOAD ENDPOINTS
// ======================

/**
 * @route   POST /api/invoices/upload
 * @desc    Upload and process a single invoice
 * @access  Private
 * @body    {
 *   file: File (required),
 *   useCache: boolean (optional, default: true),
 *   useValidation: boolean (optional, default: true),
 *   autoCorrect: boolean (optional, default: false),
 *   language: string (optional, default: 'auto'),
 *   asyncProcessing: boolean (optional, default: true),
 *   priority: string (optional: 'low' | 'normal' | 'high' | 'urgent'),
 *   webhookUrl: string (optional),
 *   tags: string (optional, comma-separated),
 *   uploadSource: string (optional, default: 'web')
 * }
 */
router.post(
  '/upload',
  protect,
  uploadLimiter,
  uploadSingle('file'),
  invoiceController.uploadInvoice
);

/**
 * @route   POST /api/invoices/batch-upload
 * @desc    Upload and process multiple invoices
 * @access  Private
 */
router.post(
  '/batch-upload',
  protect,
  uploadLimiter,
  uploadMultiple('files', 10),
  invoiceController.batchUpload
);

// ======================
// STATUS & MONITORING
// ======================

/**
 * @route   GET /api/invoices/:id/status
 * @desc    Get invoice processing status
 * @access  Private
 * @returns {
 *   invoiceId: string,
 *   status: string,
 *   progress: number,
 *   queueInfo: object,
 *   processingTime: number,
 *   updatedAt: Date
 * }
 */
router.get(
  '/:id/status',
  protect,
  invoiceController.getInvoiceStatus
);

/**
 * @route   GET /api/invoices/:id/events
 * @desc    Stream processing events (Server-Sent Events)
 * @access  Private
 * @description Real-time updates for invoice processing
 */
router.get(
  '/:id/events',
  protect,
  invoiceController.streamProcessingEvents
);

/**
 * @route   POST /api/invoices/:id/retry
 * @desc    Retry failed invoice processing
 * @access  Private
 */
router.post(
  '/:id/retry',
  protect,
  retryLimiter,
  invoiceController.retryProcessing
);

// ======================
// CRUD OPERATIONS
// ======================

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices with filtering and pagination
 * @access  Private
 * @query   {
 *   page: number (default: 1),
 *   limit: number (default: 20),
 *   status: string (optional),
 *   startDate: Date (optional),
 *   endDate: Date (optional),
 *   search: string (optional),
 *   sortBy: string (default: 'createdAt'),
 *   sortOrder: string (default: 'desc')
 * }
 */
router.get(
  '/',
  protect,
  invoiceController.getInvoices
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get single invoice details
 * @access  Private
 */
router.get(
  '/:id',
  protect,
  invoiceController.getInvoice
);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update invoice (manual corrections)
 * @access  Private
 * @body    {
 *   invoiceNumber: string (optional),
 *   invoiceDate: Date (optional),
 *   companyName: string (optional),
 *   totalAmount: number (optional),
 *   currency: string (optional),
 *   contact: object (optional),
 *   notes: string (optional),
 *   tags: array (optional),
 *   sector: string (optional),
 *   vendor: string (optional),
 *   status: string (optional),
 *   correctionReason: string (optional)
 * }
 */
router.put(
  '/:id',
  protect,
  invoiceController.updateInvoice
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  protect,
  invoiceController.deleteInvoice
);

// ======================
// EXPORT OPERATIONS
// ======================

/**
 * @route   GET /api/invoices/:id/export/pdf
 * @desc    Export single invoice to PDF
 * @access  Private
 */
router.get(
  '/:id/export/pdf',
  protect,
  invoiceController.exportInvoicePDF
);

/**
 * @route   POST /api/invoices/export/excel
 * @desc    Export multiple invoices to Excel
 * @access  Private
 * @body    {
 *   invoiceIds: array<string> (required)
 * }
 */
router.post(
  '/export/excel',
  protect,
  invoiceController.exportInvoicesExcel
);

// ======================
// HISTORY & AUDIT
// ======================

/**
 * @route   GET /api/invoices/:id/history
 * @desc    Get invoice history (corrections, exports, activities)
 * @access  Private
 */
router.get(
  '/:id/history',
  protect,
  invoiceController.getInvoiceHistory
);

// ======================
// ADMIN OPERATIONS
// ======================

/**
 * @route   POST /api/invoices/:id/approve
 * @desc    Approve invoice (admin only)
 * @access  Private/Admin
 */
router.post(
  '/:id/approve',
  protect,
  authorize('admin', 'manager'),
  async (req, res, next) => {
    try {
      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      invoice.status = 'approved';
      invoice.approvedBy = req.user.id;
      invoice.approvedAt = new Date();
      await invoice.save();

      res.json({
        success: true,
        message: 'Invoice approved successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/invoices/:id/reject
 * @desc    Reject invoice (admin only)
 * @access  Private/Admin
 */
router.post(
  '/:id/reject',
  protect,
  authorize('admin', 'manager'),
  async (req, res, next) => {
    try {
      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      invoice.status = 'rejected';
      invoice.rejectedBy = req.user.id;
      invoice.rejectedAt = new Date();
      invoice.rejectionReason = req.body.reason;
      await invoice.save();

      res.json({
        success: true,
        message: 'Invoice rejected successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;