// =====================================================
// EXPRESS APP CONFIGURATION
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

const app = express();

// =====================================================
// SECURITY
// =====================================================

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

app.use(cookieParser());

// Session (for OAuth state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  name: 'burnblack.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 15 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use(passport.initialize());

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) { return callback(null, true); }

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        process.env.FRONTEND_URL || null,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      ].filter(Boolean);

      if (process.env.NODE_ENV !== 'production' &&
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

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
      'X-Requested-With',
      'x-correlation-id',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['X-Total-Count'],
  }),
);

// =====================================================
// PARSING & COMPRESSION
// =====================================================

app.use((req, res, next) => {
  // Skip JSON parsing for webhook route — needs raw body for HMAC verification
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression({ level: 6, threshold: 1024 }));

// =====================================================
// LOGGING
// =====================================================

app.use(
  morgan('combined', {
    stream: { write: message => enterpriseLogger.info(message.trim()) },
    skip: (req) => req.url === '/api/health',
  }),
);

// =====================================================
// REQUEST MIDDLEWARE
// =====================================================

app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// =====================================================
// ROUTES
// =====================================================

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

app.use(globalErrorHandler);

module.exports = app;
