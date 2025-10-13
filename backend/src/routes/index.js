// =====================================================
// MAIN ROUTES INDEX - ENTERPRISE ROUTE MANAGEMENT
// =====================================================

const express = require('express');
const enterpriseLogger = require('../utils/logger');

const router = express.Router();

// =====================================================
// API INFORMATION ROUTE
// =====================================================

router.get('/', (req, res) => {
  res.json({
    message: 'BurnBlack ITR Platform API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      itr: '/api/itr',
      users: '/api/users',
      health: '/api/health',
      admin: '/api/admin',
      documents: '/api/documents',
      notifications: '/api/notifications',
      tickets: '/api/tickets'
    }
  });
});

// =====================================================
// API DOCUMENTATION ROUTE
// =====================================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'BurnBlack ITR Platform API Documentation',
    version: '1.0.0',
    description: 'Enterprise-grade Indian Income Tax Return filing platform',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile'
      },
      itr: {
        'GET /api/itr/types': 'Get available ITR types',
        'POST /api/itr/create': 'Create new ITR filing',
        'GET /api/itr/:id': 'Get ITR filing details',
        'PUT /api/itr/:id': 'Update ITR filing',
        'POST /api/itr/:id/submit': 'Submit ITR filing'
      },
      users: {
        'GET /api/users': 'Get all users (admin)',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      documents: {
        'POST /api/documents/presign': 'Generate presigned upload URL',
        'POST /api/documents/complete': 'Complete file upload',
        'GET /api/documents': 'Get user documents',
        'GET /api/documents/:id/download': 'Get document download URL',
        'DELETE /api/documents/:id': 'Delete document',
        'GET /api/documents/stats': 'Get document statistics',
        'GET /api/documents/categories': 'Get document categories'
      },
      notifications: {
        'GET /api/notifications': 'Get user notifications',
        'PUT /api/notifications/:id/read': 'Mark notification as read',
        'DELETE /api/notifications/:id': 'Delete notification'
      },
      tickets: {
        'POST /api/tickets': 'Create service ticket',
        'GET /api/tickets': 'Get user tickets',
        'GET /api/tickets/:id': 'Get ticket details',
        'POST /api/tickets/:id/messages': 'Add message to ticket',
        'PUT /api/tickets/:id/status': 'Update ticket status',
        'PUT /api/tickets/:id/assign': 'Assign ticket',
        'GET /api/tickets/stats': 'Get ticket statistics',
        'GET /api/tickets/types': 'Get ticket types',
        'GET /api/tickets/priorities': 'Get ticket priorities'
      },
      health: {
        'GET /api/health': 'Basic health check',
        'GET /api/health/detailed': 'Detailed health check',
        'GET /api/health/db': 'Database health check'
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rateLimiting: {
      requests: '100 per 15 minutes per IP',
      burst: '10 requests per second'
    }
  });
});

// =====================================================
// ROUTE LOADING
// =====================================================

// Load all route modules
try {
  // Core API routes
  enterpriseLogger.info('Loading auth routes...');
  router.use('/auth', require('./auth'));
  enterpriseLogger.info('Auth routes loaded successfully');
  
  enterpriseLogger.info('Loading ITR routes...');
  router.use('/itr', require('./itr'));
  enterpriseLogger.info('ITR routes loaded successfully');
  
  enterpriseLogger.info('Loading user routes...');
  router.use('/users', require('./user'));
  enterpriseLogger.info('User routes loaded successfully');
  
  enterpriseLogger.info('Loading member routes...');
  router.use('/members', require('./members'));
  enterpriseLogger.info('Member routes loaded successfully');
  
  enterpriseLogger.info('Loading health routes...');
  router.use('/health', require('./health'));
  enterpriseLogger.info('Health routes loaded successfully');
  
  enterpriseLogger.info('Loading admin routes...');
  router.use('/admin', require('./admin'));
  enterpriseLogger.info('Admin routes loaded successfully');
  
  // Additional feature routes
  enterpriseLogger.info('Loading document routes...');
  router.use('/documents', require('./documents'));
  enterpriseLogger.info('Document routes loaded successfully');
  
  enterpriseLogger.info('Loading notification routes...');
  router.use('/notifications', require('./notifications'));
  enterpriseLogger.info('Notification routes loaded successfully');
  
  enterpriseLogger.info('Loading ticket routes...');
  router.use('/tickets', require('./tickets'));
  enterpriseLogger.info('Ticket routes loaded successfully');
  
  enterpriseLogger.info('Loading CA firm routes...');
  router.use('/ca-firms', require('./ca-firms'));
  enterpriseLogger.info('CA firm routes loaded successfully');
  
  enterpriseLogger.info('Loading broker routes...');
  router.use('/broker', require('./broker'));
  enterpriseLogger.info('Broker routes loaded successfully');
  
  enterpriseLogger.info('Loading bank routes...');
  router.use('/bank', require('./bank'));
  enterpriseLogger.info('Bank routes loaded successfully');
  
  enterpriseLogger.info('Loading CA Bot routes...');
  router.use('/cabot', require('./cabot'));
  enterpriseLogger.info('CA Bot routes loaded successfully');
  
  enterpriseLogger.info('Loading ERI routes...');
  router.use('/eri', require('./eri'));
  enterpriseLogger.info('ERI routes loaded successfully');
  
  enterpriseLogger.info('All routes loaded successfully');
} catch (error) {
  enterpriseLogger.error('Error loading routes', { 
    error: error.message, 
    stack: error.stack,
    name: error.name 
  });
}

// =====================================================
// GLOBAL ERROR HANDLER FOR ROUTES
// =====================================================

router.use((err, req, res, next) => {
  enterpriseLogger.error('Route error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// 404 HANDLER FOR UNKNOWN ROUTES
// =====================================================

router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/api',
      '/api/docs',
      '/api/auth',
      '/api/itr',
      '/api/users',
      '/api/health',
      '/api/admin',
      '/api/documents',
      '/api/notifications',
      '/api/tickets',
      '/api/ca-firms',
      '/api/cabot',
      '/api/eri'
    ]
  });
});

module.exports = router;