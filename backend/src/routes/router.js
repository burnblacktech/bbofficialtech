// =====================================================
// AUTOMATIC ROUTE DISCOVERY SYSTEM
// Purpose: Automatic route discovery and registration
// Implementation: Scan routes directory, auto-register route modules
// Benefits: No manual maintenance, consistent error handling, automatic docs generation
// =====================================================

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const enterpriseLogger = require('../utils/logger');

class RouteDiscovery {
  constructor(routesDir = __dirname) {
    this.routesDir = routesDir;
    this.registeredRoutes = new Map();
    this.router = express.Router();
    this.routeMetadata = new Map();
  }

  /**
   * Automatically discover and register all route files
   */
  async discoverAndRegisterRoutes() {
    try {
      enterpriseLogger.info('Starting automatic route discovery...');

      const routeFiles = await this.getRouteFiles();

      for (const routeFile of routeFiles) {
        await this.registerRoute(routeFile);
      }

      await this.generateAPIDocs();
      enterpriseLogger.info(`Successfully registered ${this.registeredRoutes.size} routes`);

      return this.router;
    } catch (error) {
      enterpriseLogger.error('Route discovery failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all route files in the routes directory
   */
  async getRouteFiles() {
    const files = await fs.readdir(this.routesDir);
    return files
      .filter(file => {
        // Skip index.js, router.js, and api.js (this file and parent router)
        return file.endsWith('.js') &&
               !['index.js', 'router.js', 'api.js'].includes(file) &&
               !file.startsWith('.');
      })
      .map(file => path.join(this.routesDir, file));
  }

  /**
   * Register a single route file
   */
  async registerRoute(routeFile) {
    try {
      const routeName = path.basename(routeFile, '.js');
      const routeModule = require(routeFile);

      // Skip if route doesn't export an Express router
      if (typeof routeModule !== 'function' && typeof routeModule?.default !== 'function') {
        enterpriseLogger.warn(`Skipping ${routeName}: not a valid Express route module`);
        return;
      }

      const routeHandler = routeModule.default || routeModule;
      const routePath = this.getRoutePath(routeName);

      // Add route metadata
      this.addRouteMetadata(routeName, routeFile, routePath);

      // Apply common middleware to all routes
      // Add leading slash for route path
      const routePathWithSlash = '/' + routePath;
      // Mount the route handler directly - it's already an Express router
      this.router.use(routePathWithSlash, routeHandler);

      this.registeredRoutes.set(routeName, {
        path: routePath,
        file: routeFile,
        handler: routeHandler,
      });

      enterpriseLogger.info(`Registered route: ${routePath} from ${routeName}.js`);

    } catch (error) {
      enterpriseLogger.error(`Failed to register route ${routeFile}`, {
        error: error.message,
        stack: error.stack,
      });
      // Continue with other routes instead of failing completely
    }
  }

  /**
   * Convert filename to route path
   */
  getRoutePath(routeName) {
    // Convert kebab-case to route path
    // Return without leading slash - will be added when mounting
    return routeName.replace(/-/g, '');
  }

  /**
   * Apply common middleware to all routes
   */
  applyCommonMiddleware(routeHandler) {
    const router = express.Router();

    // Request timing middleware
    router.use((req, res, next) => {
      req.routeStartTime = Date.now();
      next();
    });

    // Route-specific logging middleware
    router.use((req, res, next) => {
      enterpriseLogger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
      });
      next();
    });

    // Use the actual route handler
    router.use(routeHandler);

    // Post-route middleware for timing
    router.use((req, res, next) => {
      const duration = Date.now() - req.routeStartTime;
      enterpriseLogger.info(`Route completed: ${req.method} ${req.originalUrl}`, {
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
      next();
    });

    return router;
  }

  /**
   * Add metadata for a route
   */
  addRouteMetadata(routeName, routeFile, routePath) {
    this.routeMetadata.set(routeName, {
      name: routeName,
      path: routePath,
      file: routeFile,
      registeredAt: new Date().toISOString(),
      endpoints: this.extractEndpointInfo(routeFile),
    });
  }

  /**
   * Extract endpoint information from route file (basic implementation)
   */
  extractEndpointInfo(routeFile) {
    try {
      const content = require('fs').readFileSync(routeFile, 'utf8');
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
      const endpoints = [];

      httpMethods.forEach(method => {
        const regex = new RegExp(`router\\.${method}\\s*\\(\\s*['"]([^'"]+)['"]`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          endpoints.push({
            method: method.toUpperCase(),
            path: match[1],
          });
        }
      });

      return endpoints;
    } catch (error) {
      enterpriseLogger.warn(`Could not extract endpoints from ${routeFile}`, {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Generate API documentation automatically
   */
  async generateAPIDocs() {
    const docs = {
      title: 'BurnBlack ITR Platform API Documentation',
      version: '1.0.0',
      description: 'Enterprise-grade Indian Income Tax Return filing platform',
      generated: new Date().toISOString(),
      routes: {},
    };

    // Convert metadata Map to object
    this.routeMetadata.forEach((metadata, routeName) => {
      docs.routes[routeName] = metadata;
    });

    // Store docs for later retrieval
    this.apiDocs = docs;

    enterpriseLogger.info('API documentation generated automatically');
  }

  /**
   * Get API documentation
   */
  getAPIDocumentation() {
    return this.apiDocs || { error: 'Documentation not yet generated' };
  }

  /**
   * Health check for all registered routes
   */
  async getRouteHealth() {
    const health = {
      status: 'healthy',
      totalRoutes: this.registeredRoutes.size,
      routes: {},
    };

    this.registeredRoutes.forEach((routeInfo, routeName) => {
      health.routes[routeName] = {
        status: 'registered',
        path: routeInfo.path,
        file: routeInfo.file,
      };
    });

    return health;
  }

  /**
   * Get all registered routes
   */
  getRegisteredRoutes() {
    return Array.from(this.registeredRoutes.keys());
  }
}

// =====================================================
// ROUTER INSTANCE CREATION
// =====================================================

let routeDiscoveryInstance = null;

/**
 * Get or create the route discovery instance
 */
function getRouteDiscovery() {
  if (!routeDiscoveryInstance) {
    routeDiscoveryInstance = new RouteDiscovery();
  }
  return routeDiscoveryInstance;
}

/**
 * Initialize and return the router with all routes discovered
 */
async function initializeRouter() {
  const discovery = getRouteDiscovery();
  return await discovery.discoverAndRegisterRoutes();
}

// =====================================================
// MIDDLEWARE FOR ROUTE INFORMATION
// =====================================================

/**
 * Middleware to add route information to requests
 */
function routeInfoMiddleware(req, res, next) {
  const discovery = getRouteDiscovery();
  req.registeredRoutes = discovery.getRegisteredRoutes();
  req.routeHealth = discovery.getRouteHealth();
  next();
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  RouteDiscovery,
  getRouteDiscovery,
  initializeRouter,
  routeInfoMiddleware,
};

// Also export the initialized router directly for convenience
module.exports.router = initializeRouter();