// =====================================================
// WEBSOCKET MANAGER SERVICE
// Manages WebSocket connections and event broadcasting
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // userId -> Set of WebSocket connections
    this.adminConnections = new Set(); // Admin WebSocket connections
    this.isInitialized = false;
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} httpServer - HTTP server instance
   */
  initialize(httpServer) {
    if (this.isInitialized) {
      enterpriseLogger.warn('WebSocket server already initialized');
      return;
    }

    try {
      // Dynamic import of ws package (will be installed)
      const WebSocket = require('ws');
      
      this.wss = new WebSocket.Server({
        server: httpServer,
        path: '/ws',
        verifyClient: (info) => {
          // Extract userId and token from query string
          const url = new URL(info.req.url, `http://${info.req.headers.host}`);
          const userId = url.searchParams.get('userId');
          const token = url.searchParams.get('token');
          
          // Basic validation - in production, verify JWT token
          return !!(userId && token);
        },
      });

      this.wss.on('connection', (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = url.searchParams.get('userId');
        const token = url.searchParams.get('token');
        const userRole = url.searchParams.get('role') || 'user';

        if (!userId || !token) {
          ws.close(1008, 'Missing userId or token');
          return;
        }

        // Add connection to appropriate collection
        if (userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN') {
          this.adminConnections.add(ws);
          enterpriseLogger.info('Admin WebSocket connection established', { userId, role: userRole });
        } else {
          if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
          }
          this.connections.get(userId).add(ws);
          enterpriseLogger.info('User WebSocket connection established', { userId });
        }

        // Store user info on connection
        ws.userId = userId;
        ws.userRole = userRole;

        // Handle connection close
        ws.on('close', () => {
          this.removeConnection(ws, userId, userRole);
        });

        // Handle errors
        ws.on('error', (error) => {
          enterpriseLogger.error('WebSocket error', { userId, error: error.message });
          this.removeConnection(ws, userId, userRole);
        });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'CONNECTION_ESTABLISHED',
          payload: {
            message: 'Connected to real-time updates',
            timestamp: new Date().toISOString(),
          },
        }));
      });

      this.isInitialized = true;
      enterpriseLogger.info('WebSocket server initialized successfully');
    } catch (error) {
      enterpriseLogger.error('Failed to initialize WebSocket server', {
        error: error.message,
        note: 'ws package may need to be installed: npm install ws',
      });
      // Don't throw - allow server to start without WebSocket
    }
  }

  /**
   * Remove connection from collections
   */
  removeConnection(ws, userId, userRole) {
    if (userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN') {
      this.adminConnections.delete(ws);
      enterpriseLogger.info('Admin WebSocket connection closed', { userId });
    } else {
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.connections.delete(userId);
        }
      }
      enterpriseLogger.info('User WebSocket connection closed', { userId });
    }
  }

  /**
   * Broadcast event to specific user
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToUser(userId, eventType, payload) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return; // User not connected
    }

    const message = JSON.stringify({
      type: eventType,
      payload: {
        ...payload,
        userId,
        timestamp: new Date().toISOString(),
      },
    });

    let sentCount = 0;
    userConnections.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          enterpriseLogger.error('Failed to send WebSocket message to user', {
            userId,
            error: error.message,
          });
        }
      }
    });

    if (sentCount > 0) {
      enterpriseLogger.debug('Broadcasted event to user', {
        userId,
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Broadcast event to all admins
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToAdmins(eventType, payload) {
    if (this.adminConnections.size === 0) {
      return; // No admins connected
    }

    const message = JSON.stringify({
      type: eventType,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });

    let sentCount = 0;
    this.adminConnections.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          enterpriseLogger.error('Failed to send WebSocket message to admin', {
            error: error.message,
          });
        }
      }
    });

    if (sentCount > 0) {
      enterpriseLogger.debug('Broadcasted event to admins', {
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Broadcast event to all connected users (platform-wide)
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToAll(eventType, payload) {
    const message = JSON.stringify({
      type: eventType,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });

    let sentCount = 0;
    
    // Broadcast to all users
    this.connections.forEach((userConnections) => {
      userConnections.forEach((ws) => {
        if (ws.readyState === 1) {
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            enterpriseLogger.error('Failed to broadcast WebSocket message', {
              error: error.message,
            });
          }
        }
      });
    });

    // Also broadcast to admins
    this.broadcastToAdmins(eventType, payload);

    if (sentCount > 0) {
      enterpriseLogger.debug('Broadcasted event to all users', {
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    let totalUserConnections = 0;
    this.connections.forEach((userConnections) => {
      totalUserConnections += userConnections.size;
    });

    return {
      totalUsers: this.connections.size,
      totalUserConnections,
      totalAdminConnections: this.adminConnections.size,
      isInitialized: this.isInitialized,
    };
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

module.exports = wsManager;

