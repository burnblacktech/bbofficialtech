// =====================================================
// VALIDATION UTILITIES - CRYSTAL CLEAR VALIDATION
// =====================================================

import { VALIDATION_PATTERNS, SECTION_LIMITS, ERROR_MESSAGES } from '../constants';

// =====================================================
// FIELD VALIDATORS
// =====================================================

export const fieldValidators = {
  // PAN Number validation
  pan: (value) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    if (!VALIDATION_PATTERNS.PAN.test(value)) return ERROR_MESSAGES.VALIDATION.INVALID_PAN;
    return null;
  },

  // Aadhar Number validation
  aadhar: (value) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    if (!VALIDATION_PATTERNS.AADHAR.test(value)) return ERROR_MESSAGES.VALIDATION.INVALID_AADHAR;
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    if (!VALIDATION_PATTERNS.EMAIL.test(value)) return ERROR_MESSAGES.VALIDATION.INVALID_EMAIL;
    return null;
  },

  // Phone validation
  phone: (value) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    if (!VALIDATION_PATTERNS.PHONE.test(value)) return ERROR_MESSAGES.VALIDATION.INVALID_PHONE;
    return null;
  },

  // Required field validation
  required: (value) => {
    if (!value || value.toString().trim() === '') return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    return null;
  },

  // Amount validation
  amount: (value, maxLimit = null) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT;

    if (maxLimit && numValue > maxLimit) {
      return `${ERROR_MESSAGES.VALIDATION.EXCEEDS_LIMIT} (Max: ₹${maxLimit.toLocaleString()})`;
    }

    return null;
  },

  // Date validation
  date: (value) => {
    if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date format';

    const currentYear = new Date().getFullYear();
    const inputYear = date.getFullYear();

    if (inputYear < 1900 || inputYear > currentYear) {
      return 'Date must be between 1900 and current year';
    }

    return null;
  },
};

// =====================================================
// SECTION-SPECIFIC VALIDATORS
// =====================================================

export const sectionValidators = {
  // Section 80C validation
  section80C: (deductionData) => {
    const errors = {};

    // Validate deduction type
    if (!deductionData.deductionType) {
      errors.deductionType = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }

    // Validate amount
    const amountError = fieldValidators.amount(deductionData.amount, SECTION_LIMITS['80C']);
    if (amountError) {
      errors.amount = amountError;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Section 80D validation
  section80D: (deductionData) => {
    const errors = {};

    // Validate policy type
    if (!deductionData.policyType) {
      errors.policyType = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }

    // Validate amount based on policy type
    let maxLimit = SECTION_LIMITS['80D'].SELF_FAMILY;
    if (deductionData.policyType === 'parents') {
      maxLimit = SECTION_LIMITS['80D'].PARENTS;
    } else if (deductionData.policyType === 'senior_citizen_self') {
      maxLimit = SECTION_LIMITS['80D'].SENIOR_CITIZEN_SELF;
    } else if (deductionData.policyType === 'senior_citizen_parents') {
      maxLimit = SECTION_LIMITS['80D'].SENIOR_CITIZEN_PARENTS;
    }

    const amountError = fieldValidators.amount(deductionData.premiumAmount, maxLimit);
    if (amountError) {
      errors.premiumAmount = amountError;
    }

    // Validate policy dates
    if (deductionData.policyStartDate) {
      const startDateError = fieldValidators.date(deductionData.policyStartDate);
      if (startDateError) {
        errors.policyStartDate = startDateError;
      }
    }

    if (deductionData.policyEndDate) {
      const endDateError = fieldValidators.date(deductionData.policyEndDate);
      if (endDateError) {
        errors.policyEndDate = endDateError;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Section 80G validation
  section80G: (deductionData) => {
    const errors = {};

    // Validate donee name
    if (!deductionData.doneeName) {
      errors.doneeName = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }

    // Validate donee type
    if (!deductionData.doneeType) {
      errors.doneeType = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }

    // Validate amount
    const amountError = fieldValidators.amount(deductionData.donationAmount, SECTION_LIMITS['80G']);
    if (amountError) {
      errors.donationAmount = amountError;
    }

    // Validate donation date
    if (deductionData.donationDate) {
      const dateError = fieldValidators.date(deductionData.donationDate);
      if (dateError) {
        errors.donationDate = dateError;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// =====================================================
// FORM VALIDATORS
// =====================================================

export const formValidators = {
  // Family member form validation
  familyMember: (formData) => {
    const errors = {};

    // Required fields
    const firstNameError = fieldValidators.required(formData.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = fieldValidators.required(formData.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const relationshipError = fieldValidators.required(formData.relationship);
    if (relationshipError) errors.relationship = relationshipError;

    // Optional fields with validation
    if (formData.panNumber) {
      const panError = fieldValidators.pan(formData.panNumber);
      if (panError) errors.panNumber = panError;
    }

    if (formData.aadharNumber) {
      const aadharError = fieldValidators.aadhar(formData.aadharNumber);
      if (aadharError) errors.aadharNumber = aadharError;
    }

    if (formData.email) {
      const emailError = fieldValidators.email(formData.email);
      if (emailError) errors.email = emailError;
    }

    if (formData.phone) {
      const phoneError = fieldValidators.phone(formData.phone);
      if (phoneError) errors.phone = phoneError;
    }

    if (formData.dateOfBirth) {
      const dateError = fieldValidators.date(formData.dateOfBirth);
      if (dateError) errors.dateOfBirth = dateError;
    }

    if (formData.income) {
      const incomeError = fieldValidators.amount(formData.income);
      if (incomeError) errors.income = incomeError;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // ITR session form validation
  itrSession: (formData) => {
    const errors = {};

    // Required fields
    const itrTypeError = fieldValidators.required(formData.itrType);
    if (itrTypeError) errors.itrType = itrTypeError;

    const assessmentYearError = fieldValidators.required(formData.assessmentYear);
    if (assessmentYearError) errors.assessmentYear = assessmentYearError;

    // Validate assessment year format (e.g., 2023-24)
    if (formData.assessmentYear && !/^\d{4}-\d{2}$/.test(formData.assessmentYear)) {
      errors.assessmentYear = 'Assessment year must be in format YYYY-YY (e.g., 2023-24)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

export const validationHelpers = {
  // Get total deductions for a section
  getTotalDeductions: (deductions) => {
    return deductions.reduce((total, deduction) => total + (deduction.amount || 0), 0);
  },

  // Check if section limit is exceeded
  isSectionLimitExceeded: (sectionType, totalAmount) => {
    const limit = SECTION_LIMITS[sectionType];
    if (typeof limit === 'object') {
      // For sections with different limits based on type
      return totalAmount > Math.max(...Object.values(limit));
    }
    return totalAmount > limit;
  },

  // Get remaining limit for a section
  getRemainingLimit: (sectionType, usedAmount) => {
    const limit = SECTION_LIMITS[sectionType];
    if (typeof limit === 'object') {
      const maxLimit = Math.max(...Object.values(limit));
      return Math.max(0, maxLimit - usedAmount);
    }
    return Math.max(0, limit - usedAmount);
  },

  // Validate all sections for a session
  validateAllSections: (sessionData) => {
    const errors = {};
    const warnings = {};

    // Validate each section
    Object.keys(sessionData.sections || {}).forEach(sectionType => {
      const sectionData = sessionData.sections[sectionType];
      const validator = sectionValidators[`section${sectionType}`];

      if (validator) {
        const result = validator(sectionData);
        if (!result.isValid) {
          errors[sectionType] = result.errors;
        }

        // Check for limit warnings
        const totalAmount = validationHelpers.getTotalDeductions(sectionData.deductions || []);
        if (validationHelpers.isSectionLimitExceeded(sectionType, totalAmount)) {
          warnings[sectionType] = `Total amount exceeds maximum limit for Section ${sectionType}`;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  },
};

// Export all validators
export default {
  fieldValidators,
  sectionValidators,
  formValidators,
  validationHelpers,
};
