// =====================================================
// HEALTH ROUTES - SYSTEM HEALTH AND MONITORING
// Enterprise-grade health checks and system monitoring
// =====================================================

const express = require('express');
const { pool } = require('../config/database');
const enterpriseLogger = require('../utils/logger');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// =====================================================
// BASIC HEALTH CHECK ROUTES
// =====================================================

// Basic health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    res.json(healthStatus);
  } catch (error) {
    enterpriseLogger.error('Health check failed', {
      error: error.message,
    });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const healthData = await getDetailedHealthStatus();
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    enterpriseLogger.error('Detailed health check failed', {
      error: error.message,
    });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    enterpriseLogger.error('Database health check failed', {
      error: error.message,
    });
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// =====================================================
// HEALTH CHECK FUNCTIONS
// =====================================================

// Get detailed health status
async function getDetailedHealthStatus() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {},
    };

    // Check database
    try {
      const dbHealth = await checkDatabaseHealth();
      healthData.components.database = dbHealth;
      if (dbHealth.status !== 'healthy') {
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.components.database = {
        status: 'unhealthy',
        error: error.message,
      };
      healthData.status = 'unhealthy';
    }

    // System information
    healthData.system = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
    };

    return healthData;
  } catch (error) {
    enterpriseLogger.error('Error getting detailed health status', {
      error: error.message,
    });
    throw error;
  }
}

// Check database health
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: responseTime,
      version: result.rows[0].version,
      currentTime: result.rows[0].current_time,
    };
  } catch (error) {
    enterpriseLogger.error('Database health check failed', {
      error: error.message,
    });
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

module.exports = router;