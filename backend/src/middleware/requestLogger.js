// =====================================================
// REQUEST LOGGER MIDDLEWARE
// Tracks request IDs for distributed tracing
// =====================================================

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 * 
 * Adds unique request ID to each request for tracing
 * Logs request/response details
 * Measures request duration
 */
const requestLogger = (req, res, next) => {
    // Generate or use existing request ID
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Start timer
    const startTime = Date.now();

    // Log incoming request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || 'anonymous'
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;

        // Log response
        logger.info('Outgoing response', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id || 'anonymous'
        });

        // Performance warning
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                requestId,
                method: req.method,
                path: req.path,
                duration: `${duration}ms`
            });
        }

        originalSend.call(this, data);
    };

    next();
};

module.exports = requestLogger;
