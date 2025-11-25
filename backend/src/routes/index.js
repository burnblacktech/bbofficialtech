// =====================================================
// MAIN ROUTES INDEX - AUTOMATIC ROUTE DISCOVERY SYSTEM
// =====================================================

const express = require('express');
const enterpriseLogger = require('../utils/logger');
const { getRouteDiscovery, routeInfoMiddleware } = require('./router');

const router = express.Router();

// =====================================================
// API INFORMATION ROUTE (DYNAMIC)
// =====================================================

router.get('/', async (req, res) => {
  try {
    const discovery = getRouteDiscovery();
    const routeHealth = await discovery.getRouteHealth();
    const apiDocs = discovery.getAPIDocumentation();

    res.json({
      message: 'BurnBlack ITR Platform API',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
      health: '/api/health',
      routeDiscovery: {
        totalRoutes: routeHealth.totalRoutes,
        routes: Object.keys(routeHealth.routes),
      },
      endpoints: Object.keys(routeHealth.routes).reduce((acc, routeName) => {
        acc[routeName] = `/api/${routeHealth.routes[routeName].path}`;
        return acc;
      }, {}),
    });
  } catch (error) {
    enterpriseLogger.error('Error in API info route', { error: error.message });
    res.status(500).json({
      error: 'Failed to get API information',
      message: error.message,
    });
  }
});

// =====================================================
// API DOCUMENTATION ROUTE (AUTO-GENERATED)
// =====================================================

router.get('/docs', async (req, res) => {
  try {
    const discovery = getRouteDiscovery();
    const apiDocs = discovery.getAPIDocumentation();

    if (apiDocs.error) {
      return res.status(503).json({
        error: 'Documentation not available',
        message: apiDocs.error,
      });
    }

    res.json({
      ...apiDocs,
      authentication: {
        type: 'JWT Bearer Token',
        header: 'Authorization: Bearer <token>',
      },
      rateLimiting: {
        requests: '100 per 15 minutes per IP',
        burst: '10 requests per second',
      },
      discovery: {
        enabled: true,
        description: 'Routes are automatically discovered and registered',
      },
    });
  } catch (error) {
    enterpriseLogger.error('Error generating API docs', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate API documentation',
      message: error.message,
    });
  }
});

// =====================================================
// ROUTE DISCOVERY HEALTH ROUTE
// =====================================================

router.get('/routes', async (req, res) => {
  try {
    const discovery = getRouteDiscovery();
    const routeHealth = await discovery.getRouteHealth();

    res.json({
      discovery: {
        status: routeHealth.status,
        totalRoutes: routeHealth.totalRoutes,
        timestamp: new Date().toISOString(),
      },
      routes: routeHealth.routes,
    });
  } catch (error) {
    enterpriseLogger.error('Error getting route health', { error: error.message });
    res.status(500).json({
      error: 'Failed to get route information',
      message: error.message,
    });
  }
});

// =====================================================
// AUTOMATIC ROUTE DISCOVERY INITIALIZATION
// =====================================================

// Initialize route discovery and register all routes
let routeDiscoveryInitialized = false;

async function initializeRouteDiscovery() {
  if (routeDiscoveryInitialized) {
    return;
  }

  try {
    enterpriseLogger.info('Initializing automatic route discovery...');

    const { initializeRouter } = require('./router');
    const autoRouter = await initializeRouter();

    // Mount the automatically discovered routes
    // Mount at root path since routes already have their paths (e.g., /auth, /health)
    router.use('/', autoRouter);

    routeDiscoveryInitialized = true;
    enterpriseLogger.info('Automatic route discovery completed successfully');

  } catch (error) {
    enterpriseLogger.error('Route discovery initialization failed', {
      error: error.message,
      stack: error.stack,
    });
    // Fallback: continue with basic routes if discovery fails
  }
}

// Initialize routes when this module is loaded
// Handle async initialization without blocking
// Note: Routes will be available after initialization completes
initializeRouteDiscovery().catch(error => {
  enterpriseLogger.error('Failed to initialize route discovery during module load', {
    error: error.message,
    stack: error.stack,
  });
  // Don't crash the app, continue with basic routes
});

// Export initialization function for synchronous access if needed
module.exports.initializeRouteDiscovery = initializeRouteDiscovery;

// =====================================================
// GLOBAL ERROR HANDLER FOR ROUTES
// =====================================================

router.use((err, req, res, next) => {
  enterpriseLogger.error('Route error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    routeDiscovery: routeDiscoveryInitialized,
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    routeDiscovery: routeDiscoveryInitialized,
  });
});

// =====================================================
// 404 HANDLER FOR UNKNOWN ROUTES (DYNAMIC)
// =====================================================

router.use('*', async (req, res) => {
  try {
    const discovery = getRouteDiscovery();
    const routeHealth = await discovery.getRouteHealth();
    const availableRoutes = Object.keys(routeHealth.routes).map(routeName =>
      `/api${routeHealth.routes[routeName].path}`,
    );

    res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      routeDiscovery: routeDiscoveryInitialized,
      availableRoutes: [
        '/api',
        '/api/docs',
        '/api/routes',
        ...availableRoutes,
      ],
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      routeDiscovery: routeDiscoveryInitialized,
    });
  }
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = router;

// Also export the initialization function for external use
module.exports.initializeRouteDiscovery = initializeRouteDiscovery;