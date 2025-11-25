/**
 * ERI Routes
 *
 * Routes for ERI (E-Return Intermediary) operations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { testSigning, validateConfig, submitITR, getStatus, extractPublicKey, validatePEM } = require('../controllers/eriController');
const enterpriseLogger = require('../utils/logger');

// Log route loading
enterpriseLogger.info('Loading ERI routes...');

/**
 * Test ERI signing functionality
 * POST /api/eri/test-signing
 */
router.post('/test-signing', authenticateToken, testSigning);

/**
 * Validate ERI configuration
 * GET /api/eri/validate-config
 */
router.get('/validate-config', authenticateToken, validateConfig);

/**
 * Submit ITR data to ITD
 * POST /api/eri/submit-itr
 */
router.post('/submit-itr', authenticateToken, submitITR);

/**
 * Get ERI status and configuration
 * GET /api/eri/status
 */
router.get('/status', authenticateToken, getStatus);

/**
 * Extract public key from PKCS#12 certificate
 * POST /api/eri/extract-public-key
 */
router.post('/extract-public-key', authenticateToken, extractPublicKey);

/**
 * Validate PEM certificate
 * GET /api/eri/validate-pem
 */
router.get('/validate-pem', authenticateToken, validatePEM);

// Log successful loading
enterpriseLogger.info('ERI routes loaded successfully');

module.exports = router;
