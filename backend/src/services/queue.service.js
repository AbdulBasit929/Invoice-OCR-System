// src/services/queue.service.js - Advanced Queue Service for Async Processing

const Queue = require('bull');
const config = require('../config/env');
const logger = require('../utils/logger');
const Invoice = require('../models/Invoice');
const ocrService = require('./ocr.service');
const validationService = require('./validation.service');
const notificationService = require('./notification.service');
const { uploadEvents } = require('../events/upload.events');

class QueueService {
  constructor() {
    // Initialize Redis connection config
    const redisConfig = {
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
      password: config.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    // Create queues
    this.invoiceQueue = new Queue('invoice-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    });

    this.notificationQueue = new Queue('notifications', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    });

    // Setup queue processors
    this._setupProcessors();
    
    // Setup event listeners
    this._setupEventListeners();

    logger.info('Queue service initialized');
  }

  /**
   * Add job to invoice processing queue
   * @param {string} queueName - Queue identifier
   * @param {object} data - Job data
   * @param {object} options - Job options
   * @returns {Promise<object>} Job info
   */
  async addToQueue(queueName, data, options = {}) {
    try {
      const queue = this._getQueue(queueName);
      
      const job = await queue.add(data, {
        priority: this._getPriority(data.priority),
        jobId: data.invoiceId, // Use invoice ID as job ID for tracking
        ...options,
      });

      logger.info(`Job added to ${queueName} queue: ${job.id}`);

      return {
        jobId: job.id,
        queueName,
        status: 'queued',
        data: job.data,
      };

    } catch (error) {
      logger.error(`Failed to add job to ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get job status
   * @param {string} queueName - Queue identifier
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      const queue = this._getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return {
          found: false,
          message: 'Job not found in queue',
        };
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        found: true,
        jobId: job.id,
        state,
        progress,
        attemptsMade: job.attemptsMade,
        data: job.data,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };

    } catch (error) {
      logger.error(`Failed to get job status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove job from queue
   * @param {string} queueName - Queue identifier
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async removeJob(queueName, jobId) {
    try {
      const queue = this._getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (job) {
        await job.remove();
        logger.info(`Job removed from ${queueName}: ${jobId}`);
        return true;
      }

      return false;

    } catch (error) {
      logger.error(`Failed to remove job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @param {string} queueName - Queue identifier
   * @returns {Promise<object>} Queue stats
   */
  async getQueueStats(queueName) {
    try {
      const queue = this._getQueue(queueName);

      const [
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
      ] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getPausedCount(),
      ]);

      return {
        queueName,
        counts: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused,
          total: waiting + active + completed + failed + delayed + paused,
        },
        isPaused: await queue.isPaused(),
      };

    } catch (error) {
      logger.error(`Failed to get queue stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pause queue
   * @param {string} queueName - Queue identifier
   * @returns {Promise<boolean>} Success status
   */
  async pauseQueue(queueName) {
    try {
      const queue = this._getQueue(queueName);
      await queue.pause();
      logger.info(`Queue paused: ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resume queue
   * @param {string} queueName - Queue identifier
   * @returns {Promise<boolean>} Success status
   */
  async resumeQueue(queueName) {
    try {
      const queue = this._getQueue(queueName);
      await queue.resume();
      logger.info(`Queue resumed: ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean old jobs from queue
   * @param {string} queueName - Queue identifier
   * @param {number} grace - Grace period in ms
   * @param {string} status - Job status to clean
   * @returns {Promise<array>} Cleaned job IDs
   */
  async cleanQueue(queueName, grace = 86400000, status = 'completed') {
    try {
      const queue = this._getQueue(queueName);
      const jobs = await queue.clean(grace, status);
      logger.info(`Cleaned ${jobs.length} ${status} jobs from ${queueName}`);
      return jobs;
    } catch (error) {
      logger.error(`Failed to clean queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup queue processors
   * @private
   */
  _setupProcessors() {
    // Invoice processing processor
    this.invoiceQueue.process(async (job) => {
      return await this._processInvoice(job);
    });

    // Notification processor
    this.notificationQueue.process(async (job) => {
      return await this._sendNotification(job);
    });

    logger.info('Queue processors initialized');
  }

  /**
   * Process invoice job
   * @private
   */
  async _processInvoice(job) {
    const { invoiceId, userId, filePath, ...options } = job.data;
    const startTime = Date.now();

    try {
      logger.info(`Processing invoice ${invoiceId}, attempt ${job.attemptsMade + 1}`);

      // Update progress: Starting
      await job.progress(10);
      this._emitProgress(invoiceId, 'started', 10);

      // Load invoice record
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update status
      invoice.status = 'processing';
      invoice.processingStartedAt = new Date();
      await invoice.save();

      // Update progress: OCR Processing
      await job.progress(30);
      this._emitProgress(invoiceId, 'ocr_processing', 30);

      // Process with OCR
      const ocrResult = await ocrService.processInvoice(filePath, {
        useCache: options.useCache,
        useValidation: options.useValidation,
        autoCorrect: options.autoCorrect,
        language: options.language,
      });

      // Update progress: Extracting Data
      await job.progress(60);
      this._emitProgress(invoiceId, 'extracting_data', 60);

      // Extract invoice data
      const invoiceData = ocrResult.invoice_data || {};

      // Update progress: Validating
      await job.progress(75);
      this._emitProgress(invoiceId, 'validating', 75);

      // Validate data
      const validationResults = await validationService.validateInvoiceData(invoiceData);

      // Update invoice record
      invoice.processingId = ocrResult.processing_id;
      invoice.invoiceNumber = invoiceData.invoice_number;
      invoice.invoiceDate = invoiceData.invoice_date ? new Date(invoiceData.invoice_date) : null;
      invoice.dueDate = invoiceData.due_date ? new Date(invoiceData.due_date) : null;
      invoice.companyName = invoiceData.company_name;
      invoice.totalAmount = invoiceData.total_amount?.value;
      invoice.currency = invoiceData.total_amount?.currency || 'USD';
      invoice.taxAmount = invoiceData.tax_amount?.value;
      invoice.subtotal = invoiceData.subtotal?.value;
      invoice.contact = invoiceData.contact || {};
      invoice.items = invoiceData.items || [];
      invoice.rawText = ocrResult.raw_text;
      invoice.completeText = ocrResult.complete_text || ocrResult.raw_text;
      invoice.validation = {
        ...ocrResult.validation,
        businessValidation: validationResults,
      };
      invoice.processingTime = Date.now() - startTime;
      invoice.metadata = {
        ...invoice.metadata,
        ...ocrResult.metadata,
        processingEngine: ocrResult.engine || 'paddleocr',
        confidence: ocrResult.confidence,
      };
      invoice.status = validationResults.isValid ? 'processed' : 'requires_review';
      invoice.processingCompletedAt = new Date();

      // Update progress: Checking Duplicates
      await job.progress(85);
      this._emitProgress(invoiceId, 'checking_duplicates', 85);

      // Check for duplicates
      const duplicate = await this._checkDuplicate(
        invoice.invoiceNumber,
        invoice.invoiceDate,
        invoice.totalAmount,
        invoice._id
      );

      if (duplicate) {
        invoice.isDuplicate = true;
        invoice.duplicateOf = duplicate._id;
        invoice.duplicateReason = 'Similar invoice found';
      }

      await invoice.save();

      // Update progress: Complete
      await job.progress(100);
      this._emitProgress(invoiceId, 'completed', 100);

      // Send notification
      if (options.webhookUrl) {
        await this.addToQueue('notifications', {
          type: 'webhook',
          url: options.webhookUrl,
          data: {
            event: 'invoice.processed',
            invoiceId: invoice._id,
            status: invoice.status,
            invoice: invoice.toObject(),
          },
        });
      }

      logger.info(`Invoice processed successfully: ${invoiceId}`);

      return {
        success: true,
        invoiceId,
        status: invoice.status,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      logger.error(`Invoice processing failed: ${invoiceId}`, {
        error: error.message,
        attempt: job.attemptsMade + 1,
      });

      // Update invoice status on failure
      try {
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) {
          invoice.status = 'failed';
          invoice.errorMessage = error.message;
          invoice.errorDetails = {
            message: error.message,
            stack: error.stack,
            attempt: job.attemptsMade + 1,
            timestamp: new Date(),
          };
          await invoice.save();
        }
      } catch (updateError) {
        logger.error(`Failed to update invoice status: ${updateError.message}`);
      }

      this._emitProgress(invoiceId, 'failed', 0, error.message);

      throw error;
    }
  }

  /**
   * Send notification job
   * @private
   */
  async _sendNotification(job) {
    const { type, url, data } = job.data;

    try {
      logger.info(`Sending ${type} notification`);

      if (type === 'webhook') {
        await notificationService.sendWebhook(url, data);
      } else if (type === 'email') {
        await notificationService.sendEmail(data);
      }

      logger.info(`${type} notification sent successfully`);

      return { success: true, type };

    } catch (error) {
      logger.error(`Notification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for duplicate invoices
   * @private
   */
  async _checkDuplicate(invoiceNumber, invoiceDate, totalAmount, excludeId) {
    if (!invoiceNumber || !invoiceDate || !totalAmount) {
      return null;
    }

    const dateRange = {
      $gte: new Date(new Date(invoiceDate).setDate(new Date(invoiceDate).getDate() - 7)),
      $lte: new Date(new Date(invoiceDate).setDate(new Date(invoiceDate).getDate() + 7)),
    };

    return await Invoice.findOne({
      _id: { $ne: excludeId },
      invoiceNumber: { $regex: new RegExp(`^${invoiceNumber}$`, 'i') },
      invoiceDate: dateRange,
      totalAmount: {
        $gte: totalAmount * 0.95,
        $lte: totalAmount * 1.05,
      },
      isDeleted: false,
    });
  }

  /**
   * Emit progress event
   * @private
   */
  _emitProgress(invoiceId, stage, progress, error = null) {
    uploadEvents.emit('processing', {
      invoiceId,
      stage,
      progress,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get queue instance
   * @private
   */
  _getQueue(queueName) {
    const queues = {
      'invoice-processing': this.invoiceQueue,
      'notifications': this.notificationQueue,
    };

    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    return queue;
  }

  /**
   * Get job priority from string
   * @private
   */
  _getPriority(priority) {
    const priorities = {
      low: 10,
      normal: 5,
      high: 1,
      urgent: 0,
    };

    return priorities[priority] || priorities.normal;
  }

  /**
   * Setup event listeners for queue monitoring
   * @private
   */
  _setupEventListeners() {
    // Invoice Queue Events
    this.invoiceQueue.on('completed', (job, result) => {
      logger.info(`Job completed: ${job.id}`, { result });
    });

    this.invoiceQueue.on('failed', (job, error) => {
      logger.error(`Job failed: ${job.id}`, { 
        error: error.message,
        attempts: job.attemptsMade,
      });
    });

    this.invoiceQueue.on('stalled', (job) => {
      logger.warn(`Job stalled: ${job.id}`);
    });

    this.invoiceQueue.on('progress', (job, progress) => {
      logger.debug(`Job progress: ${job.id} - ${progress}%`);
    });

    // Notification Queue Events
    this.notificationQueue.on('completed', (job) => {
      logger.info(`Notification sent: ${job.id}`);
    });

    this.notificationQueue.on('failed', (job, error) => {
      logger.error(`Notification failed: ${job.id}`, { error: error.message });
    });

    logger.info('Queue event listeners initialized');
  }

  /**
   * Graceful shutdown
   */
  async close() {
    logger.info('Closing queue service...');
    
    await Promise.all([
      this.invoiceQueue.close(),
      this.notificationQueue.close(),
    ]);

    logger.info('Queue service closed');
  }
}

const queueServiceInstance = new QueueService();
module.exports = queueServiceInstance;