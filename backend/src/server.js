// =====================================================
// SERVER ENTRY POINT
// =====================================================

require('dotenv').config();

// Sentry must init before all other imports
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      return event;
    },
  });
}

const http = require('http');
const enterpriseLogger = require('./utils/logger');
const { testConnection, closeDatabase } = require('./config/database');
const redisService = require('./services/core/RedisService');
const jobQueueService = require('./services/core/JobQueue');

let app;
try {
  app = require('./app');
} catch (error) {
  console.error('FATAL: Failed to load app.js', error);
  process.exit(1);
}

let wsManager;
try {
  wsManager = require('./services/websocket/WebSocketManager');
} catch (error) {
  enterpriseLogger.warn('WebSocketManager not available, continuing without WebSocket support');
  wsManager = null;
}

// =====================================================
// CONFIGURATION
// =====================================================

const PORT = parseInt(process.env.PORT, 10) || 3002;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

// =====================================================
// STARTUP
// =====================================================

const startServer = async () => {
  try {
    // 1. Database
    enterpriseLogger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      enterpriseLogger.error('Database connection failed. Exiting.');
      process.exit(1);
    }

    // 2. Redis (non-blocking — server works without it in dev)
    enterpriseLogger.info('Initializing Redis...');
    try {
      const redisConnected = await redisService.initialize();
      if (redisConnected) {
        try { await jobQueueService.initialize(); }
        catch (e) { enterpriseLogger.warn('Job queue init failed, continuing', { error: e.message }); }
      } else {
        enterpriseLogger.warn('Redis unavailable. Rate limiting and sessions will use fallback.');
      }
    } catch (redisError) {
      enterpriseLogger.warn('Redis init error (non-fatal)', { error: redisError.message });
    }

    // 3. Verify schema
    const { sequelize } = require('./config/database');
    const tables = await sequelize.getQueryInterface().showAllTables();
    enterpriseLogger.info('Database schema verified', { tableCount: tables.length });

    // 4. Start listening
    server.listen(PORT, HOST, async () => {
      enterpriseLogger.info(`Server listening on ${HOST}:${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
      });

      // WebSocket (optional)
      if (wsManager) {
        try {
          await wsManager.initialize(server);
          enterpriseLogger.info('WebSocket server initialized');
        } catch (error) {
          enterpriseLogger.warn('WebSocket init failed', { error: error.message });
        }
      }
    });

  } catch (error) {
    enterpriseLogger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdown = async (signal) => {
  enterpriseLogger.info(`${signal} received, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    enterpriseLogger.info('HTTP server closed');

    // Close database pool
    try { await closeDatabase(); }
    catch (e) { enterpriseLogger.error('DB close error', { error: e.message }); }

    // Close Redis
    try { await redisService.disconnect(); }
    catch (e) { /* Redis may not have a disconnect method */ }

    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    enterpriseLogger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  enterpriseLogger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  enterpriseLogger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// =====================================================
// START
// =====================================================

startServer();

module.exports = server;
