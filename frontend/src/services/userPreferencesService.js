import apiClient from './api';

// User Preferences Service
// Purpose: Manage user interaction mode preferences and filing behavior

class UserPreferencesService {
  constructor() {
    this.serviceName = 'UserPreferencesService';
  }

  /**
   * Get user preferences including interaction mode
   * @returns {Promise<Object>} User preferences data
   */
  async getUserPreferences() {
    try {
      const response = await apiClient.get('/api/v2/user/preferences');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch preferences');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch preferences',
      };
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Update result
   */
  async updateUserPreferences(preferences) {
    try {
      const response = await apiClient.put('/api/v2/user/preferences', preferences);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update preferences',
      };
    }
  }

  /**
   * Update interaction mode preference
   * @param {string} interactionMode - The interaction mode to set
   * @returns {Promise<Object>} Update result
   */
  async updateInteractionMode(interactionMode) {
    try {
      const response = await apiClient.post('/api/v2/user/preferences/interaction-mode', {
        interactionMode,
      });

      if (response.data.success) {
        // Also update localStorage for immediate UI updates
        localStorage.setItem('interactionModePreference', interactionMode);

        return {
          success: true,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.error || 'Failed to update interaction mode');
      }
    } catch (error) {
      console.error('Error updating interaction mode:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update interaction mode',
      };
    }
  }

  /**
   * Get recommended interaction mode based on user role and history
   * @returns {Promise<Object>} Recommended mode data
   */
  async getRecommendedMode() {
    try {
      const response = await apiClient.get('/api/v2/user/preferences/recommended-mode');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.error || 'Failed to get recommended mode');
      }
    } catch (error) {
      console.error('Error getting recommended mode:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get recommended mode',
      };
    }
  }

  /**
   * Get interaction mode preference from localStorage
   * @returns {string|null} Stored interaction mode preference
   */
  getStoredPreference() {
    return localStorage.getItem('interactionModePreference');
  }

  /**
   * Set interaction mode preference in localStorage
   * @param {string} mode - Interaction mode to store
   */
  setStoredPreference(mode) {
    localStorage.setItem('interactionModePreference', mode);
  }

  /**
   * Clear interaction mode preference from localStorage
   */
  clearStoredPreference() {
    localStorage.removeItem('interactionModePreference');
  }

  /**
   * Get default interaction mode based on user role
   * @param {string} userRole - User's role
   * @returns {string} Default interaction mode
   */
  getDefaultModeForRole(userRole) {
    const roleDefaults = {
      'ca': 'doc-first',
      'ca_firm_admin': 'doc-first',
      'user': 'source-first',
      'huf': 'source-first',
      'nri': 'source-first',
      'entity': 'source-first',
      'partnership': 'source-first',
      'company': 'source-first',
      'trust': 'source-first',
      'super_admin': 'source-first',
    };

    return roleDefaults[userRole] || 'source-first';
  }

  /**
   * Validate interaction mode
   * @param {string} mode - Mode to validate
   * @returns {boolean} Whether mode is valid
   */
  isValidMode(mode) {
    const validModes = ['source-first', 'doc-first', 'prefill-first'];
    return validModes.includes(mode);
  }

  /**
   * Get interaction mode display information
   * @param {string} mode - Interaction mode
   * @returns {Object} Display information for the mode
   */
  getModeDisplayInfo(mode) {
    const modeInfo = {
      'source-first': {
        title: 'Source-First',
        subtitle: 'Tell us your income sources',
        description: 'Start by telling us about your salary, business, investments, and other income sources.',
        icon: 'Calculator',
        color: 'blue',
        estimatedTime: '15-20 minutes',
      },
      'doc-first': {
        title: 'Doc-First',
        subtitle: 'Upload your documents',
        description: 'Upload your Form 16, bank statements, investment proofs, and other documents.',
        icon: 'Upload',
        color: 'green',
        estimatedTime: '10-15 minutes',
      },
      'prefill-first': {
        title: 'Prefill-First',
        subtitle: 'Import from government data',
        description: 'Connect your AIS and 26AS to automatically import your income and tax data.',
        icon: 'FileText',
        color: 'purple',
        estimatedTime: '5-10 minutes',
      },
    };

    return modeInfo[mode] || modeInfo['source-first'];
  }

  /**
   * Track interaction mode usage for analytics
   * @param {string} mode - Mode used
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Tracking result
   */
  async trackModeUsage(mode, context = {}) {
    try {
      const response = await apiClient.post('/api/v2/user/preferences/track-usage', {
        mode,
        context,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error tracking mode usage:', error);
      return {
        success: false,
        error: error.message || 'Failed to track usage',
      };
    }
  }
}

// Create and export singleton instance
const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;
