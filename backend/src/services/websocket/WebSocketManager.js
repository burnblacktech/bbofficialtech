// =====================================================
// WEBSOCKET MANAGER SERVICE
// Manages WebSocket connections and event broadcasting
// Uses Redis pub/sub for cross-instance messaging
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const redisService = require('../core/RedisService');

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // userId -> Set of WebSocket connections
    this.adminConnections = new Set(); // Admin WebSocket connections
    this.isInitialized = false;
    this.redisSubscriber = null;
    this.redisPublisher = null;
    this.instanceId = require('crypto').randomUUID(); // Unique instance ID
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} httpServer - HTTP server instance
   */
  async initialize(httpServer) {
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

      // Initialize Redis pub/sub for cross-instance messaging
      if (redisService.isReady()) {
        try {
          this.redisSubscriber = redisService.getSubscriber();
          this.redisPublisher = redisService.getPublisher();
          
          if (!this.redisSubscriber || !this.redisPublisher) {
            throw new Error('Redis subscriber/publisher not available');
          }

          // Subscribe to user-specific channels
          // Note: psubscribe returns a promise, but we'll handle it in the async context
          await Promise.all([
            this.redisSubscriber.psubscribe('ws:user:*'),
            this.redisSubscriber.psubscribe('ws:admin:*'),
            this.redisSubscriber.psubscribe('ws:all:*'),
          ]);

          // Handle messages from other instances
          this.redisSubscriber.on('pmessage', (pattern, channel, message) => {
            try {
              const data = JSON.parse(message);
              // Ignore messages from this instance
              if (data.instanceId === this.instanceId) {
                return;
              }

              // Route message to local connections
              if (channel.startsWith('ws:user:')) {
                const userId = channel.replace('ws:user:', '');
                this._broadcastToLocalUser(userId, data.eventType, data.payload);
              } else if (channel.startsWith('ws:admin:')) {
                this._broadcastToLocalAdmins(data.eventType, data.payload);
              } else if (channel === 'ws:all:*') {
                this._broadcastToLocalAll(data.eventType, data.payload);
              }
            } catch (error) {
              enterpriseLogger.error('Error processing Redis pub/sub message', {
                error: error.message,
                channel,
              });
            }
          });

          enterpriseLogger.info('Redis pub/sub initialized for WebSocket', {
            instanceId: this.instanceId,
          });
        } catch (error) {
          enterpriseLogger.warn('Redis pub/sub initialization failed', {
            error: error.message,
            note: 'WebSocket will work but cross-instance messaging disabled',
          });
        }
      }

      this.isInitialized = true;
      enterpriseLogger.info('WebSocket server initialized successfully', {
        instanceId: this.instanceId,
        redisPubSub: !!this.redisPublisher,
      });
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
   * Broadcast event to specific user (local connections only)
   */
  _broadcastToLocalUser(userId, eventType, payload) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return;
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
      if (ws.readyState === 1) {
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
      enterpriseLogger.debug('Broadcasted event to local user', {
        userId,
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Broadcast event to specific user (all instances via Redis)
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToUser(userId, eventType, payload) {
    // Broadcast to local connections
    this._broadcastToLocalUser(userId, eventType, payload);

    // Publish to Redis for other instances
    if (this.redisPublisher) {
      try {
        const channel = `ws:user:${userId}`;
        const message = JSON.stringify({
          instanceId: this.instanceId,
          eventType,
          payload,
        });
        this.redisPublisher.publish(channel, message);
      } catch (error) {
        enterpriseLogger.error('Failed to publish WebSocket message to Redis', {
          userId,
          error: error.message,
        });
      }
    }
  }

  /**
   * Broadcast event to all admins (local connections only)
   */
  _broadcastToLocalAdmins(eventType, payload) {
    if (this.adminConnections.size === 0) {
      return;
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
      if (ws.readyState === 1) {
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
      enterpriseLogger.debug('Broadcasted event to local admins', {
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Broadcast event to all admins (all instances via Redis)
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToAdmins(eventType, payload) {
    // Broadcast to local connections
    this._broadcastToLocalAdmins(eventType, payload);

    // Publish to Redis for other instances
    if (this.redisPublisher) {
      try {
        const channel = 'ws:admin:all';
        const message = JSON.stringify({
          instanceId: this.instanceId,
          eventType,
          payload,
        });
        this.redisPublisher.publish(channel, message);
      } catch (error) {
        enterpriseLogger.error('Failed to publish admin message to Redis', {
          error: error.message,
        });
      }
    }
  }

  /**
   * Broadcast event to all connected users (local connections only)
   */
  _broadcastToLocalAll(eventType, payload) {
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
    this._broadcastToLocalAdmins(eventType, payload);

    if (sentCount > 0) {
      enterpriseLogger.debug('Broadcasted event to local all users', {
        eventType,
        connections: sentCount,
      });
    }
  }

  /**
   * Broadcast event to all connected users (platform-wide, all instances)
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  broadcastToAll(eventType, payload) {
    // Broadcast to local connections
    this._broadcastToLocalAll(eventType, payload);

    // Publish to Redis for other instances
    if (this.redisPublisher) {
      try {
        const channel = 'ws:all:platform';
        const message = JSON.stringify({
          instanceId: this.instanceId,
          eventType,
          payload,
        });
        this.redisPublisher.publish(channel, message);
      } catch (error) {
        enterpriseLogger.error('Failed to publish platform message to Redis', {
          error: error.message,
        });
      }
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
      instanceId: this.instanceId,
      totalUsers: this.connections.size,
      totalUserConnections,
      totalAdminConnections: this.adminConnections.size,
      isInitialized: this.isInitialized,
      redisPubSub: !!this.redisPublisher,
    };
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

module.exports = wsManager;

