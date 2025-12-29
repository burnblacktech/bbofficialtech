// =====================================================
// FILING ANALYTICS SERVICE
// Service for generating filing analytics and insights
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { ITRFiling, RefundTracking } = require('../../models');
const { query: dbQuery } = require('../../utils/dbQuery');

class FilingAnalyticsService {
  /**
   * Get comprehensive analytics for a user
   * @param {string} userId - User ID
   * @param {object} options - Analytics options (assessmentYear, years)
   * @returns {Promise<object>} - Analytics data
   */
  async getUserAnalytics(userId, options = {}) {
    try {
      const { assessmentYear, years = 5 } = options;

      // Get all filings for the user
      const where = { userId };
      if (assessmentYear) {
        where.assessmentYear = assessmentYear;
      }

      const filings = await ITRFiling.findAll({
        where,
        order: [['assessmentYear', 'DESC']],
        limit: years * 10, // Reasonable limit
      });

      if (filings.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate year-over-year comparison
      const yearOverYear = await this.getYearOverYearComparison(userId, years);

      // Calculate tax savings insights
      const taxSavings = await this.getTaxSavingsInsights(userId, filings);

      // Calculate filing trends
      const trends = await this.getFilingTrends(userId, filings);

      // Calculate income/deduction trends
      const incomeTrends = await this.getIncomeTrends(userId, filings);
      const deductionTrends = await this.getDeductionTrends(userId, filings);

      // Calculate refund history
      const refundHistory = await this.getRefundHistory(userId, filings);

      // Calculate compliance score
      const complianceScore = await this.getComplianceScore(userId, filings);

      return {
        summary: {
          totalFilings: filings.length,
          yearsTracked: this.getUniqueYears(filings).length,
          totalRefundReceived: refundHistory.totalRefund,
          totalTaxPaid: this.calculateTotalTaxPaid(filings),
          averageRefund: refundHistory.averageRefund,
          complianceScore,
        },
        yearOverYear,
        taxSavings,
        trends,
        incomeTrends,
        deductionTrends,
        refundHistory: refundHistory.history,
        complianceScore,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get filing analytics', {
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to get analytics: ${error.message}`, 500);
    }
  }

  /**
   * Get year-over-year comparison
   * @param {string} userId - User ID
   * @param {number} years - Number of years to compare
   * @returns {Promise<Array>} - Year-over-year data
   */
  async getYearOverYearComparison(userId, years = 5) {
    try {
      const filings = await ITRFiling.findAll({
        where: { userId },
        order: [['assessmentYear', 'DESC']],
        limit: years * 10,
      });

      const yearData = {};
      filings.forEach(filing => {
        const ay = filing.assessmentYear;
        if (!yearData[ay]) {
          yearData[ay] = {
            assessmentYear: ay,
            filings: [],
            totalIncome: 0,
            totalDeductions: 0,
            totalTax: 0,
            refund: 0,
            taxPaid: 0,
          };
        }

        const formData = filing.jsonPayload || {};
        const income = this.extractTotalIncome(formData);
        const deductions = this.extractTotalDeductions(formData);
        const tax = parseFloat(filing.taxLiability || 0);
        const refund = parseFloat(filing.refundAmount || 0);
        const taxPaid = this.extractTaxPaid(formData);

        yearData[ay].filings.push(filing);
        yearData[ay].totalIncome += income;
        yearData[ay].totalDeductions += deductions;
        yearData[ay].totalTax += tax;
        yearData[ay].refund += refund;
        yearData[ay].taxPaid += taxPaid;
      });

      return Object.values(yearData)
        .sort((a, b) => b.assessmentYear.localeCompare(a.assessmentYear))
        .slice(0, years);
    } catch (error) {
      enterpriseLogger.error('Failed to get year-over-year comparison', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get tax savings insights
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<object>} - Tax savings data
   */
  async getTaxSavingsInsights(userId, filings) {
    try {
      let totalSavings = 0;
      const savingsByCategory = {};
      const savingsByYear = {};

      for (const filing of filings) {
        const formData = filing.jsonPayload || {};
        const deductions = formData.deductions || {};
        const ay = filing.assessmentYear;

        // Calculate savings from deductions (simplified - assumes 30% tax rate)
        const deductionAmount = this.extractTotalDeductions(formData);
        const estimatedSavings = deductionAmount * 0.3; // Rough estimate

        totalSavings += estimatedSavings;

        if (!savingsByYear[ay]) {
          savingsByYear[ay] = 0;
        }
        savingsByYear[ay] += estimatedSavings;

        // Categorize by deduction type
        Object.keys(deductions).forEach(category => {
          if (!savingsByCategory[category]) {
            savingsByCategory[category] = 0;
          }
          const categoryAmount = this.extractCategoryAmount(deductions[category]);
          savingsByCategory[category] += categoryAmount * 0.3;
        });
      }

      return {
        totalSavings,
        savingsByYear,
        savingsByCategory,
        topCategories: Object.entries(savingsByCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({ category, amount })),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get tax savings insights', {
        userId,
        error: error.message,
      });
      return { totalSavings: 0, savingsByYear: {}, savingsByCategory: {}, topCategories: [] };
    }
  }

  /**
   * Get filing trends
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<object>} - Filing trends
   */
  async getFilingTrends(userId, filings) {
    try {
      const trends = {
        filingFrequency: this.calculateFilingFrequency(filings),
        averageFilingTime: this.calculateAverageFilingTime(filings),
        onTimeFilingRate: this.calculateOnTimeFilingRate(filings),
        refundTrend: this.calculateRefundTrend(filings),
        taxLiabilityTrend: this.calculateTaxLiabilityTrend(filings),
      };

      return trends;
    } catch (error) {
      enterpriseLogger.error('Failed to get filing trends', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Get income trends
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<Array>} - Income trends by year
   */
  async getIncomeTrends(userId, filings) {
    try {
      const incomeByYear = {};
      const incomeBySource = {};

      filings.forEach(filing => {
        const formData = filing.jsonPayload || {};
        const ay = filing.assessmentYear;
        const income = this.extractIncomeBySource(formData);

        if (!incomeByYear[ay]) {
          incomeByYear[ay] = {
            assessmentYear: ay,
            total: 0,
            bySource: {},
          };
        }

        Object.entries(income).forEach(([source, amount]) => {
          incomeByYear[ay].total += amount;
          incomeByYear[ay].bySource[source] = (incomeByYear[ay].bySource[source] || 0) + amount;

          if (!incomeBySource[source]) {
            incomeBySource[source] = 0;
          }
          incomeBySource[source] += amount;
        });
      });

      return {
        byYear: Object.values(incomeByYear).sort((a, b) => b.assessmentYear.localeCompare(a.assessmentYear)),
        bySource: incomeBySource,
        topSources: Object.entries(incomeBySource)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([source, amount]) => ({ source, amount })),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get income trends', {
        userId,
        error: error.message,
      });
      return { byYear: [], bySource: {}, topSources: [] };
    }
  }

  /**
   * Get deduction trends
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<Array>} - Deduction trends by year
   */
  async getDeductionTrends(userId, filings) {
    try {
      const deductionByYear = {};
      const deductionByCategory = {};

      filings.forEach(filing => {
        const formData = filing.jsonPayload || {};
        const ay = filing.assessmentYear;
        const deductions = formData.deductions || {};

        if (!deductionByYear[ay]) {
          deductionByYear[ay] = {
            assessmentYear: ay,
            total: 0,
            byCategory: {},
          };
        }

        Object.entries(deductions).forEach(([category, data]) => {
          const amount = this.extractCategoryAmount(data);
          deductionByYear[ay].total += amount;
          deductionByYear[ay].byCategory[category] = (deductionByYear[ay].byCategory[category] || 0) + amount;

          if (!deductionByCategory[category]) {
            deductionByCategory[category] = 0;
          }
          deductionByCategory[category] += amount;
        });
      });

      return {
        byYear: Object.values(deductionByYear).sort((a, b) => b.assessmentYear.localeCompare(a.assessmentYear)),
        byCategory: deductionByCategory,
        topCategories: Object.entries(deductionByCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({ category, amount })),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get deduction trends', {
        userId,
        error: error.message,
      });
      return { byYear: [], byCategory: {}, topCategories: [] };
    }
  }

  /**
   * Get refund history
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<object>} - Refund history
   */
  async getRefundHistory(userId, filings) {
    try {
      const filingIds = filings.map(f => f.id);
      if (filingIds.length === 0) {
        return { totalRefund: 0, averageRefund: 0, history: [] };
      }

      const refunds = await RefundTracking.findAll({
        where: {
          filingId: {
            [require('sequelize').Op.in]: filingIds,
          },
          status: {
            [require('sequelize').Op.in]: ['credited', 'issued'],
          },
        },
        include: [{
          model: ITRFiling,
          as: 'filing',
          attributes: ['id', 'assessmentYear'],
        }],
        order: [['statusDate', 'DESC']],
      });

      const totalRefund = refunds.reduce((sum, r) => sum + parseFloat(r.expectedAmount || 0), 0);
      const averageRefund = refunds.length > 0 ? totalRefund / refunds.length : 0;

      const history = refunds.map(refund => ({
        id: refund.id,
        assessmentYear: refund.filing?.assessmentYear,
        amount: parseFloat(refund.expectedAmount || 0),
        status: refund.status,
        statusDate: refund.statusDate,
        interestAmount: parseFloat(refund.interestAmount || 0),
      }));

      return {
        totalRefund,
        averageRefund,
        history,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get refund history', {
        userId,
        error: error.message,
      });
      return { totalRefund: 0, averageRefund: 0, history: [] };
    }
  }

  /**
   * Get compliance score
   * @param {string} userId - User ID
   * @param {Array} filings - User filings
   * @returns {Promise<number>} - Compliance score (0-100)
   */
  async getComplianceScore(userId, filings) {
    try {
      if (filings.length === 0) return 100;

      let score = 100;
      let deductions = 0;

      // Penalize for late filings
      filings.forEach(filing => {
        const submittedDate = filing.submittedAt;
        if (submittedDate) {
          const ay = filing.assessmentYear;
          const year = parseInt(ay.split('-')[0]);
          const deadline = new Date(year + 1, 6, 31); // July 31 of next year
          
          if (new Date(submittedDate) > deadline) {
            deductions += 5; // 5 points per late filing
          }
        }

        // Penalize for rejections
        if (filing.status === 'rejected') {
          deductions += 10; // 10 points per rejection
        }
      });

      score = Math.max(0, score - deductions);
      return Math.round(score);
    } catch (error) {
      enterpriseLogger.error('Failed to calculate compliance score', {
        userId,
        error: error.message,
      });
      return 100;
    }
  }

  // Helper methods
  getEmptyAnalytics() {
    return {
      summary: {
        totalFilings: 0,
        yearsTracked: 0,
        totalRefundReceived: 0,
        totalTaxPaid: 0,
        averageRefund: 0,
        complianceScore: 100,
      },
      yearOverYear: [],
      taxSavings: { totalSavings: 0, savingsByYear: {}, savingsByCategory: {}, topCategories: [] },
      trends: {},
      incomeTrends: { byYear: [], bySource: {}, topSources: [] },
      deductionTrends: { byYear: [], byCategory: {}, topCategories: [] },
      refundHistory: { totalRefund: 0, averageRefund: 0, history: [] },
      complianceScore: 100,
    };
  }

  getUniqueYears(filings) {
    const years = new Set();
    filings.forEach(f => years.add(f.assessmentYear));
    return Array.from(years);
  }

  calculateTotalTaxPaid(filings) {
    return filings.reduce((sum, f) => {
      const formData = f.jsonPayload || {};
      return sum + this.extractTaxPaid(formData);
    }, 0);
  }

  extractTotalIncome(formData) {
    const income = formData.income || {};
    let total = 0;
    Object.values(income).forEach(source => {
      if (typeof source === 'object' && source.amount) {
        total += parseFloat(source.amount || 0);
      } else if (typeof source === 'number') {
        total += source;
      }
    });
    return total;
  }

  extractTotalDeductions(formData) {
    const deductions = formData.deductions || {};
    let total = 0;
    Object.values(deductions).forEach(category => {
      total += this.extractCategoryAmount(category);
    });
    return total;
  }

  extractCategoryAmount(category) {
    if (typeof category === 'number') return category;
    if (typeof category === 'object' && category.amount) return parseFloat(category.amount || 0);
    if (typeof category === 'object' && category.total) return parseFloat(category.total || 0);
    return 0;
  }

  extractTaxPaid(formData) {
    const taxesPaid = formData.taxesPaid || {};
    let total = 0;
    Object.values(taxesPaid).forEach(tax => {
      if (typeof tax === 'object' && tax.amount) {
        total += parseFloat(tax.amount || 0);
      } else if (typeof tax === 'number') {
        total += tax;
      }
    });
    return total;
  }

  extractIncomeBySource(formData) {
    const income = formData.income || {};
    const bySource = {};
    Object.entries(income).forEach(([source, data]) => {
      if (typeof data === 'object' && data.amount) {
        bySource[source] = parseFloat(data.amount || 0);
      } else if (typeof data === 'number') {
        bySource[source] = data;
      }
    });
    return bySource;
  }

  calculateFilingFrequency(filings) {
    if (filings.length < 2) return 'N/A';
    const years = this.getUniqueYears(filings);
    return years.length > 0 ? `${filings.length / years.length} per year` : 'N/A';
  }

  calculateAverageFilingTime(filings) {
    // This would require tracking creation to submission time
    // For now, return placeholder
    return 'N/A';
  }

  calculateOnTimeFilingRate(filings) {
    if (filings.length === 0) return 100;
    let onTime = 0;
    filings.forEach(filing => {
      const submittedDate = filing.submittedAt;
      if (submittedDate) {
        const ay = filing.assessmentYear;
        const year = parseInt(ay.split('-')[0]);
        const deadline = new Date(year + 1, 6, 31);
        if (new Date(submittedDate) <= deadline) {
          onTime++;
        }
      }
    });
    return Math.round((onTime / filings.length) * 100);
  }

  calculateRefundTrend(filings) {
    const refunds = filings
      .filter(f => f.refundAmount && parseFloat(f.refundAmount) > 0)
      .map(f => ({ year: f.assessmentYear, amount: parseFloat(f.refundAmount) }))
      .sort((a, b) => a.year.localeCompare(b.year));
    
    if (refunds.length < 2) return 'stable';
    
    const recent = refunds.slice(-2);
    const change = ((recent[1].amount - recent[0].amount) / recent[0].amount) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  calculateTaxLiabilityTrend(filings) {
    const liabilities = filings
      .filter(f => f.taxLiability && parseFloat(f.taxLiability) > 0)
      .map(f => ({ year: f.assessmentYear, amount: parseFloat(f.taxLiability) }))
      .sort((a, b) => a.year.localeCompare(b.year));
    
    if (liabilities.length < 2) return 'stable';
    
    const recent = liabilities.slice(-2);
    const change = ((recent[1].amount - recent[0].amount) / recent[0].amount) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
}

module.exports = new FilingAnalyticsService();

