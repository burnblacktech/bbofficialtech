// =====================================================
// FEATURE FLAGS SYSTEM (MOCK/LIVE SWITCHING)
// =====================================================

const enterpriseLogger = require('../utils/logger');

class FeatureFlagsService {
  constructor() {
    this.flags = new Map();
    this.initializeDefaultFlags();
    enterpriseLogger.info('FeatureFlagsService initialized');
  }

  /**
   * Initialize default feature flags
   */
  initializeDefaultFlags() {
    const defaultFlags = {
      // PAN Verification
      'feature_pan_verification_live': {
        name: 'PAN Verification Live Mode',
        description: 'Use live SurePass API for PAN verification',
        defaultValue: false,
        type: 'boolean',
        category: 'verification',
      },

      // ERI Integration
      'feature_eri_live': {
        name: 'ERI Integration Live Mode',
        description: 'Use live ERI API for ITR submission',
        defaultValue: false,
        type: 'boolean',
        category: 'integration',
      },

      // AI Copilot
      'feature_ai_copilot_enabled': {
        name: 'AI Copilot Enabled',
        description: 'Enable AI Copilot assistance',
        defaultValue: true,
        type: 'boolean',
        category: 'ai',
      },

      'feature_ai_copilot_llm': {
        name: 'AI Copilot LLM Mode',
        description: 'Use LLM for AI Copilot responses',
        defaultValue: false,
        type: 'boolean',
        category: 'ai',
      },

      // MFA
      'feature_mfa_enabled': {
        name: 'MFA Enabled',
        description: 'Enable Multi-Factor Authentication',
        defaultValue: true,
        type: 'boolean',
        category: 'security',
      },

      'feature_mfa_submission_only': {
        name: 'MFA Submission Only',
        description: 'Require MFA only for ITR submission',
        defaultValue: true,
        type: 'boolean',
        category: 'security',
      },

      // Document Processing
      'feature_document_ocr': {
        name: 'Document OCR',
        description: 'Enable OCR for document processing',
        defaultValue: false,
        type: 'boolean',
        category: 'documents',
      },

      'feature_document_ais_prefill': {
        name: 'AIS Prefill',
        description: 'Enable AIS/26AS prefill',
        defaultValue: false,
        type: 'boolean',
        category: 'documents',
      },

      // Notifications
      'feature_notifications_sse': {
        name: 'SSE Notifications',
        description: 'Enable Server-Sent Events for notifications',
        defaultValue: true,
        type: 'boolean',
        category: 'notifications',
      },

      'feature_notifications_email': {
        name: 'Email Notifications',
        description: 'Enable email notifications',
        defaultValue: true,
        type: 'boolean',
        category: 'notifications',
      },

      'feature_notifications_sms': {
        name: 'SMS Notifications',
        description: 'Enable SMS notifications',
        defaultValue: false,
        type: 'boolean',
        category: 'notifications',
      },

      // Payment
      'feature_payment_online': {
        name: 'Online Payments',
        description: 'Enable online payment processing',
        defaultValue: false,
        type: 'boolean',
        category: 'payment',
      },

      'feature_payment_razorpay': {
        name: 'Razorpay Integration',
        description: 'Enable Razorpay payment gateway',
        defaultValue: false,
        type: 'boolean',
        category: 'payment',
      },

      // Admin Features
      'feature_admin_advanced': {
        name: 'Advanced Admin Panel',
        description: 'Enable advanced admin features',
        defaultValue: false,
        type: 'boolean',
        category: 'admin',
      },

      'feature_admin_analytics': {
        name: 'Admin Analytics',
        description: 'Enable admin analytics dashboard',
        defaultValue: false,
        type: 'boolean',
        category: 'admin',
      },

      // Service Tickets
      'feature_service_tickets_auto': {
        name: 'Auto Service Tickets',
        description: 'Automatically create service tickets',
        defaultValue: true,
        type: 'boolean',
        category: 'support',
      },

      'feature_service_tickets_chat': {
        name: 'Service Ticket Chat',
        description: 'Enable chat in service tickets',
        defaultValue: false,
        type: 'boolean',
        category: 'support',
      },

      // Performance
      'feature_caching_enabled': {
        name: 'Caching Enabled',
        description: 'Enable application caching',
        defaultValue: true,
        type: 'boolean',
        category: 'performance',
      },

      'feature_rate_limiting': {
        name: 'Rate Limiting',
        description: 'Enable API rate limiting',
        defaultValue: true,
        type: 'boolean',
        category: 'performance',
      },
    };

    // Initialize flags with default values
    Object.entries(defaultFlags).forEach(([key, config]) => {
      this.flags.set(key, {
        ...config,
        value: this.getEnvironmentValue(key, config.defaultValue),
        lastUpdated: new Date(),
        updatedBy: 'system',
      });
    });

    enterpriseLogger.info('Default feature flags initialized', {
      count: this.flags.size,
    });
  }

  /**
   * Get feature flag value
   * @param {string} flagKey - Feature flag key
   * @param {any} defaultValue - Default value if flag not found
   * @returns {any} - Flag value
   */
  getFlag(flagKey, defaultValue = null) {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      enterpriseLogger.warn('Feature flag not found', { flagKey });
      return defaultValue;
    }

    return flag.value;
  }

  /**
   * Set feature flag value
   * @param {string} flagKey - Feature flag key
   * @param {any} value - New value
   * @param {string} updatedBy - User who updated the flag
   * @returns {boolean} - Success status
   */
  setFlag(flagKey, value, updatedBy = 'system') {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      enterpriseLogger.warn('Cannot set non-existent feature flag', { flagKey });
      return false;
    }

    // Validate value type
    if (!this.validateFlagValue(flag, value)) {
      enterpriseLogger.error('Invalid feature flag value', {
        flagKey,
        value,
        expectedType: flag.type,
      });
      return false;
    }

    flag.value = value;
    flag.lastUpdated = new Date();
    flag.updatedBy = updatedBy;

    enterpriseLogger.info('Feature flag updated', {
      flagKey,
      value,
      updatedBy,
    });

    return true;
  }

  /**
   * Get all feature flags
   * @param {string} category - Optional category filter
   * @returns {Array} - Array of feature flags
   */
  getAllFlags(category = null) {
    const flags = Array.from(this.flags.entries()).map(([key, config]) => ({
      key,
      ...config,
    }));

    if (category) {
      return flags.filter(flag => flag.category === category);
    }

    return flags;
  }

  /**
   * Get feature flags by category
   * @param {string} category - Category name
   * @returns {Array} - Array of feature flags in category
   */
  getFlagsByCategory(category) {
    return this.getAllFlags(category);
  }

  /**
   * Check if feature is enabled
   * @param {string} flagKey - Feature flag key
   * @returns {boolean} - Whether feature is enabled
   */
  isEnabled(flagKey) {
    return this.getFlag(flagKey, false) === true;
  }

  /**
   * Check if feature is disabled
   * @param {string} flagKey - Feature flag key
   * @returns {boolean} - Whether feature is disabled
   */
  isDisabled(flagKey) {
    return !this.isEnabled(flagKey);
  }

  /**
   * Get environment variable value
   * @param {string} key - Environment variable key
   * @param {any} defaultValue - Default value
   * @returns {any} - Environment value
   */
  getEnvironmentValue(key, defaultValue) {
    const envValue = process.env[key.toUpperCase()];

    if (envValue === undefined) {
      return defaultValue;
    }

    // Convert string values to appropriate types
    if (typeof defaultValue === 'boolean') {
      return envValue.toLowerCase() === 'true';
    }

    if (typeof defaultValue === 'number') {
      return parseInt(envValue, 10);
    }

    return envValue;
  }

  /**
   * Validate feature flag value
   * @param {object} flag - Feature flag configuration
   * @param {any} value - Value to validate
   * @returns {boolean} - Whether value is valid
   */
  validateFlagValue(flag, value) {
    switch (flag.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    default:
      return true;
    }
  }

  /**
   * Get feature flag statistics
   * @returns {object} - Statistics
   */
  getStats() {
    const flags = Array.from(this.flags.values());

    return {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.value === true).length,
      disabledFlags: flags.filter(f => f.value === false).length,
      categories: [...new Set(flags.map(f => f.category))],
      lastUpdated: flags.reduce((latest, flag) =>
        flag.lastUpdated > latest ? flag.lastUpdated : latest, new Date(0),
      ),
    };
  }

  /**
   * Export feature flags configuration
   * @returns {object} - Exported configuration
   */
  exportConfig() {
    const config = {};

    this.flags.forEach((flag, key) => {
      config[key] = flag.value;
    });

    return config;
  }

  /**
   * Import feature flags configuration
   * @param {object} config - Configuration to import
   * @param {string} updatedBy - User who imported the config
   * @returns {number} - Number of flags updated
   */
  importConfig(config, updatedBy = 'system') {
    let updatedCount = 0;

    Object.entries(config).forEach(([key, value]) => {
      if (this.setFlag(key, value, updatedBy)) {
        updatedCount++;
      }
    });

    enterpriseLogger.info('Feature flags configuration imported', {
      updatedCount,
      totalFlags: Object.keys(config).length,
      updatedBy,
    });

    return updatedCount;
  }

  /**
   * Reset feature flag to default value
   * @param {string} flagKey - Feature flag key
   * @param {string} updatedBy - User who reset the flag
   * @returns {boolean} - Success status
   */
  resetFlag(flagKey, updatedBy = 'system') {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      return false;
    }

    return this.setFlag(flagKey, flag.defaultValue, updatedBy);
  }

  /**
   * Reset all feature flags to default values
   * @param {string} updatedBy - User who reset the flags
   * @returns {number} - Number of flags reset
   */
  resetAllFlags(updatedBy = 'system') {
    let resetCount = 0;

    this.flags.forEach((flag, key) => {
      if (this.setFlag(key, flag.defaultValue, updatedBy)) {
        resetCount++;
      }
    });

    enterpriseLogger.info('All feature flags reset to defaults', {
      resetCount,
      updatedBy,
    });

    return resetCount;
  }
}

module.exports = new FeatureFlagsService();
