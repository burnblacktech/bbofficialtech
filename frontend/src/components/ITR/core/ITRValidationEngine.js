// =====================================================
// UNIFIED ITR VALIDATION ENGINE
// Single validation system for all ITR types
// Handles complex validation rules and cross-section dependencies
// =====================================================

import { validationService } from '../../../services';

class ITRValidationEngine {
  constructor() {
    this.validationRules = new Map();
    this.initializeRules();
  }

  initializeRules() {
    // Personal info validation rules
    this.validationRules.set('personal_info', {
      fullName: {
        required: true,
        type: 'text',
        minLength: 3,
        pattern: '^[a-zA-Z\\s\\.]+$',
        message: 'Please enter a valid name (letters, spaces, and dots only, min 3 characters)'
      },
      pan: {
        required: true,
        type: 'text',
        pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
        message: 'PAN must be 10 characters: 5 letters, 4 numbers, 1 letter'
      },
      aadhaar: {
        required: false,
        type: 'text',
        pattern: '^\\d{12}$',
        message: 'Aadhaar must be exactly 12 digits'
      },
      dob: {
        required: true,
        type: 'date',
        custom: (value) => {
          const age = this.calculateAge(value);
          if (age < 18) return 'You must be at least 18 years old';
          if (age > 120) return 'Please enter a valid date of birth';
          return null;
        }
      },
      email: {
        required: true,
        type: 'email',
        pattern: '[^@]+@[^@]+\\.[^@]+',
        message: 'Please enter a valid email address'
      },
      phone: {
        required: true,
        type: 'tel',
        pattern: '[6-9]\\d{9}',
        message: 'Mobile number must start with 6-9 and be 10 digits'
      }
    });

    // Income validation rules
    this.validationRules.set('income', {
      gross_salary: {
        required: false,
        type: 'number',
        min: 0,
        max: 100000000,
        message: 'Gross salary must be between 0 and ₹10 crore'
      },
      rental_income: {
        required: false,
        type: 'number',
        min: 0,
        message: 'Rental income must be non-negative'
      },
      interest_income: {
        required: false,
        type: 'number',
        min: 0,
        message: 'Interest income must be non-negative'
      },
      capital_gains: {
        required: false,
        type: 'number',
        message: 'Capital gains must be a valid number'
      }
    });

    // Deduction validation rules
    this.validationRules.set('deductions', {
      section_80c: {
        required: false,
        type: 'number',
        min: 0,
        max: 150000,
        message: 'Section 80C deduction cannot exceed ₹1.5 lakh'
      },
      section_80d: {
        required: false,
        type: 'number',
        min: 0,
        max: 25000,
        message: 'Section 80D deduction cannot exceed ₹25,000 (₹50,000 for senior citizens)'
      },
      section_80e: {
        required: false,
        type: 'number',
        min: 0,
        max: 150000,
        message: 'Section 80E deduction cannot exceed ₹1.5 lakh total'
      }
    });
  }

  calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  validateField(section, fieldId, value, formData = {}) {
    const sectionRules = this.validationRules.get(section);
    if (!sectionRules || !sectionRules[fieldId]) {
      return { isValid: true, errors: [] };
    }

    const rule = sectionRules[fieldId];
    const errors = [];

    // Required validation
    if (rule.required && !this.hasValue(value)) {
      errors.push(`${this.getFieldLabel(section, fieldId)} is required`);
    }

    // Skip other validations if field is empty and not required
    if (!this.hasValue(value) && !rule.required) {
      return { isValid: true, errors: [] };
    }

    // Type-specific validations
    if (rule.type === 'number' && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(`${this.getFieldLabel(section, fieldId)} must be a valid number`);
      } else {
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${this.getFieldLabel(section, fieldId)} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${this.getFieldLabel(section, fieldId)} cannot exceed ${rule.max}`);
        }
      }
    }

    // Pattern validation
    if (rule.pattern && value) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        errors.push(rule.message || `${this.getFieldLabel(section, fieldId)} format is invalid`);
      }
    }

    // Length validation
    if (rule.minLength && value && value.length < rule.minLength) {
      errors.push(`${this.getFieldLabel(section, fieldId)} must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors.push(`${this.getFieldLabel(section, fieldId)} must not exceed ${rule.maxLength} characters`);
    }

    // Custom validation
    if (rule.custom && value) {
      const customError = rule.custom(value, formData);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateSection(sectionId, sectionData, formData = {}) {
    const sectionRules = this.validationRules.get(sectionId);
    if (!sectionRules) {
      return { isValid: true, errors: {} };
    }

    const errors = {};
    let isValid = true;

    for (const [fieldId, rule] of Object.entries(sectionRules)) {
      const fieldValue = sectionData[fieldId];
      const validation = this.validateField(sectionId, fieldId, fieldValue, {
        ...formData,
        [sectionId]: sectionData
      });

      if (!validation.isValid) {
        errors[fieldId] = validation;
        isValid = false;
      }
    }

    return {
      isValid,
      errors
    };
  }

  validateCompleteForm(formData, itrType = 'ITR-1') {
    const allErrors = {};
    let isValid = true;

    // Validate all configured sections
    const sectionIds = ['personal_info', 'income', 'deductions', 'taxes_paid'];

    for (const sectionId of sectionIds) {
      const sectionData = formData[sectionId] || {};
      const validation = this.validateSection(sectionId, sectionData, formData);

      if (!validation.isValid) {
        allErrors[sectionId] = validation.errors;
        isValid = false;
      }
    }

    // Cross-section validations
    const crossValidationErrors = this.performCrossValidation(formData, itrType);
    if (crossValidationErrors.length > 0) {
      allErrors.cross_section = crossValidationErrors;
      isValid = false;
    }

    return {
      isValid,
      errors: allErrors,
      warnings: this.generateWarnings(formData, itrType)
    };
  }

  performCrossValidation(formData, itrType) {
    const errors = [];

    // Income vs Deductions validation
    const totalIncome = this.calculateTotalIncome(formData);
    const totalDeductions = this.calculateTotalDeductions(formData);

    if (totalDeductions > totalIncome) {
      errors.push('Total deductions cannot exceed total income');
    }

    // ITR-1 specific validations
    if (itrType === 'ITR-1') {
      if (totalIncome > 5000000) {
        errors.push('ITR-1 is applicable only for total income up to ₹50 lakh');
      }

      // Check for business income (not allowed in ITR-1)
      if (formData.income?.business_income > 0) {
        errors.push('Business income cannot be declared in ITR-1. Consider ITR-3 or ITR-4.');
      }

      // Check for multiple house properties (not allowed in ITR-1)
      const houseProperties = formData.house_property?.properties || [];
      if (houseProperties.length > 1) {
        errors.push('ITR-1 allows only one house property. Consider ITR-2 for multiple properties.');
      }
    }

    // Senior citizen benefits validation
    const age = formData.personal_info?.dob ? this.calculateAge(formData.personal_info.dob) : 0;
    if (age >= 60) {
      const section80D = formData.deductions?.section_80d || 0;
      if (section80D > 50000) {
        errors.push('Section 80D deduction for senior citizens cannot exceed ₹50,000');
      }
    }

    return errors;
  }

  calculateTotalIncome(formData) {
    let total = 0;

    const income = formData.income || {};
    total += parseFloat(income.gross_salary || 0);
    total += parseFloat(income.rental_income || 0);
    total += parseFloat(income.interest_income || 0);
    total += parseFloat(income.dividend_income || 0);
    total += parseFloat(income.capital_gains || 0);
    total += parseFloat(income.other_sources || 0);

    return total;
  }

  calculateTotalDeductions(formData) {
    let total = 0;

    const deductions = formData.deductions || {};
    total += parseFloat(deductions.section_80c || 0);
    total += parseFloat(deductions.section_80d || 0);
    total += parseFloat(deductions.section_80e || 0);
    total += parseFloat(deductions.section_80g || 0);
    total += parseFloat(deductions.other_deductions || 0);

    return total;
  }

  generateWarnings(formData, itrType) {
    const warnings = [];

    // High income warning
    const totalIncome = this.calculateTotalIncome(formData);
    if (totalIncome > 10000000) {
      warnings.push('High income detected. Ensure all income sources are properly reported.');
    }

    // Low deduction warning
    const totalDeductions = this.calculateTotalDeductions(formData);
    if (totalIncome > 500000 && totalDeductions < 50000) {
      warnings.push('Low deductions detected. Consider available tax-saving options under Section 80C.');
    }

    // Tax calculation warning
    if (!formData.tax_computation?.computed) {
      warnings.push('Tax computation not yet performed. Compute tax before submission.');
    }

    return warnings;
  }

  getFieldLabel(section, fieldId) {
    const labels = {
      personal_info: {
        fullName: 'Full Name',
        pan: 'PAN Number',
        aadhaar: 'Aadhaar Number',
        dob: 'Date of Birth',
        email: 'Email Address',
        phone: 'Mobile Number'
      },
      income: {
        gross_salary: 'Gross Salary',
        rental_income: 'Rental Income',
        interest_income: 'Interest Income',
        capital_gains: 'Capital Gains'
      },
      deductions: {
        section_80c: 'Section 80C Deduction',
        section_80d: 'Section 80D Deduction',
        section_80e: 'Section 80E Deduction'
      }
    };

    return labels[section]?.[fieldId] || fieldId;
  }

  hasValue(value) {
    return value !== null && value !== undefined && value !== '';
  }

  // Get suggested ITR type based on data
  suggestITRType(formData) {
    const totalIncome = this.calculateTotalIncome(formData);
    const hasBusinessIncome = formData.income?.business_income > 0;
    const hasCapitalGains = formData.income?.capital_gains > 0;
    const multipleHouseProperties = (formData.house_property?.properties || []).length > 1;

    if (totalIncome <= 5000000 && !hasBusinessIncome && !hasCapitalGains && !multipleHouseProperties) {
      return 'ITR-1';
    } else if (hasCapitalGains || multipleHouseProperties) {
      return 'ITR-2';
    } else if (hasBusinessIncome) {
      return 'ITR-3';
    } else {
      return 'ITR-4';
    }
  }
}

// Create singleton instance
const itrValidationEngine = new ITRValidationEngine();

export default itrValidationEngine;