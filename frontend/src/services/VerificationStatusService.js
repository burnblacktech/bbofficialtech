// =====================================================
// VERIFICATION STATUS SERVICE
// Centralized service to manage field verification statuses
// =====================================================

import { VERIFICATION_STATUS } from './FieldLockService';
import itrService from './api/itrService';

class VerificationStatusService {
  constructor() {
    this.statusCache = new Map(); // Cache for verification statuses
  }

  /**
   * Get verification status for a field
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @param {object} draftData - Draft data (optional, for loading from draft)
   * @returns {string} Verification status
   */
  getVerificationStatus(section, field, draftData = null) {
    // Check cache first
    const key = `${section}.${field}`;
    if (this.statusCache.has(key)) {
      return this.statusCache.get(key);
    }

    // Check draft data if provided
    if (draftData?.verificationStatuses?.[section]?.[field]) {
      const status = draftData.verificationStatuses[section][field];
      this.statusCache.set(key, status);
      return status;
    }

    return VERIFICATION_STATUS.UNVERIFIED;
  }

  /**
   * Set verification status for a field
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @param {string} status - Verification status
   * @param {string} source - Data source (optional)
   */
  setVerificationStatus(section, field, status, source = null) {
    const key = `${section}.${field}`;
    this.statusCache.set(key, status);

    // Also update fieldLockService for consistency
    const fieldLockService = require('./FieldLockService').default;
    fieldLockService.setFieldVerificationStatus(section, field, status, source);
  }

  /**
   * Load verification statuses from database
   * @param {string} draftId - Draft ID
   * @returns {Promise<object>} Verification statuses object
   */
  async loadVerificationStatuses(draftId) {
    try {
      if (!draftId) {
        return {};
      }

      // Check cache first
      const cacheKey = `verification_${draftId}`;
      if (this.statusCache.has(cacheKey)) {
        return this.statusCache.get(cacheKey);
      }

      // Load draft data
      const draftResponse = await itrService.getDraftById(draftId);
      // Handle multiple response structures
      let draftData = null;
      if (draftResponse?.draft?.data) {
        draftData = draftResponse.draft.data;
      } else if (draftResponse?.draft?.formData) {
        draftData = draftResponse.draft.formData;
      } else if (draftResponse?.draft) {
        draftData = draftResponse.draft;
      } else if (draftResponse?.data) {
        draftData = draftResponse.data;
      }

      if (!draftData) {
        return {};
      }

      // Parse if string
      const parsedData = typeof draftData === 'string' ? JSON.parse(draftData) : draftData;

      // Extract verification statuses
      const verificationStatuses = parsedData.verificationStatuses || {};

      // Update cache
      this.statusCache.set(cacheKey, verificationStatuses);

      // Also update individual field caches
      Object.keys(verificationStatuses).forEach((section) => {
        Object.keys(verificationStatuses[section]).forEach((field) => {
          const key = `${section}.${field}`;
          this.statusCache.set(key, verificationStatuses[section][field]);
        });
      });

      return verificationStatuses;
    } catch (error) {
      console.error('Failed to load verification statuses:', error);
      return {};
    }
  }

  /**
   * Save verification statuses to database
   * @param {string} draftId - Draft ID
   * @param {object} statuses - Verification statuses object
   * @returns {Promise<object>} Saved statuses
   */
  async saveVerificationStatuses(draftId, statuses) {
    try {
      if (!draftId) {
        throw new Error('Draft ID is required to save verification statuses');
      }

      // Get current draft data
      const draftResponse = await itrService.getDraftById(draftId);
      // Handle multiple response structures
      let draftData = null;
      if (draftResponse?.draft?.data) {
        draftData = draftResponse.draft.data;
      } else if (draftResponse?.draft?.formData) {
        draftData = draftResponse.draft.formData;
      } else if (draftResponse?.draft) {
        draftData = draftResponse.draft;
      } else if (draftResponse?.data) {
        draftData = draftResponse.data;
      }

      // Parse if string
      const parsedData = typeof draftData === 'string' ? JSON.parse(draftData) : (draftData || {});

      // Merge verification statuses
      const updatedData = {
        ...parsedData,
        verificationStatuses: {
          ...(parsedData.verificationStatuses || {}),
          ...statuses,
        },
      };

      // Save to backend - itrService.updateDraft wraps payload as { formData }
      await itrService.updateDraft(draftId, updatedData);

      // Update cache
      const cacheKey = `verification_${draftId}`;
      this.statusCache.set(cacheKey, updatedData.verificationStatuses);

      // Also update individual field caches
      Object.keys(statuses).forEach((section) => {
        Object.keys(statuses[section]).forEach((field) => {
          const key = `${section}.${field}`;
          this.statusCache.set(key, statuses[section][field]);
        });
      });

      return updatedData.verificationStatuses;
    } catch (error) {
      console.error('Failed to save verification statuses:', error);
      throw error;
    }
  }

  /**
   * Get all verification statuses for a section
   * @param {string} section - Section name
   * @param {object} draftData - Draft data (optional)
   * @returns {object} Verification statuses for the section
   */
  getSectionVerificationStatuses(section, draftData = null) {
    if (draftData?.verificationStatuses?.[section]) {
      return draftData.verificationStatuses[section];
    }

    // Build from cache
    const sectionStatuses = {};
    this.statusCache.forEach((status, key) => {
      const [sectionName, fieldName] = key.split('.');
      if (sectionName === section) {
        sectionStatuses[fieldName] = status;
      }
    });

    return sectionStatuses;
  }

  /**
   * Clear cache for a draft
   * @param {string} draftId - Draft ID
   */
  clearCache(draftId) {
    if (draftId) {
      const cacheKey = `verification_${draftId}`;
      this.statusCache.delete(cacheKey);
    } else {
      this.statusCache.clear();
    }
  }

  /**
   * Batch update verification statuses
   * @param {object} updates - Object with section.field as keys and status as values
   */
  batchUpdateVerificationStatuses(updates) {
    Object.keys(updates).forEach((key) => {
      const [section, field] = key.split('.');
      const status = updates[key];
      this.setVerificationStatus(section, field, status);
    });
  }
}

export default new VerificationStatusService();

