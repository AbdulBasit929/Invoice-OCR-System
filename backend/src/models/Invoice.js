// src/models/Invoice.js - Enhanced Invoice Model

const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Processing Information
  processingId: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'processed',
      'requires_review',
      'validated',
      'approved',
      'rejected',
      'failed',
    ],
    default: 'pending',
    index: true,
  },
  processingStartedAt: Date,
  processingCompletedAt: Date,
  processingTime: Number, // in milliseconds
  retryCount: {
    type: Number,
    default: 0,
  },

  // File Information
  originalFilename: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
    index: true,
  },

  // Invoice Data
  invoiceNumber: {
    type: String,
    index: true,
  },
  invoiceDate: {
    type: Date,
    index: true,
  },
  dueDate: Date,
  companyName: {
    type: String,
    index: true,
  },
  
  // Financial Information
  totalAmount: {
    type: Number,
    index: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  subtotal: Number,
  taxAmount: Number,
  discountAmount: Number,
  
  // Contact Information
  contact: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },

  // Line Items
  items: [{
    description: String,
    quantity: Number,
    unit_price: Number,
    total: Number,
    tax_rate: Number,
  }],

  // OCR Results
  rawText: String,
  completeText: String,
  
  // Validation
  validation: {
    isValid: Boolean,
    score: Number,
    errors: [{
      field: String,
      message: String,
      severity: String,
      weight: Number,
    }],
    warnings: [{
      field: String,
      message: String,
      severity: String,
    }],
    fieldValidations: mongoose.Schema.Types.Mixed,
  },

  // Confidence & Quality
  confidence: {
    overall: Number,
    breakdown: mongoose.Schema.Types.Mixed,
  },

  // Metadata
  metadata: {
    ocrEngine: String,
    processingEngine: String,
    dataQuality: String,
    processingDate: String,
    corrections: [{
      field: String,
      original: mongoose.Schema.Types.Mixed,
      corrected: mongoose.Schema.Types.Mixed,
    }],
    type: mongoose.Schema.Types.Mixed,
  },

  // Upload Metadata
  uploadMetadata: {
    ipAddress: String,
    userAgent: String,
    uploadedAt: Date,
    uploadSource: String,
  },

  // Corrections History
  corrections: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    correctedAt: Date,
    reason: String,
  }],

  // Export History
  exportHistory: [{
    exportedAt: Date,
    exportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    exportFormat: String,
  }],

  // Duplicate Detection
  isDuplicate: {
    type: Boolean,
    default: false,
    index: true,
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  duplicateReason: String,

  // Classification
  tags: [String],
  sector: String,
  vendor: String,
  notes: String,

  // Approval Workflow
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: Date,
  rejectionReason: String,

  // Error Handling
  errorMessage: String,
  errorDetails: {
    message: String,
    stack: String,
    attempt: Number,
    timestamp: Date,
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index({ userId: 1, status: 1 });
InvoiceSchema.index({ invoiceNumber: 1, invoiceDate: 1, totalAmount: 1 });
InvoiceSchema.index({ status: 1, createdAt: -1 });
InvoiceSchema.index({ fileHash: 1, userId: 1 });
InvoiceSchema.index({ 'validation.score': -1 });
InvoiceSchema.index({ isDuplicate: 1, isDeleted: 1 });

// Virtual for age in days
InvoiceSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for processing duration
InvoiceSchema.virtual('processingDuration').get(function() {
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt - this.processingStartedAt;
  }
  return null;
});

// Virtual for validation status
InvoiceSchema.virtual('validationStatus').get(function() {
  if (!this.validation || !this.validation.score) return 'unknown';
  
  const score = this.validation.score;
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
});

// Methods

/**
 * Check if invoice is editable
 */
InvoiceSchema.methods.isEditable = function() {
  return ['processed', 'requires_review', 'validated'].includes(this.status);
};

/**
 * Check if invoice can be approved
 */
InvoiceSchema.methods.canApprove = function() {
  return ['processed', 'validated'].includes(this.status) && !this.isDuplicate;
};

/**
 * Check if invoice can be exported
 */
InvoiceSchema.methods.canExport = function() {
  return ['processed', 'validated', 'approved'].includes(this.status);
};

/**
 * Add correction to history
 */
InvoiceSchema.methods.addCorrection = function(field, newValue, userId, reason) {
  this.corrections.push({
    field,
    oldValue: this[field],
    newValue,
    correctedBy: userId,
    correctedAt: new Date(),
    reason,
  });
  
  this[field] = newValue;
};

/**
 * Mark as duplicate
 */
InvoiceSchema.methods.markAsDuplicate = function(originalInvoiceId, reason) {
  this.isDuplicate = true;
  this.duplicateOf = originalInvoiceId;
  this.duplicateReason = reason;
  this.status = 'requires_review';
};

/**
 * Get summary for dashboard
 */
InvoiceSchema.methods.getSummary = function() {
  return {
    id: this._id,
    invoiceNumber: this.invoiceNumber,
    companyName: this.companyName,
    totalAmount: this.totalAmount,
    currency: this.currency,
    invoiceDate: this.invoiceDate,
    status: this.status,
    isDuplicate: this.isDuplicate,
    validationScore: this.validation?.score,
    confidence: this.confidence?.overall,
    createdAt: this.createdAt,
  };
};

// Static Methods

/**
 * Get invoices by status
 */
InvoiceSchema.statics.getByStatus = function(userId, status) {
  return this.find({
    userId,
    status,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

/**
 * Get recent invoices
 */
InvoiceSchema.statics.getRecent = function(userId, limit = 10) {
  return this.find({
    userId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-rawText -completeText');
};

/**
 * Get invoices requiring review
 */
InvoiceSchema.statics.getRequiringReview = function(userId) {
  return this.find({
    userId,
    status: 'requires_review',
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

/**
 * Get duplicate invoices
 */
InvoiceSchema.statics.getDuplicates = function(userId) {
  return this.find({
    userId,
    isDuplicate: true,
    isDeleted: false,
  })
    .populate('duplicateOf', 'invoiceNumber totalAmount invoiceDate')
    .sort({ createdAt: -1 });
};

/**
 * Get processing statistics
 */
InvoiceSchema.statics.getProcessingStats = async function(userId, startDate, endDate) {
  const match = {
    userId: mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        processed: {
          $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        duplicates: {
          $sum: { $cond: ['$isDuplicate', 1, 0] }
        },
        averageProcessingTime: { $avg: '$processingTime' },
        averageValidationScore: { $avg: '$validation.score' },
        totalAmount: { $sum: '$totalAmount' },
      }
    }
  ]);

  return stats[0] || {};
};

// Pre-save middleware
InvoiceSchema.pre('save', function(next) {
  // Auto-set processing completed time
  if (this.isModified('status') && 
      ['processed', 'failed', 'validated', 'approved', 'rejected'].includes(this.status) &&
      this.processingStartedAt && !this.processingCompletedAt) {
    this.processingCompletedAt = new Date();
  }

  // Calculate processing time
  if (this.processingStartedAt && this.processingCompletedAt && !this.processingTime) {
    this.processingTime = this.processingCompletedAt - this.processingStartedAt;
  }

  next();
});

// Pre-remove middleware
InvoiceSchema.pre('remove', function(next) {
  // Clean up associated files
  const fs = require('fs');
  if (this.filePath && fs.existsSync(this.filePath)) {
    fs.unlinkSync(this.filePath);
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);