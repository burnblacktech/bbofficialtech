// =====================================================
// MAIN APPLICATION FILE - EXPRESS APP CONFIGURATION;
// Enterprise-grade Express.js application setup;
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const enterpriseLogger = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');

// Import routes;
const routes = require('./routes');

// =====================================================
// EXPRESS APP INITIALIZATION;
// =====================================================

const app = express();

// =====================================================
// SECURITY MIDDLEWARE;
// =====================================================

// Helmet for security headers;
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\''],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc: ['\'self\''],
        fontSrc: ['\'self\''],
        objectSrc: ['\'none\''],
        mediaSrc: ['\'self\''],
        frameSrc: ['\'none\''],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Cookie parser
app.use(cookieParser());

// Session configuration for OAuth state parameter
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  name: 'burnblack.sid', // Custom session name
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 minutes for OAuth state
    sameSite: 'lax', // Allow cross-site requests for OAuth
  },
}));

// Initialize Passport
app.use(passport.initialize());

// CORS configuration;
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://burnblack.com',
        'https://www.burnblack.com',
        'https://app.burnblack.com',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'API-Version',
      'X-Requested-With',
      'x-correlation-id',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['API-Version', 'X-Total-Count', 'X-Page-Count'],
  }),
);

// =====================================================
// PARSING MIDDLEWARE;
// =====================================================

// Body parsing middleware;
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
);

// =====================================================
// COMPRESSION MIDDLEWARE;
// =====================================================

// Compression middleware;
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

// =====================================================
// LOGGING MIDDLEWARE;
// =====================================================

// Morgan HTTP request logger;
app.use(
  morgan('combined', {
    stream: {
      write: message => {
        enterpriseLogger.info(message.trim());
      },
    },
    skip: (req, res) => {
      // Skip logging for health checks;
      return req.url === '/api/health' || req.url === '/api/health/';
    },
  }),
);

// =====================================================
// REQUEST PROCESSING MIDDLEWARE;
// =====================================================

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Request ID middleware;
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request timing middleware;
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// =====================================================
// ROUTE REGISTRATION;
// =====================================================

// Register all routes;
// Use api.js for explicit route mounting (more reliable than automatic discovery)
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// =====================================================
// ERROR HANDLING MIDDLEWARE;
// =====================================================

// 404 handler;
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler;
app.use(globalErrorHandler);

// =====================================================
// GRACEFUL SHUTDOWN HANDLING;
// =====================================================

// Graceful shutdown handling;
process.on('SIGTERM', () => {
  enterpriseLogger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  enterpriseLogger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler;
process.on('unhandledRejection', (reason, promise) => {
  enterpriseLogger.error('Unhandled Promise Rejection', {
    reason: reason,
    promise: promise,
  });
});

// Uncaught exception handler;
process.on('uncaughtException', error => {
  enterpriseLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Unhandled promise rejection handler;
process.on('unhandledRejection', (reason, promise) => {
  enterpriseLogger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // In production, you might want to exit here, but for development, log and continue
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// =====================================================
// APPLICATION STARTUP;
// =====================================================

// Application startup logging;
app.on('ready', () => {
  enterpriseLogger.info('Application started successfully', {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
  });
});

// =====================================================
// EXPORT APPLICATION;
// =====================================================

module.exports = app;
