// =====================================================
// UNIFIED ITR VALIDATION ENGINE
// Single validation system for all ITR types
// Handles complex validation rules and cross-section dependencies
// =====================================================
/* eslint-disable camelcase */
// Field names use snake_case to match API/database schemas

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
        message: 'Please enter a valid name (letters, spaces, and dots only, min 3 characters)',
      },
      pan: {
        required: true,
        type: 'text',
        pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
        message: 'PAN must be 10 characters: 5 letters, 4 numbers, 1 letter',
      },
      aadhaar: {
        required: false,
        type: 'text',
        pattern: '^\\d{12}$',
        message: 'Aadhaar must be exactly 12 digits',
      },
      dob: {
        required: true,
        type: 'date',
        custom: (value) => {
          const age = this.calculateAge(value);
          if (age < 18) return 'You must be at least 18 years old';
          if (age > 120) return 'Please enter a valid date of birth';
          return null;
        },
      },
      email: {
        required: true,
        type: 'email',
        pattern: '[^@]+@[^@]+\\.[^@]+',
        message: 'Please enter a valid email address',
      },
      phone: {
        required: true,
        type: 'tel',
        pattern: '[6-9]\\d{9}',
        message: 'Mobile number must start with 6-9 and be 10 digits',
      },
    });

    // Income validation rules
    this.validationRules.set('income', {
      gross_salary: {
        required: false,
        type: 'number',
        min: 0,
        max: 100000000,
        message: 'Gross salary must be between 0 and ₹10 crore',
      },
      rental_income: {
        required: false,
        type: 'number',
        min: 0,
        message: 'Rental income must be non-negative',
      },
      interest_income: {
        required: false,
        type: 'number',
        min: 0,
        message: 'Interest income must be non-negative',
      },
      capital_gains: {
        required: false,
        type: 'number',
        message: 'Capital gains must be a valid number',
      },
    });

    // Deduction validation rules
    this.validationRules.set('deductions', {
      section_80c: {
        required: false,
        type: 'number',
        min: 0,
        max: 150000,
        message: 'Section 80C deduction cannot exceed ₹1.5 lakh',
      },
      section_80d: {
        required: false,
        type: 'number',
        min: 0,
        max: 25000,
        message: 'Section 80D deduction cannot exceed ₹25,000 (₹50,000 for senior citizens)',
      },
      section_80e: {
        required: false,
        type: 'number',
        min: 0,
        max: 150000,
        message: 'Section 80E deduction cannot exceed ₹1.5 lakh total',
      },
    });

    // ITR-3: Business Income validation rules
    this.validationRules.set('businessIncome', {
      businesses: {
        required: false,
        type: 'array',
        custom: (businesses) => {
          if (!Array.isArray(businesses) || businesses.length === 0) {
            return null; // Optional, no error
          }
          const errors = [];
          businesses.forEach((business, index) => {
            if (!business.pnl) {
              errors.push(`Business ${index + 1}: P&L data is required`);
              return;
            }
            const pnl = business.pnl;
            if (pnl.grossReceipts < 0) {
              errors.push(`Business ${index + 1}: Gross receipts cannot be negative`);
            }
            if (pnl.openingStock < 0 || pnl.closingStock < 0) {
              errors.push(`Business ${index + 1}: Stock values cannot be negative`);
            }
            if (pnl.purchases < 0) {
              errors.push(`Business ${index + 1}: Purchases cannot be negative`);
            }
            // Check closing stock reasonableness
            const maxClosingStock = (pnl.openingStock || 0) + (pnl.purchases || 0);
            if (pnl.closingStock > maxClosingStock * 1.1) {
              errors.push(`Business ${index + 1}: Closing stock seems unusually high`);
            }
          });
          return errors.length > 0 ? errors.join('; ') : null;
        },
      },
    });

    // ITR-3: Professional Income validation rules
    this.validationRules.set('professionalIncome', {
      professions: {
        required: false,
        type: 'array',
        custom: (professions) => {
          if (!Array.isArray(professions) || professions.length === 0) {
            return null; // Optional, no error
          }
          const errors = [];
          professions.forEach((profession, index) => {
            if (!profession.pnl) {
              errors.push(`Profession ${index + 1}: P&L data is required`);
              return;
            }
            const pnl = profession.pnl;
            if (pnl.professionalFees < 0) {
              errors.push(`Profession ${index + 1}: Professional fees cannot be negative`);
            }
            // Check expense reasonableness
            const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
            if (expensesTotal < 0) {
              errors.push(`Profession ${index + 1}: Expenses cannot be negative`);
            }
            if (pnl.professionalFees > 0 && expensesTotal > pnl.professionalFees * 0.9) {
              errors.push(`Profession ${index + 1}: Expenses seem unusually high compared to fees`);
            }
          });
          return errors.length > 0 ? errors.join('; ') : null;
        },
      },
    });

    // ITR-3: Balance Sheet validation rules
    this.validationRules.set('balanceSheet', {
      hasBalanceSheet: {
        required: false,
        type: 'boolean',
      },
      assets: {
        required: false,
        type: 'object',
        custom: (assets, formData) => {
          if (!formData.balanceSheet?.hasBalanceSheet) {
            return null; // Optional if balance sheet not maintained
          }
          const liabilities = formData.balanceSheet?.liabilities || {};
          const assetsTotal = assets?.total || 0;
          const liabilitiesTotal = liabilities?.total || 0;
          if (assetsTotal !== liabilitiesTotal) {
            return `Balance sheet is not balanced. Assets (₹${assetsTotal.toLocaleString('en-IN')}) ≠ Liabilities + Capital (₹${liabilitiesTotal.toLocaleString('en-IN')})`;
          }
          return null;
        },
      },
    });

    // ITR-3: Audit Information validation rules
    this.validationRules.set('auditInfo', {
      isAuditApplicable: {
        required: false,
        type: 'boolean',
      },
      auditReportNumber: {
        required: false,
        type: 'text',
        custom: (value, formData) => {
          if (formData.auditInfo?.isAuditApplicable && (!value || value.trim() === '')) {
            return 'Audit report number is required when audit is applicable';
          }
          return null;
        },
      },
      auditReportDate: {
        required: false,
        type: 'date',
        custom: (value, formData) => {
          if (formData.auditInfo?.isAuditApplicable) {
            if (!value) {
              return 'Audit report date is required when audit is applicable';
            }
            const reportDate = new Date(value);
            const today = new Date();
            if (reportDate > today) {
              return 'Audit report date cannot be in the future';
            }
          }
          return null;
        },
      },
      caDetails: {
        required: false,
        type: 'object',
        custom: (caDetails, formData) => {
          if (formData.auditInfo?.isAuditApplicable) {
            if (!caDetails) {
              return 'CA details are required when audit is applicable';
            }
            if (!caDetails.caName || caDetails.caName.trim() === '') {
              return 'CA name is required';
            }
            if (!caDetails.membershipNumber || caDetails.membershipNumber.trim() === '') {
              return 'CA membership number is required';
            }
            // Validate membership number format (6-8 digits)
            const membershipPattern = /^\d{6,8}$/;
            if (!membershipPattern.test(caDetails.membershipNumber)) {
              return 'CA membership number must be 6-8 digits';
            }
          }
          return null;
        },
      },
    });
  }

  calculateExpenseTotal(expenseCategory) {
    if (!expenseCategory || typeof expenseCategory !== 'object') {
      return 0;
    }
    if (typeof expenseCategory.total === 'number') {
      return expenseCategory.total;
    }
    return Object.entries(expenseCategory).reduce((sum, [key, value]) => {
      if (key === 'total') return sum;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
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

  /**
   * Real-time field validation with immediate feedback
   * @param {string} fieldPath - Field path (e.g., 'personal_info.pan' or 'income.salary.gross')
   * @param {any} value - Field value
   * @param {object} formData - Complete form data for context
   * @returns {object} Validation result with isValid and errors
   */
  validateFieldRealTime(fieldPath, value, formData = {}) {
    const [section, ...fieldParts] = fieldPath.split('.');
    const fieldId = fieldParts.join('.');

    return this.validateField(section, fieldId, value, formData);
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
      errors,
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
        [sectionId]: sectionData,
      });

      if (!validation.isValid) {
        errors[fieldId] = validation;
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
    };
  }

  validateCompleteForm(formData, itrType = 'ITR-1') {
    const allErrors = {};
    let isValid = true;

    // Validate all configured sections
    let sectionIds = ['personal_info', 'income', 'deductions', 'taxes_paid'];

    // Add ITR-3 specific sections
    if (itrType === 'ITR-3' || itrType === 'ITR3') {
      sectionIds = [...sectionIds, 'businessIncome', 'professionalIncome', 'balanceSheet', 'auditInfo'];
    }

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
      warnings: this.generateWarnings(formData, itrType),
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

    // Salary vs HRA validation
    const salary = formData.income?.salary || formData.income?.gross_salary || 0;
    const hraReceived = formData.income?.hra_received || formData.income?.hra || 0;
    const rentPaid = formData.income?.rent_paid || 0;
    if (hraReceived > 0 && rentPaid === 0) {
      errors.push('Rent paid is required when HRA is received');
    }
    if (hraReceived > salary * 0.5) {
      errors.push('HRA received cannot exceed 50% of salary');
    }

    // Capital Gains vs Exemptions validation
    const capitalGains = formData.income?.capital_gains || {};
    const stcg = capitalGains.shortTerm || capitalGains.stcg || 0;
    const ltcg = capitalGains.longTerm || capitalGains.ltcg || 0;
    const exemption54 = formData.deductions?.exemption_54 || 0;
    const exemption54F = formData.deductions?.exemption_54f || 0;
    const exemption54EC = formData.deductions?.exemption_54ec || 0;
    const totalExemptions = exemption54 + exemption54F + exemption54EC;
    if (totalExemptions > ltcg) {
      errors.push('Capital gains exemptions cannot exceed long-term capital gains');
    }

    // TDS vs Income validation
    const tdsOnSalary = formData.taxes_paid?.tds_salary || formData.taxesPaid?.tdsSalary || 0;
    if (tdsOnSalary > 0 && salary === 0) {
      errors.push('TDS on salary cannot be declared without salary income');
    }
    const tdsOnInterest = formData.taxes_paid?.tds_interest || formData.taxesPaid?.tdsInterest || 0;
    const interestIncome = formData.income?.interest_income || formData.income?.interest || 0;
    if (tdsOnInterest > 0 && interestIncome === 0) {
      errors.push('TDS on interest cannot be declared without interest income');
    }

    // Bank Account vs Refund validation
    const refundAmount = formData.tax_computation?.refund || formData.taxComputation?.refundAmount || 0;
    const bankAccounts = formData.bank_details?.accounts || formData.bankDetails?.accounts || [];
    if (refundAmount > 0 && bankAccounts.length === 0) {
      errors.push('Bank account details are required when refund is due');
    }
    const refundAccount = bankAccounts.find(acc => acc.is_refund_account || acc.isRefundAccount);
    if (refundAmount > 0 && !refundAccount) {
      errors.push('Please select a bank account for refund');
    }

    // ITR-1 specific validations
    if (itrType === 'ITR-1' || itrType === 'ITR1') {
      if (totalIncome > 5000000) {
        errors.push('ITR-1 is applicable only for total income up to ₹50 lakh');
      }

      // Check for agricultural income > ₹5,000 (not allowed in ITR-1) - CRITICAL REGULATORY RULE
      const agriIncome = formData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
        || formData.exemptIncome?.netAgriculturalIncome
        || formData.agriculturalIncome
        || 0;
      if (agriIncome > 5000) {
        errors.push(
          `Agricultural income (₹${agriIncome.toLocaleString('en-IN')}) exceeds ₹5,000 limit. ` +
          'ITR-1 is not permitted. You must file ITR-2.',
        );
      }

      // Check for business income (not allowed in ITR-1)
      if (formData.income?.business_income > 0) {
        errors.push('Business income cannot be declared in ITR-1. Consider ITR-3 or ITR-4.');
      }

      // Check for multiple house properties (not allowed in ITR-1)
      const houseProperties = formData.house_property?.properties || formData.houseProperty?.properties || [];
      if (houseProperties.length > 1) {
        errors.push('ITR-1 allows only one house property. Consider ITR-2 for multiple properties.');
      }
    }

    // ITR-3 specific validations
    if (itrType === 'ITR-3' || itrType === 'ITR3') {
      // Check if audit is applicable and report is provided
      if (formData.auditInfo?.isAuditApplicable) {
        if (!formData.auditInfo.auditReportNumber || formData.auditInfo.auditReportNumber.trim() === '') {
          errors.push('Audit report number is required when tax audit is applicable (Section 44AB)');
        }
        if (!formData.auditInfo.auditReportDate) {
          errors.push('Audit report date is required when tax audit is applicable');
        }
        if (!formData.auditInfo.caDetails?.caName || !formData.auditInfo.caDetails?.membershipNumber) {
          errors.push('CA details are required when tax audit is applicable');
        }
      }

      // Validate balance sheet if maintained
      if (formData.balanceSheet?.hasBalanceSheet) {
        const assetsTotal = formData.balanceSheet.assets?.total || 0;
        const liabilitiesTotal = formData.balanceSheet.liabilities?.total || 0;
        if (Math.abs(assetsTotal - liabilitiesTotal) > 0.01) {
          errors.push(`Balance sheet is not balanced. Difference: ₹${Math.abs(assetsTotal - liabilitiesTotal).toLocaleString('en-IN')}`);
        }
      }

      // Validate business income structure
      if (formData.income?.businessIncome?.businesses) {
        formData.income.businessIncome.businesses.forEach((biz, index) => {
          if (!biz.businessName || biz.businessName.trim() === '') {
            errors.push(`Business ${index + 1}: Business name is required`);
          }
          if (biz.pnl?.grossReceipts && biz.pnl.grossReceipts < 0) {
            errors.push(`Business ${index + 1}: Gross receipts cannot be negative`);
          }
        });
      }

      // Validate professional income structure
      if (formData.income?.professionalIncome?.professions) {
        formData.income.professionalIncome.professions.forEach((prof, index) => {
          if (!prof.professionName || prof.professionName.trim() === '') {
            errors.push(`Profession ${index + 1}: Profession name is required`);
          }
          if (prof.pnl?.professionalFees && prof.pnl.professionalFees < 0) {
            errors.push(`Profession ${index + 1}: Professional fees cannot be negative`);
          }
        });
      }
    }

    // ITR-4 specific validations
    if (itrType === 'ITR-4' || itrType === 'ITR4') {
      // Validate presumptive business income limits
      if (formData.income?.presumptiveBusiness?.hasPresumptiveBusiness) {
        const grossReceipts = formData.income.presumptiveBusiness.grossReceipts || 0;
        if (grossReceipts > 20000000) {
          errors.push('Presumptive business income: Gross receipts cannot exceed ₹2 crores for ITR-4. Consider ITR-3 for higher turnover.');
        }
        if (grossReceipts < 0) {
          errors.push('Presumptive business income: Gross receipts cannot be negative');
        }
        if (!formData.income.presumptiveBusiness.optedOut && grossReceipts > 0 && !formData.income.presumptiveBusiness.presumptiveRate) {
          errors.push('Presumptive business income: Presumptive rate is required');
        }
      }

      // Validate presumptive professional income limits
      if (formData.income?.presumptiveProfessional?.hasPresumptiveProfessional) {
        const grossReceipts = formData.income.presumptiveProfessional.grossReceipts || 0;
        if (grossReceipts > 5000000) {
          errors.push('Presumptive professional income: Gross receipts cannot exceed ₹50 lakhs for ITR-4. Consider ITR-3 for higher receipts.');
        }
        if (grossReceipts < 0) {
          errors.push('Presumptive professional income: Gross receipts cannot be negative');
        }
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

  /**
   * Validate deduction limits for Chapter VI-A
   * @param {object} formData - Form data
   * @returns {Array} Array of validation errors
   */
  validateDeductionLimits(formData) {
    const errors = [];
    const deductions = formData.deductions || {};

    // Section 80C: ₹1.5L limit
    const section80C = deductions.section_80c || deductions.section80C || 0;
    if (section80C > 150000) {
      errors.push('Section 80C deduction cannot exceed ₹1,50,000');
    }

    // Section 80D: Age-based limits
    const age = formData.personal_info?.dob ? this.calculateAge(formData.personal_info.dob) : 0;
    const section80D = deductions.section_80d || deductions.section80D || 0;
    if (age < 60) {
      if (section80D > 25000) {
        errors.push('Section 80D deduction cannot exceed ₹25,000 for non-senior citizens');
      }
    } else {
      if (section80D > 50000) {
        errors.push('Section 80D deduction cannot exceed ₹50,000 for senior citizens');
      }
    }

    // Section 80G: Percentage-based deductions (no hard limit, but validate structure)
    const section80G = deductions.section_80g || deductions.section80G || {};
    if (section80G.donations) {
      section80G.donations.forEach((donation, index) => {
        if (donation.amount < 0) {
          errors.push(`Section 80G donation ${index + 1}: Amount cannot be negative`);
        }
        if (!['100', '50'].includes(donation.deduction_percentage?.toString())) {
          errors.push(`Section 80G donation ${index + 1}: Invalid deduction percentage`);
        }
      });
    }

    // Section 80TTA/80TTB: Age-based limits
    const section80TTA = deductions.section_80tta || deductions.section80TTA || 0;
    const section80TTB = deductions.section_80ttb || deductions.section80TTB || 0;
    if (age < 60) {
      if (section80TTA > 10000) {
        errors.push('Section 80TTA deduction cannot exceed ₹10,000');
      }
      if (section80TTB > 0) {
        errors.push('Section 80TTB is only applicable for senior citizens (60+)');
      }
    } else {
      if (section80TTB > 50000) {
        errors.push('Section 80TTB deduction cannot exceed ₹50,000');
      }
    }

    return errors;
  }

  /**
   * Validate tax computation rules
   * @param {object} formData - Form data
   * @param {object} taxComputation - Tax computation result
   * @returns {Array} Array of validation errors
   */
  validateTaxComputationRules(formData, taxComputation) {
    const errors = [];
    const computation = taxComputation || {};

    // Rebate u/s 87A eligibility
    const taxableIncome = computation.taxableIncome || 0;
    const rebate87A = computation.rebate87A || 0;
    if (rebate87A > 0 && taxableIncome > 500000) {
      errors.push('Rebate u/s 87A is only applicable for taxable income up to ₹5,00,000');
    }
    if (rebate87A > 12500) {
      errors.push('Rebate u/s 87A cannot exceed ₹12,500');
    }

    // Surcharge applicability
    const totalIncome = this.calculateTotalIncome(formData);
    const surcharge = computation.surcharge || 0;
    if (totalIncome <= 5000000 && surcharge > 0) {
      errors.push('Surcharge is not applicable for total income up to ₹50 lakhs');
    }

    // Cess calculations (4% of tax + surcharge)
    const taxOnIncome = computation.taxOnIncome || 0;
    const expectedCess = Math.round((taxOnIncome + surcharge) * 0.04);
    const actualCess = computation.cess || 0;
    if (Math.abs(actualCess - expectedCess) > 1) {
      errors.push(`Education and Health Cess should be 4% of (Tax + Surcharge). Expected: ₹${expectedCess}, Actual: ₹${actualCess}`);
    }

    return errors;
  }

  /**
   * Validate business rules for ITR type and form data
   * @param {object} formData - Form data
   * @param {string} itrType - ITR type
   * @returns {object} Validation result with errors and warnings
   */
  validateBusinessRules(formData, itrType) {
    const errors = [];
    const warnings = [];

    // ITR-1 specific rules
    if (itrType === 'ITR-1' || itrType === 'ITR1') {
      const totalIncome = this.calculateTotalIncome(formData);
      if (totalIncome > 5000000) {
        errors.push('ITR-1 is applicable only for total income up to ₹50 lakhs. Please use ITR-2.');
      }

      // Check for agricultural income > ₹5,000 (CRITICAL REGULATORY RULE - MANDATORY)
      const agriIncome = formData.exemptIncome?.agriculturalIncome?.netAgriculturalIncome
        || formData.exemptIncome?.netAgriculturalIncome
        || formData.agriculturalIncome
        || 0;
      if (agriIncome > 5000) {
        errors.push(
          `Agricultural income (₹${agriIncome.toLocaleString('en-IN')}) exceeds ₹5,000 limit. ` +
          'ITR-1 is not permitted. You must file ITR-2.',
        );
      }

      // Check for business income
      const businessIncome = formData.income?.business_income || formData.income?.businessIncome || 0;
      if (businessIncome > 0) {
        errors.push('Business income cannot be declared in ITR-1. Consider ITR-3 or ITR-4.');
      }

      // Check for capital gains
      const capitalGains = formData.income?.capital_gains || {};
      const hasCapitalGains = (capitalGains.shortTerm || capitalGains.longTerm || capitalGains.stcg || capitalGains.ltcg) > 0;
      if (hasCapitalGains) {
        errors.push('Capital gains cannot be declared in ITR-1. Please use ITR-2.');
      }

      // Check for multiple house properties
      const houseProperties = formData.house_property?.properties || formData.houseProperty?.properties || [];
      if (houseProperties.length > 1) {
        errors.push('ITR-1 allows only one house property. Consider ITR-2 for multiple properties.');
      }
    }

    // ITR-2 specific rules
    if (itrType === 'ITR-2' || itrType === 'ITR2') {
      const businessIncome = formData.income?.business_income || formData.income?.businessIncome || 0;
      if (businessIncome > 0) {
        errors.push('Business income cannot be declared in ITR-2. Consider ITR-3 or ITR-4.');
      }
    }

    // ITR-3 specific rules
    if (itrType === 'ITR-3' || itrType === 'ITR3') {
      const businessIncome = formData.income?.business_income || formData.income?.businessIncome || {};
      const hasBusinessIncome = businessIncome.businesses?.length > 0 || businessIncome.grossReceipts > 0;
      const professionalIncome = formData.income?.professional_income || formData.income?.professionalIncome || {};
      const hasProfessionalIncome = professionalIncome.professions?.length > 0 || professionalIncome.grossReceipts > 0;

      if (!hasBusinessIncome && !hasProfessionalIncome) {
        warnings.push('ITR-3 typically requires business or professional income. Please verify your ITR type selection.');
      }
    }

    // ITR-4 specific rules
    if (itrType === 'ITR-4' || itrType === 'ITR4') {
      const presumptiveBusiness = formData.income?.presumptive_business || formData.income?.presumptiveBusiness || {};
      if (presumptiveBusiness.grossReceipts > 20000000) {
        errors.push('Presumptive business income: Gross receipts cannot exceed ₹2 crores for ITR-4. Consider ITR-3 for higher turnover.');
      }

      const presumptiveProfessional = formData.income?.presumptive_professional || formData.income?.presumptiveProfessional || {};
      if (presumptiveProfessional.grossReceipts > 5000000) {
        errors.push('Presumptive professional income: Gross receipts cannot exceed ₹50 lakhs for ITR-4. Consider ITR-3 for higher receipts.');
      }
    }

    // Add deduction limit validations
    const deductionErrors = this.validateDeductionLimits(formData);
    errors.push(...deductionErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  calculateTotalIncome(formData) {
    let total = 0;

    const income = formData.income || {};
    total += parseFloat(income.gross_salary || income.salary || 0);
    total += parseFloat(income.rental_income || 0);
    total += parseFloat(income.interest_income || 0);
    total += parseFloat(income.dividend_income || 0);
    total += parseFloat(income.capital_gains || 0);
    total += parseFloat(income.other_sources || income.otherIncome || 0);

    // ITR-3: Add business income
    if (formData.businessIncome?.businesses) {
      formData.businessIncome.businesses.forEach(business => {
        if (business.pnl) {
          const pnl = business.pnl;
          const directExpenses = this.calculateExpenseTotal(pnl.directExpenses);
          const indirectExpenses = this.calculateExpenseTotal(pnl.indirectExpenses);
          const depreciation = this.calculateExpenseTotal(pnl.depreciation);
          const netProfit = (pnl.grossReceipts || 0) +
            (pnl.openingStock || 0) -
            (pnl.closingStock || 0) -
            (pnl.purchases || 0) -
            directExpenses -
            indirectExpenses -
            depreciation -
            (pnl.otherExpenses || 0);
          total += netProfit;
        }
      });
    } else if (formData.income?.businessIncome) {
      total += parseFloat(formData.income.businessIncome) || 0;
    }

    // ITR-3: Add professional income
    if (formData.professionalIncome?.professions) {
      formData.professionalIncome.professions.forEach(profession => {
        if (profession.pnl) {
          const pnl = profession.pnl;
          const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
          const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
          const netIncome = (pnl.professionalFees || 0) - expensesTotal - depreciationTotal;
          total += netIncome;
        }
      });
    } else if (formData.income?.professionalIncome) {
      total += parseFloat(formData.income.professionalIncome) || 0;
    }

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
        phone: 'Mobile Number',
      },
      income: {
        gross_salary: 'Gross Salary',
        rental_income: 'Rental Income',
        interest_income: 'Interest Income',
        capital_gains: 'Capital Gains',
      },
      deductions: {
        section_80c: 'Section 80C Deduction',
        section_80d: 'Section 80D Deduction',
        section_80e: 'Section 80E Deduction',
      },
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

// Export the class for use with 'new'
export default ITRValidationEngine;

// Also export a singleton instance for convenience
export const itrValidationEngine = new ITRValidationEngine();
