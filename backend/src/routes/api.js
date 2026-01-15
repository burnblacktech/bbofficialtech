// =====================================================
// API ROUTES - MAIN API ROUTER
// Enterprise-grade API routing and middleware management
// =====================================================

const express = require('express');
const enterpriseLogger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// =====================================================
// RATE LIMITING MIDDLEWARE
// =====================================================

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// API ROUTES REGISTRATION
// =====================================================

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbPoolMonitor = require('../utils/dbPoolMonitor');
  const redisService = require('../services/core/RedisService');
  const { testConnection } = require('../config/database');

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {},
  };

  // Check database
  try {
    const dbConnected = await testConnection();
    const poolStats = await dbPoolMonitor.getStats();
    health.services.database = {
      connected: dbConnected,
      pool: poolStats,
    };
  } catch (error) {
    health.services.database = {
      connected: false,
      error: error.message,
    };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redisHealth = await redisService.healthCheck();
    health.services.redis = redisHealth;
    if (!redisHealth.healthy) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.redis = {
      healthy: false,
      error: error.message,
    };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/health',
      '/api/status',
      '/api/auth',
      '/api/itr',
      '/api/user',
      '/api/admin',
    ],
  });
});

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Auth routes with strict rate limiting
router.use('/auth', strictLimiter, require('./auth'));

// User routes (alias for auth routes for backward compatibility)
router.use('/user', strictLimiter, require('./auth'));

// Public routes for landing page
router.use('/public', generalLimiter, require('./public'));

// ITR routes with general rate limiting
router.use('/itr', generalLimiter, require('./itr'));

// Dashboard routes
router.use('/dashboard', require('./dashboard'));

// =====================================================
// FILING ROUTES (S12 Phase 8)
// =====================================================

// Filing orchestrator routes - canonical filing CRUD
router.use('/filings', generalLimiter, require('./filings'));

// Employer/salary routes
router.use('/employers', generalLimiter, require('./employers'));

// Capital gains routes
router.use('/capital-gains', generalLimiter, require('./capitalGains'));

// Regime comparison routes
router.use('/regime-comparison', generalLimiter, require('./regimeComparison'));

// Filing safety routes
router.use('/filing-safety', generalLimiter, require('./filingSafety'));

// Re-registering here for legacy reasons, keeping consistency
router.use('/dashboard', generalLimiter, require('./dashboard'));

// Income routes
router.use('/income', generalLimiter, require('./income'));

// Deduction routes
router.use('/deductions', generalLimiter, require('./deductions'));

// Tax calculation routes
router.use('/tax', generalLimiter, require('./tax'));

// Document and OCR routes
router.use('/documents', generalLimiter, require('./documents'));
router.use('/ca', generalLimiter, require('./ca'));

// Notification routes
router.use('/notifications', generalLimiter, require('./notification'));

// =====================================================
// ERROR HANDLING
// =====================================================

// Global error handler for API routes
router.use((err, req, res, next) => {
  enterpriseLogger.error('API error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = router;