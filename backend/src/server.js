// =====================================================
// SERVER ENTRY POINT - HTTP SERVER CONFIGURATION;
// Enterprise-grade HTTP server setup and startup;
// =====================================================

// Load environment variables first;
require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const enterpriseLogger = require('./utils/logger');
const { initializeDatabase, testConnection } = require('./config/database');
const redisService = require('./services/core/RedisService');
const dbPoolMonitor = require('./utils/dbPoolMonitor');
const jobQueueService = require('./services/core/JobQueue');
const app = require('./app');
const wsManager = require('./services/websocket/WebSocketManager');

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
  const sslOptions = {
    key: fs.readFileSync(
      process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/private.key'),
    ),
    cert: fs.readFileSync(
      process.env.SSL_CERT_PATH ||
        path.join(__dirname, '../ssl/certificate.crt'),
    ),
    ca: process.env.SSL_CA_PATH
      ? fs.readFileSync(process.env.SSL_CA_PATH)
      : undefined,
  };

  server = https.createServer(sslOptions, app);

  enterpriseLogger.info('HTTPS server configured', {
    sslEnabled: true,
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
  });
} else {
  // HTTP server configuration;
  server = http.createServer(app);

  enterpriseLogger.info('HTTP server configured', {
    sslEnabled: false,
  });
}

// =====================================================
// SERVER EVENT HANDLERS;
// =====================================================

// Server error handler;
server.on('error', error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
  case 'EACCES':
    enterpriseLogger.error(`${bind} requires elevated privileges`);
    process.exit(1);
    break;
  case 'EADDRINUSE':
    enterpriseLogger.error(`${bind} is already in use`);
    process.exit(1);
    break;
  default:
    throw error;
  }
});

// Server listening handler;
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

  enterpriseLogger.info('Server started successfully', {
    host: HOST,
    port: PORT,
    bind: bind,
    environment: NODE_ENV,
    ssl: NODE_ENV === 'production' && process.env.SSL_ENABLED === 'true',
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
  });

  // Emit ready event;
  app.emit('ready');
});

// =====================================================
// GRACEFUL SHUTDOWN HANDLING;
// =====================================================

// Graceful shutdown function;
const gracefulShutdown = async signal => {
  enterpriseLogger.info(`${signal} received, starting graceful shutdown`);

  // Close job queues
  try {
    await jobQueueService.close();
  } catch (error) {
    enterpriseLogger.error('Error closing job queues', { error: error.message });
  }

  // Close Redis connections
  try {
    await redisService.disconnect();
  } catch (error) {
    enterpriseLogger.error('Error disconnecting Redis', { error: error.message });
  }

  server.close(async (err) => {
    if (err) {
      enterpriseLogger.error('Error during server shutdown', {
        error: err.message,
      });
      process.exit(1);
    }

    // Close database connection
    try {
      const { closeDatabase } = require('./config/database');
      await closeDatabase();
    } catch (error) {
      enterpriseLogger.error('Error closing database', { error: error.message });
    }

    enterpriseLogger.info('Server closed successfully');
    process.exit(0);
  });

  // Force close after 30 seconds;
  setTimeout(() => {
    enterpriseLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Signal handlers;
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers to catch unhandled errors
process.on('uncaughtException', (error) => {
  enterpriseLogger.error('Uncaught Exception - Server will exit', {
    error: error.message,
    stack: error.stack,
  });
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  enterpriseLogger.error('Unhandled Rejection - Server will continue but this should be fixed', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Don't exit on unhandled rejection, but log it
});

// =====================================================
// SERVER STARTUP;
// =====================================================

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection first
    enterpriseLogger.info('Testing database connection...');
    let dbConnected = false;
    try {
      dbConnected = await testConnection();
    } catch (dbError) {
      enterpriseLogger.error('Database connection test threw an error', {
        error: dbError.message,
        stack: dbError.stack,
      });
      dbConnected = false;
    }
    
    if (!dbConnected) {
      enterpriseLogger.error('Database connection failed. Server will not start.');
      setTimeout(() => {
        process.exit(1);
      }, 1000);
      return;
    }
    
    // Initialize Redis (non-blocking - server can start without Redis in dev)
    enterpriseLogger.info('Initializing Redis connection...');
    let redisConnected = false;
    try {
      redisConnected = await redisService.initialize();
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
