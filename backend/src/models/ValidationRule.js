// src/models/ValidationRule.js - Validation Rules Model

const mongoose = require('mongoose');

const validationRuleSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'invoiceNumber',
      'invoiceDate',
      'companyName',
      'totalAmount',
      'currency',
      'phone',
      'email'
    ]
  },
  
  fieldType: {
    type: String,
    required: true,
    enum: ['critical', 'important', 'optional']
  },
  
  rules: {
    required: {
      type: Boolean,
      default: false
    },
    minLength: Number,
    maxLength: Number,
    minValue: Number,
    maxValue: Number,
    pattern: String,
    customValidator: String // Function name for custom validation
  },
  
  errorMessages: {
    required: String,
    invalid: String,
    tooShort: String,
    tooLong: String,
    outOfRange: String
  },
  
  autoCorrect: {
    enabled: {
      type: Boolean,
      default: false
    },
    strategy: String // e.g., 'trim', 'uppercase', 'format-date'
  },
  
  confidenceThreshold: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to get active rules
validationRuleSchema.statics.getActiveRules = async function() {
  return await this.find({ isActive: true }).select('-__v');
};

// Static method to validate field
validationRuleSchema.statics.validateField = async function(fieldName, value) {
  const rule = await this.findOne({ fieldName, isActive: true });
  
  if (!rule) {
    return { valid: true, message: 'No validation rule found' };
  }
  
  const errors = [];
  
  // Required check
  if (rule.rules.required && (!value || value === '')) {
    errors.push(rule.errorMessages.required || `${fieldName} is required`);
  }
  
  if (value) {
    // Length checks for strings
    if (typeof value === 'string') {
      if (rule.rules.minLength && value.length < rule.rules.minLength) {
        errors.push(rule.errorMessages.tooShort || `${fieldName} is too short`);
      }
      if (rule.rules.maxLength && value.length > rule.rules.maxLength) {
        errors.push(rule.errorMessages.tooLong || `${fieldName} is too long`);
      }
      
      // Pattern check
      if (rule.rules.pattern) {
        const regex = new RegExp(rule.rules.pattern);
        if (!regex.test(value)) {
          errors.push(rule.errorMessages.invalid || `${fieldName} format is invalid`);
        }
      }
    }
    
    // Value range checks for numbers
    if (typeof value === 'number') {
      if (rule.rules.minValue !== undefined && value < rule.rules.minValue) {
        errors.push(rule.errorMessages.outOfRange || `${fieldName} is below minimum`);
      }
      if (rule.rules.maxValue !== undefined && value > rule.rules.maxValue) {
        errors.push(rule.errorMessages.outOfRange || `${fieldName} exceeds maximum`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    fieldType: rule.fieldType
  };
};

module.exports = mongoose.model('ValidationRule', validationRuleSchema);
