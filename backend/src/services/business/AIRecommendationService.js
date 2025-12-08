// =====================================================
// AI RECOMMENDATION SERVICE
// Generates smart recommendations for tax optimization,
// deduction suggestions, and compliance warnings
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class AIRecommendationService {
  constructor() {
    this.recommendations = [];
  }

  /**
   * Generate AI recommendations based on form data
   * @param {object} formData - ITR form data
   * @param {string} itrType - ITR type (ITR-1, ITR-2, ITR-3, ITR-4)
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<array>} Array of recommendations
   */
  async generateRecommendations(formData, itrType, assessmentYear = '2024-25') {
    try {
      enterpriseLogger.info('Generating AI recommendations', { itrType, assessmentYear });

      const recommendations = [];

      // 1. Tax Optimization Recommendations
      recommendations.push(...this.generateTaxOptimizationRecommendations(formData, itrType));

      // 2. Deduction Suggestions
      recommendations.push(...this.generateDeductionSuggestions(formData, itrType));

      // 3. Compliance Warnings
      recommendations.push(...this.generateComplianceWarnings(formData, itrType));

      // Sort by priority (high > medium > low)
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      enterpriseLogger.info('AI recommendations generated', {
        itrType,
        count: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
      });

      return recommendations;
    } catch (error) {
      enterpriseLogger.error('Failed to generate AI recommendations', {
        error: error.message,
        itrType,
        stack: error.stack,
      });
      throw new AppError(`Failed to generate recommendations: ${error.message}`, 500);
    }
  }

  /**
   * Generate tax optimization recommendations
   */
  generateTaxOptimizationRecommendations(formData, itrType) {
    const recommendations = [];
    const deductions = formData.deductions || {};
    const income = formData.income || {};
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);

    // Section 80C optimization
    const section80C = deductions.section80C || 0;
    const max80C = 150000;
    if (section80C < max80C && grossTotalIncome > 500000) {
      const additional = max80C - section80C;
      const taxSavings = additional * 0.30; // Assuming 30% tax bracket
      recommendations.push({
        type: 'tax_optimization',
        priority: 'high',
        title: 'Claim Additional Section 80C',
        message: `You can claim additional ₹${additional.toLocaleString('en-IN')} under Section 80C (max ₹1.5L)`,
        action: {
          field: 'deductions.section80C',
          value: max80C,
        },
        impact: `Reduces tax liability by ₹${Math.round(taxSavings).toLocaleString('en-IN')}`,
      });
    }

    // Section 80D optimization
    const section80D = deductions.section80D || 0;
    const max80D = 25000; // Basic limit, can be higher for senior citizens
    if (section80D === 0 && grossTotalIncome > 300000) {
      recommendations.push({
        type: 'tax_optimization',
        priority: 'medium',
        title: 'Consider Section 80D for Health Insurance',
        message: 'You can claim up to ₹25,000 for health insurance premium under Section 80D',
        action: {
          field: 'deductions.section80D',
          value: 25000,
        },
        impact: 'Reduces tax liability by ₹7,500 (assuming 30% tax bracket)',
      });
    }

    // Presumptive taxation for ITR-4
    if (itrType === 'ITR-4' && formData.businessIncome) {
      const businessIncome = formData.businessIncome.grossReceipts || 0;
      if (businessIncome > 0 && businessIncome <= 20000000) {
        recommendations.push({
          type: 'tax_optimization',
          priority: 'high',
          title: 'Presumptive Taxation Available',
          message: 'You can use presumptive taxation scheme which simplifies tax calculation',
          action: null,
          impact: 'Simplifies filing and may reduce tax liability',
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate deduction suggestions
   */
  generateDeductionSuggestions(formData, itrType) {
    const recommendations = [];
    const income = formData.income || {};
    const deductions = formData.deductions || {};
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);

    // ELSS investment suggestion
    if (grossTotalIncome > 500000 && (deductions.section80C || 0) < 150000) {
      recommendations.push({
        type: 'deduction_suggestion',
        priority: 'medium',
        title: 'Consider ELSS Funds for Section 80C',
        message: 'Based on your income, consider investing in ELSS funds for Section 80C deduction',
        action: {
          field: 'deductions.section80C',
          value: Math.min(150000, (deductions.section80C || 0) + 50000),
        },
        impact: 'Tax-efficient investment with potential for growth',
      });
    }

    // Home loan interest deduction
    const houseProperties = formData.houseProperties || formData.houseProperty || [];
    const properties = Array.isArray(houseProperties) ? houseProperties : [houseProperties];
    properties.forEach((property, index) => {
      if (property && property.interestOnLoan > 0 && property.interestOnLoan > (deductions.section80C || 0)) {
        recommendations.push({
          type: 'deduction_suggestion',
          priority: 'medium',
          title: `Home Loan Interest Deduction Available - Property ${index + 1}`,
          message: `Home loan interest deduction available: ₹${property.interestOnLoan.toLocaleString('en-IN')}`,
          action: null,
          impact: 'Already accounted in house property income calculation',
        });
      }
    });

    // Medical insurance premium
    if (grossTotalIncome > 300000 && (deductions.section80D || 0) === 0) {
      recommendations.push({
        type: 'deduction_suggestion',
        priority: 'low',
        title: 'Medical Insurance Premium Deduction',
        message: 'Medical insurance premium can be claimed under Section 80D',
        action: {
          field: 'deductions.section80D',
          value: 25000,
        },
        impact: 'Reduces taxable income',
      });
    }

    return recommendations;
  }

  /**
   * Generate compliance warnings
   */
  generateComplianceWarnings(formData, itrType) {
    const recommendations = [];
    const income = formData.income || {};

    // Capital gains details check for ITR-2
    if (itrType === 'ITR-2' && income.capitalGains > 0) {
      const capitalGains = formData.capitalGains || {};
      if (!capitalGains.hasCapitalGains && !capitalGains.stcgDetails && !capitalGains.ltcgDetails) {
        recommendations.push({
          type: 'compliance_warning',
          priority: 'high',
          title: 'Missing Capital Gains Details',
          message: 'Capital gains details required for ITR-2. Please provide STCG/LTCG breakdown.',
          action: null,
        });
      }
    }

    // Business expenses check for ITR-3
    if (itrType === 'ITR-3' && income.businessIncome > 0) {
      const businessIncome = formData.businessIncome || {};
      if (!businessIncome.grossReceipts && !businessIncome.netProfit) {
        recommendations.push({
          type: 'compliance_warning',
          priority: 'high',
          title: 'Incomplete Business Income Details',
          message: 'Business expenses and P&L details not provided for ITR-3',
          action: null,
        });
      }
    }

    // Income limit check for ITR-1
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);
    if (itrType === 'ITR-1' && grossTotalIncome > 5000000) {
      recommendations.push({
        type: 'compliance_warning',
        priority: 'high',
        title: 'Income Exceeds ITR-1 Limit',
        message: `Total income (₹${grossTotalIncome.toLocaleString('en-IN')}) exceeds ITR-1 limit (₹50L). Consider ITR-2.`,
        action: null,
      });
    }

    // TDS mismatch check
    const taxesPaid = formData.taxesPaid || {};
    if (taxesPaid.tds && taxesPaid.tds > 0 && formData.prefetchData) {
      // Compare with prefetch data if available
      const prefetchTDS = formData.prefetchData?.taxesPaid?.tds || 0;
      if (Math.abs(taxesPaid.tds - prefetchTDS) > 1000) {
        recommendations.push({
          type: 'compliance_warning',
          priority: 'medium',
          title: 'TDS Mismatch Detected',
          message: `TDS entered (₹${taxesPaid.tds.toLocaleString('en-IN')}) differs from Form 26AS. Please verify.`,
          action: null,
        });
      }
    }

    // Required fields check
    const personalInfo = formData.personalInfo || {};
    if (!personalInfo.pan || !personalInfo.full_name) {
      recommendations.push({
        type: 'compliance_warning',
        priority: 'high',
        title: 'Missing Required Personal Information',
        message: 'PAN and Full Name are required fields',
        action: null,
      });
    }

    return recommendations;
  }

  /**
   * Calculate gross total income
   */
  calculateGrossTotalIncome(formData) {
    const income = formData.income || {};
    return (
      (income.salary || 0) +
      (income.businessIncome || 0) +
      (income.professionalIncome || 0) +
      (income.capitalGains || 0) +
      (income.interestIncome || 0) +
      (income.dividendIncome || 0) +
      (income.otherIncome || 0)
    );
  }

  /**
   * Generate optimization suggestions for tax optimizer
   * @param {object} formData - Current form data
   * @param {string} itrType - ITR type
   * @returns {Array} - Array of optimization suggestions
   */
  generateOptimizationSuggestions(formData, itrType) {
    const suggestions = [];
    const deductions = formData.deductions || {};
    const income = formData.income || {};
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);

    // Section 80C optimization
    const current80C = parseFloat(deductions.section80C || 0);
    if (current80C < 150000 && grossTotalIncome > 500000) {
      const remaining80C = 150000 - current80C;
      suggestions.push({
        type: 'section80C',
        title: 'Maximize Section 80C Deduction',
        description: `Invest ₹${remaining80C.toLocaleString('en-IN')} more to maximize Section 80C deduction`,
        potentialSavings: this.estimateTaxSavings(remaining80C, grossTotalIncome),
        investmentAmount: remaining80C,
        priority: remaining80C > 50000 ? 'high' : 'medium',
      });
    }

    // NPS optimization
    const currentNPS = parseFloat(deductions.section80CCD || 0);
    if (currentNPS < 50000 && grossTotalIncome > 500000) {
      const remainingNPS = 50000 - currentNPS;
      suggestions.push({
        type: 'section80CCD',
        title: 'Additional NPS Contribution',
        description: `Contribute ₹${remainingNPS.toLocaleString('en-IN')} more to NPS for additional deduction`,
        potentialSavings: this.estimateTaxSavings(remainingNPS, grossTotalIncome),
        investmentAmount: remainingNPS,
        priority: 'medium',
      });
    }

    // Health Insurance optimization
    const current80D = parseFloat(deductions.section80D || 0);
    if (current80D < 25000 && grossTotalIncome > 300000) {
      const remaining80D = 25000 - current80D;
      suggestions.push({
        type: 'section80D',
        title: 'Health Insurance Premium',
        description: `Purchase health insurance with premium ₹${remaining80D.toLocaleString('en-IN')} for deduction`,
        potentialSavings: this.estimateTaxSavings(remaining80D, grossTotalIncome),
        investmentAmount: remaining80D,
        priority: 'high',
      });
    }

    return suggestions;
  }

  /**
   * Rank suggestions by impact
   * @param {Array} suggestions - Array of suggestions
   * @param {number} currentTax - Current tax liability
   * @returns {Array} - Ranked suggestions
   */
  rankSuggestionsByImpact(suggestions, currentTax) {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        impactScore: this.calculateImpactScore(suggestion, currentTax),
      }))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.impactScore - a.impactScore;
      });
  }

  /**
   * Explain a suggestion
   * @param {object} suggestion - Suggestion object
   * @returns {string} - Explanation text
   */
  explainSuggestion(suggestion) {
    const explanations = {
      section80C: `Section 80C allows deduction up to ₹1.5 lakhs for investments in ELSS, PPF, NSC, Tax-saving FD, Life Insurance, etc.`,
      section80CCD: `Section 80CCD provides additional deduction up to ₹50,000 for NPS contributions beyond the ₹1.5 lakhs limit of Section 80C.`,
      section80D: `Section 80D allows deduction for health insurance premiums paid for self, family, and parents.`,
      hraOptimization: `HRA exemption is calculated as the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of basic salary, (3) 50% of basic salary.`,
    };
    return explanations[suggestion.type] || 'This optimization can help reduce your tax liability.';
  }

  /**
   * Estimate tax savings for an investment
   * @param {number} investmentAmount - Investment amount
   * @param {number} totalIncome - Total income
   * @returns {number} - Estimated tax savings
   */
  estimateTaxSavings(investmentAmount, totalIncome) {
    let taxRate = 0.10;
    if (totalIncome > 1000000) {
      taxRate = 0.30;
    } else if (totalIncome > 500000) {
      taxRate = 0.20;
    }
    return investmentAmount * taxRate;
  }

  /**
   * Calculate impact score for ranking
   * @param {object} suggestion - Suggestion object
   * @param {number} currentTax - Current tax liability
   * @returns {number} - Impact score
   */
  calculateImpactScore(suggestion, currentTax) {
    if (!suggestion.potentialSavings || currentTax === 0) return 0;
    const savingsPercentage = (suggestion.potentialSavings / currentTax) * 100;
    const priorityMultiplier = { high: 1.5, medium: 1.0, low: 0.5 };
    return savingsPercentage * priorityMultiplier[suggestion.priority || 'medium'];
  }
}

module.exports = new AIRecommendationService();

