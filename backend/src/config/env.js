// src/config/env.js
require('dotenv').config();

module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',

  // Database
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT - ADD THESE
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

  // OCR API
  OCR_API_URL: process.env.OCR_API_URL || 'http://localhost:5000',
  OCR_API_TIMEOUT: parseInt(process.env.OCR_API_TIMEOUT, 10) || 120000,

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/png,image/jpeg,image/jpg').split(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Batch Processing
  BATCH_PROCESSING_SIZE: parseInt(process.env.BATCH_PROCESSING_SIZE, 10) || 10,
  BATCH_TIMEOUT: parseInt(process.env.BATCH_TIMEOUT, 10) || 300000,

  // Analytics
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ANALYTICS_RETENTION_DAYS: parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10) || 90,
};