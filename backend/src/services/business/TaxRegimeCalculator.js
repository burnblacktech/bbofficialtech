// =====================================================
// TAX REGIME CALCULATOR SERVICE
// Supports both Old Regime (pre-115BAC) and New Regime (115BAC)
// Provides side-by-side comparison and regime-specific calculations
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class TaxRegimeCalculator {
  constructor() {
    // Old Regime Tax Slabs (FY 2024-25)
    this.oldRegimeSlabs = {
      individual: [
        { min: 0, max: 250000, rate: 0, cess: 0 },
        { min: 250001, max: 500000, rate: 5, cess: 4 },
        { min: 500001, max: 750000, rate: 10, cess: 4 },
        { min: 750001, max: 1000000, rate: 15, cess: 4 },
        { min: 1000001, max: 1250000, rate: 20, cess: 4 },
        { min: 1250001, max: 1500000, rate: 25, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
      seniorCitizen: [
        { min: 0, max: 300000, rate: 0, cess: 0 },
        { min: 300001, max: 500000, rate: 5, cess: 4 },
        { min: 500001, max: 750000, rate: 10, cess: 4 },
        { min: 750001, max: 1000000, rate: 15, cess: 4 },
        { min: 1000001, max: 1250000, rate: 20, cess: 4 },
        { min: 1250001, max: 1500000, rate: 25, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
      superSeniorCitizen: [
        { min: 0, max: 500000, rate: 0, cess: 0 },
        { min: 500001, max: 750000, rate: 5, cess: 4 },
        { min: 750001, max: 1000000, rate: 10, cess: 4 },
        { min: 1000001, max: 1250000, rate: 15, cess: 4 },
        { min: 1250001, max: 1500000, rate: 20, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
    };

    // New Regime Tax Slabs (Section 115BAC) - FY 2024-25
    this.newRegimeSlabs = {
      individual: [
        { min: 0, max: 300000, rate: 0, cess: 0 },
        { min: 300001, max: 700000, rate: 5, cess: 4 },
        { min: 700001, max: 1000000, rate: 10, cess: 4 },
        { min: 1000001, max: 1200000, rate: 15, cess: 4 },
        { min: 1200001, max: 1500000, rate: 20, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
      seniorCitizen: [
        { min: 0, max: 300000, rate: 0, cess: 0 },
        { min: 300001, max: 700000, rate: 5, cess: 4 },
        { min: 700001, max: 1000000, rate: 10, cess: 4 },
        { min: 1000001, max: 1200000, rate: 15, cess: 4 },
        { min: 1200001, max: 1500000, rate: 20, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
      superSeniorCitizen: [
        { min: 0, max: 300000, rate: 0, cess: 0 },
        { min: 300001, max: 700000, rate: 5, cess: 4 },
        { min: 700001, max: 1000000, rate: 10, cess: 4 },
        { min: 1000001, max: 1200000, rate: 15, cess: 4 },
        { min: 1200001, max: 1500000, rate: 20, cess: 4 },
        { min: 1500001, max: Infinity, rate: 30, cess: 4 },
      ],
    };

    // Standard deduction for New Regime
    this.newRegimeStandardDeduction = 50000;

    // Rebate under Section 87A (for both regimes)
    this.rebate87A = {
      maxIncome: 500000,
      rebate: 12500,
    };
  }

  /**
   * Calculate tax for a given regime
   * @param {object} formData - ITR form data
   * @param {string} regime - 'old' or 'new'
   * @param {string} assessmentYear - Assessment year (default: '2024-25')
   * @returns {object} Tax computation result
   */
  calculateTax(formData, regime = 'old', assessmentYear = '2024-25') {
    try {
      const income = formData.income || {};
      const deductions = formData.deductions || {};
      const taxesPaid = formData.taxesPaid || {};

      // Calculate gross total income
      const grossTotalIncome = this.calculateGrossTotalIncome(income);

      // Calculate deductions based on regime
      const totalDeductions = regime === 'new'
        ? this.calculateNewRegimeDeductions(deductions, income)
        : this.calculateOldRegimeDeductions(deductions, income);

      // Calculate taxable income
      const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

      // Determine taxpayer category (individual, senior citizen, super senior citizen)
      const age = this.calculateAge(formData.personalInfo?.dob || formData.personalInfo?.dateOfBirth);
      const category = this.getTaxpayerCategory(age);

      // Get appropriate tax slabs
      const slabs = regime === 'new'
        ? this.newRegimeSlabs[category]
        : this.oldRegimeSlabs[category];

      // Calculate tax on income
      let taxResult = this.calculateTaxBySlabs(taxableIncome, slabs);

      // Agricultural income aggregation (Old Regime only)
      // Agricultural income is exempt but affects tax rates
      // Partial integration applies when:
      // 1. Agricultural income > ₹5,000 AND
      // 2. Non-agricultural income > basic exemption limit
      if (regime === 'old') {
        const agriculturalIncome = this.extractAgriculturalIncome(formData);
        // Use gross non-agricultural income (before deductions) for aggregation calculation
        const nonAgriGrossIncome = grossTotalIncome - agriculturalIncome;
        const basicExemption = category === 'superSeniorCitizen' ? 500000 : category === 'seniorCitizen' ? 300000 : 250000;
        
        // Apply partial integration only if both conditions are met
        if (agriculturalIncome > 5000 && nonAgriGrossIncome > basicExemption) {
          const agriAggregation = this.calculateAgriculturalAggregation(nonAgriGrossIncome, agriculturalIncome, age);
          taxResult.tax += agriAggregation;
          // Update breakdown if needed
          if (agriAggregation > 0 && taxResult.breakdown) {
            taxResult.breakdown.push({
              min: 'N/A',
              max: 'N/A',
              rate: 'Marginal (Agri Aggregation)',
              income: agriculturalIncome,
              tax: agriAggregation,
              description: `Tax on (₹${nonAgriGrossIncome.toLocaleString('en-IN')} + ₹${agriculturalIncome.toLocaleString('en-IN')}) - Tax on (₹${agriculturalIncome.toLocaleString('en-IN')} + ₹${basicExemption.toLocaleString('en-IN')})`,
            });
          }
        }
      }

      // Calculate cess (4% of tax)
      const cess = Math.round(taxResult.tax * 0.04);
      const totalTaxLiability = taxResult.tax + cess;

      // Calculate rebate under Section 87A
      const rebate = this.calculateRebate87A(totalTaxLiability, taxableIncome);

      // Final tax liability after rebate
      const finalTaxLiability = Math.max(0, totalTaxLiability - rebate.amount);

      // Calculate taxes paid
      const totalTaxesPaid = (taxesPaid.tds || 0) +
        (taxesPaid.advanceTax || 0) +
        (taxesPaid.selfAssessmentTax || 0);

      // Calculate refund or payable
      const refundOrPayable = totalTaxesPaid - finalTaxLiability;

      return {
        regime,
        assessmentYear,
        grossTotalIncome,
        totalDeductions,
        taxableIncome,
        taxOnIncome: taxResult.tax,
        cess,
        totalTaxLiability,
        rebate: rebate.amount,
        finalTaxLiability,
        totalTaxesPaid,
        refundOrPayable,
        isRefund: refundOrPayable > 0,
        breakdown: {
          taxSlabs: taxResult.breakdown,
          deductions: this.getDeductionBreakdown(deductions, regime),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Tax calculation failed', {
        error: error.message,
        regime,
        stack: error.stack,
      });
      throw new AppError(`Tax calculation failed: ${error.message}`, 500);
    }
  }

  /**
   * Compare both regimes side-by-side
   * @param {object} formData - ITR form data
   * @param {string} assessmentYear - Assessment year
   * @returns {object} Comparison result
   */
  compareRegimes(formData, assessmentYear = '2024-25') {
    try {
      const oldRegimeResult = this.calculateTax(formData, 'old', assessmentYear);
      const newRegimeResult = this.calculateTax(formData, 'new', assessmentYear);

      const savings = oldRegimeResult.finalTaxLiability - newRegimeResult.finalTaxLiability;
      const recommendedRegime = savings > 0 ? 'new' : 'old';

      return {
        oldRegime: oldRegimeResult,
        newRegime: newRegimeResult,
        comparison: {
          savings: Math.abs(savings),
          savingsType: savings > 0 ? 'new_regime' : 'old_regime',
          recommendedRegime,
          difference: savings,
        },
      };
    } catch (error) {
      enterpriseLogger.error('Regime comparison failed', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(`Regime comparison failed: ${error.message}`, 500);
    }
  }

  /**
   * Calculate gross total income
   * Handles both simple (ITR-1) and structured (ITR-2) data formats
   */
  calculateGrossTotalIncome(income) {
    let total = 0;

    // Salary income
    total += parseFloat(income.salary || 0);

    // Business income - handle ITR-3 structured format or simple number
    let businessIncomeTotal = 0;
    if (income.businessIncome) {
      if (typeof income.businessIncome === 'object' && income.businessIncome.businesses && Array.isArray(income.businessIncome.businesses)) {
        // ITR-3: Calculate total from businesses array
        businessIncomeTotal = income.businessIncome.businesses.reduce((sum, biz) => {
          if (biz.pnl) {
            const pnl = biz.pnl;
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
            return sum + netProfit;
          }
          return sum + (parseFloat(biz.pnl?.netProfit) || 0);
        }, 0);
      } else {
        // Simple number format
        businessIncomeTotal = parseFloat(income.businessIncome) || 0;
      }
    }
    total += businessIncomeTotal;

    // Professional income - handle ITR-3 structured format or simple number
    let professionalIncomeTotal = 0;
    if (income.professionalIncome) {
      if (typeof income.professionalIncome === 'object' && income.professionalIncome.professions && Array.isArray(income.professionalIncome.professions)) {
        // ITR-3: Calculate total from professions array
        professionalIncomeTotal = income.professionalIncome.professions.reduce((sum, prof) => {
          if (prof.pnl) {
            const pnl = prof.pnl;
            const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
            const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
            const netIncome = (pnl.professionalFees || 0) - expensesTotal - depreciationTotal;
            return sum + netIncome;
          }
          return sum + (parseFloat(prof.pnl?.netIncome) || 0);
        }, 0);
      } else {
        // Simple number format
        professionalIncomeTotal = parseFloat(income.professionalIncome) || 0;
      }
    }
    total += professionalIncomeTotal;

    // ITR-4: Handle presumptive income
    if (income.presumptiveBusiness?.presumptiveIncome) {
      total += parseFloat(income.presumptiveBusiness.presumptiveIncome || 0);
    }
    if (income.presumptiveProfessional?.presumptiveIncome) {
      total += parseFloat(income.presumptiveProfessional.presumptiveIncome || 0);
    }

    // ITR-4: Handle goods carriage income (Section 44AE)
    if (income.goodsCarriage || formData.goodsCarriage) {
      const goodsCarriage = income.goodsCarriage || formData.goodsCarriage;
      if (goodsCarriage.totalPresumptiveIncome) {
        // Use pre-calculated total if available
        total += parseFloat(goodsCarriage.totalPresumptiveIncome) || 0;
      } else if (goodsCarriage.vehicles && Array.isArray(goodsCarriage.vehicles)) {
        // Calculate from vehicles array
        const goodsCarriageIncome = goodsCarriage.vehicles.reduce((sum, vehicle) => {
          const monthsOwned = parseFloat(vehicle.monthsOwned) || 12;
          if (vehicle.type === 'heavy_goods') {
            // Heavy goods vehicle: ₹1,000 per ton per month
            const tons = parseFloat(vehicle.gvw) || 12;
            return sum + (1000 * tons * monthsOwned);
          } else {
            // Light goods vehicle: ₹7,500 per vehicle per month
            return sum + (7500 * monthsOwned);
          }
        }, 0);
        total += goodsCarriageIncome;
      }
    }

    // Capital gains - handle structured data (ITR-2) or simple number
    let capitalGainsTotal = 0;
    if (income.capitalGains) {
      if (typeof income.capitalGains === 'object' && income.capitalGains.stcgDetails && income.capitalGains.ltcgDetails) {
        // ITR-2 structured format
        const stcgTotal = (income.capitalGains.stcgDetails || []).reduce(
          (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
          0,
        );
        const ltcgTotal = (income.capitalGains.ltcgDetails || []).reduce(
          (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
          0,
        );
        capitalGainsTotal = stcgTotal + ltcgTotal;
      } else {
        // Simple number format (ITR-1 fallback)
        capitalGainsTotal = parseFloat(income.capitalGains) || 0;
      }
    }
    total += capitalGainsTotal;

    // Helper method to calculate expense total from expense category object
    this.calculateExpenseTotal = function(expenseCategory) {
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
    };

    // House property income - handle structured data (ITR-2) or simple number
    let housePropertyTotal = 0;
    if (income.houseProperty) {
      if (Array.isArray(income.houseProperty)) {
        // Array format
        housePropertyTotal = income.houseProperty.reduce((sum, prop) => {
          return sum + (parseFloat(prop.netRentalIncome) || 0);
        }, 0);
      } else if (income.houseProperty.properties && Array.isArray(income.houseProperty.properties)) {
        // ITR-2 structured format with properties array
        housePropertyTotal = income.houseProperty.properties.reduce((sum, prop) => {
          const rentalIncome = parseFloat(prop.annualRentalIncome) || 0;
          const municipalTaxes = parseFloat(prop.municipalTaxes) || 0;
          const interestOnLoan = parseFloat(prop.interestOnLoan) || 0;
          const netIncome = Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
          return sum + netIncome;
        }, 0);
      } else {
        // Simple number format
        housePropertyTotal = parseFloat(income.houseProperty) || 0;
      }
    }
    total += housePropertyTotal;

    // Foreign income - handle structured data (ITR-2)
    let foreignIncomeTotal = 0;
    if (income.foreignIncome && income.foreignIncome.foreignIncomeDetails) {
      foreignIncomeTotal = (income.foreignIncome.foreignIncomeDetails || []).reduce(
        (sum, entry) => sum + (parseFloat(entry.amountInr) || 0),
        0,
      );
    }
    total += foreignIncomeTotal;

    // Director/Partner income (ITR-2)
    const directorPartnerIncome = (income.directorPartner?.directorIncome || 0) +
                                  (income.directorPartner?.partnerIncome || 0);
    total += directorPartnerIncome;

    // Other income sources - handle structured format (otherSources) or simple number
    if (income.otherSources && typeof income.otherSources === 'object') {
      total += parseFloat(income.otherSources.totalOtherSourcesIncome || 0) ||
        (parseFloat(income.otherSources.totalInterestIncome || 0) + parseFloat(income.otherSources.totalOtherIncome || 0));
    } else {
      total += parseFloat(income.interestIncome || 0);
      total += parseFloat(income.dividendIncome || 0);
      total += parseFloat(income.otherIncome || 0);
    }

    return total;
  }

  /**
   * Extract agricultural income from formData
   * Agricultural income is exempt but used for rate aggregation in Old Regime
   */
  extractAgriculturalIncome(formData) {
    return parseFloat(
      formData?.exemptIncome?.agriculturalIncome?.netAgriculturalIncome ||
      formData?.exemptIncome?.netAgriculturalIncome ||
      formData?.agriculturalIncome ||
      0
    );
  }

  /**
   * Calculate agricultural income aggregation for rate purposes (Old Regime only)
   * This implements the partial integration method where agricultural income affects tax rates
   * 
   * Formula (Partial Integration):
   * Step 1: Tax on (non-agri income + agri income)
   * Step 2: Tax on (agri income + basic exemption limit)
   * Step 3: Tax payable = Step 1 - Step 2
   * 
   * Conditions for application:
   * - Agricultural income > ₹5,000
   * - Non-agricultural income > basic exemption limit (₹2.5L/₹3L/₹5L based on age)
   * 
   * @param {number} nonAgriIncome - Non-agricultural income (gross, before deductions)
   * @param {number} agriIncome - Agricultural income (exempt but used for rate calculation)
   * @param {number} age - Taxpayer age (for determining basic exemption limit)
   * @returns {number} Additional tax due to agricultural income affecting the rate
   */
  calculateAgriculturalAggregation(nonAgriIncome, agriIncome, age = 0) {
    // Determine taxpayer category for correct slabs and basic exemption
    const category = this.getTaxpayerCategory(age);
    const basicExemption = category === 'superSeniorCitizen' ? 500000 : category === 'seniorCitizen' ? 300000 : 250000;
    
    // Partial integration applies only if:
    // 1. Agricultural income > ₹5,000 (regulatory threshold)
    // 2. Non-agricultural income > basic exemption limit
    if (agriIncome <= 5000 || nonAgriIncome <= basicExemption) {
      return 0;
    }

    const slabs = this.oldRegimeSlabs[category];

    // Step 1: Calculate tax on (non-agri + agri) - total income for rate purposes
    const totalIncome = nonAgriIncome + agriIncome;
    const taxOnTotal = this.calculateTaxBySlabs(totalIncome, slabs).tax;

    // Step 2: Calculate tax on (agri + basic exemption) - tax on agricultural income portion
    const agriWithExemption = agriIncome + basicExemption;
    const taxOnAgriExemption = this.calculateTaxBySlabs(agriWithExemption, slabs).tax;

    // Step 3: Additional tax due to agricultural income affecting the rate
    // This is the difference: tax calculated at higher rate due to agri income
    return Math.max(0, taxOnTotal - taxOnAgriExemption);
  }

  /**
   * Calculate deductions for Old Regime
   */
  calculateOldRegimeDeductions(deductions, income) {
    let total = 0;

    // Section 80C (max ₹1.5L)
    total += Math.min(deductions.section80C || 0, 150000);

    // Section 80D (Health Insurance)
    total += deductions.section80D || 0;

    // Section 80E (Education Loan Interest)
    total += deductions.section80E || 0;

    // Section 80G (Donations)
    total += deductions.section80G || 0;

    // Section 80TTA (Interest on Savings Account - max ₹10,000)
    total += Math.min(deductions.section80TTA || 0, 10000);

    // Section 80TTB (Interest Income for Senior Citizens - max ₹50,000)
    total += Math.min(deductions.section80TTB || 0, 50000);

    // Other deductions
    total += deductions.otherDeductions || 0;

    // HRA (if applicable)
    if (income.hra) {
      total += income.hra;
    }

    // Standard deduction (₹50,000 for salaried)
    if (income.salary > 0) {
      total += 50000;
    }

    return total;
  }

  /**
   * Calculate deductions for New Regime
   * New regime has limited deductions: Standard deduction only
   */
  calculateNewRegimeDeductions(deductions, income) {
    let total = 0;

    // Standard deduction (₹50,000 for salaried)
    if (income.salary > 0) {
      total += this.newRegimeStandardDeduction;
    }

    // New regime allows very limited deductions
    // Most deductions are not available in new regime

    return total;
  }

  /**
   * Calculate tax based on tax slabs
   */
  calculateTaxBySlabs(taxableIncome, slabs) {
    let tax = 0;
    const breakdown = [];

    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const slabIncome = Math.min(taxableIncome, slab.max) - slab.min;
        const slabTax = (slabIncome * slab.rate) / 100;
        tax += slabTax;

        if (slabTax > 0) {
          breakdown.push({
            min: slab.min,
            max: slab.max === Infinity ? 'Infinity' : slab.max,
            rate: slab.rate,
            income: slabIncome,
            tax: slabTax,
          });
        }
      }
    }

    return {
      tax: Math.round(tax),
      breakdown,
    };
  }

  /**
   * Calculate rebate under Section 87A
   */
  calculateRebate87A(totalTaxLiability, taxableIncome) {
    if (taxableIncome <= this.rebate87A.maxIncome) {
      return {
        applicable: true,
        amount: Math.min(totalTaxLiability, this.rebate87A.rebate),
      };
    }
    return {
      applicable: false,
      amount: 0,
    };
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get taxpayer category based on age
   */
  getTaxpayerCategory(age) {
    if (age >= 80) return 'superSeniorCitizen';
    if (age >= 60) return 'seniorCitizen';
    return 'individual';
  }

  /**
   * Get deduction breakdown for display
   */
  getDeductionBreakdown(deductions, regime) {
    const breakdown = {};

    if (regime === 'old') {
      breakdown.section80C = Math.min(deductions.section80C || 0, 150000);
      breakdown.section80D = deductions.section80D || 0;
      breakdown.section80E = deductions.section80E || 0;
      breakdown.section80G = deductions.section80G || 0;
      breakdown.section80TTA = Math.min(deductions.section80TTA || 0, 10000);
      breakdown.section80TTB = Math.min(deductions.section80TTB || 0, 50000);
      breakdown.standardDeduction = 50000; // For salaried
      breakdown.otherDeductions = deductions.otherDeductions || 0;
    } else {
      breakdown.standardDeduction = 50000; // Only standard deduction in new regime
    }

    return breakdown;
  }
}

module.exports = TaxRegimeCalculator;

