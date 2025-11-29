// src/services/ocr.service.js - 

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config/env');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorTypes');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const { formatOCRResponse } = require('../utils/helpers');

// PDF processing
const { convert } = require('pdf-poppler');

class OCRService {
  constructor() {
    this.ocrClient = axios.create({
      baseURL: config.OCR_API_URL || 'http://localhost:5000',
      timeout: config.OCR_API_TIMEOUT || 220000,
    });

    this.cache = new NodeCache({ 
      stdTTL: 86400,
      checkperiod: 3600,
      useClones: false 
    });

    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageProcessingTime: 0,
    };

    this._setupInterceptors();
  }

  /**
   * Main processing method - handles both images and PDFs
   */
  async processInvoice(filePath, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      logger.info('🔄 Starting invoice processing', {
        filePath,
        fileSize: fsSync.statSync(filePath).size,
        isPDF: this._isPDF(filePath)
      });

      // Check if file is PDF
      const isPDF = this._isPDF(filePath);
      
      let imagePathToProcess = filePath;
      let convertedImage = null;

      // Convert PDF to image if necessary
      if (isPDF) {
        logger.info('📄 PDF detected, converting to image...');
        imagePathToProcess = await this._convertPDFToImage(filePath);
        convertedImage = imagePathToProcess;
        
        logger.info('✅ PDF converted successfully', {
          outputPath: imagePathToProcess,
          outputSize: fsSync.statSync(imagePathToProcess).size
        });
      }

      // Generate cache key from the processed image
      const cacheKey = await this._generateCacheKey(imagePathToProcess);

      // Check cache
      if (options.useCache !== false) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          logger.info(`✅ Cache hit: ${cacheKey}`);
          
          // Cleanup converted image if exists
          if (convertedImage) {
            try {
              await fs.unlink(convertedImage);
            } catch (e) {}
          }
          
          return {
            ...cachedResult,
            cached: true,
            cacheKey,
          };
        }
      }

      // Validate file
      await this._validateFile(imagePathToProcess);

      // Process with OCR API
      const result = await this._processWithRetry(imagePathToProcess, options);

      // Enhance results
      const enhancedResult = await this._enhanceResults(result, options);

      // Cache the result
      if (options.useCache !== false && enhancedResult.success) {
        this.cache.set(cacheKey, enhancedResult);
        logger.info(`📦 Result cached: ${cacheKey}`);
      }

      // Cleanup converted image
      if (convertedImage) {
        try {
          await fs.unlink(convertedImage);
          logger.info('🧹 Cleaned up temporary converted image');
        } catch (e) {
          logger.warn('Failed to cleanup converted image:', e.message);
        }
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this._updateAverageProcessingTime(processingTime);

      // Format and return result
      const formattedResult = formatOCRResponse(enhancedResult);
      
      logger.info('✅ Processing completed', {
        processingTime,
        textLength: formattedResult.raw_text?.length || 0,
        hasInvoiceData: !!formattedResult.invoice_data
      });
      
      return {
        ...formattedResult,
        cached: false,
        processing_time: processingTime,
      };

    } catch (error) {
      this.metrics.failedRequests++;
      logger.error('❌ OCR processing failed', {
        error: error.message,
        filePath,
        stack: error.stack
      });
      
      throw new AppError(`OCR processing failed: ${error.message}`, 500);
    }
  }

  /**
   * Check if file is PDF
   */
  _isPDF(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') return true;
    
    // Check magic bytes
    try {
      const buffer = fsSync.readFileSync(filePath, { start: 0, end: 5 });
      return buffer.toString('latin1').startsWith('%PDF-');
    } catch (e) {
      return false;
    }
  }

  /**
   * Convert PDF to image using pdf-poppler
   */
  async _convertPDFToImage(pdfPath) {
    try {
      // Create temporary directory
      const tempDir = path.join(os.tmpdir(), 'ocr_pdf_conversions');
      await fs.mkdir(tempDir, { recursive: true });

      const timestamp = Date.now();
      const prefix = `pdf_${timestamp}`;

      logger.info('🔄 Converting PDF to image with poppler', {
        pdfPath,
        tempDir,
        prefix
      });

      // Convert PDF (first page only for now)
      const options = {
        format: 'png',
        out_dir: tempDir,
        out_prefix: prefix,
        page: 1, // First page only
        scale: 2048, // High resolution for better OCR
        single_file: true,
        print_settings: null
      };

      // Perform conversion
      await convert(pdfPath, options);

      // Find the converted file
      const files = await fs.readdir(tempDir);
      const convertedFile = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));

      if (!convertedFile) {
        throw new Error('PDF conversion produced no output file');
      }

      const convertedPath = path.join(tempDir, convertedFile);

      // Verify file exists and has content
      const stats = await fs.stat(convertedPath);
      if (stats.size === 0) {
        throw new Error('Converted image is empty');
      }

      logger.info('✅ PDF converted successfully', {
        outputFile: convertedFile,
        size: stats.size,
        path: convertedPath
      });

      return convertedPath;

    } catch (error) {
      logger.error('❌ PDF conversion failed', {
        error: error.message,
        pdfPath,
        stack: error.stack
      });
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  /**
   * Process with retry logic
   */
  async _processWithRetry(filePath, options, attempt = 1) {
    try {
      logger.info(`📤 OCR attempt ${attempt}/${this.retryConfig.maxRetries}`);

      // Verify file exists before sending
      const fileExists = fsSync.existsSync(filePath);
      if (!fileExists) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileSize = fsSync.statSync(filePath).size;
      logger.info(`📊 File info: ${fileSize} bytes`);

      // Create form data
      const form = new FormData();
      form.append('file', fsSync.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: 'image/png'
      });
      
      // Add processing options
      form.append('useCache', String(options.useCache !== false));
      form.append('useValidation', String(options.useValidation !== false));
      
      if (options.autoCorrect) {
        form.append('autoCorrect', 'true');
      }
      
      if (options.language) {
        form.append('language', options.language);
      }

      logger.info('🌐 Sending request to OCR API...', {
        url: `${this.ocrClient.defaults.baseURL}/api/v1/process`,
        fileSize
      });

      // Send request
      const response = await this.ocrClient.post('/api/v1/process', form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 200000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      logger.info('📥 Received response from OCR API', {
        status: response.status,
        success: response.data.success
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'OCR processing failed');
      }

      // Check if we got any text
      if (!response.data.raw_text || response.data.raw_text.trim().length === 0) {
        logger.warn('⚠️ No text extracted from document');
      } else {
        logger.info(`✅ Text extracted: ${response.data.raw_text.length} characters`);
      }

      return response.data;

    } catch (error) {
      logger.error(`❌ OCR attempt ${attempt} failed`, {
        error: error.message,
        code: error.code,
        response: error.response?.data
      });

      // Check if we should retry
      if (attempt < this.retryConfig.maxRetries && this._isRetryableError(error)) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        logger.warn(`⏳ Retrying in ${delay}ms...`);
        await this._sleep(delay);
        
        return this._processWithRetry(filePath, options, attempt + 1);
      }

      // No more retries
      throw error;
    }
  }

  /**
   * Enhance OCR results
   */
  async _enhanceResults(result, options) {
    try {
      const enhanced = { ...result };

      // Calculate confidence
      enhanced.confidence = this._calculateConfidence(result);

      // Validate extracted data
      if (options.useValidation !== false) {
        enhanced.validation = await this._validateExtractedData(result.invoice_data);
      }

      // Auto-correct if enabled
      if (options.autoCorrect) {
        enhanced.invoice_data = this._autoCorrectData(result.invoice_data);
      }

      // Add metadata
      enhanced.metadata = {
        ...result.metadata,
        ocrEngine: result.engine || 'paddleocr',
        processingDate: new Date().toISOString(),
        dataQuality: this._assessDataQuality(result.invoice_data),
      };

      return enhanced;

    } catch (error) {
      logger.error(`Error enhancing results: ${error.message}`);
      return result;
    }
  }

  /**
   * Calculate confidence score
   */
  _calculateConfidence(result) {
    try {
      const invoiceData = result.invoice_data || {};
      const scores = [];

      if (invoiceData.invoice_number?.confidence) {
        scores.push(invoiceData.invoice_number.confidence);
      }
      if (invoiceData.total_amount?.confidence) {
        scores.push(invoiceData.total_amount.confidence);
      }
      if (invoiceData.invoice_date?.confidence) {
        scores.push(invoiceData.invoice_date.confidence);
      }
      if (invoiceData.company_name?.confidence) {
        scores.push(invoiceData.company_name.confidence);
      }

      if (scores.length === 0) return 0.5;
      
      const avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      return {
        overall: avgConfidence,
        breakdown: {
          invoice_number: invoiceData.invoice_number?.confidence || 0,
          total_amount: invoiceData.total_amount?.confidence || 0,
          invoice_date: invoiceData.invoice_date?.confidence || 0,
          company_name: invoiceData.company_name?.confidence || 0,
        },
      };

    } catch (error) {
      return { overall: 0.5, breakdown: {} };
    }
  }

  /**
   * Validate extracted data
   */
  async _validateExtractedData(invoiceData) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (!invoiceData) {
      validation.valid = false;
      validation.errors.push('No invoice data extracted');
      return validation;
    }

    // Required fields
    if (!invoiceData.invoice_number) {
      validation.warnings.push('Invoice number is missing');
    }

    if (!invoiceData.total_amount || !invoiceData.total_amount.value) {
      validation.errors.push('Total amount is missing or invalid');
      validation.valid = false;
    }

    if (!invoiceData.invoice_date) {
      validation.warnings.push('Invoice date is missing');
    }

    return validation;
  }

  /**
   * Auto-correct common OCR errors
   */
  _autoCorrectData(invoiceData) {
    if (!invoiceData) return invoiceData;

    const corrected = { ...invoiceData };

    // Correct invoice number
    if (corrected.invoice_number) {
      let correctedNumber = corrected.invoice_number.toString().trim();
      
      if (correctedNumber !== corrected.invoice_number) {
        corrected._corrections = corrected._corrections || [];
        corrected._corrections.push({
          field: 'invoice_number',
          original: corrected.invoice_number,
          corrected: correctedNumber,
        });
        corrected.invoice_number = correctedNumber;
      }
    }

    // Correct total amount
    if (corrected.total_amount?.value) {
      let amount = corrected.total_amount.value.toString().replace(/[^0-9.]/g, '');
      const parsed = parseFloat(amount);
      
      if (!isNaN(parsed) && parsed !== corrected.total_amount.value) {
        corrected._corrections = corrected._corrections || [];
        corrected._corrections.push({
          field: 'total_amount',
          original: corrected.total_amount.value,
          corrected: parsed,
        });
        corrected.total_amount.value = parsed;
      }
    }

    return corrected;
  }

  /**
   * Assess data quality
   */
  _assessDataQuality(invoiceData) {
    if (!invoiceData) return 'poor';

    let score = 0;
    const weights = {
      invoice_number: 25,
      total_amount: 30,
      invoice_date: 20,
      company_name: 15,
      contact: 10,
    };

    if (invoiceData.invoice_number) score += weights.invoice_number;
    if (invoiceData.total_amount?.value > 0) score += weights.total_amount;
    if (invoiceData.invoice_date) score += weights.invoice_date;
    if (invoiceData.company_name) score += weights.company_name;
    if (invoiceData.contact?.email || invoiceData.contact?.phone) score += weights.contact;

    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Generate cache key
   */
  async _generateCacheKey(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      return `ocr_${hash}`;
    } catch (error) {
      return `ocr_${Date.now()}_${Math.random()}`;
    }
  }

  /**
   * Validate file
   */
  async _validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
    } catch (error) {
      throw new AppError(`Invalid file: ${error.message}`, 400);
    }
  }

  /**
   * Check if error is retryable
   */
  _isRetryableError(error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    if (error.response && error.response.status >= 500) {
      return true;
    }

    if (error.code === 'ECONNABORTED') {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update average processing time
   */
  _updateAverageProcessingTime(newTime) {
    const total = this.metrics.averageProcessingTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageProcessingTime = (total + newTime) / this.metrics.successfulRequests;
  }

  /**
   * Setup axios interceptors
   */
  _setupInterceptors() {
    this.ocrClient.interceptors.request.use(
      (config) => {
        logger.debug(`OCR API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error(`OCR API Request Error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    this.ocrClient.interceptors.response.use(
      (response) => {
        logger.debug(`OCR API Response: ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(`OCR API Error Response: ${error.response.status} ${error.response.data?.error || error.message}`);
        } else {
          logger.error(`OCR API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check
   */
  async checkHealth() {
    try {
      const startTime = Date.now();
      const response = await this.ocrClient.get('/health', { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        apiVersion: response.data.version,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`OCR API health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: this.metrics.totalRequests > 0
        ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime) + 'ms',
    };
  }

  /**
   * Clear cache
   */
  clearLocalCache() {
    const keys = this.cache.keys();
    this.cache.flushAll();
    logger.info(`Local cache cleared: ${keys.length} entries removed`);
    
    return {
      success: true,
      clearedEntries: keys.length,
    };
  }
}

module.exports = new OCRService();
