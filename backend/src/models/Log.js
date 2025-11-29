// src/models/Log.js - Activity Log Model

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    required: true,
    enum: [
      'upload',
      'process',
      'validate',
      'correct',
      'export',
      'delete',
      'reprocess',
      'login',
      'logout',
      'create_user',
      'update_user',
      'delete_user',
      'view',
      'search',
      'filter'
    ],
    index: true
  },
  
  resource: {
    type: String,
    enum: ['invoice', 'user', 'system'],
    required: true,
    index: true
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
    index: true
  },
  
  errorMessage: {
    type: String
  },
  
  duration: {
    type: Number // in milliseconds
  }
}, {
  timestamps: true
});

// Indexes for better query performance
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ resource: 1, resourceId: 1 });
logSchema.index({ createdAt: -1 });

// Static method to create log
logSchema.statics.createLog = async function(logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Error creating log:', error);
    // Don't throw error to prevent disrupting main operations
    return null;
  }
};

// Static method to get user activity
logSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

// Static method to get resource history
logSchema.statics.getResourceHistory = async function(resource, resourceId, limit = 20) {
  return await this.find({ resource, resourceId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

module.exports = mongoose.model('Log', logSchema);

