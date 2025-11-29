// src/controllers/invoice.controller.js - Invoice Controller

const Invoice = require('../models/Invoice');
const Log = require('../models/Log');
const ocrService = require('../services/ocr.service');
const validationService = require('../services/validation.service');
const exportService = require('../services/export.service');
const { AppError, NotFoundError } = require('../utils/errorTypes');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// @desc    Upload and process invoice
// @route   POST /api/v1/invoices/upload
// @access  Private
exports.uploadInvoice = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    logger.info(`File uploaded: ${req.file.originalname} by user ${req.user.id}`);

    const startTime = Date.now();

    // Log the optimized file path
    logger.info(`Image optimized: ${path.basename(req.file.path)}`);

    // Create invoice record FIRST with 'pending' status
    const invoice = await Invoice.create({
      userId: req.user.id,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      status: 'pending', // Set to pending initially
    });

    logger.info(`Invoice record created: ${invoice._id}`);

    // NOW trigger OCR processing in the background
    // This allows the request to return quickly while OCR processes
    processInvoiceWithOCR(invoice._id, req.file.path, req.user.id).catch(error => {
      logger.error(`OCR processing failed for invoice ${invoice._id}: ${error.message}`);
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice uploaded successfully and is being processed'
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Background OCR processing function
async function processInvoiceWithOCR(invoiceId, filePath, userId) {
  try {
    logger.info(`Starting OCR processing for invoice ${invoiceId}`);

    // Update status to processing
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'processing'
    });

    // Process with OCR
    const ocrResult = await ocrService.processInvoice(filePath, {
      useCache: true,
      useValidation: true,
    });

    logger.info(`OCR processing completed for invoice ${invoiceId}`);

    // Extract data from OCR result
    const invoiceData = ocrResult.invoice_data || {};

    // Update invoice with OCR results
    const invoice = await Invoice.findById(invoiceId);
    
    invoice.processingId = ocrResult.processing_id;
    invoice.invoiceNumber = invoiceData.invoice_number;
    invoice.invoiceDate = invoiceData.invoice_date ? new Date(invoiceData.invoice_date) : null;
    invoice.companyName = invoiceData.company_name;
    invoice.totalAmount = invoiceData.total_amount?.value;
    invoice.currency = invoiceData.total_amount?.currency || 'USD';
    invoice.contact = invoiceData.contact || {};
    invoice.rawText = ocrResult.raw_text;
    invoice.completeText = ocrResult.complete_text || ocrResult.raw_text;
    //invoice.validation = ocrResult.validation;
    invoice.validation = normalizeValidation(ocrResult.validation);
    invoice.processingTime = ocrResult.processing_time;
    invoice.metadata = ocrResult.metadata;
    invoice.status = 'processed';

    await invoice.save();

    // Check for duplicates
    const duplicate = await validationService.checkDuplicate(
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.totalAmount,
      invoice._id
    );

    if (duplicate) {
      invoice.isDuplicate = true;
      invoice.duplicateOf = duplicate._id;
      await invoice.save();
    }

    // Log activity
    await Log.createLog({
      userId: userId,
      action: 'process',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Invoice processed: ${invoice.invoiceNumber || invoice._id}`,
      details: { processingId: ocrResult.processing_id },
    });

    logger.info(`Invoice processed successfully: ${invoice._id}`);

  } catch (error) {
    logger.error(`Error in OCR processing for invoice ${invoiceId}: ${error.message}`);
    
    // Update status to failed
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'failed',
      processingError: error.message
    });
  }
}

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeUnprocessed, // ✅ NEW: Allow fetching all statuses
    } = req.query;

    // Build query
    const query = {
      userId: req.user.id,
      isDeleted: false,
    };

    // ✅ FIXED: By default, only show processed invoices
    // When includeUnprocessed='true', show ALL statuses
    if (includeUnprocessed !== 'true' && !status) {
      query.status = { $in: ['processed', 'validated', 'approved'] };
      console.log('📊 Filtering to only show processed invoices');
    }

    // If specific status is requested, use that
    if (status) {
      query.status = status;
      console.log(`📊 Filtering by status: ${status}`);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    console.log('📊 Invoice query:', JSON.stringify(query, null, 2));

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-rawText -completeText') // Exclude large text fields
        .lean(),
      Invoice.countDocuments(query),
    ]);

    console.log(`✅ Found ${invoices.length} invoices (total: ${total})`);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    next(error);
  }
};
function normalizeValidation(validation = {}) {
  const normalizeList = (input) => {
    if (!input) return [];

    // Convert single string → [{ message: string }]
    if (typeof input === "string") {
      return [{ message: input }];
    }

    // Convert array of strings → [{ message: string }]
    if (Array.isArray(input)) {
      return input.map((w) =>
        typeof w === "string" ? { message: w } : w
      );
    }

    // Already array of objects OR unknown
    return [];
  };

  return {
    isValid: validation.isValid ?? false,
    score: validation.score ?? 0,
    errors: normalizeList(validation.errors),
    warnings: normalizeList(validation.warnings),
    fieldValidations: validation.fieldValidations ?? {},
  };
}

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Log view activity
    await Log.createLog({
      userId: req.user.id,
      action: 'view',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Viewed invoice: ${invoice.invoiceNumber || invoice._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    const allowedFields = [
      'invoiceNumber',
      'invoiceDate',
      'companyName',
      'totalAmount',
      'currency',
      'contact',
      'notes',
      'tags',
      'sector',
      'vendor',
      'status',
    ];

    // Track corrections
    const corrections = [];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== invoice[field]) {
        corrections.push({
          field,
          oldValue: invoice[field],
          newValue: req.body[field],
        });
        invoice[field] = req.body[field];
      }
    });

    // Add corrections to history
    if (corrections.length > 0) {
      corrections.forEach(correction => {
        invoice.corrections.push({
          field: correction.field,
          oldValue: correction.oldValue,
          newValue: correction.newValue,
          correctedBy: req.user.id,
          correctedAt: new Date(),
          reason: req.body.correctionReason,
        });
      });

      // Update status if not already validated
      if (invoice.status === 'processed') {
        invoice.status = 'validated';
      }
    }

    await invoice.save();

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'correct',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Updated invoice: ${invoice.invoiceNumber || invoice._id}`,
      details: { corrections },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Invoice updated: ${invoice._id}`);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Soft delete
    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    invoice.deletedBy = req.user.id;
    await invoice.save();

    // Delete physical file
    if (fs.existsSync(invoice.filePath)) {
      fs.unlinkSync(invoice.filePath);
    }

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'delete',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Deleted invoice: ${invoice.invoiceNumber || invoice._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Invoice deleted: ${invoice._id}`);

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export single invoice to PDF
// @route   GET /api/v1/invoices/:id/export/pdf
// @access  Private
exports.exportInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Ensure export directory exists
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      logger.info(`✅ Created export directory: ${exportDir}`);
    }

    // Generate safe filename
    const safeInvoiceNumber = (invoice.invoiceNumber || invoice._id.toString())
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const filename = `invoice_${safeInvoiceNumber}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, filename);

    logger.info(`📄 Generating PDF for invoice ${invoice._id}`);
    logger.info(`📁 File path: ${filePath}`);

    // Generate PDF using the export service
    await exportService.exportToPDF(invoice, filePath);

    // Verify file was created (CRITICAL FIX)
    if (!fs.existsSync(filePath)) {
      logger.error(`❌ PDF file not found after generation: ${filePath}`);
      return next(new AppError('PDF generation failed - file not created', 500));
    }

    const stats = fs.statSync(filePath);
    logger.info(`✅ PDF generated successfully: ${filename} (${stats.size} bytes)`);

    // Track export in invoice history
    try {
      invoice.exportHistory = invoice.exportHistory || [];
      invoice.exportHistory.push({
        exportedAt: new Date(),
        exportedBy: req.user.id,
        exportFormat: 'pdf',
        filename: filename,
      });
      await invoice.save();
    } catch (error) {
      logger.warn(`Failed to save export history: ${error.message}`);
    }

    // Log the activity
    try {
      await Log.createLog({
        userId: req.user.id,
        action: 'export',
        resource: 'invoice',
        resourceId: invoice._id,
        description: `Exported invoice ${invoice.invoiceNumber || invoice._id} to PDF`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      logger.warn(`Failed to create log entry: ${error.message}`);
    }

    // Send file to client
    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error(`❌ Error sending PDF file: ${err.message}`);
        if (!res.headersSent) {
          return next(new AppError('Failed to send PDF file', 500));
        }
      } else {
        logger.info(`✅ PDF sent to client: ${filename}`);
      }

      // Clean up file after sending (after 10 seconds)
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`🗑️  Cleaned up temporary PDF: ${filename}`);
        }
      }, 10000);
    });

  } catch (error) {
    logger.error(`❌ PDF export error: ${error.message}`);
    logger.error(error.stack);
    next(error);
  }
};






// @desc    Export multiple invoices to Excel
// @route   POST /api/v1/invoices/export/excel
// @access  Private
exports.exportInvoicesExcel = async (req, res, next) => {
  try {
    const { invoiceIds, filters } = req.body;

    let query = { userId: req.user.id, isDeleted: false };

    if (invoiceIds && invoiceIds.length > 0) {
      query._id = { $in: invoiceIds };
    } else if (filters) {
      if (filters.status) query.status = filters.status;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const invoices = await Invoice.find(query).select('-rawText -completeText');

    if (invoices.length === 0) {
      return next(new AppError('No invoices found to export', 404));
    }

    // Generate Excel
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `invoices_export_${Date.now()}.xlsx`;
    const filePath = path.join(exportDir, filename);

    await exportService.exportToExcel(invoices, filePath);

    // Track exports
    const exportRecord = {
      exportedAt: new Date(),
      exportedBy: req.user.id,
      exportFormat: 'excel',
    };

    await Promise.all(
      invoices.map(invoice => {
        invoice.exportHistory.push(exportRecord);
        return invoice.save();
      })
    );

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'export',
      resource: 'invoice',
      description: `Exported ${invoices.length} invoices to Excel`,
      details: { count: invoices.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Send file
    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error(`Error sending file: ${err.message}`);
      }
      // Clean up file after sending
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch upload invoices
// @route   POST /api/v1/invoices/batch-upload
// @access  Private
exports.batchUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please upload at least one file', 400));
    }

    const results = [];
    const errors = [];

    // Process each file
    for (const file of req.files) {
      try {
        logger.info(`File uploaded: ${file.originalname} by user ${req.user.id}`);
        logger.info(`Image optimized: ${path.basename(file.path)}`);

        // Create invoice record with pending status
        const invoice = await Invoice.create({
          userId: req.user.id,
          originalFilename: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          status: 'pending',
        });

        logger.info(`Invoice record created: ${invoice._id}`);

        // Trigger OCR processing in background
        processInvoiceWithOCR(invoice._id, file.path, req.user.id).catch(error => {
          logger.error(`OCR processing failed for invoice ${invoice._id}: ${error.message}`);
        });

        results.push({
          filename: file.originalname,
          invoiceId: invoice._id,
          success: true,
        });
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message,
          success: false,
        });

        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'upload',
      resource: 'invoice',
      description: `Batch upload: ${results.length} successful, ${errors.length} failed`,
      details: { total: req.files.length, successful: results.length, failed: errors.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Batch upload completed: ${results.length}/${req.files.length} successful`);

    res.status(201).json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total: req.files.length,
          successful: results.length,
          failed: errors.length,
        },
      },
      message: 'Files uploaded successfully and are being processed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice history (corrections, exports)
// @route   GET /api/v1/invoices/:id/history
// @access  Private
exports.getInvoiceHistory = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    }).populate('corrections.correctedBy', 'name email');

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    const logs = await Log.getResourceHistory('invoice', invoice._id);

    res.json({
      success: true,
      data: {
        corrections: invoice.corrections,
        exportHistory: invoice.exportHistory,
        activityLogs: logs,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Export all functions for ES6 destructuring in routes
module.exports = {
  uploadInvoice: exports.uploadInvoice,
  getInvoices: exports.getInvoices,
  getInvoice: exports.getInvoice,
  updateInvoice: exports.updateInvoice,
  deleteInvoice: exports.deleteInvoice,
  exportInvoicePDF: exports.exportInvoicePDF,
  exportInvoicesExcel: exports.exportInvoicesExcel,
  batchUpload: exports.batchUpload,
  getInvoiceHistory: exports.getInvoiceHistory,
};
// @desc    Get invoice processing status
// @route   GET /api/v1/invoices/:id/status
// @access  Private
exports.getInvoiceStatus = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    }).select('status processingError processingTime createdAt updatedAt');

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Calculate progress based on status
    let progress = 0;
    switch (invoice.status) {
      case 'pending':
        progress = 10;
        break;
      case 'processing':
        progress = 50;
        break;
      case 'processed':
      case 'validated':
      case 'approved':
        progress = 100;
        break;
      case 'failed':
      case 'rejected':
        progress = 0;
        break;
      default:
        progress = 0;
    }

    const response = {
      invoiceId: invoice._id,
      status: invoice.status,
      progress,
      processingTime: invoice.processingTime || null,
      error: invoice.processingError || null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream processing events (Server-Sent Events)
// @route   GET /api/v1/invoices/:id/events
// @access  Private
exports.streamProcessingEvents = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial status
    res.write(`data: ${JSON.stringify({
      status: invoice.status,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    // Poll for status changes every 2 seconds
    const intervalId = setInterval(async () => {
      try {
        const updatedInvoice = await Invoice.findById(req.params.id)
          .select('status processingError processingTime');

        if (!updatedInvoice) {
          clearInterval(intervalId);
          res.end();
          return;
        }

        res.write(`data: ${JSON.stringify({
          status: updatedInvoice.status,
          error: updatedInvoice.processingError,
          processingTime: updatedInvoice.processingTime,
          timestamp: new Date().toISOString(),
        })}\n\n`);

        // Stop streaming if processing is complete or failed
        if (['processed', 'validated', 'approved', 'failed', 'rejected'].includes(updatedInvoice.status)) {
          clearInterval(intervalId);
          res.end();
        }
      } catch (error) {
        clearInterval(intervalId);
        res.end();
      }
    }, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Retry failed invoice processing
// @route   POST /api/v1/invoices/:id/retry
// @access  Private
exports.retryProcessing = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    });

    if (!invoice) {
      return next(new NotFoundError('Invoice not found'));
    }

    // Only allow retry for failed invoices
    if (invoice.status !== 'failed') {
      return next(new AppError('Can only retry failed invoices', 400));
    }

    // Check if file still exists
    if (!fs.existsSync(invoice.filePath)) {
      return next(new AppError('Invoice file not found. Please re-upload.', 404));
    }

    // Reset status to pending
    invoice.status = 'pending';
    invoice.processingError = null;
    await invoice.save();

    logger.info(`Retrying invoice processing: ${invoice._id}`);

    // Trigger OCR processing again
    processInvoiceWithOCR(invoice._id, invoice.filePath, req.user.id).catch(error => {
      logger.error(`OCR retry failed for invoice ${invoice._id}: ${error.message}`);
    });

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'retry',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Retrying invoice processing: ${invoice._id}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Invoice processing retry initiated',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// Export all functions for ES6 destructuring in routes
module.exports = {
  uploadInvoice: exports.uploadInvoice,
  getInvoices: exports.getInvoices,
  getInvoice: exports.getInvoice,
  updateInvoice: exports.updateInvoice,
  deleteInvoice: exports.deleteInvoice,
  exportInvoicePDF: exports.exportInvoicePDF,
  exportInvoicesExcel: exports.exportInvoicesExcel,
  batchUpload: exports.batchUpload,
  getInvoiceHistory: exports.getInvoiceHistory,
  getInvoiceStatus: exports.getInvoiceStatus,
  streamProcessingEvents: exports.streamProcessingEvents,
  retryProcessing: exports.retryProcessing,
};