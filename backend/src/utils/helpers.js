// src/utils/helpers.js

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Clean up old files from directory
 * @param {string} directory - Directory path
 * @param {number} maxAgeHours - Maximum file age in hours
 */
const cleanupOldFiles = (directory, maxAgeHours = 24) => {
  if (!fs.existsSync(directory)) return;

  const stat = fs.statSync(directory);
  if (!stat.isDirectory()) {
    logger.warn(`cleanupOldFiles: ${directory} is not a directory`);
    return;
  }

  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  fs.readdirSync(directory).forEach(file => {
    const filePath = path.join(directory, file);
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (err) {
      logger.warn(`Could not stat file: ${filePath}`);
      return;
    }

    if (stats.isFile() && now - stats.mtimeMs > maxAge) {
      try {
        fs.unlinkSync(filePath);
        logger.debug(`Deleted old file: ${filePath}`);
      } catch (err) {
        logger.error(`Failed to delete file: ${filePath}`, err);
      }
    }
  });
};

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
};

/**
 * Normalize validation data from OCR API
 * Ensures warnings and errors are always arrays
 * @param {object} validation - Validation object from OCR API
 * @returns {object} Normalized validation object
 */
const normalizeValidation = (validation) => {
  if (!validation) return null;

  const normalized = { ...validation };

  // Normalize warnings
  if (validation.warnings) {
    if (typeof validation.warnings === 'string') {
      normalized.warnings = [validation.warnings];
      logger.debug('Normalized warnings from string to array');
    } else if (!Array.isArray(validation.warnings)) {
      normalized.warnings = [];
      logger.warn('Invalid warnings type, setting to empty array');
    }
  } else {
    normalized.warnings = [];
  }

  // Normalize errors
  if (validation.errors) {
    if (typeof validation.errors === 'string') {
      normalized.errors = [validation.errors];
      logger.debug('Normalized errors from string to array');
    } else if (!Array.isArray(validation.errors)) {
      normalized.errors = [];
      logger.warn('Invalid errors type, setting to empty array');
    }
  } else {
    normalized.errors = [];
  }

  return normalized;
};

/**
 * Format OCR response for database storage
 * @param {object} ocrResult - Raw OCR API response
 * @returns {object} Formatted OCR result
 */
const formatOCRResponse = (ocrResult) => {
  if (!ocrResult) return null;
  console.log('🔧 formatOCRResponse called!'); // ← ADD THIS LINE
  logger.info('🔧 Formatting OCR response'); 
  const formatted = { ...ocrResult };

  if (formatted.validation) {
    formatted.validation = normalizeValidation(formatted.validation);
    logger.info('✅ Validation normalized'); 
  }

  return formatted;
};

// Export all functions
module.exports = {
  cleanupOldFiles,
  formatBytes,
  generateRandomString,
  sanitizeFilename,
  normalizeValidation,
  formatOCRResponse
};