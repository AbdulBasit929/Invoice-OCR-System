// src/middleware/validation.js - IMPROVED Request Validation Middleware

const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorTypes');

// Check validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    // LOG THE VALIDATION ERRORS
    console.log('❌ [Validation] Validation failed!');
    console.log('📥 [Validation] Request body:', req.body);
    console.log('❌ [Validation] Errors:', JSON.stringify(errorMessages, null, 2));
    
    // Return error with details
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

// Common validation rules
const { body, param, query } = require('express-validator');

exports.loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

exports.invoiceIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid invoice ID'),
];

exports.userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
];

exports.invoiceQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['uploaded', 'processing', 'processed', 'validated', 'failed', 'exported'])
    .withMessage('Invalid status value'),
];

exports.invoiceUpdateValidation = [
  body('invoiceNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Invoice number cannot be empty'),
  body('invoiceDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('companyName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency code must be 3 characters'),
];