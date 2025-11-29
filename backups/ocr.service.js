// src/services/ocr.service.js - OCR Service

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorTypes');

class OCRService {
  constructor() {
    this.ocrClient = axios.create({
      baseURL: config.OCR_API_URL,
      timeout: config.OCR_API_TIMEOUT,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Process invoice file with OCR API
   * @param {string} filePath - Path to the uploaded file
   * @param {object} options - Processing options
   * @returns {Promise<object>} OCR processing result
   */
  async processInvoice(filePath) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('useCache', 'true');
      form.append('useValidation', 'true');

      const response = await axios.post(
        process.env.OCR_API_URL + '/api/v1/process',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          timeout: 200000, // 120 seconds timeout
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'OCR processing failed');
      }
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Check OCR API health
   * @returns {Promise<object>} Health status
   */
  async checkHealth() {
    try {
      const response = await this.ocrClient.get('/health');
      return response.data;
    } catch (error) {
      logger.error(`OCR API health check failed: ${error.message}`);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Get cache statistics from OCR API
   * @returns {Promise<object>} Cache stats
   */
  async getCacheStats() {
    try {
      const response = await this.ocrClient.get('/api/v1/cache/stats');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get cache stats: ${error.message}`);
      throw new AppError('Failed to retrieve cache statistics', 500);
    }
  }

  /**
   * Clear OCR API cache
   * @returns {Promise<object>} Clear result
   */
  async clearCache() {
    try {
      const response = await this.ocrClient.post('/api/v1/cache/clear');
      return response.data;
    } catch (error) {
      logger.error(`Failed to clear cache: ${error.message}`);
      throw new AppError('Failed to clear cache', 500);
    }
  }
}

module.exports = new OCRService();

