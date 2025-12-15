// =====================================================
// CA BOT SERVICE - FRONTEND API INTEGRATION
// Handles CA Bot API calls and state management
// =====================================================

import axios from 'axios';
import { enterpriseLogger } from '../utils/logger';
import { getApiBaseUrl } from '../utils/apiConfig';

class CABotService {
  constructor() {
    this.baseURL = getApiBaseUrl();
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );

    enterpriseLogger.info('CABotService initialized', { baseURL: this.baseURL });
  }

  /**
   * Process user message and get AI response
   * @param {string} message - User message
   * @param {object} context - Conversation context
   * @returns {Promise<object>} - AI response
   */
  async processMessage(message, context) {
    try {
      enterpriseLogger.info('Processing CA Bot message', {
        messageLength: message.length,
        userType: context.userType,
        language: context.language,
      });

      const response = await this.axiosInstance.post('/cabot/message', {
        message,
        context,
      });

      enterpriseLogger.info('CA Bot response received', {
        responseLength: response.data.data.response.length,
        userType: response.data.data.metadata.userType,
      });

      return response.data.data;
    } catch (error) {
      enterpriseLogger.error('CA Bot message processing error', {
        error: error.message,
        message: message,
      });
      throw error;
    }
  }

  /**
   * Detect user type from message
   * @param {string} message - User message
   * @returns {Promise<object>} - User type detection result
   */
  async detectUserType(message) {
    try {
      enterpriseLogger.info('Detecting user type', { messageLength: message.length });

      const response = await this.axiosInstance.post('/cabot/detect-user-type', {
        message,
      });

      enterpriseLogger.info('User type detected', {
        userType: response.data.data.userType,
        confidence: response.data.data.confidence,
      });

      return response.data.data;
    } catch (error) {
      enterpriseLogger.error('User type detection error', {
        error: error.message,
        message: message,
      });
      throw error;
    }
  }

  /**
   * Get conversation context
   * @param {string} filingId - Optional filing ID
   * @returns {Promise<object>} - Conversation context
   */
  async getConversationContext(filingId = null) {
    try {
      const url = filingId ? `/cabot/context/${filingId}` : '/cabot/context';

      enterpriseLogger.info('Getting conversation context', { filingId });

      const response = await this.axiosInstance.get(url);

      enterpriseLogger.info('Conversation context retrieved', {
        currentStep: response.data.data.context.currentStep,
        userType: response.data.data.context.userType,
      });

      return response.data.data.context;
    } catch (error) {
      enterpriseLogger.error('Conversation context error', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Update conversation context
   * @param {object} context - Updated context
   * @returns {Promise<object>} - Updated context
   */
  async updateConversationContext(context) {
    try {
      enterpriseLogger.info('Updating conversation context', {
        userType: context.userType,
        language: context.language,
        currentStep: context.currentStep,
      });

      const response = await this.axiosInstance.put('/cabot/context', {
        context,
      });

      enterpriseLogger.info('Conversation context updated', {
        userType: response.data.data.context.userType,
        currentStep: response.data.data.context.currentStep,
      });

      return response.data.data.context;
    } catch (error) {
      enterpriseLogger.error('Conversation context update error', {
        error: error.message,
        context: context,
      });
      throw error;
    }
  }

  /**
   * Process filing data from conversation
   * @param {object} conversationData - Conversation data
   * @returns {Promise<object>} - Processed filing data
   */
  async processFilingData(conversationData) {
    try {
      enterpriseLogger.info('Processing filing data from conversation', {
        userType: conversationData.userType,
        language: conversationData.language,
        steps: conversationData.steps?.length || 0,
      });

      const response = await this.axiosInstance.post('/cabot/process-filing-data', {
        conversationData,
      });

      enterpriseLogger.info('Filing data processed', {
        hasPersonalInfo: !!response.data.data.filingData.personalInfo,
        hasIncomeDetails: !!response.data.data.filingData.incomeDetails,
        hasDeductions: !!response.data.data.filingData.deductions,
      });

      return response.data.data.filingData;
    } catch (error) {
      enterpriseLogger.error('Filing data processing error', {
        error: error.message,
        conversationData: conversationData,
      });
      throw error;
    }
  }

  /**
   * Get CA Bot status and configuration
   * @returns {Promise<object>} - Bot status
   */
  async getBotStatus() {
    try {
      enterpriseLogger.info('Getting CA Bot status');

      const response = await this.axiosInstance.get('/cabot/status');

      enterpriseLogger.info('CA Bot status retrieved', {
        isActive: response.data.data.status.isActive,
        aiIntegration: response.data.data.status.features.aiIntegration,
      });

      return response.data.data.status;
    } catch (error) {
      enterpriseLogger.error('CA Bot status error', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reset conversation
   * @param {string} filingId - Optional filing ID
   * @returns {Promise<object>} - New conversation context
   */
  async resetConversation(filingId = null) {
    try {
      const url = filingId ? `/cabot/reset/${filingId}` : '/cabot/reset';

      enterpriseLogger.info('Resetting conversation', { filingId });

      const response = await this.axiosInstance.post(url);

      enterpriseLogger.info('Conversation reset', {
        newStep: response.data.data.context.currentStep,
        userType: response.data.data.context.userType,
      });

      return response.data.data.context;
    } catch (error) {
      enterpriseLogger.error('Conversation reset error', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Get conversation history
   * @param {string} filingId - Optional filing ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Conversation history
   */
  async getConversationHistory(filingId = null, options = {}) {
    try {
      const url = filingId ? `/cabot/history/${filingId}` : '/cabot/history';
      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0,
      };

      enterpriseLogger.info('Getting conversation history', {
        filingId,
        limit: params.limit,
        offset: params.offset,
      });

      const response = await this.axiosInstance.get(url, { params });

      enterpriseLogger.info('Conversation history retrieved', {
        totalCount: response.data.data.history.totalCount,
        hasMore: response.data.data.history.hasMore,
      });

      return response.data.data.history;
    } catch (error) {
      enterpriseLogger.error('Conversation history error', {
        error: error.message,
        filingId,
        options,
      });
      throw error;
    }
  }

  /**
   * Create new conversation session
   * @param {object} options - Session options
   * @returns {Promise<object>} - New session
   */
  async createSession(options = {}) {
    try {
      const session = {
        id: Date.now().toString(),
        userType: options.userType || 'educated',
        language: options.language || 'en',
        currentStep: 'greeting',
        collectedData: {},
        steps: [],
        createdAt: new Date().toISOString(),
        ...options,
      };

      enterpriseLogger.info('Creating new CA Bot session', {
        sessionId: session.id,
        userType: session.userType,
        language: session.language,
      });

      return session;
    } catch (error) {
      enterpriseLogger.error('Session creation error', {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Save conversation to local storage
   * @param {string} sessionId - Session ID
   * @param {object} conversationData - Conversation data
   */
  saveConversationToStorage(sessionId, conversationData) {
    try {
      const key = `cabot_conversation_${sessionId}`;
      localStorage.setItem(key, JSON.stringify(conversationData));

      enterpriseLogger.info('Conversation saved to storage', {
        sessionId,
        key,
        dataSize: JSON.stringify(conversationData).length,
      });
    } catch (error) {
      enterpriseLogger.error('Conversation storage error', {
        error: error.message,
        sessionId,
      });
    }
  }

  /**
   * Load conversation from local storage
   * @param {string} sessionId - Session ID
   * @returns {object|null} - Conversation data
   */
  loadConversationFromStorage(sessionId) {
    try {
      const key = `cabot_conversation_${sessionId}`;
      const data = localStorage.getItem(key);

      if (data) {
        const conversationData = JSON.parse(data);

        enterpriseLogger.info('Conversation loaded from storage', {
          sessionId,
          key,
          dataSize: data.length,
        });

        return conversationData;
      }

      return null;
    } catch (error) {
      enterpriseLogger.error('Conversation load error', {
        error: error.message,
        sessionId,
      });
      return null;
    }
  }

  /**
   * Clear conversation from local storage
   * @param {string} sessionId - Session ID
   */
  clearConversationFromStorage(sessionId) {
    try {
      const key = `cabot_conversation_${sessionId}`;
      localStorage.removeItem(key);

      enterpriseLogger.info('Conversation cleared from storage', {
        sessionId,
        key,
      });
    } catch (error) {
      enterpriseLogger.error('Conversation clear error', {
        error: error.message,
        sessionId,
      });
    }
  }
}

// Create singleton instance
const cabotService = new CABotService();

export default cabotService;
