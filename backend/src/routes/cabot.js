// =====================================================
// CA BOT ROUTES - CONVERSATIONAL AI ENDPOINTS
// =====================================================

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const cabotController = require('../controllers/CABotController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// Validation schemas
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  context: Joi.object({
    userType: Joi.string().valid('non_educated', 'educated', 'ultra_educated').required(),
    language: Joi.string().valid('en', 'hi').required(),
    currentStep: Joi.string().required(),
    collectedData: Joi.object(),
    steps: Joi.array().items(Joi.string()),
  }).required(),
});

const userTypeSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});

const contextSchema = Joi.object({
  context: Joi.object({
    userType: Joi.string().valid('non_educated', 'educated', 'ultra_educated').required(),
    language: Joi.string().valid('en', 'hi').required(),
    currentStep: Joi.string().required(),
    collectedData: Joi.object(),
    steps: Joi.array().items(Joi.string()),
  }).required(),
});

const filingDataSchema = Joi.object({
  conversationData: Joi.object({
    userType: Joi.string().valid('non_educated', 'educated', 'ultra_educated').required(),
    language: Joi.string().valid('en', 'hi').required(),
    currentStep: Joi.string().required(),
    collectedData: Joi.object(),
    steps: Joi.array().items(Joi.string()),
  }).required(),
});

// Routes

/**
 * @route POST /api/cabot/message
 * @desc Process user message and generate AI response
 * @access Private
 */
router.post('/message',
  authenticateToken,
  cabotController.processMessage,
);

/**
 * @route POST /api/cabot/detect-user-type
 * @desc Detect user type from message
 * @access Private
 */
router.post('/detect-user-type',
  authenticateToken,
  cabotController.detectUserType,
);

/**
 * @route GET /api/cabot/context
 * @desc Get conversation context
 * @access Private
 */
router.get('/context',
  authenticateToken,
  cabotController.getConversationContext,
);

/**
 * @route GET /api/cabot/context/:filingId
 * @desc Get conversation context for specific filing
 * @access Private
 */
router.get('/context/:filingId',
  authenticateToken,
  cabotController.getConversationContext,
);

/**
 * @route PUT /api/cabot/context
 * @desc Update conversation context
 * @access Private
 */
router.put('/context',
  authenticateToken,
  cabotController.updateConversationContext,
);

/**
 * @route POST /api/cabot/process-filing-data
 * @desc Process filing data from conversation
 * @access Private
 */
router.post('/process-filing-data',
  authenticateToken,
  cabotController.processFilingData,
);

/**
 * @route GET /api/cabot/status
 * @desc Get CA Bot status and configuration
 * @access Private
 */
router.get('/status',
  authenticateToken,
  cabotController.getBotStatus,
);

/**
 * @route POST /api/cabot/reset
 * @desc Reset conversation
 * @access Private
 */
router.post('/reset',
  authenticateToken,
  cabotController.resetConversation,
);

/**
 * @route POST /api/cabot/reset/:filingId
 * @desc Reset conversation for specific filing
 * @access Private
 */
router.post('/reset/:filingId',
  authenticateToken,
  cabotController.resetConversation,
);

/**
 * @route GET /api/cabot/history
 * @desc Get conversation history
 * @access Private
 */
router.get('/history',
  authenticateToken,
  cabotController.getConversationHistory,
);

/**
 * @route GET /api/cabot/history/:filingId
 * @desc Get conversation history for specific filing
 * @access Private
 */
router.get('/history/:filingId',
  authenticateToken,
  cabotController.getConversationHistory,
);

module.exports = router;
