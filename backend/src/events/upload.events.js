// src/events/upload.events.js - Centralized Event Emitter for Upload Events

const EventEmitter = require('events');

/**
 * Upload Events Emitter
 * Handles all upload and processing related events
 */
class UploadEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Increase if you have many listeners
  }

  /**
   * Emit processing progress event
   * @param {string} invoiceId - Invoice ID
   * @param {string} stage - Processing stage
   * @param {number} progress - Progress percentage (0-100)
   * @param {string|null} error - Error message if any
   */
  emitProcessing(invoiceId, stage, progress, error = null) {
    this.emit('processing', {
      invoiceId,
      stage,
      progress,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit upload event
   * @param {string} invoiceId - Invoice ID
   * @param {object} data - Upload data
   */
  emitUpload(invoiceId, data) {
    this.emit('upload', {
      invoiceId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit completion event
   * @param {string} invoiceId - Invoice ID
   * @param {object} result - Processing result
   */
  emitComplete(invoiceId, result) {
    this.emit('complete', {
      invoiceId,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit error event
   * @param {string} invoiceId - Invoice ID
   * @param {Error} error - Error object
   */
  emitError(invoiceId, error) {
    this.emit('error', {
      invoiceId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create and export singleton instance
const uploadEvents = new UploadEvents();

module.exports = { uploadEvents, UploadEvents };