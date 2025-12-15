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
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
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

// =====================================================
// ITR ROUTES
// =====================================================

// ITR routes with general rate limiting
router.use('/itr', generalLimiter, require('./itr'));

// =====================================================
// USER ROUTES
// =====================================================

// User routes with general rate limiting
router.use('/users', generalLimiter, require('./user'));

// =====================================================
// MEMBER ROUTES
// =====================================================

// Member (family member) routes with general rate limiting
router.use('/members', generalLimiter, require('./members'));

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin routes with strict rate limiting
router.use('/admin', strictLimiter, require('./admin'));

// =====================================================
// DOCUMENT ROUTES
// =====================================================

// Document management routes
router.use('/documents', generalLimiter, require('./documents'));

// =====================================================
// OCR ROUTES
// =====================================================

// OCR routes for document processing
router.use('/ocr', generalLimiter, require('./ocr'));

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Public routes (stats, testimonials) - no rate limiting for landing page
router.use('/public', require('./public'));

// =====================================================
// ANALYTICS ROUTES
// =====================================================

// Analytics routes (web vitals, performance tracking)
router.use('/analytics', generalLimiter, require('./analytics'));

// =====================================================
// HELP ROUTES
// =====================================================

// Help content routes (public)
router.use('/help', generalLimiter, require('./help'));

// =====================================================
// SUPPORT ROUTES
// =====================================================

// Support ticket routes (authenticated)
router.use('/support', generalLimiter, require('./support'));

// =====================================================
// BROKER ROUTES
// =====================================================

// Broker file processing routes
router.use('/broker', generalLimiter, require('./broker'));

// =====================================================
// NOTIFICATION ROUTES
// =====================================================

// Notification routes
router.use('/notifications', generalLimiter, require('./notifications'));

// =====================================================
// CA MARKETPLACE ROUTES
// =====================================================

// CA marketplace routes (public browsing, authenticated actions)
router.use('/ca-marketplace', generalLimiter, require('./ca-marketplace'));

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