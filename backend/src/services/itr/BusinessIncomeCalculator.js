// =====================================================
// BUSINESS INCOME CALCULATOR
// Calculates net business income from P&L statements
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class BusinessIncomeCalculator {
  constructor() {
    enterpriseLogger.info('BusinessIncomeCalculator initialized');
  }

  /**
   * Calculate net business income from P&L data
   * @param {object} businessData - Business P&L data
   * @returns {number} - Net business income (profit or loss)
   */
  calculateNetBusinessIncome(businessData) {
    try {
      if (!businessData || !businessData.pnl) {
        return 0;
      }

      const pnl = businessData.pnl;
      
      // Calculate direct expenses total
      const directExpensesTotal = this.calculateExpenseTotal(pnl.directExpenses);
      
      // Calculate indirect expenses total
      const indirectExpensesTotal = this.calculateExpenseTotal(pnl.indirectExpenses);
      
      // Calculate depreciation total
      const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);
      
      // Net Profit/Loss = Gross Receipts + Opening Stock - Closing Stock - Purchases - Direct Expenses - Indirect Expenses - Depreciation - Other Expenses
      const netProfit = (pnl.grossReceipts || 0) +
        (pnl.openingStock || 0) -
        (pnl.closingStock || 0) -
        (pnl.purchases || 0) -
        directExpensesTotal -
        indirectExpensesTotal -
        depreciationTotal -
        (pnl.otherExpenses || 0);

      return netProfit;
    } catch (error) {
      enterpriseLogger.error('Error calculating business income', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError('Failed to calculate business income', 500);
    }
  }

  /**
   * Calculate total from expense category object
   * @param {object} expenseCategory - Expense category (directExpenses, indirectExpenses, depreciation)
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
   * Calculate total business income from multiple businesses
   * @param {array} businesses - Array of business objects
   * @returns {number} - Total net business income
   */
  calculateTotalBusinessIncome(businesses) {
    if (!Array.isArray(businesses) || businesses.length === 0) {
      return 0;
    }

    return businesses.reduce((total, business) => {
      const netIncome = this.calculateNetBusinessIncome(business);
      return total + netIncome;
    }, 0);
  }

  /**
   * Handle business loss set-off
   * @param {number} businessLoss - Business loss amount (negative value)
   * @param {number} otherIncome - Other income sources
   * @returns {object} - Set-off result with remaining loss
   */
  handleBusinessLossSetOff(businessLoss, otherIncome) {
    if (businessLoss >= 0) {
      return {
        setOffAmount: 0,
        remainingLoss: 0,
        carryForwardLoss: 0,
      };
    }

    const lossAmount = Math.abs(businessLoss);
    const setOffAmount = Math.min(lossAmount, otherIncome);
    const remainingLoss = lossAmount - setOffAmount;

    return {
      setOffAmount,
      remainingLoss,
      carryForwardLoss: remainingLoss, // Can be carried forward to next year
    };
  }

  /**
   * Validate business P&L data
   * @param {object} businessData - Business P&L data
   * @returns {object} - Validation result
   */
  validateBusinessData(businessData) {
    const errors = [];

    if (!businessData || !businessData.pnl) {
      errors.push('Business P&L data is required');
      return { isValid: false, errors };
    }

    const pnl = businessData.pnl;

    // Validate gross receipts
    if (pnl.grossReceipts < 0) {
      errors.push('Gross receipts cannot be negative');
    }

    // Validate stock values
    if (pnl.openingStock < 0 || pnl.closingStock < 0) {
      errors.push('Stock values cannot be negative');
    }

    // Validate purchases
    if (pnl.purchases < 0) {
      errors.push('Purchases cannot be negative');
    }

    // Validate expenses (can be 0 or positive)
    const directExpensesTotal = this.calculateExpenseTotal(pnl.directExpenses);
    const indirectExpensesTotal = this.calculateExpenseTotal(pnl.indirectExpenses);
    const depreciationTotal = this.calculateExpenseTotal(pnl.depreciation);

    if (directExpensesTotal < 0 || indirectExpensesTotal < 0 || depreciationTotal < 0) {
      errors.push('Expenses cannot be negative');
    }

    // Warning: Closing stock should not exceed opening stock + purchases (with tolerance)
    const maxClosingStock = (pnl.openingStock || 0) + (pnl.purchases || 0) + (directExpensesTotal || 0);
    if (pnl.closingStock > maxClosingStock * 1.1) { // 10% tolerance
      errors.push('Warning: Closing stock seems unusually high compared to opening stock and purchases');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if presumptive taxation (Section 44AD) is applicable
   * @param {object} businessData - Business data
   * @returns {boolean} - Whether presumptive taxation is applicable
   */
  isPresumptiveTaxationApplicable(businessData) {
    if (!businessData || !businessData.pnl) {
      return false;
    }

    const turnover = businessData.pnl.grossReceipts || 0;
    
    // Section 44AD: Applicable if turnover <= ₹2 crores and business is eligible
    // This is a simplified check - actual rules are more complex
    return turnover <= 20000000; // ₹2 crores
  }

  /**
   * Calculate presumptive income under Section 44AD
   * @param {number} turnover - Gross receipts/turnover
   * @param {number} presumptiveRate - Presumptive rate (default 8% for digital receipts)
   * @returns {number} - Presumptive income
   */
  calculatePresumptiveIncome(turnover, presumptiveRate = 8) {
    return (turnover * presumptiveRate) / 100;
  }
}

module.exports = new BusinessIncomeCalculator();

