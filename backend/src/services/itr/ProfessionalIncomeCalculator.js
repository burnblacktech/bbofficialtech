// =====================================================
// PROFESSIONAL INCOME CALCULATOR
// Calculates net professional income from fees and expenses
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class ProfessionalIncomeCalculator {
  constructor() {
    enterpriseLogger.info('ProfessionalIncomeCalculator initialized');
  }

  /**
   * Calculate net professional income from P&L data
   * @param {object} professionData - Professional P&L data
   * @returns {number} - Net professional income (profit or loss)
   */
  calculateNetProfessionalIncome(professionData) {
    try {
      if (!professionData || !professionData.pnl) {
        return 0;
      }

      const pnl = professionData.pnl;
      
      // Calculate professional expenses total
      const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
      
      // Calculate depreciation total
      const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
      
      // Net Professional Income = Professional Fees - Professional Expenses - Depreciation
      const netIncome = (pnl.professionalFees || 0) -
        expensesTotal -
        depreciationTotal;

      return netIncome;
    } catch (error) {
      enterpriseLogger.error('Error calculating professional income', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError('Failed to calculate professional income', 500);
    }
  }

  /**
   * Calculate total from expense category object
   * @param {object} expenseCategory - Expense category (expenses, depreciation)
   * @returns {number} - Total expenses
   */
  calculateExpenseTotal(expenseCategory) {
    if (!expenseCategory || typeof expenseCategory !== 'object') {
      return 0;
    }

    // If total is already calculated, use it
    if (typeof expenseCategory.total === 'number') {
      return expenseCategory.total;
    }

    // Otherwise, sum all numeric values except 'total'
    return Object.entries(expenseCategory).reduce((sum, [key, value]) => {
      if (key === 'total') return sum;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  /**
   * Calculate total professional income from multiple professions
   * @param {array} professions - Array of profession objects
   * @returns {number} - Total net professional income
   */
  calculateTotalProfessionalIncome(professions) {
    if (!Array.isArray(professions) || professions.length === 0) {
      return 0;
    }

    return professions.reduce((total, profession) => {
      const netIncome = this.calculateNetProfessionalIncome(profession);
      return total + netIncome;
    }, 0);
  }

  /**
   * Handle professional loss set-off
   * @param {number} professionalLoss - Professional loss amount (negative value)
   * @param {number} otherIncome - Other income sources
   * @returns {object} - Set-off result with remaining loss
   */
  handleProfessionalLossSetOff(professionalLoss, otherIncome) {
    if (professionalLoss >= 0) {
      return {
        setOffAmount: 0,
        remainingLoss: 0,
        carryForwardLoss: 0,
      };
    }

    const lossAmount = Math.abs(professionalLoss);
    const setOffAmount = Math.min(lossAmount, otherIncome);
    const remainingLoss = lossAmount - setOffAmount;

    return {
      setOffAmount,
      remainingLoss,
      carryForwardLoss: remainingLoss, // Can be carried forward to next year
    };
  }

  /**
   * Validate professional P&L data
   * @param {object} professionData - Professional P&L data
   * @returns {object} - Validation result
   */
  validateProfessionalData(professionData) {
    const errors = [];

    if (!professionData || !professionData.pnl) {
      errors.push('Professional P&L data is required');
      return { isValid: false, errors };
    }

    const pnl = professionData.pnl;

    // Validate professional fees
    if (pnl.professionalFees < 0) {
      errors.push('Professional fees cannot be negative');
    }

    // Validate expenses (can be 0 or positive)
    const expensesTotal = this.calculateExpenseTotal(pnl.expenses);
    const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);

    if (expensesTotal < 0 || depreciationTotal < 0) {
      errors.push('Expenses cannot be negative');
    }

    // Warning: Expenses should be reasonable compared to fees
    if (pnl.professionalFees > 0 && expensesTotal > pnl.professionalFees * 0.9) {
      errors.push('Warning: Expenses seem unusually high compared to professional fees');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if presumptive taxation (Section 44ADA) is applicable
   * @param {object} professionData - Professional data
   * @returns {boolean} - Whether presumptive taxation is applicable
   */
  isPresumptiveTaxationApplicable(professionData) {
    if (!professionData || !professionData.pnl) {
      return false;
    }

    const receipts = professionData.pnl.professionalFees || 0;
    
    // Section 44ADA: Applicable if receipts <= ₹50 lakhs and profession is eligible
    // This is a simplified check - actual rules are more complex
    return receipts <= 5000000; // ₹50 lakhs
  }

  /**
   * Calculate presumptive income under Section 44ADA
   * @param {number} receipts - Professional fees/receipts
   * @param {number} presumptiveRate - Presumptive rate (default 50% for profession)
   * @returns {number} - Presumptive income
   */
  calculatePresumptiveIncome(receipts, presumptiveRate = 50) {
    return (receipts * presumptiveRate) / 100;
  }
}

module.exports = new ProfessionalIncomeCalculator();

