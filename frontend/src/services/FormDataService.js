// =====================================================
// FORM DATA SERVICE
// Centralized service for all form data operations
// =====================================================

import itrService from './api/itrService';
import apiClient from './core/APIClient';
import { enterpriseLogger } from '../utils/logger';

class FormDataService {
  constructor() {
    this.cache = new Map(); // Cache for loaded data
  }

  /**
   * Save form data for a specific section or all data
   * @param {string} section - Section name (e.g., 'personalInfo', 'income', 'all' for entire formData)
   * @param {object} data - Section data to save (or entire formData if section is 'all')
   * @param {string} draftId - Draft ID
   * @returns {Promise<object>} Saved data
   */
  async saveFormData(section, data, draftId) {
    try {
      if (!draftId) {
        throw new Error('Draft ID is required to save form data');
      }

      let updatedData;

      if (section === 'all') {
        // Save entire formData
        updatedData = data;
      } else {
        // Get current draft data
        const currentDraft = await this.loadFormData(draftId, false); // Don't use cache for save
        // Merge section data
        updatedData = {
          ...currentDraft,
          [section]: {
            ...(currentDraft[section] || {}),
            ...data,
          },
        };
      }

      // Save to backend - itrService.updateDraft wraps payload as { formData }
      const response = await itrService.updateDraft(draftId, updatedData);
      // Update cache
      this.cache.set(draftId, updatedData);

      return response;
    } catch (error) {
      enterpriseLogger.error('Failed to save section data', { section, error });
      throw error;
    }
  }

  /**
   * Load all form data for a draft
   * @param {string} draftId - Draft ID
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<object>} Form data
   */
  async loadFormData(draftId, useCache = true) {
    try {
      if (!draftId) {
        return {};
      }

      // Check cache first
      if (useCache && this.cache.has(draftId)) {
        return this.cache.get(draftId);
      }

      // Load from backend
      const response = await itrService.getDraft(draftId);
      const formData = response.data || response.formData || {};

      // Update cache
      this.cache.set(draftId, formData);

      return formData;
    } catch (error) {
      enterpriseLogger.error('Failed to load form data', { error });
      // Return empty object on error to prevent crashes
      return {};
    }
  }

  /**
   * Load data for a specific section
   * @param {string} draftId - Draft ID
   * @param {string} section - Section name
   * @returns {Promise<object>} Section data
   */
  async loadSectionData(draftId, section) {
    try {
      const formData = await this.loadFormData(draftId);
      return formData[section] || {};
    } catch (error) {
      enterpriseLogger.error('Failed to load section data', { section, error });
      return {};
    }
  }

  /**
   * Merge form data updates with existing data
   * @param {object} existing - Existing form data
   * @param {object} updates - Updates to merge
   * @returns {object} Merged form data
   */
  mergeFormData(existing, updates) {
    if (!existing || typeof existing !== 'object') {
      return updates || {};
    }

    if (!updates || typeof updates !== 'object') {
      return existing;
    }

    // Deep merge
    const merged = { ...existing };

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== null && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        merged[key] = this.mergeFormData(existing[key] || {}, updates[key]);
      } else {
        merged[key] = updates[key];
      }
    });

    return merged;
  }

  /**
   * Validate data before saving
   * @param {object} data - Data to validate
   * @param {string} section - Section name
   * @returns {object} Validation result { isValid, errors }
   */
  validateBeforeSave(data, section) {
    const errors = {};

    // Basic validation rules
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: { general: 'Invalid data format' },
      };
    }

    // Section-specific validation
    switch (section) {
      case 'personalInfo':
        if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan)) {
          errors.pan = 'Invalid PAN format';
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.email = 'Invalid email format';
        }
        if (data.phone && !/^[0-9]{10}$/.test(data.phone.replace(/\D/g, ''))) {
          errors.phone = 'Invalid phone number';
        }
        break;

      case 'income':
        // Basic income validation
        if (data.salary && (isNaN(data.salary) || data.salary < 0)) {
          errors.salary = 'Salary must be a positive number';
        }
        break;

      default:
        break;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Clear cache for a draft
   * @param {string} draftId - Draft ID
   */
  clearCache(draftId) {
    if (draftId) {
      this.cache.delete(draftId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Save profile data
   * @param {object} profileData - Profile data to save
   * @returns {Promise<object>} Saved profile data
   */
  async saveProfileData(profileData) {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      enterpriseLogger.error('Failed to save profile data', { error });
      throw error;
    }
  }

  /**
   * Load profile data
   * @returns {Promise<object>} Profile data
   */
  async loadProfileData() {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data?.user || response.data || {};
    } catch (error) {
      enterpriseLogger.error('Failed to load profile data', { error });
      return {};
    }
  }

  /**
   * Save family member data
   * @param {string} memberId - Member ID (null for new member)
   * @param {object} memberData - Member data to save
   * @returns {Promise<object>} Saved member data
   */
  async saveFamilyMemberData(memberId, memberData) {
    try {
      if (memberId) {
        const response = await apiClient.put(`/members/${memberId}`, memberData);
        return response.data;
      } else {
        const response = await apiClient.post('/members', memberData);
        return response.data;
      }
    } catch (error) {
      enterpriseLogger.error('Failed to save family member data', { error });
      throw error;
    }
  }

  /**
   * Load family member data
   * @param {string} memberId - Member ID
   * @returns {Promise<object>} Member data
   */
  async loadFamilyMemberData(memberId) {
    try {
      const response = await apiClient.get(`/members/${memberId}`);
      return response.data || {};
    } catch (error) {
      enterpriseLogger.error('Failed to load family member data', { error });
      return {};
    }
  }
}

export default new FormDataService();

