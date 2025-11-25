// =====================================================
// SSE NOTIFICATION CLIENT
// =====================================================

import { enterpriseLogger } from '../utils/logger';

class SSENotificationClient {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.listeners = new Map();
    this.userId = null;
    this.token = null;
  }

  /**
   * Connect to SSE endpoint
   * @param {string} userId - User ID
   * @param {string} token - Authentication token
   */
  connect(userId, token) {
    try {
      this.userId = userId;
      this.token = token;

      if (this.isConnected) {
        enterpriseLogger.warn('SSE client already connected');
        return;
      }

      const url = `${window.location.origin}/api/notifications/sse`;

      this.eventSource = new EventSource(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      this.setupEventListeners();

      enterpriseLogger.info('SSE client connecting', { userId, url });

    } catch (error) {
      enterpriseLogger.error('Failed to connect SSE client', { error: error.message });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.eventSource) return;

    // Connection established
    this.eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.isConnected = true;
        this.reconnectAttempts = 0;

        enterpriseLogger.info('SSE client connected', { userId: this.userId });
        this.emit('connected', data);
      } catch (error) {
        enterpriseLogger.error('Failed to parse connected event', { error: error.message });
      }
    });

    // Notification received
    this.eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);

        enterpriseLogger.info('SSE notification received', {
          userId: this.userId,
          type: notification.type,
          id: notification.id,
        });

        this.emit('notification', notification);
        this.emit(notification.type, notification);
      } catch (error) {
        enterpriseLogger.error('Failed to parse notification event', { error: error.message });
      }
    });

    // Connection error
    this.eventSource.addEventListener('error', (event) => {
      enterpriseLogger.error('SSE connection error', { userId: this.userId });
      this.isConnected = false;
      this.emit('error', event);

      // Attempt to reconnect
      this.attemptReconnect();
    });

    // Connection closed
    this.eventSource.addEventListener('close', (event) => {
      enterpriseLogger.info('SSE connection closed', { userId: this.userId });
      this.isConnected = false;
      this.emit('close', event);
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      enterpriseLogger.error('SSE max reconnect attempts reached', { userId: this.userId });
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;

    enterpriseLogger.info('SSE attempting reconnect', {
      userId: this.userId,
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    });

    setTimeout(() => {
      this.disconnect();
      this.connect(this.userId, this.token);
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from SSE
   */
  disconnect() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      this.isConnected = false;
      this.reconnectAttempts = 0;

      enterpriseLogger.info('SSE client disconnected', { userId: this.userId });
      this.emit('disconnected');
    } catch (error) {
      enterpriseLogger.error('Failed to disconnect SSE client', { error: error.message });
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          enterpriseLogger.error('SSE listener error', { event, error: error.message });
        }
      });
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(message = 'Test notification from client') {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const data = await response.json();
      enterpriseLogger.info('Test notification sent', { userId: this.userId });
      return data;

    } catch (error) {
      enterpriseLogger.error('Failed to send test notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      userId: this.userId,
    };
  }

  /**
   * Check if connected
   */
  isConnectedToSSE() {
    return this.isConnected;
  }
}

// Create singleton instance
const sseClient = new SSENotificationClient();

export default sseClient;
