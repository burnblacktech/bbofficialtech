// =====================================================
// AUTO-POPULATION SERVICE (ENHANCED)
// Comprehensive auto-population with data source priority and conflict resolution
// =====================================================

import itrAutoFillService from './ITRAutoFillService';
import fieldLockService, { VERIFICATION_STATUS } from './FieldLockService';
import formDataService from './FormDataService';
import verificationStatusService from './VerificationStatusService';

/**
 * Data source priority order
 * Higher priority sources override lower priority ones
 */
const DATA_SOURCE_PRIORITY = {
  verified: 10, // Highest priority - verified data
  previousYear: 9, // Previous year filing data
  form16: 8, // Form 16 extracted data
  ais: 7, // AIS (Annual Information Statement)
  form26as: 6, // Form 26AS
  eri: 5, // ERI (e-Return Intermediary)
  userProfile: 4, // User profile data
  manual: 1, // Manual entry (lowest priority)
};

/**
 * Data source labels for display
 */
export const DATA_SOURCE_LABELS = {
  verified: 'Verified',
  previousYear: 'Previous Year',
  form16: 'Form 16',
  ais: 'AIS',
  form26as: 'Form 26AS',
  eri: 'ERI',
  userProfile: 'User Profile',
  manual: 'Manual Entry',
};

class AutoPopulationService {
  constructor() {
    this.fieldSources = {}; // Track data source for each field
    this.conflicts = {}; // Track data conflicts
  }

  /**
   * Enhanced auto-population with priority-based merging
   * @param {object} sources - Data from various sources
   * @param {object} currentFormData - Current form data
   * @param {object} verificationStatuses - Existing verification statuses
   * @returns {object} Merged form data with source tracking
   */
  autoPopulateWithPriority(sources, currentFormData = {}, verificationStatuses = {}) {
    const merged = {
      personalInfo: { ...currentFormData.personalInfo },
      income: { ...currentFormData.income },
      deductions: { ...currentFormData.deductions },
      taxesPaid: { ...currentFormData.taxesPaid },
      bankDetails: { ...currentFormData.bankDetails },
    };

    const autoFilledFields = {
      personalInfo: [],
      income: [],
      deductions: [],
      taxesPaid: [],
      bankDetails: [],
    };

    const fieldSources = {
      personalInfo: {},
      income: {},
      deductions: {},
      taxesPaid: {},
      bankDetails: {},
    };

    // Process each section with priority-based merging
    this.mergeSectionWithPriority('personalInfo', sources, merged, autoFilledFields, fieldSources, verificationStatuses);
    this.mergeSectionWithPriority('income', sources, merged, autoFilledFields, fieldSources, verificationStatuses);
    this.mergeSectionWithPriority('deductions', sources, merged, autoFilledFields, fieldSources, verificationStatuses);
    this.mergeSectionWithPriority('taxesPaid', sources, merged, autoFilledFields, fieldSources, verificationStatuses);
    this.mergeSectionWithPriority('bankDetails', sources, merged, autoFilledFields, fieldSources, verificationStatuses);

    // Store field sources for later reference
    this.fieldSources = fieldSources;

    return {
      formData: merged,
      autoFilledFields,
      fieldSources,
      conflicts: this.conflicts,
    };
  }

  /**
   * Merge section data with priority-based logic
   */
  mergeSectionWithPriority(section, sources, merged, autoFilledFields, fieldSources, verificationStatuses) {
    const sectionData = merged[section];
    const availableSources = this.getAvailableSourcesForSection(section, sources);

    // Sort sources by priority
    const sortedSources = availableSources.sort((a, b) => {
      const priorityA = DATA_SOURCE_PRIORITY[a.source] || 0;
      const priorityB = DATA_SOURCE_PRIORITY[b.source] || 0;
      return priorityB - priorityA; // Higher priority first
    });

    // Merge data from each source (higher priority overrides lower)
    sortedSources.forEach(({ source, data }) => {
      if (!data || typeof data !== 'object') return;

      Object.keys(data).forEach((field) => {
        const currentValue = sectionData[field];
        const newValue = data[field];

        // Skip if value is null, undefined, or empty
        if (newValue === null || newValue === undefined || newValue === '') return;

        // Check if field should be locked
        const verificationStatus = verificationStatuses[section]?.[field] || VERIFICATION_STATUS.UNVERIFIED;
        const lockStatus = fieldLockService.shouldLockField(section, field, verificationStatus);

        // If field is locked and has existing value, don't override
        if (lockStatus.locked && currentValue !== null && currentValue !== undefined && currentValue !== '') {
          // Track conflict
          this.trackConflict(section, field, currentValue, newValue, source);
          return;
        }

        // Determine if we should merge this value
        const shouldMerge = this.shouldMergeValue(section, field, currentValue, newValue, source);

        if (shouldMerge) {
          sectionData[field] = newValue;
          if (!autoFilledFields[section].includes(field)) {
            autoFilledFields[section].push(field);
          }
          fieldSources[section][field] = {
            source,
            priority: DATA_SOURCE_PRIORITY[source] || 0,
            timestamp: Date.now(),
          };

          // Set verification status if applicable
          if (source === 'verified') {
            fieldLockService.setFieldVerificationStatus(section, field, VERIFICATION_STATUS.VERIFIED, source);
          } else if (['form16', 'ais', 'form26as', 'previousYear'].includes(source)) {
            fieldLockService.setFieldVerificationStatus(section, field, VERIFICATION_STATUS.AUTO_FILLED, source);
          }
        }
      });
    });
  }

  /**
   * Get available sources for a section
   */
  getAvailableSourcesForSection(section, sources) {
    const available = [];

    // Personal Info sources
    if (section === 'personalInfo') {
      if (sources.verified?.personalInfo) {
        available.push({ source: 'verified', data: sources.verified.personalInfo });
      }
      if (sources.previousYear?.personalInfo) {
        available.push({ source: 'previousYear', data: sources.previousYear.personalInfo });
      }
      if (sources.form16?.personalInfo) {
        available.push({ source: 'form16', data: sources.form16.personalInfo });
      }
      if (sources.userProfile?.personalInfo) {
        available.push({ source: 'userProfile', data: sources.userProfile.personalInfo });
      }
    }

    // Income sources
    if (section === 'income') {
      if (sources.form16?.income) {
        available.push({ source: 'form16', data: sources.form16.income });
      }
      if (sources.ais?.income) {
        available.push({ source: 'ais', data: sources.ais.income });
      }
      if (sources.form26as?.income) {
        available.push({ source: 'form26as', data: sources.form26as.income });
      }
      if (sources.previousYear?.income) {
        available.push({ source: 'previousYear', data: sources.previousYear.income });
      }
    }

    // Deductions sources
    if (section === 'deductions') {
      if (sources.form16?.deductions) {
        available.push({ source: 'form16', data: sources.form16.deductions });
      }
      if (sources.previousYear?.deductions) {
        available.push({ source: 'previousYear', data: sources.previousYear.deductions });
      }
      if (sources.userProfile?.deductions) {
        available.push({ source: 'userProfile', data: sources.userProfile.deductions });
      }
    }

    // Taxes Paid sources
    if (section === 'taxesPaid') {
      if (sources.ais?.taxesPaid) {
        available.push({ source: 'ais', data: sources.ais.taxesPaid });
      }
      if (sources.form26as?.taxesPaid) {
        available.push({ source: 'form26as', data: sources.form26as.taxesPaid });
      }
      if (sources.form16?.taxesPaid) {
        available.push({ source: 'form16', data: sources.form16.taxesPaid });
      }
      if (sources.previousYear?.taxesPaid) {
        available.push({ source: 'previousYear', data: sources.previousYear.taxesPaid });
      }
    }

    // Bank Details sources
    if (section === 'bankDetails') {
      if (sources.verified?.bankDetails) {
        available.push({ source: 'verified', data: sources.verified.bankDetails });
      }
      if (sources.userProfile?.bankDetails) {
        available.push({ source: 'userProfile', data: sources.userProfile.bankDetails });
      }
      if (sources.previousYear?.bankDetails) {
        available.push({ source: 'previousYear', data: sources.previousYear.bankDetails });
      }
    }

    return available;
  }

  /**
   * Determine if a value should be merged
   */
  shouldMergeValue(section, field, currentValue, newValue, source) {
    // If current value is empty/null, always merge
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      return true;
    }

    // If current value exists, check priority
    const currentSource = this.fieldSources[section]?.[field];
    if (!currentSource) {
      // No existing source, merge if new source has priority
      return DATA_SOURCE_PRIORITY[source] >= DATA_SOURCE_PRIORITY.manual;
    }

    // Compare priorities
    const currentPriority = currentSource.priority || 0;
    const newPriority = DATA_SOURCE_PRIORITY[source] || 0;

    // Merge if new source has higher priority
    return newPriority > currentPriority;
  }

  /**
   * Track data conflicts
   */
  trackConflict(section, field, currentValue, newValue, newSource) {
    const conflictKey = `${section}.${field}`;
    if (!this.conflicts[conflictKey]) {
      this.conflicts[conflictKey] = [];
    }

    this.conflicts[conflictKey].push({
      currentValue,
      newValue,
      newSource,
      timestamp: Date.now(),
    });
  }

  /**
   * Resolve conflict by accepting a source
   */
  resolveConflict(section, field, acceptedSource) {
    const conflictKey = `${section}.${field}`;
    delete this.conflicts[conflictKey];

    // Update field source
    if (!this.fieldSources[section]) {
      this.fieldSources[section] = {};
    }

    this.fieldSources[section][field] = {
      source: acceptedSource,
      priority: DATA_SOURCE_PRIORITY[acceptedSource] || 0,
      timestamp: Date.now(),
      resolved: true,
    };
  }

  /**
   * Get data source for a field
   */
  getFieldSource(section, field) {
    return this.fieldSources[section]?.[field] || null;
  }

  /**
   * Get all conflicts
   */
  getConflicts() {
    return this.conflicts;
  }

  /**
   * Clear all conflicts
   */
  clearConflicts() {
    this.conflicts = {};
  }

  /**
   * Get auto-population summary
   */
  getAutoPopulationSummary(autoFilledFields, fieldSources) {
    const summary = {
      totalFields: 0,
      autoFilledCount: 0,
      bySource: {},
    };

    Object.keys(autoFilledFields).forEach((section) => {
      const fields = autoFilledFields[section] || [];
      summary.autoFilledCount += fields.length;

      fields.forEach((field) => {
        const sourceInfo = fieldSources[section]?.[field];
        if (sourceInfo) {
          const source = sourceInfo.source;
          if (!summary.bySource[source]) {
            summary.bySource[source] = 0;
          }
          summary.bySource[source]++;
        }
      });
    });

    return summary;
  }

  /**
   * Save auto-populated data to draft
   * @param {string} draftId - Draft ID
   * @param {object} autoPopulatedData - Auto-populated form data
   * @param {object} fieldSources - Field sources tracking
   * @param {object} verificationStatuses - Verification statuses
   * @returns {Promise<object>} Saved data
   */
  async saveAutoPopulatedDataToDraft(draftId, autoPopulatedData, fieldSources, verificationStatuses) {
    try {
      if (!draftId) {
        throw new Error('Draft ID is required to save auto-populated data');
      }

      // Save form data
      await formDataService.saveFormData('all', autoPopulatedData, draftId);

      // Save verification statuses
      if (verificationStatuses && Object.keys(verificationStatuses).length > 0) {
        await verificationStatusService.saveVerificationStatuses(draftId, verificationStatuses);
      }

      return {
        success: true,
        message: 'Auto-populated data saved to draft',
      };
    } catch (error) {
      console.error('Failed to save auto-populated data to draft:', error);
      throw error;
    }
  }
}

export default new AutoPopulationService();

