// =====================================================
// BALANCE SHEET SERVICE
// Handles balance sheet operations for ITR-3
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class BalanceSheetService {
  /**
   * Get balance sheet for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} Balance sheet data
   */
  async getBalanceSheet(filingId) {
    try {
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['jsonPayload']
      });

      if (!filing) {
        return null;
      }

      const balanceSheet = filing.jsonPayload?.balanceSheet;

      return balanceSheet || {
        hasBalanceSheet: false,
        assets: {
          currentAssets: { cash: 0, bank: 0, inventory: 0, receivables: 0, other: 0, total: 0 },
          fixedAssets: { building: 0, machinery: 0, vehicles: 0, furniture: 0, other: 0, total: 0 },
          investments: 0,
          loansAdvances: 0,
          total: 0,
        },
        liabilities: {
          currentLiabilities: { creditors: 0, bankOverdraft: 0, shortTermLoans: 0, other: 0, total: 0 },
          longTermLiabilities: { longTermLoans: 0, other: 0, total: 0 },
          capital: 0,
          total: 0,
        },
      };
    } catch (error) {
      enterpriseLogger.error('Get balance sheet failed', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Update balance sheet for a filing
   * @param {string} filingId - Filing ID
   * @param {object} balanceSheetData - Balance sheet data
   * @returns {Promise<object>} Updated balance sheet
   */
  async updateBalanceSheet(filingId, balanceSheetData) {
    try {
      const filing = await ITRFiling.findByPk(filingId);

      if (!filing) {
        throw new Error('Filing not found');
      }

      // Sync to jsonPayload (SSOT)
      const payload = { ...(filing.jsonPayload || {}) };
      payload.balanceSheet = balanceSheetData;

      filing.jsonPayload = payload;
      filing.changed('jsonPayload', true);

      // Validate balance sheet
      const validation = this.validateBalanceSheet(balanceSheetData);
      if (!validation.isValid) {
        throw new Error(`Balance sheet validation failed: ${validation.errors.join(', ')}`);
      }

      await filing.save();

      enterpriseLogger.info('Balance sheet updated via model', { filingId });

      return filing.jsonPayload.balanceSheet;
    } catch (error) {
      enterpriseLogger.error('Update balance sheet failed', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Validate balance sheet
   * @param {object} balanceSheet - Balance sheet data
   * @returns {object} Validation result
   */
  validateBalanceSheet(balanceSheet) {
    const errors = [];

    if (!balanceSheet.hasBalanceSheet) {
      return { isValid: true, errors: [] };
    }

    // Calculate totals
    const calculated = this.calculateTotals(balanceSheet);

    // Check if assets equal liabilities
    const assetsTotal = calculated.assets.total;
    const liabilitiesTotal = calculated.liabilities.total;
    const difference = Math.abs(assetsTotal - liabilitiesTotal);

    if (difference > 0.01) {
      errors.push(
        `Balance sheet is not balanced. Assets: ₹${assetsTotal.toLocaleString('en-IN')}, ` +
        `Liabilities + Capital: ₹${liabilitiesTotal.toLocaleString('en-IN')}, ` +
        `Difference: ₹${difference.toLocaleString('en-IN')}`
      );
    }

    // Validate individual values are non-negative
    if (assetsTotal < 0) {
      errors.push('Total assets cannot be negative');
    }
    if (liabilitiesTotal < 0) {
      errors.push('Total liabilities cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      calculated,
    };
  }

  /**
   * Calculate totals for balance sheet
   * @param {object} balanceSheet - Balance sheet data
   * @returns {object} Balance sheet with calculated totals
   */
  calculateTotals(balanceSheet) {
    const calculated = JSON.parse(JSON.stringify(balanceSheet));

    // Calculate current assets total
    if (calculated.assets?.currentAssets) {
      const currentAssets = calculated.assets.currentAssets;
      currentAssets.total =
        (currentAssets.cash || 0) +
        (currentAssets.bank || 0) +
        (currentAssets.inventory || 0) +
        (currentAssets.receivables || 0) +
        (currentAssets.other || 0);
    }

    // Calculate fixed assets total
    if (calculated.assets?.fixedAssets) {
      const fixedAssets = calculated.assets.fixedAssets;
      fixedAssets.total =
        (fixedAssets.building || 0) +
        (fixedAssets.machinery || 0) +
        (fixedAssets.vehicles || 0) +
        (fixedAssets.furniture || 0) +
        (fixedAssets.other || 0);
    }

    // Calculate total assets
    if (calculated.assets) {
      calculated.assets.total =
        (calculated.assets.currentAssets?.total || 0) +
        (calculated.assets.fixedAssets?.total || 0) +
        (calculated.assets.investments || 0) +
        (calculated.assets.loansAdvances || 0);
    }

    // Calculate current liabilities total
    if (calculated.liabilities?.currentLiabilities) {
      const currentLiabilities = calculated.liabilities.currentLiabilities;
      currentLiabilities.total =
        (currentLiabilities.creditors || 0) +
        (currentLiabilities.bankOverdraft || 0) +
        (currentLiabilities.shortTermLoans || 0) +
        (currentLiabilities.other || 0);
    }

    // Calculate long-term liabilities total
    if (calculated.liabilities?.longTermLiabilities) {
      const longTermLiabilities = calculated.liabilities.longTermLiabilities;
      longTermLiabilities.total =
        (longTermLiabilities.longTermLoans || 0) +
        (longTermLiabilities.other || 0);
    }

    // Calculate total liabilities
    if (calculated.liabilities) {
      calculated.liabilities.total =
        (calculated.liabilities.currentLiabilities?.total || 0) +
        (calculated.liabilities.longTermLiabilities?.total || 0) +
        (calculated.liabilities.capital || 0);
    }

    return calculated;
  }
}

module.exports = new BalanceSheetService();
