// =====================================================
// ERI (E-Return Intermediary) ROUTES
// Routes for direct e-filing with IT Department
// =====================================================

const express = require('express');
const router = express.Router();
const ERIService = require('../services/ERIService');
const { authenticateToken } = require('../middleware/auth');
const enterpriseLogger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/eri/health
 * Check ERI service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await ERIService.healthCheck();
    sendSuccess(res, 'ERI service health check', health);
  } catch (error) {
    sendError(res, 'ERI health check failed', 500, error.message);
  }
});

/**
 * POST /api/eri/validate-pan
 * Validate PAN with IT Department
 */
router.post('/validate-pan', async (req, res) => {
  try {
    const { pan } = req.body;

    if (!pan) {
      return sendError(res, 'PAN is required', 400);
    }

    const result = await ERIService.validatePAN(pan);
    sendSuccess(res, 'PAN validated successfully', result.data);

  } catch (error) {
    enterpriseLogger.error('ERI PAN validation error', {
      userId: req.user?.id,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/eri/prefill/:pan/:assessmentYear
 * Get prefilled ITR data
 */
router.get('/prefill/:pan/:assessmentYear', async (req, res) => {
  try {
    const { pan, assessmentYear } = req.params;

    const result = await ERIService.getPrefilledData(pan, assessmentYear);
    sendSuccess(res, 'Prefilled data retrieved', result.data);

  } catch (error) {
    enterpriseLogger.error('ERI prefill error', {
      userId: req.user?.id,
      assessmentYear: req.params.assessmentYear,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * POST /api/eri/submit
 * Submit ITR to IT Department
 */
router.post('/submit', async (req, res) => {
  try {
    const { itrData, itrType, assessmentYear } = req.body;

    if (!itrData || !itrType || !assessmentYear) {
      return sendError(res, 'itrData, itrType, and assessmentYear are required', 400);
    }

    const result = await ERIService.submitITR(itrData, itrType, assessmentYear);

    enterpriseLogger.info('ITR submitted via ERI', {
      userId: req.user?.id,
      itrType,
      assessmentYear,
      acknowledgmentNumber: result.acknowledgmentNumber,
    });

    sendSuccess(res, 'ITR submitted successfully', {
      acknowledgmentNumber: result.acknowledgmentNumber,
      filingDate: result.filingDate,
      status: result.status,
    });

  } catch (error) {
    enterpriseLogger.error('ERI submission error', {
      userId: req.user?.id,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/eri/status/:acknowledgmentNumber
 * Get filing status
 */
router.get('/status/:acknowledgmentNumber', async (req, res) => {
  try {
    const { acknowledgmentNumber } = req.params;

    const result = await ERIService.getFilingStatus(acknowledgmentNumber);
    sendSuccess(res, 'Filing status retrieved', result);

  } catch (error) {
    enterpriseLogger.error('ERI status check error', {
      userId: req.user?.id,
      acknowledgmentNumber: req.params.acknowledgmentNumber,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * POST /api/eri/everify/initiate
 * Initiate e-verification
 */
router.post('/everify/initiate', async (req, res) => {
  try {
    const { acknowledgmentNumber, method } = req.body;

    if (!acknowledgmentNumber || !method) {
      return sendError(res, 'acknowledgmentNumber and method are required', 400);
    }

    const result = await ERIService.initiateEVerification(acknowledgmentNumber, method);

    enterpriseLogger.info('E-verification initiated via ERI', {
      userId: req.user?.id,
      acknowledgmentNumber,
      method,
    });

    sendSuccess(res, 'E-verification initiated', {
      transactionId: result.transactionId,
    });

  } catch (error) {
    enterpriseLogger.error('ERI e-verification initiation error', {
      userId: req.user?.id,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * POST /api/eri/everify/complete
 * Complete e-verification with OTP
 */
router.post('/everify/complete', async (req, res) => {
  try {
    const { transactionId, otp } = req.body;

    if (!transactionId || !otp) {
      return sendError(res, 'transactionId and otp are required', 400);
    }

    const result = await ERIService.completeEVerification(transactionId, otp);

    enterpriseLogger.info('E-verification completed via ERI', {
      userId: req.user?.id,
      transactionId,
      verified: result.verified,
    });

    sendSuccess(res, 'E-verification completed', {
      verified: result.verified,
    });

  } catch (error) {
    enterpriseLogger.error('ERI e-verification completion error', {
      userId: req.user?.id,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/eri/itrv/:acknowledgmentNumber
 * Download ITR-V acknowledgment
 */
router.get('/itrv/:acknowledgmentNumber', async (req, res) => {
  try {
    const { acknowledgmentNumber } = req.params;

    const result = await ERIService.downloadITRV(acknowledgmentNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
    res.send(result.pdf);

  } catch (error) {
    enterpriseLogger.error('ERI ITR-V download error', {
      userId: req.user?.id,
      acknowledgmentNumber: req.params.acknowledgmentNumber,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/eri/form26as/:pan/:assessmentYear
 * Get Form 26AS data
 */
router.get('/form26as/:pan/:assessmentYear', async (req, res) => {
  try {
    const { pan, assessmentYear } = req.params;

    const result = await ERIService.getForm26AS(pan, assessmentYear);
    sendSuccess(res, 'Form 26AS retrieved', result.data);

  } catch (error) {
    enterpriseLogger.error('ERI Form 26AS error', {
      userId: req.user?.id,
      assessmentYear: req.params.assessmentYear,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/eri/ais/:pan/:assessmentYear
 * Get AIS data
 */
router.get('/ais/:pan/:assessmentYear', async (req, res) => {
  try {
    const { pan, assessmentYear } = req.params;

    const result = await ERIService.getAIS(pan, assessmentYear);
    sendSuccess(res, 'AIS data retrieved', result.data);

  } catch (error) {
    enterpriseLogger.error('ERI AIS error', {
      userId: req.user?.id,
      assessmentYear: req.params.assessmentYear,
      error: error.message,
    });
    sendError(res, error.message, 500);
  }
});

module.exports = router;
