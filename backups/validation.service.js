// src/services/validation.service.js - Validation Service

const Invoice = require('../models/Invoice');
const ValidationRule = require('../models/ValidationRule');
const logger = require('../utils/logger');

class ValidationService {
  /**
   * Validate invoice data against rules
   * @param {object} invoiceData - Invoice data to validate
   * @returns {Promise<object>} Validation results
   */
  async validateInvoiceData(invoiceData) {
    try {
      const rules = await ValidationRule.getActiveRules();
      const validationResults = {};
      let overallValid = true;

      for (const rule of rules) {
        const value = invoiceData[rule.fieldName];
        const result = await ValidationRule.validateField(rule.fieldName, value);
        
        validationResults[rule.fieldName] = result;
        
        if (!result.valid && rule.fieldType === 'critical') {
          overallValid = false;
        }
      }

      return {
        valid: overallValid,
        results: validationResults,
      };
    } catch (error) {
      logger.error(`Validation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for duplicate invoices
   * @param {string} invoiceNumber
   * @param {Date} invoiceDate  
   * @param {number} totalAmount
   * @param {string} excludeId - Invoice ID to exclude from search
   * @returns {Promise<object|null>} Duplicate invoice or null
   */
  async checkDuplicate(invoiceNumber, invoiceDate, totalAmount, excludeId = null) {
    try {
      if (!invoiceNumber || !invoiceDate || !totalAmount) {
        return null;
      }

      const query = {
        invoiceNumber,
        invoiceDate,
        totalAmount,
        isDeleted: false,
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const duplicate = await Invoice.findOne(query);
      return duplicate;
    } catch (error) {
      logger.error(`Duplicate check error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate confidence scores for invoice fields
   * @param {object} invoiceData - Invoice data
   * @param {object} validation - Validation results
   * @returns {object} Confidence scores
   */
  calculateConfidenceScores(invoiceData, validation) {
    const scores = {};
    const fields = ['invoiceNumber', 'invoiceDate', 'companyName', 'totalAmount'];

    fields.forEach(field => {
      let confidence = 0.5; // Default medium confidence

      // Check if field exists and has value
      if (invoiceData[field]) {
        confidence = 0.7;

        // Boost confidence if validation passed
        if (validation && validation.results && validation.results[field]) {
          if (validation.results[field].valid) {
            confidence = 0.95;
          } else {
            confidence = 0.4;
          }
        }

        // Check data quality
        const value = invoiceData[field];
        if (typeof value === 'string') {
          // Penalize if too short
          if (value.length < 3) {
            confidence *= 0.7;
          }
          // Penalize if contains many special characters (possible OCR errors)
          const specialChars = value.match(/[^a-zA-Z0-9\s.-]/g);
          if (specialChars && specialChars.length > value.length * 0.2) {
            confidence *= 0.8;
          }
        }
      } else {
        confidence = 0.0; // No data
      }

      scores[field] = Math.max(0, Math.min(1, confidence));
    });

    return scores;
  }
}

module.exports = new ValidationService();

