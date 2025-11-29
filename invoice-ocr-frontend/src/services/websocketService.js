// src/services/websocketService.js - REAL-TIME UPDATES SERVICE
// WebSocket connection for live invoice status updates and notifications

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - Authentication token
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ WebSocket connection in progress...');
      return;
    }

    try {
      this.isConnecting = true;
      
      // Get WebSocket URL from environment or use default
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      // Create WebSocket connection with authentication
      this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

      // Connection opened
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected', { timestamp: new Date() });
      };

      // Listen for messages
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      // Connection closed
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        } else {
          console.error('❌ Max reconnection attempts reached');
          this.emit('error', { message: 'Failed to reconnect to server' });
        }
      };

      // Connection error
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { message: 'WebSocket connection error' });
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.emit('error', { message: error.message });
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {object} data - Message data
   */
  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'INVOICE_STATUS_UPDATE':
        console.log('📊 Invoice status updated:', payload);
        this.emit('invoiceStatusUpdate', payload);
        break;

      case 'INVOICE_CREATED':
        console.log('✨ New invoice created:', payload);
        this.emit('invoiceCreated', payload);
        break;

      case 'INVOICE_UPDATED':
        console.log('📝 Invoice updated:', payload);
        this.emit('invoiceUpdated', payload);
        break;

      case 'INVOICE_DELETED':
        console.log('🗑️ Invoice deleted:', payload);
        this.emit('invoiceDeleted', payload);
        break;

      case 'PROCESSING_PROGRESS':
        console.log('⏳ Processing progress:', payload);
        this.emit('processingProgress', payload);
        break;

      case 'NOTIFICATION':
        console.log('🔔 Notification:', payload);
        this.emit('notification', payload);
        break;

      case 'HEARTBEAT':
        // Respond to server heartbeat
        this.send({ type: 'HEARTBEAT_ACK' });
        break;

      default:
        console.warn('⚠️ Unknown message type:', type);
        this.emit('message', data);
    }
  }

  /**
   * Send message to server
   * @param {object} data - Data to send
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      console.log('📤 WebSocket message sent:', data);
    } else {
      console.warn('⚠️ WebSocket not connected. Message not sent:', data);
    }
  }

  /**
   * Subscribe to invoice updates
   * @param {string} invoiceId - Invoice ID to subscribe to
   */
  subscribeToInvoice(invoiceId) {
    this.send({
      type: 'SUBSCRIBE_INVOICE',
      payload: { invoiceId },
    });
    console.log('👁️ Subscribed to invoice:', invoiceId);
  }

  /**
   * Unsubscribe from invoice updates
   * @param {string} invoiceId - Invoice ID to unsubscribe from
   */
  unsubscribeFromInvoice(invoiceId) {
    this.send({
      type: 'UNSUBSCRIBE_INVOICE',
      payload: { invoiceId },
    });
    console.log('👁️‍🗨️ Unsubscribed from invoice:', invoiceId);
  }

  /**
   * Subscribe to all invoice updates
   */
  subscribeToAllInvoices() {
    this.send({
      type: 'SUBSCRIBE_ALL',
    });
    console.log('👁️ Subscribed to all invoices');
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'HEARTBEAT' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   * @param {string} token - Authentication token
   */
  scheduleReconnect(token) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(
      `🔄 Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket...');
      this.stopHeartbeat();
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if WebSocket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   * @returns {string} Connection state
   */
  getState() {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;