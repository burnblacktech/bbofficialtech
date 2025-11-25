// =====================================================
// CA BOT CONTROLLER - CONVERSATIONAL AI ENDPOINTS
// Handles CA Bot API requests and responses
// =====================================================

const cabotService = require('../services/integration/AIService');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class CABotController {
  /**
   * Process user message and generate AI response
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async processMessage(req, res, next) {
    try {
      const { message, context } = req.body;
      const userId = req.user?.id;

      if (!message || !context) {
        throw new AppError('Message and context are required', 400);
      }

      enterpriseLogger.info('Processing CA Bot message', {
        userId,
        messageLength: message.length,
        userType: context.userType,
        language: context.language,
        currentStep: context.currentStep,
      });

      // Detect user type from message
      const detectedUserType = cabotService.detectUserType(message);

      // Update context with detected user type
      const updatedContext = {
        ...context,
        userType: detectedUserType,
        userId,
        timestamp: new Date().toISOString(),
      };

      // Generate AI response
      const response = await cabotService.generateAIResponse(message, updatedContext);

      // Log response generation
      enterpriseLogger.info('CA Bot response generated', {
        userId,
        userType: detectedUserType,
        responseLength: response.content.length,
        isAI: response.metadata.isAI,
      });

      res.status(200).json({
        success: true,
        data: {
          response: response.content,
          metadata: response.metadata,
          context: updatedContext,
        },
      });

    } catch (error) {
      enterpriseLogger.error('CA Bot message processing error', {
        error: error.message,
        userId: req.user?.id,
        message: req.body.message,
      });

      next(error);
    }
  }

  /**
   * Detect user type from message
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async detectUserType(req, res, next) {
    try {
      const { message } = req.body;
      const userId = req.user?.id;

      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const userType = cabotService.detectUserType(message);

      enterpriseLogger.info('User type detected', {
        userId,
        userType,
        messageLength: message.length,
      });

      res.status(200).json({
        success: true,
        data: {
          userType,
          confidence: 'high', // Could be enhanced with confidence scoring
          detectedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      enterpriseLogger.error('User type detection error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Get conversation context
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async getConversationContext(req, res, next) {
    try {
      const userId = req.user?.id;
      const { filingId } = req.params;

      // Get conversation context from database or create new
      const context = {
        userId,
        filingId: filingId || null,
        currentStep: 'greeting',
        userType: 'educated',
        language: 'en',
        collectedData: {},
        steps: [],
        createdAt: new Date().toISOString(),
      };

      enterpriseLogger.info('Conversation context retrieved', {
        userId,
        filingId,
        currentStep: context.currentStep,
      });

      res.status(200).json({
        success: true,
        data: { context },
      });

    } catch (error) {
      enterpriseLogger.error('Conversation context error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Update conversation context
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async updateConversationContext(req, res, next) {
    try {
      const { context } = req.body;
      const userId = req.user?.id;

      if (!context) {
        throw new AppError('Context is required', 400);
      }

      // Validate context
      const validation = cabotService.validateConversationData(context);
      if (!validation.isValid) {
        throw new AppError(`Invalid context: ${validation.errors.join(', ')}`, 400);
      }

      // Update context with user ID
      const updatedContext = {
        ...context,
        userId,
        updatedAt: new Date().toISOString(),
      };

      enterpriseLogger.info('Conversation context updated', {
        userId,
        userType: updatedContext.userType,
        language: updatedContext.language,
        currentStep: updatedContext.currentStep,
        warnings: validation.warnings,
      });

      res.status(200).json({
        success: true,
        data: { context: updatedContext },
        warnings: validation.warnings,
      });

    } catch (error) {
      enterpriseLogger.error('Conversation context update error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Process filing data from conversation
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async processFilingData(req, res, next) {
    try {
      const { conversationData } = req.body;
      const userId = req.user?.id;

      if (!conversationData) {
        throw new AppError('Conversation data is required', 400);
      }

      // Process filing data from conversation
      const filingData = cabotService.processFilingData(conversationData);

      enterpriseLogger.info('Filing data processed from conversation', {
        userId,
        userType: conversationData.userType,
        language: conversationData.language,
        steps: conversationData.steps?.length || 0,
        hasPersonalInfo: !!filingData.personalInfo,
        hasIncomeDetails: !!filingData.incomeDetails,
        hasDeductions: !!filingData.deductions,
      });

      res.status(200).json({
        success: true,
        data: { filingData },
      });

    } catch (error) {
      enterpriseLogger.error('Filing data processing error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Get CA Bot status and configuration
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async getBotStatus(req, res, next) {
    try {
      const userId = req.user?.id;

      const status = {
        isActive: true,
        version: '1.0.0',
        features: {
          userTypeDetection: true,
          languageSupport: ['en', 'hi'],
          voiceInput: true,
          voiceOutput: true,
          realTimeComputation: true,
          aiIntegration: process.env.FEATURE_OPENAI_LIVE === 'true',
        },
        supportedUserTypes: ['non_educated', 'educated', 'ultra_educated'],
        supportedLanguages: ['en', 'hi'],
        filingSteps: [
          'greeting',
          'personal_info',
          'family_selection',
          'income_details',
          'deductions',
          'tax_computation',
          'review',
          'submission',
        ],
      };

      enterpriseLogger.info('CA Bot status retrieved', {
        userId,
        isActive: status.isActive,
        aiIntegration: status.features.aiIntegration,
      });

      res.status(200).json({
        success: true,
        data: { status },
      });

    } catch (error) {
      enterpriseLogger.error('CA Bot status error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Reset conversation
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async resetConversation(req, res, next) {
    try {
      const userId = req.user?.id;
      const { filingId } = req.params;

      const newContext = {
        userId,
        filingId: filingId || null,
        currentStep: 'greeting',
        userType: 'educated',
        language: 'en',
        collectedData: {},
        steps: [],
        createdAt: new Date().toISOString(),
      };

      enterpriseLogger.info('Conversation reset', {
        userId,
        filingId,
        newStep: newContext.currentStep,
      });

      res.status(200).json({
        success: true,
        data: { context: newContext },
        message: 'Conversation reset successfully',
      });

    } catch (error) {
      enterpriseLogger.error('Conversation reset error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }

  /**
   * Get conversation history
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  async getConversationHistory(req, res, next) {
    try {
      const userId = req.user?.id;
      const { filingId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // In a real implementation, this would fetch from database
      // For now, return mock data
      const history = {
        messages: [],
        totalCount: 0,
        hasMore: false,
      };

      enterpriseLogger.info('Conversation history retrieved', {
        userId,
        filingId,
        limit,
        offset,
        totalCount: history.totalCount,
      });

      res.status(200).json({
        success: true,
        data: { history },
      });

    } catch (error) {
      enterpriseLogger.error('Conversation history error', {
        error: error.message,
        userId: req.user?.id,
      });

      next(error);
    }
  }
}

module.exports = new CABotController();
