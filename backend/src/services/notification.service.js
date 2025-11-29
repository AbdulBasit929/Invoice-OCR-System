// src/services/notification.service.js - Notification Service

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class NotificationService {
  constructor() {
    this.webhookClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Invoice-OCR-System/1.0',
      },
    });

    // Webhook retry configuration
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Send webhook notification
   * @param {string} url - Webhook URL
   * @param {object} data - Payload data
   * @returns {Promise<object>} Response
   */
  async sendWebhook(url, data) {
    return await this._sendWithRetry(url, data);
  }

  /**
   * Send webhook with retry logic
   * @private
   */
  async _sendWithRetry(url, data, attempt = 1) {
    try {
      logger.info(`Sending webhook to ${url}, attempt ${attempt}`);

      const response = await this.webhookClient.post(url, {
        ...data,
        timestamp: new Date().toISOString(),
        attempt,
      });

      logger.info(`Webhook sent successfully to ${url}`);

      return {
        success: true,
        statusCode: response.status,
        attempt,
      };

    } catch (error) {
      logger.error(`Webhook failed (attempt ${attempt}): ${error.message}`);

      // Retry if not last attempt
      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        logger.info(`Retrying webhook in ${delay}ms`);
        await this._sleep(delay);
        
        return await this._sendWithRetry(url, data, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Send email notification (placeholder for future implementation)
   * @param {object} emailData - Email data
   * @returns {Promise<object>} Response
   */
  async sendEmail(emailData) {
    // TODO: Implement email sending (SendGrid, AWS SES, etc.)
    logger.info('Email notification:', emailData);
    
    return {
      success: true,
      message: 'Email notification queued',
    };
  }

  /**
   * Sleep utility
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationService();