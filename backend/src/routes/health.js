// =====================================================
// HEALTH CHECK ROUTES
// Production monitoring and diagnostics
// =====================================================

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const redis = require('../config/redis');

/**
 * Basic Health Check
 * GET /health
 * 
 * Returns 200 if service is alive
 */
router.get('/health', async (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Detailed Health Check
 * GET /health/detailed
 * 
 * Checks all critical dependencies
 */
router.get('/health/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {}
    };

    // Database check
    try {
        await sequelize.authenticate();
        health.checks.database = {
            status: 'healthy',
            message: 'Database connection successful'
        };
    } catch (error) {
        health.status = 'unhealthy';
        health.checks.database = {
            status: 'unhealthy',
            message: error.message
        };
    }

    // Redis check
    try {
        if (redis) {
            await redis.ping();
            health.checks.redis = {
                status: 'healthy',
                message: 'Redis connection successful'
            };
        } else {
            health.checks.redis = {
                status: 'skipped',
                message: 'Redis not configured'
            };
        }
    } catch (error) {
        health.status = 'degraded';
        health.checks.redis = {
            status: 'unhealthy',
            message: error.message
        };
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
    };

    health.checks.memory = {
        status: memUsageMB.heapUsed > 500 ? 'warning' : 'healthy',
        usage: memUsageMB,
        message: memUsageMB.heapUsed > 500 ? 'High memory usage' : 'Memory usage normal'
    };

    // Set response status
    const statusCode = health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
});

/**
 * Readiness Check
 * GET /health/ready
 * 
 * Returns 200 when service is ready to accept traffic
 */
router.get('/health/ready', async (req, res) => {
    try {
        // Check database
        await sequelize.authenticate();

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * Liveness Check
 * GET /health/live
 * 
 * Returns 200 if process is alive (no dependency checks)
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid
    });
});

module.exports = router;
