// =====================================================
// SSE NOTIFICATION SERVICE
// =====================================================

const enterpriseLogger = require('../utils/logger');
const featureFlags = require('../common/featureFlags');

class SSENotificationService {
  constructor() {
    this.clients = new Map(); // userId -> Set of response objects
    this.isEnabled = featureFlags.isEnabled('feature_sse_notifications_enabled');
    
    enterpriseLogger.info('SSENotificationService initialized', {
      enabled: this.isEnabled
    });
  }

  /**
   * Add a client connection
   * @param {string} userId - User ID
   * @param {object} res - Express response object
   */
  addClient(userId, res) {
    if (!this.isEnabled) {
      enterpriseLogger.warn('SSE notifications disabled, rejecting connection', { userId });
      return false;
    }

    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      this.sendToClient(res, 'connected', {
        message: 'SSE connection established',
        timestamp: new Date().toISOString(),
        userId
      });

      // Store client connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(res);

      // Handle client disconnect
      res.on('close', () => {
        this.removeClient(userId, res);
      });

      res.on('error', (error) => {
        enterpriseLogger.error('SSE client error', { userId, error: error.message });
        this.removeClient(userId, res);
      });

      enterpriseLogger.info('SSE client connected', { userId, totalClients: this.getTotalClients() });
      return true;

    } catch (error) {
      enterpriseLogger.error('Failed to add SSE client', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Remove a client connection
   * @param {string} userId - User ID
   * @param {object} res - Express response object
   */
  removeClient(userId, res) {
    try {
      if (this.clients.has(userId)) {
        this.clients.get(userId).delete(res);
        
        // Clean up empty user sets
        if (this.clients.get(userId).size === 0) {
          this.clients.delete(userId);
        }
      }

      enterpriseLogger.info('SSE client disconnected', { userId, totalClients: this.getTotalClients() });

    } catch (error) {
      enterpriseLogger.error('Failed to remove SSE client', { userId, error: error.message });
    }
  }

  /**
   * Send notification to a specific user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {object} data - Notification data
   */
  sendToUser(userId, type, data) {
    if (!this.isEnabled) {
      enterpriseLogger.warn('SSE notifications disabled, skipping send', { userId, type });
      return;
    }

    try {
      const userClients = this.clients.get(userId);
      if (!userClients || userClients.size === 0) {
        enterpriseLogger.debug('No SSE clients found for user', { userId, type });
        return;
      }

      const notification = {
        id: this.generateNotificationId(),
        type,
        data,
        timestamp: new Date().toISOString(),
        userId
      };

      let sentCount = 0;
      userClients.forEach(res => {
        try {
          this.sendToClient(res, 'notification', notification);
          sentCount++;
        } catch (error) {
          enterpriseLogger.error('Failed to send to SSE client', { userId, error: error.message });
          this.removeClient(userId, res);
        }
      });

      enterpriseLogger.info('SSE notification sent to user', {
        userId,
        type,
        sentCount,
        totalClients: userClients.size
      });

    } catch (error) {
      enterpriseLogger.error('Failed to send SSE notification to user', {
        userId,
        type,
        error: error.message
      });
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {string} type - Notification type
   * @param {object} data - Notification data
   */
  sendToUsers(userIds, type, data) {
    userIds.forEach(userId => {
      this.sendToUser(userId, type, data);
    });
  }

  /**
   * Send notification to all connected clients
   * @param {string} type - Notification type
   * @param {object} data - Notification data
   */
  sendToAll(type, data) {
    if (!this.isEnabled) {
      enterpriseLogger.warn('SSE notifications disabled, skipping broadcast', { type });
      return;
    }

    try {
      const notification = {
        id: this.generateNotificationId(),
        type,
        data,
        timestamp: new Date().toISOString(),
        broadcast: true
      };

      let sentCount = 0;
      this.clients.forEach((userClients, userId) => {
        userClients.forEach(res => {
          try {
            this.sendToClient(res, 'notification', notification);
            sentCount++;
          } catch (error) {
            enterpriseLogger.error('Failed to send broadcast to SSE client', { userId, error: error.message });
            this.removeClient(userId, res);
          }
        });
      });

      enterpriseLogger.info('SSE broadcast sent', { type, sentCount, totalUsers: this.clients.size });

    } catch (error) {
      enterpriseLogger.error('Failed to send SSE broadcast', { type, error: error.message });
    }
  }

  /**
   * Send notification to clients by role
   * @param {string} role - User role
   * @param {string} type - Notification type
   * @param {object} data - Notification data
   */
  sendToRole(role, type, data) {
    // This would typically query the database for users with the specified role
    // For now, we'll send to all connected clients
    enterpriseLogger.info('SSE notification sent to role', { role, type });
    this.sendToAll(type, { ...data, targetRole: role });
  }

  /**
   * Send notification to client
   * @param {object} res - Express response object
   * @param {string} event - Event type
   * @param {object} data - Data to send
   */
  sendToClient(res, event, data) {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(message);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate unique notification ID
   * @returns {string} - Unique notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get total number of connected clients
   * @returns {number} - Total clients
   */
  getTotalClients() {
    let total = 0;
    this.clients.forEach(userClients => {
      total += userClients.size;
    });
    return total;
  }

  /**
   * Get connected users count
   * @returns {number} - Number of connected users
   */
  getConnectedUsersCount() {
    return this.clients.size;
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getServiceStatus() {
    return {
      enabled: this.isEnabled,
      connectedUsers: this.getConnectedUsersCount(),
      totalClients: this.getTotalClients(),
      clients: Array.from(this.clients.keys())
    };
  }

  /**
   * Send filing status update notification
   * @param {string} userId - User ID
   * @param {object} filingData - Filing data
   */
  sendFilingStatusUpdate(userId, filingData) {
    this.sendToUser(userId, 'filing_status_update', {
      filingId: filingData.id,
      itrType: filingData.itrType,
      oldStatus: filingData.oldStatus,
      newStatus: filingData.newStatus,
      message: `Your ${filingData.itrType} filing status has been updated to ${filingData.newStatus}`,
      filingData
    });
  }

  /**
   * Send ticket update notification
   * @param {string} userId - User ID
   * @param {object} ticketData - Ticket data
   */
  sendTicketUpdate(userId, ticketData) {
    this.sendToUser(userId, 'ticket_update', {
      ticketId: ticketData.id,
      ticketNumber: ticketData.ticketNumber,
      oldStatus: ticketData.oldStatus,
      newStatus: ticketData.newStatus,
      message: `Your ticket ${ticketData.ticketNumber} has been updated`,
      ticketData
    });
  }

  /**
   * Send document verification notification
   * @param {string} userId - User ID
   * @param {object} documentData - Document data
   */
  sendDocumentVerification(userId, documentData) {
    this.sendToUser(userId, 'document_verification', {
      documentId: documentData.id,
      filename: documentData.filename,
      verificationStatus: documentData.verificationStatus,
      message: `Your document ${documentData.filename} verification status: ${documentData.verificationStatus}`,
      documentData
    });
  }

  /**
   * Send system maintenance notification
   * @param {object} maintenanceData - Maintenance data
   */
  sendSystemMaintenance(maintenanceData) {
    this.sendToAll('system_maintenance', {
      message: 'System maintenance scheduled',
      startTime: maintenanceData.startTime,
      endTime: maintenanceData.endTime,
      description: maintenanceData.description,
      maintenanceData
    });
  }

  /**
   * Send payment notification
   * @param {string} userId - User ID
   * @param {object} paymentData - Payment data
   */
  sendPaymentNotification(userId, paymentData) {
    this.sendToUser(userId, 'payment_notification', {
      paymentId: paymentData.id,
      amount: paymentData.amount,
      status: paymentData.status,
      message: `Payment ${paymentData.status}: ₹${paymentData.amount}`,
      paymentData
    });
  }

  /**
   * Send MFA notification
   * @param {string} userId - User ID
   * @param {object} mfaData - MFA data
   */
  sendMFANotification(userId, mfaData) {
    this.sendToUser(userId, 'mfa_notification', {
      action: mfaData.action,
      message: `MFA ${mfaData.action}: ${mfaData.message}`,
      mfaData
    });
  }

  /**
   * Send admin notification
   * @param {string} userId - User ID
   * @param {object} adminData - Admin data
   */
  sendAdminNotification(userId, adminData) {
    this.sendToUser(userId, 'admin_notification', {
      action: adminData.action,
      message: `Admin action: ${adminData.message}`,
      adminData
    });
  }

  /**
   * Send general notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} data - Additional data
   */
  sendGeneralNotification(userId, title, message, data = {}) {
    this.sendToUser(userId, 'general_notification', {
      title,
      message,
      data
    });
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections() {
    try {
      const now = Date.now();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach((userClients, userId) => {
        userClients.forEach(res => {
          // Check if connection is still active
          if (res.destroyed || res.closed) {
            this.removeClient(userId, res);
          }
        });
      });

      enterpriseLogger.info('SSE cleanup completed', {
        connectedUsers: this.getConnectedUsersCount(),
        totalClients: this.getTotalClients()
      });

    } catch (error) {
      enterpriseLogger.error('Failed to cleanup SSE connections', { error: error.message });
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000); // Run every minute

    enterpriseLogger.info('SSE cleanup interval started');
  }
}

module.exports = new SSENotificationService();
