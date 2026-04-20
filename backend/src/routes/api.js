// =====================================================
// API ROUTES - MVP ROUTER
// Only MVP routes are active. Non-MVP routes are
// commented out and can be re-enabled as needed.
// =====================================================

const express = require('express');
const enterpriseLogger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// =====================================================
// RATE LIMITING
// =====================================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// HEALTH CHECK
// =====================================================

router.get('/health', async (req, res) => {
  const { testConnection } = require('../config/database');

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {},
  };

  try {
    const dbConnected = await testConnection();
    health.services.database = { connected: dbConnected };
    if (!dbConnected) { health.status = 'degraded'; }
  } catch (error) {
    health.services.database = { connected: false, error: error.message };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// MVP ROUTES
// =====================================================

// Auth (register, login, profile, password, Google OAuth)
router.use('/auth', strictLimiter, require('./auth'));
router.use('/user', strictLimiter, require('./auth')); // backward compat alias

// Filing CRUD + submission + financial story screens
router.use('/filings', generalLimiter, require('./filings'));

// Tax computation + regime comparison
router.use('/tax', generalLimiter, require('./tax'));

// ITR determination + PAN verification
router.use('/itr', generalLimiter, require('./itr'));

// ERI client management + operations
router.use('/eri', strictLimiter, require('./eri'));

// Payments + billing
router.use('/payments', generalLimiter, require('./payments'));

// OTP verification
router.use('/otp', strictLimiter, require('./otp'));

// Account management (audit trail, export, deletion, notification prefs)
router.use('/account', generalLimiter, require('./account'));

// Family member management
router.use('/family', generalLimiter, require('./family'));

// Document vault
router.use('/vault', generalLimiter, require('./vault'));

// =====================================================
// ERROR HANDLING
// =====================================================

router.use((err, req, res, next) => {
  enterpriseLogger.error('API error', {
    error: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
});

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = router;
