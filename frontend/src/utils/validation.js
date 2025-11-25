// Enhanced Real-time Validation System
// Comprehensive validation with smart error handling and suggestions

import React from 'react';

export const VALIDATION_RULES = {
  // Personal Information Validation
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s.]+$/,
    messages: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 100 characters',
      pattern: 'Name can only contain letters, spaces, and periods',
    },
    suggestions: [
      'Use your official name as per PAN card',
      'Include middle name if applicable',
      'Avoid special characters except periods',
    ],
  },

  pan: {
    required: true,
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    messages: {
      required: 'PAN number is required',
      pattern: 'Invalid PAN format. Must be AAAAA1111A',
    },
    suggestions: [
      'Format: First 5 letters, then 4 numbers, then 1 letter',
      'Check your PAN card for the exact format',
      'All letters should be in uppercase',
    ],
    autoCorrect: (value) => value.toUpperCase(),
  },

  aadhaar: {
    required: false,
    pattern: /^\d{12}$/,
    messages: {
      pattern: 'Aadhaar number must be exactly 12 digits',
    },
    suggestions: [
      'Enter 12-digit Aadhaar number without spaces',
      'Remove any spaces or hyphens',
      'Aadhaar is optional but recommended for verification',
    ],
  },

  mobile: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    messages: {
      required: 'Mobile number is required',
      pattern: 'Invalid mobile number format',
    },
    suggestions: [
      'Enter 10-digit mobile number starting with 6-9',
      'Remove country code (+91) if present',
      'Use the number registered with your bank',
    ],
  },

  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    messages: {
      required: 'Email address is required',
      pattern: 'Invalid email address format',
    },
    suggestions: [
      'Use your primary email address',
      'Check for typos in domain name',
      'Avoid special characters in username',
    ],
  },

  pincode: {
    required: true,
    pattern: /^\d{6}$/,
    messages: {
      required: 'PIN code is required',
      pattern: 'PIN code must be exactly 6 digits',
    },
    suggestions: [
      'Enter 6-digit PIN code',
      'Find PIN code on India Post website',
      'Use PIN code of your communication address',
    ],
  },

  // Income Validation
  salary: {
    required: false,
    min: 0,
    max: 50000000, // ₹5 crores
    messages: {
      min: 'Salary cannot be negative',
      max: 'Salary amount seems unusually high',
    },
    suggestions: [
      'Enter annual gross salary before deductions',
      'Include HRA, Conveyance, LTA if applicable',
      'Refer to Form 16 for exact amount',
    ],
  },

  houseProperty: {
    required: false,
    messages: {
      invalid: 'Invalid house property details',
    },
    suggestions: [
      'Enter annual rental income if property is let out',
      'For self-occupied: enter 0 or leave blank',
      'Calculate after deducting municipal taxes',
    ],
  },

  business: {
    required: false,
    min: 0,
    messages: {
      min: 'Business income cannot be negative',
    },
    suggestions: [
      'Enter net profit after all business expenses',
      'Include presumptive taxation if applicable',
      'Refer to audited financial statements',
    ],
  },

  // Deductions Validation
  section80C: {
    required: false,
    min: 0,
    max: 150000,
    messages: {
      max: 'Section 80C deduction cannot exceed ₹1,50,000',
    },
    suggestions: [
      'Maximum limit is ₹1,50,000 per year',
      'Includes PPF, ELSS, Life Insurance, etc.',
      'Keep investment proofs for verification',
    ],
  },

  section80D: {
    required: false,
    min: 0,
    max: 25000,
    messages: {
      max: 'Section 80D deduction cannot exceed ₹25,000',
    },
    suggestions: [
      '₹25,000 for self, spouse, and dependent children',
      'Additional ₹25,000 for parents if they are senior citizens',
      'Keep medical insurance receipts',
    ],
  },

  section80TTA: {
    required: false,
    min: 0,
    max: 10000,
    messages: {
      max: 'Section 80TTA deduction cannot exceed ₹10,000',
    },
    suggestions: [
      'Maximum limit is ₹10,000 per year',
      'For interest earned on savings account',
      'Available to individuals and HUFs only',
    ],
  },
};

// Validation Engine Class
export class ValidationEngine {
  constructor() {
    this.errors = {};
    this.warnings = {};
    this.suggestions = {};
  }

  // Validate single field
  validateField(fieldName, value, context = {}) {
    const rules = VALIDATION_RULES[fieldName];
    if (!rules) return { isValid: true, errors: [], warnings: [], suggestions: [] };

    const errors = [];
    const warnings = [];
    const suggestions = [...(rules.suggestions || [])];

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push({
        type: 'required',
        message: rules.messages.required,
        severity: 'error',
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({
        type: 'pattern',
        message: rules.messages.pattern,
        severity: 'error',
      });
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({
        type: 'minLength',
        message: rules.messages.minLength,
        severity: 'error',
      });
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        type: 'maxLength',
        message: rules.messages.maxLength,
        severity: 'error',
      });
    }

    // Numeric validation
    if (rules.min !== undefined && parseFloat(value) < rules.min) {
      errors.push({
        type: 'min',
        message: rules.messages.min,
        severity: 'error',
      });
    }

    if (rules.max !== undefined && parseFloat(value) > rules.max) {
      if (rules.max * 1.1 < parseFloat(value)) {
        // Significantly over limit - error
        errors.push({
          type: 'max',
          message: rules.messages.max,
          severity: 'error',
        });
      } else {
        // Slightly over limit - warning
        warnings.push({
          type: 'max',
          message: `Value is close to maximum limit of ${rules.max.toLocaleString()}`,
          severity: 'warning',
        });
      }
    }

    // Cross-field validations
    if (context.totalIncome && fieldName.includes('section80C')) {
      const max80C = Math.min(150000, context.totalIncome * 0.1);
      if (parseFloat(value) > max80C) {
        warnings.push({
          type: 'crossField',
          message: 'Section 80C limit is 10% of income or ₹1,50,000 (whichever is lower)',
          severity: 'warning',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate entire form section
  validateSection(sectionData, sectionName, context = {}) {
    const sectionErrors = {};
    const sectionWarnings = {};
    const sectionSuggestions = {};

    Object.entries(sectionData).forEach(([fieldName, value]) => {
      const result = this.validateField(fieldName, value, context);

      if (result.errors.length > 0) {
        sectionErrors[fieldName] = result.errors;
      }

      if (result.warnings.length > 0) {
        sectionWarnings[fieldName] = result.warnings;
      }

      if (result.suggestions.length > 0) {
        sectionSuggestions[fieldName] = result.suggestions;
      }
    });

    // Cross-section validations
    this.validateCrossSection(sectionData, sectionName, sectionErrors, sectionWarnings, context);

    return {
      isValid: Object.keys(sectionErrors).length === 0,
      errors: sectionErrors,
      warnings: sectionWarnings,
      suggestions: sectionSuggestions,
    };
  }

  // Cross-section validation logic
  validateCrossSection(sectionData, sectionName, errors, warnings, context) {
    switch (sectionName) {
      case 'incomeSources':
        this.validateIncomeSection(sectionData, errors, warnings, context);
        break;
      case 'deductions':
        this.validateDeductionsSection(sectionData, errors, warnings, context);
        break;
      default:
        // No cross-section validation needed for this section
        break;
    }
  }

  // Income section cross-validation
  validateIncomeSection(incomeData, errors, warnings, context) {
    const activeIncomes = Object.entries(incomeData)
      .filter(([key, value]) => value.hasIncome && value.amount > 0)
      .map(([key, value]) => ({ type: key, amount: value.amount }));

    // Check if at least one income source is selected
    if (activeIncomes.length === 0) {
      errors.income = [{
        type: 'required',
        message: 'At least one income source is required',
        severity: 'error',
      }];
    }

    // Check for unusually high income
    const totalIncome = activeIncomes.reduce((sum, income) => sum + income.amount, 0);
    if (totalIncome > 10000000) { // ₹1 crore
      warnings.totalIncome = [{
        type: 'highIncome',
        message: 'Total income is very high. Please verify the amounts.',
        severity: 'warning',
      }];
    }

    // Business income validation
    const businessIncome = activeIncomes.find(income => income.type === 'business');
    if (businessIncome && businessIncome.amount > 0) {
      if (!context.hasGST || !context.hasAudit) {
        warnings.businessCompliance = [{
          type: 'compliance',
          message: 'Business income may require GST registration and audit',
          severity: 'warning',
        }];
      }
    }
  }

  // Deductions section cross-validation
  validateDeductionsSection(deductionsData, errors, warnings, context) {
    const totalDeductions = Object.values(deductionsData)
      .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

    const maxDeductionLimit = 150000; // Standard deduction limit
    if (totalDeductions > maxDeductionLimit) {
      warnings.totalDeductions = [{
        type: 'limit',
        message: `Total deductions exceed standard limit of ₹${maxDeductionLimit.toLocaleString()}`,
        severity: 'warning',
      }];
    }

    // Check deduction ratios
    if (context.totalIncome) {
      const deductionRatio = totalDeductions / context.totalIncome;
      if (deductionRatio > 0.5) { // More than 50% of income as deductions
        warnings.deductionRatio = [{
          type: 'ratio',
          message: 'Deduction amount is unusually high compared to income',
          severity: 'warning',
        }];
      }
    }
  }

  // Auto-correct common issues
  autoCorrect(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];
    if (!rules || !rules.autoCorrect) return value;

    return rules.autoCorrect(value);
  }

  // Get smart suggestions for field
  getSuggestions(fieldName, currentValue, context) {
    const rules = VALIDATION_RULES[fieldName];
    if (!rules) return [];

    const suggestions = [...(rules.suggestions || [])];

    // Context-based suggestions
    switch (fieldName) {
      case 'pan':
        if (currentValue && currentValue.length >= 5) {
          suggestions.push('Ensure the PAN belongs to the primary taxpayer');
        }
        break;

      case 'salary':
        if (context.hasForm16) {
          suggestions.push('Match the amount with your Form 16');
        }
        break;

      default:
        // No additional context-based suggestions for this field
        break;
    }

    return suggestions;
  }
}

// React Hook for validation
export const useValidation = (initialData = {}) => {
  const [validationState, setValidationState] = React.useState({
    errors: {},
    warnings: {},
    suggestions: {},
    touched: new Set(),
  });

  const engine = React.useMemo(() => new ValidationEngine(), []);

  const validateField = React.useCallback((fieldName, value, context = {}) => {
    const result = engine.validateField(fieldName, value, context);

    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: result.errors,
      },
      warnings: {
        ...prev.warnings,
        [fieldName]: result.warnings,
      },
      suggestions: {
        ...prev.suggestions,
        [fieldName]: result.suggestions,
      },
    }));

    return result;
  }, [engine]);

  const validateSection = React.useCallback((sectionData, sectionName, context = {}) => {
    const result = engine.validateSection(sectionData, sectionName, context);

    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...result.errors },
      warnings: { ...prev.warnings, ...result.warnings },
      suggestions: { ...prev.suggestions, ...result.suggestions },
    }));

    return result;
  }, [engine]);

  const markFieldAsTouched = React.useCallback((fieldName) => {
    setValidationState(prev => ({
      ...prev,
      touched: new Set([...prev.touched, fieldName]),
    }));
  }, []);

  const clearFieldErrors = React.useCallback((fieldName) => {
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: [] },
      warnings: { ...prev.warnings, [fieldName]: [] },
    }));
  }, []);

  const getFieldValidation = React.useCallback((fieldName) => {
    const isTouched = validationState.touched.has(fieldName);
    const errors = validationState.errors[fieldName] || [];
    const warnings = validationState.warnings[fieldName] || [];
    const suggestions = validationState.suggestions[fieldName] || [];

    return {
      isValid: errors.length === 0,
      errors: isTouched ? errors : [],
      warnings: isTouched ? warnings : [],
      suggestions,
      isTouched,
    };
  }, [validationState]);

  const resetValidation = React.useCallback(() => {
    setValidationState({
      errors: {},
      warnings: {},
      suggestions: {},
      touched: new Set(),
    });
  }, []);

  return {
    validateField,
    validateSection,
    markFieldAsTouched,
    clearFieldErrors,
    getFieldValidation,
    resetValidation,
    validationState,
  };
};

// Utility functions
export const formatValidationMessage = (error) => {
  return {
    message: error.message,
    severity: error.severity,
    type: error.type,
  };
};

export const getValidationIcon = (severity) => {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    default:
      return 'ℹ️';
  }
};

export const isValidPAN = (pan) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
};

export const isValidAadhaar = (aadhaar) => {
  return /^\d{12}$/.test(aadhaar);
};

export const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(mobile);
};

// Export singleton instance
export const validationEngine = new ValidationEngine();
