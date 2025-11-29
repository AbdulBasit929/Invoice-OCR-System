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

    const startTime = Date.now();

    // Process with OCR
    const ocrResult = await ocrService.processInvoice(req.file.path, {
      useCache: req.body.useCache !== 'false',
      useValidation: req.body.useValidation !== 'false',
      proximity: req.body.proximity ? parseInt(req.body.proximity) : null,
    });

    // Extract data from OCR result
    const invoiceData = ocrResult.invoice_data || {};

    // Create invoice record
    const invoice = await Invoice.create({
      userId: req.user.id,
      processingId: ocrResult.processing_id,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      invoiceNumber: invoiceData.invoice_number,
      invoiceDate: invoiceData.invoice_date ? new Date(invoiceData.invoice_date) : null,
      companyName: invoiceData.company_name,
      totalAmount: invoiceData.total_amount?.value,
      currency: invoiceData.total_amount?.currency || 'USD',
      contact: invoiceData.contact || {},
      rawText: ocrResult.raw_text,
      completeText: ocrResult.complete_text || ocrResult.raw_text,
      validation: ocrResult.validation,
      processingTime: ocrResult.processing_time,
      metadata: ocrResult.metadata,
      status: 'processed',
    });

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
      userId: req.user.id,
      action: 'upload',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Invoice uploaded: ${req.file.originalname}`,
      details: { processingId: ocrResult.processing_id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      duration: Date.now() - startTime,
    });

    logger.info(`Invoice processed successfully: ${invoice._id}`);

    res.status(201).json({
      success: true,
      data: invoice,
      duplicate: invoice.isDuplicate,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  console.log('======================================');
  console.log('🚀 getInvoices CALLED!');
  console.log('🔍 req.user:', req.user);
  console.log('======================================');
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
    } = req.query;

    // Build query
    const query = {
      userId: req.user.id,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
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

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-rawText -completeText'),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Generate PDF
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `invoice_${invoice.invoiceNumber || invoice._id}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, filename);

    await exportService.exportToPDF(invoice, filePath);

    // Track export
    invoice.exportHistory.push({
      exportedAt: new Date(),
      exportedBy: req.user.id,
      exportFormat: 'pdf',
    });
    await invoice.save();

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'export',
      resource: 'invoice',
      resourceId: invoice._id,
      description: `Exported invoice to PDF: ${invoice.invoiceNumber || invoice._id}`,
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

// @desc    Export multiple invoices to Excel
// @route   POST /api/v1/invoices/export/excel
// @access  Private
exports.exportInvoicesExcel = async (req, res, next) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return next(new AppError('Please provide invoice IDs', 400));
    }

    const invoices = await Invoice.find({
      _id: { $in: invoiceIds },
      userId: req.user.id,
      isDeleted: false,
    });

    if (invoices.length === 0) {
      return next(new NotFoundError('No invoices found'));
    }

    // Generate Excel
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `invoices_${Date.now()}.xlsx`;
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
        const ocrResult = await ocrService.processInvoice(file.path, {
          useCache: true,
          useValidation: true,
        });

        const invoiceData = ocrResult.invoice_data || {};

        const invoice = await Invoice.create({
          userId: req.user.id,
          processingId: ocrResult.processing_id,
          originalFilename: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          invoiceNumber: invoiceData.invoice_number,
          invoiceDate: invoiceData.invoice_date ? new Date(invoiceData.invoice_date) : null,
          companyName: invoiceData.company_name,
          totalAmount: invoiceData.total_amount?.value,
          currency: invoiceData.total_amount?.currency || 'USD',
          contact: invoiceData.contact || {},
          rawText: ocrResult.raw_text,
          completeText: ocrResult.complete_text || ocrResult.raw_text,
          validation: ocrResult.validation,
          processingTime: ocrResult.processing_time,
          metadata: ocrResult.metadata,
          status: 'processed',
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

