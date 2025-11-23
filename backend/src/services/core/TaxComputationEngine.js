// =====================================================
// TAX COMPUTATION ENGINE
// =====================================================

const enterpriseLogger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class TaxComputationEngine {
  constructor() {
    this.taxSlabs = {
      '2024-25': {
        individual: [
          { min: 0, max: 250000, rate: 0, cess: 0 },
          { min: 250001, max: 500000, rate: 5, cess: 4 },
          { min: 500001, max: 750000, rate: 10, cess: 4 },
          { min: 750001, max: 1000000, rate: 15, cess: 4 },
          { min: 1000001, max: 1250000, rate: 20, cess: 4 },
          { min: 1250001, max: 1500000, rate: 25, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ],
        seniorCitizen: [
          { min: 0, max: 300000, rate: 0, cess: 0 },
          { min: 300001, max: 500000, rate: 5, cess: 4 },
          { min: 500001, max: 750000, rate: 10, cess: 4 },
          { min: 750001, max: 1000000, rate: 15, cess: 4 },
          { min: 1000001, max: 1250000, rate: 20, cess: 4 },
          { min: 1250001, max: 1500000, rate: 25, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ],
        superSeniorCitizen: [
          { min: 0, max: 500000, rate: 0, cess: 0 },
          { min: 500001, max: 750000, rate: 10, cess: 4 },
          { min: 750001, max: 1000000, rate: 15, cess: 4 },
          { min: 1000001, max: 1250000, rate: 20, cess: 4 },
          { min: 1250001, max: 1500000, rate: 25, cess: 4 },
          { min: 1500001, max: Infinity, rate: 30, cess: 4 }
        ]
      }
    };

    this.deductionLimits = {
      '2024-25': {
        section80C: 150000,
        section80D: 25000,
        section80E: Infinity, // No limit
        section80G: Infinity, // No limit
        section80TTA: 10000,
        section80TTB: 50000,
        section24: 200000,
        standardDeduction: 50000
      }
    };

    enterpriseLogger.info('TaxComputationEngine initialized');
  }

  /**
   * Compute tax for ITR filing
   * @param {object} filingData - Complete filing data
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<object>} - Tax computation result
   */
  async computeTax(filingData, assessmentYear = '2024-25') {
    try {
      enterpriseLogger.info('Starting tax computation', { 
        itrType: filingData.itrType,
        assessmentYear 
      });

      const computation = {
        assessmentYear,
        itrType: filingData.itrType,
        grossTotalIncome: 0,
        totalDeductions: 0,
        taxableIncome: 0,
        taxComputation: {},
        totalTax: 0,
        cess: 0,
        finalTax: 0,
        refundAmount: 0,
        taxPaid: 0,
        computedAt: new Date().toISOString()
      };

      // Calculate gross total income
      computation.grossTotalIncome = this.calculateGrossTotalIncome(filingData);
      
      // Calculate total deductions
      computation.totalDeductions = this.calculateTotalDeductions(filingData, assessmentYear);
      
      // Calculate taxable income
      computation.taxableIncome = Math.max(0, computation.grossTotalIncome - computation.totalDeductions);
      
      // Calculate tax based on ITR type
      computation.taxComputation = this.calculateTaxByType(
        computation.taxableIncome, 
        filingData.personalInfo,
        assessmentYear
      );
      
      computation.totalTax = computation.taxComputation.totalTax;
      computation.cess = computation.taxComputation.cess;
      computation.finalTax = computation.totalTax + computation.cess;
      
      // Calculate refund/payable
      computation.taxPaid = filingData.taxPaid || 0;
      computation.refundAmount = Math.max(0, computation.taxPaid - computation.finalTax);

      enterpriseLogger.info('Tax computation completed', {
        grossTotalIncome: computation.grossTotalIncome,
        totalDeductions: computation.totalDeductions,
        taxableIncome: computation.taxableIncome,
        totalTax: computation.totalTax,
        finalTax: computation.finalTax
      });

      return computation;
    } catch (error) {
      enterpriseLogger.error('Tax computation failed', { 
        error: error.message,
        filingData: filingData.itrType 
      });
      throw new AppError(`Tax computation failed: ${error.message}`, 500);
    }
  }

  /**
   * Calculate gross total income from all sources
   * @param {object} filingData - Filing data
   * @returns {number} - Gross total income
   */
  calculateGrossTotalIncome(filingData) {
    let totalIncome = 0;

    // Salary income
    if (filingData.income?.salary?.totalSalary) {
      totalIncome += parseFloat(filingData.income.salary.totalSalary) || 0;
    }

    // House property income
    if (filingData.income?.houseProperty?.netRentalIncome) {
      totalIncome += parseFloat(filingData.income.houseProperty.netRentalIncome) || 0;
    }

    // Capital gains
    if (filingData.income?.capitalGains?.shortTerm) {
      totalIncome += parseFloat(filingData.income.capitalGains.shortTerm) || 0;
    }
    if (filingData.income?.capitalGains?.longTerm) {
      totalIncome += parseFloat(filingData.income.capitalGains.longTerm) || 0;
    }

    // Business income
    if (filingData.income?.businessIncome?.netProfit) {
      totalIncome += parseFloat(filingData.income.businessIncome.netProfit) || 0;
    }

    // Other income
    if (filingData.income?.otherIncome) {
      Object.values(filingData.income.otherIncome).forEach(amount => {
        totalIncome += parseFloat(amount) || 0;
      });
    }

    return totalIncome;
  }

  /**
   * Calculate total deductions with limits
   * @param {object} filingData - Filing data
   * @param {string} assessmentYear - Assessment year
   * @returns {number} - Total deductions
   */
  calculateTotalDeductions(filingData, assessmentYear) {
    const limits = this.deductionLimits[assessmentYear];
    let totalDeductions = 0;

    // Section 80C (max ₹1,50,000)
    if (filingData.deductions?.section80C) {
      const section80C = Object.values(filingData.deductions.section80C)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      totalDeductions += Math.min(section80C, limits.section80C);
    }

    // Section 80D (max ₹25,000)
    if (filingData.deductions?.section80D) {
      const section80D = Object.values(filingData.deductions.section80D)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      totalDeductions += Math.min(section80D, limits.section80D);
    }

    // Section 80E (no limit)
    if (filingData.deductions?.section80E?.educationLoanInterest) {
      totalDeductions += parseFloat(filingData.deductions.section80E.educationLoanInterest) || 0;
    }

    // Section 80G (no limit)
    if (filingData.deductions?.section80G?.donations) {
      totalDeductions += parseFloat(filingData.deductions.section80G.donations) || 0;
    }

    // Section 80TTA (max ₹10,000)
    if (filingData.deductions?.section80TTA?.savingsInterest) {
      const section80TTA = parseFloat(filingData.deductions.section80TTA.savingsInterest) || 0;
      totalDeductions += Math.min(section80TTA, limits.section80TTA);
    }

    // Section 80TTB (max ₹50,000 for senior citizens)
    if (filingData.deductions?.section80TTB?.bankInterest) {
      const section80TTB = parseFloat(filingData.deductions.section80TTB.bankInterest) || 0;
      totalDeductions += Math.min(section80TTB, limits.section80TTB);
    }

    // Section 24 (max ₹2,00,000)
    if (filingData.deductions?.section24?.homeLoanInterest) {
      const section24 = parseFloat(filingData.deductions.section24.homeLoanInterest) || 0;
      totalDeductions += Math.min(section24, limits.section24);
    }

    // Standard deduction
    if (filingData.deductions?.otherDeductions?.standardDeduction) {
      totalDeductions += parseFloat(filingData.deductions.otherDeductions.standardDeduction) || 0;
    }

    // HRA, LTA, Medical reimbursement
    if (filingData.deductions?.otherDeductions) {
      const otherDeductions = filingData.deductions.otherDeductions;
      totalDeductions += parseFloat(otherDeductions.hra) || 0;
      totalDeductions += parseFloat(otherDeductions.lta) || 0;
      totalDeductions += parseFloat(otherDeductions.medicalReimbursement) || 0;
    }

    return totalDeductions;
  }

  /**
   * Calculate tax based on taxpayer type
   * @param {number} taxableIncome - Taxable income
   * @param {object} personalInfo - Personal information
   * @param {string} assessmentYear - Assessment year
   * @returns {object} - Tax computation details
   */
  calculateTaxByType(taxableIncome, personalInfo, assessmentYear) {
    const slabs = this.taxSlabs[assessmentYear];
    let applicableSlabs = slabs.individual;

    // Determine taxpayer type based on age
    const age = this.calculateAge(personalInfo.dateOfBirth);
    if (age >= 80) {
      applicableSlabs = slabs.superSeniorCitizen;
    } else if (age >= 60) {
      applicableSlabs = slabs.seniorCitizen;
    }

    let totalTax = 0;
    const taxBreakdown = [];

    for (const slab of applicableSlabs) {
      if (taxableIncome > slab.min) {
        const taxableInThisSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
        const taxInThisSlab = (taxableInThisSlab * slab.rate) / 100;
        
        if (taxInThisSlab > 0) {
          totalTax += taxInThisSlab;
          taxBreakdown.push({
            slab: `${slab.min.toLocaleString()} - ${slab.max === Infinity ? 'Above' : slab.max.toLocaleString()}`,
            rate: `${slab.rate}%`,
            taxableAmount: taxableInThisSlab,
            tax: taxInThisSlab
          });
        }
      }
    }

    const cess = (totalTax * 4) / 100; // 4% cess

    return {
      totalTax,
      cess,
      taxBreakdown,
      applicableSlabs: applicableSlabs,
      taxpayerType: age >= 80 ? 'superSeniorCitizen' : age >= 60 ? 'seniorCitizen' : 'individual'
    };
  }

  /**
   * Calculate age from date of birth
   * @param {string} dateOfBirth - Date of birth
   * @returns {number} - Age
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate tax computation
   * @param {object} computation - Tax computation result
   * @returns {object} - Validation result
   */
  validateComputation(computation) {
    const errors = [];
    const warnings = [];

    // Basic validations
    if (computation.grossTotalIncome < 0) {
      errors.push('Gross total income cannot be negative');
    }

    if (computation.totalDeductions < 0) {
      errors.push('Total deductions cannot be negative');
    }

    if (computation.taxableIncome < 0) {
      errors.push('Taxable income cannot be negative');
    }

    if (computation.totalTax < 0) {
      errors.push('Tax amount cannot be negative');
    }

    // Warnings
    if (computation.grossTotalIncome > 10000000) {
      warnings.push('High income detected - consider professional tax planning');
    }

    if (computation.totalDeductions > computation.grossTotalIncome * 0.8) {
      warnings.push('High deduction ratio - verify deduction claims');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new TaxComputationEngine();