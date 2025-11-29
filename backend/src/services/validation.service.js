const Invoice = require('../models/Invoice');
const ValidationRule = require('../models/ValidationRule');
const logger = require('../utils/logger');

class ValidationService {
  constructor() {
    this.rulesCache = new Map();
    this._loadRules();
  }

  async _loadRules() {
    try {
      const rules = await ValidationRule.find({ isActive: true });
      rules.forEach(rule => {
        this.rulesCache.set(rule._id.toString(), rule);
      });
      logger.info(`Loaded ${rules.length} validation rules`, { rules: rules.map(r => r.fieldName) });
    } catch (error) {
      logger.error(`Failed to load validation rules: ${error.message}`, { error });
    }
  }

  async validateInvoiceData(invoiceData) {
    const validation = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      fieldValidations: {},
    };

    if (!invoiceData) {
      validation.isValid = false;
      validation.score = 0;
      validation.errors.push({
        field: 'general',
        message: 'No invoice data provided',
        severity: 'critical',
      });
      return validation;
    }

    await this._validateRequiredFields(invoiceData, validation);
    await this._validateFieldFormats(invoiceData, validation);
    await this._validateBusinessRules(invoiceData, validation);
    await this._validateDataConsistency(invoiceData, validation);
    validation.score = this._calculateValidationScore(validation);

    if (!this.rulesCache.size) {
      logger.warn('No custom validation rules loaded, using static validations only');
    }

    return validation;
  }

  async _validateRequiredFields(invoiceData, validation) {
    const requiredFields = [
      { field: 'invoice_number', weight: 25, message: 'Invoice number is required' },
      { field: 'total_amount', weight: 30, message: 'Total amount is required' },
      { field: 'invoice_date', weight: 20, message: 'Invoice date is required' },
      { field: 'company_name', weight: 15, message: 'Company name is required' },
    ];

    for (const { field, weight, message } of requiredFields) {
      const value = this._getNestedValue(invoiceData, field);
      
      if (!value || (typeof value === 'object' && !value.value)) {
        validation.errors.push({
          field,
          message,
          severity: 'high',
          weight,
        });
        validation.isValid = false;
      } else {
        validation.fieldValidations[field] = {
          isValid: true,
          value,
        };
      }
    }
  }

  async _validateFieldFormats(invoiceData, validation) {
    if (invoiceData.invoice_number) {
      const invoiceNumber = invoiceData.invoice_number.toString().trim();
      
      if (invoiceNumber.length < 3) {
        validation.warnings.push({
          field: 'invoice_number',
          message: 'Invoice number seems too short',
          severity: 'medium',
        });
      }

      if (invoiceNumber.length > 50) {
        validation.warnings.push({
          field: 'invoice_number',
          message: 'Invoice number seems too long',
          severity: 'medium',
        });
      }

      validation.fieldValidations.invoice_number = {
        ...validation.fieldValidations.invoice_number,
        format: 'valid',
        length: invoiceNumber.length,
      };
    }

    if (invoiceData.total_amount) {
      const amount = invoiceData.total_amount.value || invoiceData.total_amount;
      
      if (typeof amount !== 'number' || isNaN(amount)) {
        validation.errors.push({
          field: 'total_amount',
          message: 'Total amount must be a valid number',
          severity: 'high',
        });
        validation.isValid = false;
      } else if (amount <= 0) {
        validation.errors.push({
          field: 'total_amount',
          message: 'Total amount must be greater than zero',
          severity: 'high',
        });
        validation.isValid = false;
      } else if (amount > 1000000000) {
        validation.warnings.push({
          field: 'total_amount',
          message: 'Total amount seems unusually high',
          severity: 'medium',
        });
      }

      validation.fieldValidations.total_amount = {
        isValid: typeof amount === 'number' && amount > 0,
        value: amount,
        currency: invoiceData.total_amount.currency || 'USD',
      };
    }

    if (invoiceData.invoice_date) {
      const invoiceDate = new Date(invoiceData.invoice_date);
      const currentDate = new Date();
      const fiveYearsAgo = new Date(currentDate.getFullYear() - 5, currentDate.getMonth(), currentDate.getDate());
      const oneYearFuture = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());

      if (isNaN(invoiceDate.getTime())) {
        validation.errors.push({
          field: 'invoice_date',
          message: 'Invalid invoice date format',
          severity: 'high',
        });
        validation.isValid = false;
      } else {
        if (invoiceDate < fiveYearsAgo) {
          validation.warnings.push({
            field: 'invoice_date',
            message: 'Invoice date is more than 5 years old',
            severity: 'low',
          });
        }

        if (invoiceDate > oneYearFuture) {
          validation.warnings.push({
            field: 'invoice_date',
            message: 'Invoice date is more than 1 year in the future',
            severity: 'medium',
          });
        }

        validation.fieldValidations.invoice_date = {
          isValid: true,
          value: invoiceDate,
          formatted: invoiceDate.toISOString().split('T')[0],
        };
      }
    }

    if (invoiceData.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(invoiceData.contact.email);

      if (!isValidEmail) {
        validation.warnings.push({
          field: 'contact.email',
          message: 'Email format appears invalid',
          severity: 'low',
        });
      }

      validation.fieldValidations['contact.email'] = {
        isValid: isValidEmail,
        value: invoiceData.contact.email,
      };
    }

    if (invoiceData.contact?.phone) {
      const phoneRegex = /^[\d\s\-\+$$  $$]+$/;
      const isValidPhone = phoneRegex.test(invoiceData.contact.phone) && 
                          invoiceData.contact.phone.replace(/\D/g, '').length >= 10;

      if (!isValidPhone) {
        validation.warnings.push({
          field: 'contact.phone',
          message: 'Phone number format appears invalid',
          severity: 'low',
        });
      }

      validation.fieldValidations['contact.phone'] = {
        isValid: isValidPhone,
        value: invoiceData.contact.phone,
      };
    }
  }

  async _validateBusinessRules(invoiceData, validation) {
    if (invoiceData.invoice_date && invoiceData.due_date) {
      const invoiceDate = new Date(invoiceData.invoice_date);
      const dueDate = new Date(invoiceData.due_date);

      if (dueDate < invoiceDate) {
        validation.errors.push({
          field: 'due_date',
          message: 'Due date cannot be before invoice date',
          severity: 'high',
        });
        validation.isValid = false;
      }

      const daysDifference = Math.floor((dueDate - invoiceDate) / (1000 * 60 * 60 * 24));
      if (daysDifference > 365) {
        validation.warnings.push({
          field: 'due_date',
          message: 'Due date is more than 1 year after invoice date',
          severity: 'medium',
        });
      }
    }

    if (invoiceData.subtotal && invoiceData.tax_amount && invoiceData.total_amount) {
      const subtotal = invoiceData.subtotal.value || invoiceData.subtotal;
      const taxAmount = invoiceData.tax_amount.value || invoiceData.tax_amount;
      const totalAmount = invoiceData.total_amount.value || invoiceData.total_amount;

      const calculatedTotal = subtotal + taxAmount;
      const tolerance = 0.02;

      if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
        validation.warnings.push({
          field: 'total_amount',
          message: `Calculated total (${calculatedTotal}) doesn't match declared total (${totalAmount})`,
          severity: 'medium',
          details: {
            subtotal,
            taxAmount,
            calculatedTotal,
            declaredTotal: totalAmount,
            difference: Math.abs(calculatedTotal - totalAmount),
          },
        });
      }
    }

    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      await this._validateLineItems(invoiceData.items, invoiceData, validation);
    }

    await this._applyCustomRules(invoiceData, validation);
  }

  async _validateLineItems(items, invoiceData, validation) {
    if (items.length === 0) {
      validation.warnings.push({
        field: 'items',
        message: 'No line items found',
        severity: 'low',
      });
      return;
    }

    let itemsTotal = 0;
    const itemValidations = [];

    items.forEach((item, index) => {
      const itemValidation = {
        index,
        isValid: true,
        errors: [],
      };

      if (!item.description || item.description.trim() === '') {
        itemValidation.errors.push('Missing description');
        itemValidation.isValid = false;
      }

      if (!item.quantity || item.quantity <= 0) {
        itemValidation.errors.push('Invalid quantity');
        itemValidation.isValid = false;
      }

      if (!item.unit_price || item.unit_price <= 0) {
        itemValidation.errors.push('Invalid unit price');
        itemValidation.isValid = false;
      }

      if (!item.total || item.total <= 0) {
        itemValidation.errors.push('Invalid total');
        itemValidation.isValid = false;
      }

      const calculatedTotal = item.quantity * item.unit_price;
      if (Math.abs(calculatedTotal - item.total) > 0.01) {
        itemValidation.errors.push(`Calculated total (${calculatedTotal}) doesn't match item total (${item.total})`);
      }

      itemsTotal += item.total;
      itemValidations.push(itemValidation);
    });

    const invoiceTotal = invoiceData.total_amount?.value || invoiceData.total_amount;
    const subtotal = invoiceData.subtotal?.value || invoiceData.subtotal;

    const compareWith = subtotal || invoiceTotal;
    if (compareWith && Math.abs(itemsTotal - compareWith) > compareWith * 0.01) {
      validation.warnings.push({
        field: 'items',
        message: `Line items total (${itemsTotal}) doesn't match invoice ${subtotal ? 'subtotal' : 'total'} (${compareWith})`,
        severity: 'medium',
        details: {
          itemsTotal,
          invoiceTotal: compareWith,
          difference: Math.abs(itemsTotal - compareWith),
        },
      });
    }

    validation.fieldValidations.items = {
      count: items.length,
      total: itemsTotal,
      validations: itemValidations,
    };
  }

  async _validateDataConsistency(invoiceData, validation) {
    if (invoiceData.total_amount?.currency) {
      const currency = invoiceData.total_amount.currency;
      
      if (invoiceData.subtotal?.currency && invoiceData.subtotal.currency !== currency) {
        validation.warnings.push({
          field: 'currency',
          message: 'Currency mismatch between total and subtotal',
          severity: 'high',
        });
      }

      if (invoiceData.tax_amount?.currency && invoiceData.tax_amount.currency !== currency) {
        validation.warnings.push({
          field: 'currency',
          message: 'Currency mismatch between total and tax amount',
          severity: 'high',
        });
      }
    }

    const stringFields = ['invoice_number', 'company_name'];
    stringFields.forEach(field => {
      const value = this._getNestedValue(invoiceData, field);
      if (value && typeof value === 'string' && value.trim() === '') {
        validation.warnings.push({
          field,
          message: `${field} contains only whitespace`,
          severity: 'medium',
        });
      }
    });
  }

  async _applyCustomRules(invoiceData, validation) {
    for (const [, rule] of this.rulesCache) {
      try {
        const result = await ValidationRule.validateField(rule.fieldName, this._getNestedValue(invoiceData, rule.fieldName));
        if (!result.valid) {
          const issue = {
            field: rule.fieldName,
            message: result.errors.join(', '),
            severity: rule.fieldType === 'critical' ? 'error' : rule.fieldType === 'important' ? 'high' : 'low',
            ruleId: rule._id,
          };
          if (rule.fieldType === 'critical') {
            validation.errors.push(issue);
            validation.isValid = false;
          } else {
            validation.warnings.push(issue);
          }
        }
      } catch (error) {
        logger.error(`Error evaluating rule ${rule._id} for ${rule.fieldName}: ${error.message}`);
      }
    }
  }

  _calculateValidationScore(validation) {
    let score = 100;

    validation.errors.forEach(error => {
      const deduction = error.weight || (error.severity === 'critical' ? 30 : error.severity === 'high' ? 20 : 10);
      score -= deduction;
    });

    validation.warnings.forEach(warning => {
      const deduction = warning.severity === 'high' ? 5 : warning.severity === 'medium' ? 3 : 1;
      score -= deduction;
    });

    return Math.max(0, Math.min(100, score));
  }

  async checkDuplicate(invoiceNumber, invoiceDate, totalAmount, excludeId) {
    if (!invoiceNumber || !invoiceDate || !totalAmount) {
      return null;
    }

    try {
      const dateRange = {
        $gte: new Date(new Date(invoiceDate).setDate(new Date(invoiceDate).getDate() - 7)),
        $lte: new Date(new Date(invoiceDate).setDate(new Date(invoiceDate).getDate() + 7)),
      };

      const duplicate = await Invoice.findOne({
        _id: { $ne: excludeId },
        invoiceNumber: { $regex: new RegExp(`^${invoiceNumber}$`, 'i') },
        invoiceDate: dateRange,
        totalAmount: {
          $gte: totalAmount * 0.95,
          $lte: totalAmount * 1.05,
        },
        isDeleted: false,
        status: { $in: ['processed', 'validated', 'approved'] },
      });

      return duplicate;

    } catch (error) {
      logger.error(`Error checking for duplicates: ${error.message}`);
      return null;
    }
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async reloadRules() {
    this.rulesCache.clear();
    await this._loadRules();
    logger.info('Validation rules reloaded');
  }
}

module.exports = new ValidationService();