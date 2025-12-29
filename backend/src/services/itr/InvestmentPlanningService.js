// =====================================================
// INVESTMENT PLANNING SERVICE
// Provides investment recommendations and tax savings calculations
// =====================================================

const { query: dbQuery } = require('../../utils/dbQuery');
const enterpriseLogger = require('../../utils/logger');

class InvestmentPlanningService {
  constructor() {
    // Section 80C limit
    this.section80CLimit = 150000;
    // Section 80D limits
    this.section80DLimits = {
      self: 25000,
      parents: 50000,
      total: 75000,
    };
    // NPS additional deduction (Section 80CCD(1B))
    this.npsAdditionalLimit = 50000;
  }

  /**
   * Generate investment recommendations based on user profile
   * @param {string} userId - User ID
   * @param {object} options - Options including availableAmount, riskProfile, etc.
   * @returns {object} Investment recommendations
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const { availableAmount, riskProfile = 'moderate', currentDeductions = {} } = options;

      // Get user's current financial profile
      const userProfile = await this.getUserFinancialProfile(userId);

      // Calculate remaining deduction capacity
      const remainingCapacity = this.calculateRemainingCapacity(currentDeductions, userProfile);

      // Generate recommendations by section
      const recommendations = {
        section80C: this.generateSection80CRecommendations(
          remainingCapacity.section80C,
          riskProfile,
          availableAmount,
          userProfile
        ),
        section80D: this.generateSection80DRecommendations(
          remainingCapacity.section80D,
          userProfile
        ),
        nps: this.generateNPSRecommendations(
          remainingCapacity.nps,
          availableAmount,
          userProfile
        ),
      };

      // Calculate tax savings
      const taxSavings = this.calculateTaxSavings(recommendations, userProfile);

      // Prioritize recommendations
      const prioritized = this.prioritizeRecommendations(recommendations, taxSavings, availableAmount);

      return {
        success: true,
        recommendations: prioritized,
        taxSavings,
        totalInvestmentRequired: prioritized.reduce((sum, rec) => sum + (rec.investmentAmount || 0), 0),
        remainingCapacity,
      };
    } catch (error) {
      enterpriseLogger.error('Generate investment recommendations failed', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Calculate tax savings for investment recommendations
   * @param {object} recommendations - Investment recommendations
   * @param {object} userProfile - User financial profile
   * @returns {object} Tax savings breakdown
   */
  calculateTaxSavings(recommendations, userProfile) {
    const taxableIncome = userProfile.taxableIncome || 0;
    const taxRegime = userProfile.taxRegime || 'old';

    let totalDeduction = 0;
    let totalSavings = 0;

    // Calculate deductions from recommendations
    Object.values(recommendations).forEach((sectionRecs) => {
      if (Array.isArray(sectionRecs)) {
        sectionRecs.forEach((rec) => {
          if (rec.deductionAmount) {
            totalDeduction += rec.deductionAmount;
          }
        });
      }
    });

    // Calculate tax savings based on regime
    if (taxRegime === 'old') {
      // Old regime: Calculate based on tax slabs
      const taxRate = this.getTaxRate(taxableIncome);
      totalSavings = totalDeduction * (taxRate / 100);
    } else {
      // New regime: No deductions, but we still calculate for comparison
      totalSavings = 0;
    }

    return {
      totalDeduction,
      totalSavings,
      effectiveTaxRate: this.getTaxRate(taxableIncome),
      regime: taxRegime,
    };
  }

  /**
   * Generate Section 80C investment recommendations
   */
  generateSection80CRecommendations(remainingCapacity, riskProfile, availableAmount, userProfile) {
    const recommendations = [];
    const capacity = Math.min(remainingCapacity, this.section80CLimit);

    if (capacity <= 0) {
      return recommendations;
    }

    // ELSS (Equity Linked Savings Scheme) - High risk, high returns
    if (riskProfile === 'high' || riskProfile === 'moderate') {
      const elssAmount = Math.min(capacity, availableAmount || capacity, 50000);
      if (elssAmount > 0) {
        recommendations.push({
          type: 'ELSS',
          category: 'equity',
          investmentAmount: elssAmount,
          deductionAmount: elssAmount,
          lockInPeriod: 3, // years
          expectedReturns: 12, // percentage
          risk: 'high',
          description: 'ELSS Mutual Funds - Tax-saving equity funds with 3-year lock-in',
          benefits: ['Tax deduction under 80C', 'Potential for high returns', 'Diversified equity exposure'],
        });
      }
    }

    // PPF (Public Provident Fund) - Low risk, moderate returns
    if (riskProfile === 'low' || riskProfile === 'moderate') {
      const ppfAmount = Math.min(capacity - (recommendations.reduce((sum, r) => sum + r.investmentAmount, 0)), 150000);
      if (ppfAmount > 0) {
        recommendations.push({
          type: 'PPF',
          category: 'debt',
          investmentAmount: ppfAmount,
          deductionAmount: ppfAmount,
          lockInPeriod: 15, // years
          expectedReturns: 7.1, // percentage
          risk: 'low',
          description: 'Public Provident Fund - Government-backed savings scheme',
          benefits: ['Tax deduction under 80C', 'Tax-free returns', 'Government guarantee'],
        });
      }
    }

    // Tax-saving Fixed Deposit - Low risk, low returns
    if (riskProfile === 'low') {
      const fdAmount = Math.min(
        capacity - recommendations.reduce((sum, r) => sum + r.investmentAmount, 0),
        150000
      );
      if (fdAmount > 0) {
        recommendations.push({
          type: 'Tax Saving FD',
          category: 'debt',
          investmentAmount: fdAmount,
          deductionAmount: fdAmount,
          lockInPeriod: 5, // years
          expectedReturns: 6.5, // percentage
          risk: 'low',
          description: 'Tax-saving Fixed Deposit - Bank fixed deposit with 5-year lock-in',
          benefits: ['Tax deduction under 80C', 'Capital protection', 'Fixed returns'],
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate Section 80D health insurance recommendations
   */
  generateSection80DRecommendations(remainingCapacity, userProfile) {
    const recommendations = [];
    const age = userProfile.age || 30;
    const hasParents = userProfile.hasParents || false;
    const parentsAge = userProfile.parentsAge || 60;

    // Self health insurance
    if (remainingCapacity.self > 0) {
      const selfAmount = Math.min(remainingCapacity.self, this.section80DLimits.self);
      recommendations.push({
        type: 'Health Insurance - Self',
        category: 'insurance',
        investmentAmount: selfAmount,
        deductionAmount: selfAmount,
        lockInPeriod: 1, // year
        expectedReturns: 0, // Insurance doesn't provide returns
        risk: 'low',
        description: `Health Insurance Premium for self (up to ₹${this.section80DLimits.self.toLocaleString('en-IN')})`,
        benefits: ['Tax deduction under 80D', 'Health coverage', 'Cashless treatment'],
      });
    }

    // Parents health insurance (if applicable)
    if (hasParents && remainingCapacity.parents > 0) {
      const parentsAmount = parentsAge >= 60
        ? Math.min(remainingCapacity.parents, this.section80DLimits.parents)
        : Math.min(remainingCapacity.parents, this.section80DLimits.self);

      if (parentsAmount > 0) {
        recommendations.push({
          type: 'Health Insurance - Parents',
          category: 'insurance',
          investmentAmount: parentsAmount,
          deductionAmount: parentsAmount,
          lockInPeriod: 1,
          expectedReturns: 0,
          risk: 'low',
          description: `Health Insurance Premium for parents (up to ₹${(parentsAge >= 60 ? this.section80DLimits.parents : this.section80DLimits.self).toLocaleString('en-IN')})`,
          benefits: ['Tax deduction under 80D', 'Health coverage for parents', 'Higher limit for senior citizens'],
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate NPS recommendations
   */
  generateNPSRecommendations(remainingCapacity, availableAmount, userProfile) {
    const recommendations = [];
    const npsCapacity = Math.min(remainingCapacity, this.npsAdditionalLimit);

    if (npsCapacity <= 0) {
      return recommendations;
    }

    const npsAmount = Math.min(npsCapacity, availableAmount || npsCapacity, 50000);
    if (npsAmount > 0) {
      recommendations.push({
        type: 'NPS - Tier 1',
        category: 'pension',
        investmentAmount: npsAmount,
        deductionAmount: npsAmount,
        lockInPeriod: 60, // years (until retirement)
        expectedReturns: 9, // percentage
        risk: 'moderate',
        description: 'National Pension System - Additional deduction under Section 80CCD(1B)',
        benefits: [
          'Additional ₹50,000 deduction (over and above 80C)',
          'Tax-free withdrawal up to 60% at retirement',
          'Pension income in retirement',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Calculate remaining deduction capacity
   */
  calculateRemainingCapacity(currentDeductions, userProfile) {
    const section80CUsed = currentDeductions.section80C || 0;
    const section80DUsed = {
      self: currentDeductions.section80DSelf || 0,
      parents: currentDeductions.section80DParents || 0,
    };
    const npsUsed = currentDeductions.nps || 0;

    return {
      section80C: Math.max(0, this.section80CLimit - section80CUsed),
      section80D: {
        self: Math.max(0, this.section80DLimits.self - section80DUsed.self),
        parents: Math.max(0, this.section80DLimits.parents - section80DUsed.parents),
      },
      nps: Math.max(0, this.npsAdditionalLimit - npsUsed),
    };
  }

  /**
   * Get user financial profile
   */
  async getUserFinancialProfile(userId) {
    try {
      // Try to get from financial profile table if it exists
      const profileQuery = `
        SELECT 
          json_payload->'taxableIncome' as taxable_income,
          json_payload->'taxRegime' as tax_regime,
          json_payload->'age' as age,
          json_payload->'hasParents' as has_parents,
          json_payload->'parentsAge' as parents_age
        FROM financial_profiles
        WHERE user_id = $1
        LIMIT 1
      `;

      const result = await dbQuery(profileQuery, [userId]);
      
      if (result.rows.length > 0) {
        return {
          taxableIncome: result.rows[0].taxable_income || 0,
          taxRegime: result.rows[0].tax_regime || 'old',
          age: result.rows[0].age || 30,
          hasParents: result.rows[0].has_parents || false,
          parentsAge: result.rows[0].parents_age || 60,
        };
      }

      // Return default profile if not found
      return {
        taxableIncome: 0,
        taxRegime: 'old',
        age: 30,
        hasParents: false,
        parentsAge: 60,
      };
    } catch (error) {
      enterpriseLogger.error('Get user financial profile failed', {
        error: error.message,
        userId,
      });
      // Return default profile on error
      return {
        taxableIncome: 0,
        taxRegime: 'old',
        age: 30,
        hasParents: false,
        parentsAge: 60,
      };
    }
  }

  /**
   * Get tax rate based on taxable income (old regime)
   */
  getTaxRate(taxableIncome) {
    if (taxableIncome <= 250000) return 0;
    if (taxableIncome <= 500000) return 5;
    if (taxableIncome <= 1000000) return 20;
    return 30;
  }

  /**
   * Prioritize recommendations based on tax savings and available amount
   */
  prioritizeRecommendations(recommendations, taxSavings, availableAmount) {
    const allRecs = [];
    
    // Flatten all recommendations
    Object.values(recommendations).forEach((sectionRecs) => {
      if (Array.isArray(sectionRecs)) {
        allRecs.push(...sectionRecs);
      }
    });

    // Sort by tax savings potential (deduction amount * tax rate)
    allRecs.sort((a, b) => {
      const aValue = (a.deductionAmount || 0) * (taxSavings.effectiveTaxRate / 100);
      const bValue = (b.deductionAmount || 0) * (taxSavings.effectiveTaxRate / 100);
      return bValue - aValue;
    });

    // Filter by available amount if provided
    if (availableAmount) {
      let total = 0;
      return allRecs.filter((rec) => {
        if (total + rec.investmentAmount <= availableAmount) {
          total += rec.investmentAmount;
          return true;
        }
        return false;
      });
    }

    return allRecs;
  }

  /**
   * Calculate NPS benefits
   * @param {number} contribution - NPS contribution amount
   * @param {number} years - Number of years until retirement
   * @param {number} expectedReturns - Expected annual returns (percentage)
   * @returns {object} NPS benefits calculation
   */
  calculateNPSBenefits(contribution, years = 30, expectedReturns = 9) {
    // Calculate corpus at retirement
    const monthlyContribution = contribution / 12;
    const monthlyRate = expectedReturns / 12 / 100;
    const months = years * 12;

    // Future value of annuity formula
    const corpus = monthlyContribution * 
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

    // 60% can be withdrawn tax-free
    const taxFreeWithdrawal = corpus * 0.6;
    // 40% must be used to buy annuity
    const annuityAmount = corpus * 0.4;
    // Annuity provides monthly pension (assuming 6% annuity rate)
    const monthlyPension = (annuityAmount * 0.06) / 12;

    return {
      totalCorpus: corpus,
      taxFreeWithdrawal,
      annuityAmount,
      monthlyPension,
      years,
      expectedReturns,
    };
  }
}

module.exports = new InvestmentPlanningService();

