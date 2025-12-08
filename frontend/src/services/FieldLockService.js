// =====================================================
// FIELD LOCK SERVICE
// Configurable field locking based on verification status
// =====================================================

/**
 * Field lock configuration rules
 * Defines which fields should be locked after verification
 */
export const FIELD_LOCK_RULES = {
  personalInfo: {
    pan: { lockAfter: 'verification', allowAdd: false, reason: 'PAN verified and cannot be changed' },
    name: { lockAfter: 'verification', allowAdd: false, reason: 'Name verified and cannot be changed' },
    dob: { lockAfter: 'verification', allowAdd: false, reason: 'Date of birth verified and cannot be changed' },
    address: { lockAfter: 'verification', allowAdd: true, reason: 'Primary address verified. You can add additional addresses.' },
    email: { lockAfter: 'verification', allowAdd: false, reason: 'Email verified and cannot be changed' },
    phone: { lockAfter: 'verification', allowAdd: false, reason: 'Phone verified and cannot be changed' },
  },
  bankDetails: {
    accountNumber: { lockAfter: 'verification', allowAdd: true, reason: 'Primary account verified. You can add additional accounts.' },
    ifsc: { lockAfter: 'verification', allowAdd: true, reason: 'IFSC verified. You can add additional accounts.' },
    bankName: { lockAfter: 'verification', allowAdd: true, reason: 'Bank name verified. You can add additional accounts.' },
  },
  taxesPaid: {
    tds: { lockAfter: 'ais_verification', allowAdd: false, reason: 'TDS verified from AIS/26AS and cannot be changed' },
    advanceTax: { lockAfter: 'manual_entry', allowAdd: false, reason: 'Advance tax is manually entered' },
  },
};

/**
 * Verification status types
 */
export const VERIFICATION_STATUS = {
  VERIFIED: 'verified', // Verified via external service
  AUTO_FILLED: 'auto_filled', // Auto-populated from trusted source
  MANUAL: 'manual', // Manually entered by user
  UNVERIFIED: 'unverified', // Not yet verified
};

class FieldLockService {
  constructor() {
    this.fieldVerificationStatus = new Map(); // Track verification status per field
  }

  /**
   * Check if a field should be locked
   * @param {string} section - Section name (e.g., 'personalInfo', 'bankDetails')
   * @param {string} field - Field name (e.g., 'pan', 'accountNumber')
   * @param {string} verificationStatus - Current verification status
   * @returns {object} Lock status with reason
   */
  shouldLockField(section, field, verificationStatus) {
    const rule = FIELD_LOCK_RULES[section]?.[field];
    if (!rule) {
      return { locked: false, reason: null, allowAdd: false };
    }

    // Check if field should be locked based on verification status
    let locked = false;
    if (rule.lockAfter === 'verification' && verificationStatus === VERIFICATION_STATUS.VERIFIED) {
      locked = true;
    } else if (rule.lockAfter === 'ais_verification' && verificationStatus === VERIFICATION_STATUS.VERIFIED) {
      locked = true;
    } else if (rule.lockAfter === 'manual_entry' && verificationStatus === VERIFICATION_STATUS.MANUAL) {
      locked = false; // Manual entries are generally editable
    }

    return {
      locked,
      reason: locked ? rule.reason : null,
      allowAdd: rule.allowAdd,
    };
  }

  /**
   * Set verification status for a field
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @param {string} status - Verification status
   * @param {string} source - Data source (optional)
   */
  setFieldVerificationStatus(section, field, status, source = null) {
    const key = `${section}.${field}`;
    this.fieldVerificationStatus.set(key, {
      status,
      source,
      timestamp: Date.now(),
    });
  }

  /**
   * Get verification status for a field
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @returns {object} Verification status
   */
  getFieldVerificationStatus(section, field) {
    const key = `${section}.${field}`;
    return this.fieldVerificationStatus.get(key) || {
      status: VERIFICATION_STATUS.UNVERIFIED,
      source: null,
      timestamp: null,
    };
  }

  /**
   * Check if field allows adding additional entries
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @returns {boolean} Whether additional entries are allowed
   */
  allowsAdditionalEntries(section, field) {
    const rule = FIELD_LOCK_RULES[section]?.[field];
    return rule?.allowAdd || false;
  }

  /**
   * Get lock status for all fields in a section
   * @param {string} section - Section name
   * @param {object} fieldStatuses - Object with field names as keys and verification statuses as values
   * @returns {object} Lock statuses for all fields
   */
  getSectionLockStatuses(section, fieldStatuses = {}) {
    const lockStatuses = {};
    const sectionRules = FIELD_LOCK_RULES[section] || {};

    Object.keys(sectionRules).forEach((field) => {
      const verificationStatus = fieldStatuses[field] || VERIFICATION_STATUS.UNVERIFIED;
      lockStatuses[field] = this.shouldLockField(section, field, verificationStatus);
    });

    return lockStatuses;
  }

  /**
   * Clear verification status for a field (for testing/reset)
   * @param {string} section - Section name
   * @param {string} field - Field name
   */
  clearFieldVerificationStatus(section, field) {
    const key = `${section}.${field}`;
    this.fieldVerificationStatus.delete(key);
  }

  /**
   * Clear all verification statuses
   */
  clearAllVerificationStatuses() {
    this.fieldVerificationStatus.clear();
  }

  /**
   * Request unlock for a field (with confirmation)
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @param {string} reason - Reason for unlock request
   * @returns {object} Unlock request status
   */
  requestUnlock(section, field, reason = '') {
    const key = `${section}.${field}`;
    const verificationStatus = this.getFieldVerificationStatus(section, field);
    if (verificationStatus.status !== VERIFICATION_STATUS.VERIFIED) {
      return {
        canUnlock: true,
        requiresConfirmation: false,
        reason: 'Field is not verified',
      };
    }

    return {
      canUnlock: true,
      requiresConfirmation: true,
      reason: reason || `Unlocking verified field: ${field}`,
      verificationStatus,
    };
  }

  /**
   * Unlock a field after confirmation
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @param {boolean} confirmed - Whether unlock is confirmed
   * @returns {boolean} Whether field was unlocked
   */
  unlockField(section, field, confirmed = false) {
    if (!confirmed) {
      return false;
    }

    const key = `${section}.${field}`;
    const verificationStatus = this.getFieldVerificationStatus(section, field);
    // Only unlock if field is verified
    if (verificationStatus.status === VERIFICATION_STATUS.VERIFIED) {
      // Change status to manual (unlocked but previously verified)
      this.setFieldVerificationStatus(section, field, VERIFICATION_STATUS.MANUAL, 'unlocked_by_user');
      // Log unlock action
      console.log(`Field ${section}.${field} unlocked by user`, {
        previousStatus: verificationStatus.status,
        previousSource: verificationStatus.source,
        unlockedAt: Date.now(),
      });

      return true;
    }

    return false;
  }

  /**
   * Check if a field is currently locked
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @returns {boolean} Whether field is locked
   */
  isFieldLocked(section, field) {
    const verificationStatus = this.getFieldVerificationStatus(section, field);
    const lockStatus = this.shouldLockField(section, field, verificationStatus.status);
    return lockStatus.locked;
  }

  /**
   * Get reason for field lock
   * @param {string} section - Section name
   * @param {string} field - Field name
   * @returns {string|null} Lock reason or null if not locked
   */
  getLockReason(section, field) {
    const verificationStatus = this.getFieldVerificationStatus(section, field);
    const lockStatus = this.shouldLockField(section, field, verificationStatus.status);
    return lockStatus.reason;
  }
}

export default new FieldLockService();

