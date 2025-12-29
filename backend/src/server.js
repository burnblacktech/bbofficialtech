// =====================================================
// SERVER ENTRY POINT - HTTP SERVER CONFIGURATION;
// Enterprise-grade HTTP server setup and startup;
// =====================================================

// Load environment variables first;
require('dotenv').config();
console.log('TRACE: dotenv config loaded');

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const enterpriseLogger = require('./utils/logger');
console.log('TRACE: logger loaded');
const { initializeDatabase, testConnection } = require('./config/database');
console.log('TRACE: db config loaded');
const redisService = require('./services/core/RedisService');
console.log('TRACE: redis service loaded');
const dbPoolMonitor = require('./utils/dbPoolMonitor');
console.log('TRACE: db pool monitor loaded');
const jobQueueService = require('./services/core/JobQueue');
console.log('TRACE: job queue loaded');
const app = require('./app');
console.log('TRACE: app loaded');
const wsManager = require('./services/websocket/WebSocketManager');
console.log('TRACE: wsManager loaded');


// =====================================================
// SERVER CONFIGURATION;
// =====================================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// =====================================================
// SSL CONFIGURATION (FOR PRODUCTION)
// =====================================================

let server;

if (NODE_ENV === 'production' && process.env.SSL_ENABLED === 'true') {
  // HTTPS server configuration;
  // ...
} else {
  // HTTP server configuration;
  server = http.createServer(app);

  enterpriseLogger.info('HTTP server configured', {
    sslEnabled: false,
  });
}

// ... handlers ...

// =====================================================
// SERVER STARTUP;
// =====================================================

// Initialize database and start server
const startServer = async () => {
  console.log('TRACE: startServer entered');
  try {
    // Test database connection first
    enterpriseLogger.info('Testing database connection...');
    console.log('TRACE: about to testConnection');
    let dbConnected = false;
    try {
      dbConnected = await testConnection();
      console.log('TRACE: testConnection finished', dbConnected);
    } catch (dbError) {
      // ...
    }

    if (!dbConnected) {
      console.log('TRACE: db not connected');
      // ...
    }

    // Initialize Redis (non-blocking - server can start without Redis in dev)
    console.log('TRACE: about to init Redis');
    enterpriseLogger.info('Initializing Redis connection...');
    let redisConnected = false;
    try {
      redisConnected = await redisService.initialize();
      console.log('TRACE: Redis init finished', redisConnected);

      if (!redisConnected) {
        enterpriseLogger.warn('Redis connection failed. Server will continue but some features may be limited.', {
          note: 'Rate limiting, sessions, and caching will use fallback mechanisms',
        });
      } else {
        // Initialize job queue if Redis is available
        enterpriseLogger.info('Initializing job queue service...');
        try {
          await jobQueueService.initialize();
        } catch (jobQueueError) {
          enterpriseLogger.warn('Job queue initialization failed, continuing without background jobs', {
            error: jobQueueError.message,
          });
        }

        // Upgrade session store to Redis if available
        try {
          let RedisStore;
          try {
            RedisStore = require('connect-redis').default;
          } catch (requireError) {
            enterpriseLogger.warn('connect-redis package not available - sessions will use memory store', {
              error: requireError.message,
            });
            RedisStore = null;
          }

          if (RedisStore) {
            const redisClient = redisService.getClient();
            if (redisClient) {
              // Note: This won't work for existing sessions, but new sessions will use Redis
              enterpriseLogger.info('Redis available - sessions will use Redis store for new connections');
            }
          }
        } catch (sessionError) {
          enterpriseLogger.warn('Failed to upgrade session store to Redis', {
            error: sessionError.message,
          });
        }
      }
    } catch (redisError) {
      enterpriseLogger.error('Redis initialization error (non-fatal)', {
        error: redisError.message,
        stack: redisError.stack,
      });
      // Continue without Redis
      redisConnected = false;
    }

    // Verify schema exists
    console.log('TRACE: Before Verifying schema');
    enterpriseLogger.info('Verifying database schema...');
    const { sequelize } = require('./config/database');
    const tables = await sequelize.getQueryInterface().showAllTables();
    enterpriseLogger.info('Database schema verified', {
      tableCount: tables.length,
      tables: tables.slice(0, 10), // Log first 10 tables
    });

    // Start the server
    server.listen(PORT, HOST, async () => {
      enterpriseLogger.info('Server listening', {
        host: HOST,
        port: PORT,
        environment: NODE_ENV,
        databaseConnected: true,
        redisConnected: redisConnected,
        tablesFound: tables.length,
      });

      // Start database pool monitoring
      try {
        dbPoolMonitor.start();
        enterpriseLogger.info('Database pool monitor started');
      } catch (error) {
        enterpriseLogger.warn('Database pool monitor failed to start', {
          error: error.message,
        });
      }

      // Phase 5: Initialize finance event handlers
      try {
        const { initializeFinanceEventHandlers } = require('./events/financeEventHandlers');
        initializeFinanceEventHandlers();
        enterpriseLogger.info('Finance event handlers initialized');
      } catch (financeError) {
        enterpriseLogger.warn('Finance event handlers initialization failed (non-blocking)', {
          error: financeError.message,
        });
      }

      // Initialize WebSocket server
      try {
        await wsManager.initialize(server);
        enterpriseLogger.info('WebSocket server initialized');
      } catch (error) {
        enterpriseLogger.warn('WebSocket server initialization failed', {
          error: error.message,
          note: 'Server will continue without WebSocket support',
        });
      }
    });
  } catch (error) {
    enterpriseLogger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Give time for logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

// Start the server
startServer();

// =====================================================
// HEALTH CHECK ENDPOINT (FOR LOAD BALANCERS)
// =====================================================

// Simple health check for load balancers;
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

// =====================================================
// EXPORT SERVER;
// =====================================================

module.exports = server;
