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
  async generateRecommendations(formData, itrType, assessmentYear = null) {
    const { getDefaultAssessmentYear } = require('../../constants/assessmentYears');
    const finalAssessmentYear = assessmentYear || getDefaultAssessmentYear();
    try {
      enterpriseLogger.info('Generating AI recommendations', { itrType, assessmentYear: finalAssessmentYear });

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
   * Generate optimization suggestions for tax optimizer with enhanced context
   * @param {object} formData - Current form data
   * @param {string} itrType - ITR type
   * @param {object} userProfile - User profile (age, risk profile, etc.)
   * @returns {Array} - Array of optimization suggestions with explanations
   */
  generateOptimizationSuggestions(formData, itrType, userProfile = {}) {
    const suggestions = [];
    const deductions = formData.deductions || {};
    const income = formData.income || {};
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);
    const personalInfo = formData.personalInfo || {};
    const age = userProfile.age || this.calculateAge(personalInfo.dateOfBirth) || 30;
    const riskProfile = userProfile.riskProfile || 'moderate';

    // Section 80C optimization with personalized recommendations
    const current80C = parseFloat(deductions.section80C || 0);
    if (current80C < 150000 && grossTotalIncome > 500000) {
      const remaining80C = 150000 - current80C;
      const taxSavings = this.estimateTaxSavings(remaining80C, grossTotalIncome);
      const explanation = this.explainSuggestion({ type: 'section80C' }, formData);
      
      // Personalized investment recommendations based on age and risk profile
      let recommendedInvestments = [];
      if (age < 35 && riskProfile === 'aggressive') {
        recommendedInvestments = ['ELSS Mutual Funds (equity exposure)', 'PPF (long-term safety)', 'Life Insurance'];
      } else if (age < 50 && riskProfile === 'moderate') {
        recommendedInvestments = ['ELSS Mutual Funds', 'PPF', 'NSC', 'Tax-saving FDs'];
      } else {
        recommendedInvestments = ['PPF (safe, long-term)', 'NSC (fixed returns)', 'Tax-saving FDs', 'Life Insurance'];
      }

      suggestions.push({
        type: 'section80C',
        title: 'Maximize Section 80C Deduction',
        description: `Invest ₹${remaining80C.toLocaleString('en-IN')} more to maximize Section 80C deduction and save ₹${taxSavings.toLocaleString('en-IN')} in taxes`,
        potentialSavings: taxSavings,
        investmentAmount: remaining80C,
        priority: remaining80C > 50000 ? 'high' : 'medium',
        impactScore: this.calculateImpactScore({ potentialSavings: taxSavings, priority: remaining80C > 50000 ? 'high' : 'medium' }, grossTotalIncome * 0.3),
        explanation: explanation.fullExplanation,
        whyThisSuggestion: explanation.why,
        howToImplement: explanation.how,
        impactDetails: explanation.impact,
        deadline: explanation.deadline,
        recommendedInvestments: recommendedInvestments,
        context: {
          currentIncome: grossTotalIncome,
          taxBracket: this.getTaxBracket(grossTotalIncome),
          currentDeduction: current80C,
          maxDeduction: 150000,
        },
      });
    }

    // NPS optimization with context
    const currentNPS = parseFloat(deductions.section80CCD || 0);
    if (currentNPS < 50000 && grossTotalIncome > 500000 && age < 60) {
      const remainingNPS = 50000 - currentNPS;
      const taxSavings = this.estimateTaxSavings(remainingNPS, grossTotalIncome);
      const explanation = this.explainSuggestion({ type: 'section80CCD' }, formData);

      suggestions.push({
        type: 'section80CCD',
        title: 'Additional NPS Contribution',
        description: `Contribute ₹${remainingNPS.toLocaleString('en-IN')} more to NPS for additional deduction beyond Section 80C`,
        potentialSavings: taxSavings,
        investmentAmount: remainingNPS,
        priority: 'medium',
        impactScore: this.calculateImpactScore({ potentialSavings: taxSavings, priority: 'medium' }, grossTotalIncome * 0.3),
        explanation: explanation.fullExplanation,
        whyThisSuggestion: explanation.why,
        howToImplement: explanation.how,
        impactDetails: explanation.impact,
        deadline: explanation.deadline,
        context: {
          currentIncome: grossTotalIncome,
          taxBracket: this.getTaxBracket(grossTotalIncome),
          age: age,
          retirementBenefit: true,
        },
      });
    }

    // Health Insurance optimization with age-based limits
    const max80D = age >= 60 ? 50000 : 25000;
    const current80D = parseFloat(deductions.section80D || 0);
    if (current80D < max80D && grossTotalIncome > 300000) {
      const remaining80D = max80D - current80D;
      const taxSavings = this.estimateTaxSavings(remaining80D, grossTotalIncome);
      const explanation = this.explainSuggestion({ type: 'section80D' }, formData);

      suggestions.push({
        type: 'section80D',
        title: age >= 60 ? 'Maximize Health Insurance Deduction (Senior Citizen)' : 'Health Insurance Premium Deduction',
        description: `Purchase health insurance with premium ₹${remaining80D.toLocaleString('en-IN')} to claim full Section 80D deduction`,
        potentialSavings: taxSavings,
        investmentAmount: remaining80D,
        priority: 'high',
        impactScore: this.calculateImpactScore({ potentialSavings: taxSavings, priority: 'high' }, grossTotalIncome * 0.3),
        explanation: explanation.fullExplanation,
        whyThisSuggestion: explanation.why,
        howToImplement: explanation.how,
        impactDetails: explanation.impact,
        deadline: explanation.deadline,
        context: {
          age: age,
          maxDeduction: max80D,
          currentDeduction: current80D,
          includesParents: true,
        },
      });
    }

    // Regime comparison suggestion
    const oldRegimeTax = formData.taxComputation?.oldRegime?.totalTax || 0;
    const newRegimeTax = formData.taxComputation?.newRegime?.totalTax || 0;
    if (oldRegimeTax > 0 && newRegimeTax > 0) {
      const savings = Math.abs(oldRegimeTax - newRegimeTax);
      const betterRegime = oldRegimeTax < newRegimeTax ? 'old' : 'new';
      
      if (savings > 10000) {
        suggestions.push({
          type: 'regimeSwitch',
          title: `Switch to ${betterRegime === 'old' ? 'Old' : 'New'} Regime`,
          description: `By switching to the ${betterRegime === 'old' ? 'Old' : 'New'} regime, you can save ₹${savings.toLocaleString('en-IN')} in taxes`,
          potentialSavings: savings,
          investmentAmount: 0,
          priority: savings > 50000 ? 'high' : 'medium',
          impactScore: this.calculateImpactScore({ potentialSavings: savings, priority: savings > 50000 ? 'high' : 'medium' }, Math.max(oldRegimeTax, newRegimeTax)),
          explanation: `The ${betterRegime === 'old' ? 'Old' : 'New'} regime is more beneficial for your income profile. ${betterRegime === 'old' ? 'Old regime allows deductions under various sections (80C, 80D, etc.) which reduce your taxable income.' : 'New regime offers a flat ₹50,000 standard deduction and lower tax rates, which may be more beneficial if you have limited deductions.'}`,
          whyThisSuggestion: `Based on your current deductions and income, the ${betterRegime === 'old' ? 'Old' : 'New'} regime results in lower tax liability.`,
          howToImplement: `Simply select the ${betterRegime === 'old' ? 'Old' : 'New'} regime when filing your ITR.`,
          impactDetails: `This will reduce your tax liability by ₹${savings.toLocaleString('en-IN')}.`,
          deadline: 'You can choose the regime at the time of filing.',
          context: {
            oldRegimeTax: oldRegimeTax,
            newRegimeTax: newRegimeTax,
            currentRegime: formData.regime || 'old',
            recommendedRegime: betterRegime,
          },
        });
      }
    }

    // Rank suggestions by impact score
    return this.rankSuggestionsByImpact(suggestions, Math.max(oldRegimeTax, newRegimeTax));
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
   * Explain a suggestion with detailed reasoning
   * @param {object} suggestion - Suggestion object
   * @param {object} formData - Form data for context
   * @returns {object} - Detailed explanation with why, how, and impact
   */
  explainSuggestion(suggestion, formData = {}) {
    const income = formData.income || {};
    const deductions = formData.deductions || {};
    const grossTotalIncome = this.calculateGrossTotalIncome(formData);
    const personalInfo = formData.personalInfo || {};
    const age = personalInfo.age || this.calculateAge(personalInfo.dateOfBirth);

    const explanations = {
      section80C: {
        why: `Based on your income of ₹${grossTotalIncome.toLocaleString('en-IN')}, you're in the ${this.getTaxBracket(grossTotalIncome)} tax bracket. Maximizing Section 80C can significantly reduce your tax liability.`,
        how: `You can invest in any combination of: ELSS mutual funds (equity exposure + tax benefit), PPF (safe, long-term), NSC (fixed returns), Tax-saving FDs (bank deposits), Life Insurance premiums, or Home Loan principal repayment.`,
        impact: `By investing ₹${(150000 - (deductions.section80C || 0)).toLocaleString('en-IN')} more, you'll save ₹${this.estimateTaxSavings(150000 - (deductions.section80C || 0), grossTotalIncome).toLocaleString('en-IN')} in taxes (${this.getTaxBracket(grossTotalIncome)} rate).`,
        deadline: `Investments must be made before March 31st of the financial year to claim deduction.`,
      },
      section80CCD: {
        why: `NPS contributions provide an additional deduction of up to ₹50,000 beyond the ₹1.5 lakhs Section 80C limit. This is especially beneficial for higher income earners.`,
        how: `Contribute to your NPS Tier-1 account. The contribution is eligible for deduction under Section 80CCD(1B), which is over and above the Section 80C limit.`,
        impact: `By contributing ₹${(50000 - (deductions.section80CCD || 0)).toLocaleString('en-IN')} more to NPS, you'll save ₹${this.estimateTaxSavings(50000 - (deductions.section80CCD || 0), grossTotalIncome).toLocaleString('en-IN')} in taxes while building retirement corpus.`,
        deadline: `NPS contributions must be made before March 31st.`,
      },
      section80D: {
        why: age >= 60
          ? `As a senior citizen, you can claim up to ₹50,000 for health insurance premiums, providing better tax benefits.`
          : `Health insurance is essential for financial security and provides tax benefits under Section 80D.`,
        how: `Purchase health insurance for yourself, spouse, children, and parents. Premiums paid are eligible for deduction.`,
        impact: `By claiming ₹${(age >= 60 ? 50000 : 25000) - (deductions.section80D || 0)} in health insurance premiums, you'll save ₹${this.estimateTaxSavings((age >= 60 ? 50000 : 25000) - (deductions.section80D || 0), grossTotalIncome).toLocaleString('en-IN')} in taxes while protecting your family's health.`,
        deadline: `Premium must be paid before March 31st.`,
      },
      hraOptimization: {
        why: `HRA exemption can significantly reduce your taxable salary income if you're paying rent.`,
        how: `HRA exemption is calculated as the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of basic salary, (3) 50% of basic salary (metro) or 40% (non-metro).`,
        impact: `Optimizing HRA can reduce your taxable income by up to the exempt amount, saving taxes at your applicable rate.`,
        deadline: `Rent receipts and rental agreement must be maintained for the full year.`,
      },
    };

    const baseExplanation = explanations[suggestion.type] || {
      why: 'This optimization can help reduce your tax liability based on your current financial situation.',
      how: 'Follow the suggested action to implement this optimization.',
      impact: `This can save you approximately ₹${(suggestion.potentialSavings || 0).toLocaleString('en-IN')} in taxes.`,
      deadline: 'Ensure actions are completed before March 31st of the financial year.',
    };

    return {
      why: baseExplanation.why,
      how: baseExplanation.how,
      impact: baseExplanation.impact,
      deadline: baseExplanation.deadline,
      fullExplanation: `${baseExplanation.why}\n\n${baseExplanation.how}\n\n${baseExplanation.impact}\n\nNote: ${baseExplanation.deadline}`,
    };
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
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
   * Get tax bracket description
   */
  getTaxBracket(income) {
    if (income > 1000000) return '30%';
    if (income > 500000) return '20%';
    return '5%';
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

