// =====================================================
// TAX SAVINGS RECOMMENDATIONS ENGINE
// AI-powered tax optimization suggestions
// Critical feature for competitive advantage with ClearTax/ComputeTax
// =====================================================

import { apiClient } from './core/APIClient';

class TaxSavingsService {
  constructor() {
    this.apiEndpoint = '/api/tax/savings/recommend';
    this.recommendationEngine = new TaxRecommendationEngine();
    this.deductionRules = this.initializeDeductionRules();
    this.investmentOptions = this.initializeInvestmentOptions();
  }

  /**
   * Initialize tax deduction rules for FY 2024-25
   */
  initializeDeductionRules() {
    return {
      section80C: {
        limit: 150000,
        description: 'Section 80C - Investment & Expenses',
        categories: {
          equityLinked: {
            elss: { max: 150000, lockIn: 3, risk: 'high', returns: 12, description: 'ELSS Mutual Funds' },
            nps: { max: 50000, lockIn: 60, risk: 'medium', returns: 9, description: 'National Pension System (Tier-1)' }
          },
          traditional: {
            ppf: { max: 150000, lockIn: 15, risk: 'low', returns: 7.1, description: 'Public Provident Fund' },
            epf: { max: 150000, lockIn: 58, risk: 'low', returns: 8.5, description: 'Employees Provident Fund' },
            fixedDeposit: { max: 150000, lockIn: 5, risk: 'low', returns: 6.5, description: 'Tax Saving Fixed Deposit' },
            nsf: { max: 150000, lockIn: 5, risk: 'low', returns: 7, description: 'National Savings Certificate' }
          },
          insurance: {
            lifeInsurance: { max: 150000, lockIn: 2, risk: 'low', returns: 5, description: 'Life Insurance Premium' },
            ulip: { max: 150000, lockIn: 5, risk: 'medium', returns: 8, description: 'ULIP Plans' }
          },
          housing: {
            homeLoanPrincipal: { max: 150000, lockIn: 0, risk: 'low', returns: 8.5, description: 'Home Loan Principal Repayment' },
            stampDuty: { max: 150000, lockIn: 0, risk: 'low', returns: 100, description: 'Stamp Duty & Registration' }
          },
          education: {
            tuitionFees: { max: 150000, lockIn: 0, risk: 'low', returns: 100, description: 'Children Tuition Fees' },
            educationLoan: { max: 150000, lockIn: 8, risk: 'low', returns: 9, description: 'Education Loan Interest (80E)' }
          }
        }
      },

      section80D: {
        limit: {
          self: 25000,
          parents: 50000,
          total: 75000
        },
        description: 'Section 80D - Health Insurance',
        categories: {
          healthInsurance: { max: 25000, lockIn: 1, risk: 'low', returns: 100, description: 'Health Insurance Premium' },
          seniorCitizenHealthInsurance: { max: 50000, lockIn: 1, risk: 'low', returns: 100, description: 'Senior Citizen Health Insurance' },
          preventiveHealth: { max: 5000, lockIn: 0, risk: 'low', returns: 100, description: 'Preventive Health Check-up' }
        }
      },

      section80E: {
        limit: 150000,
        description: 'Section 80E - Education Loan Interest',
        duration: 8, // 8 years max
        categories: {
          educationLoanInterest: { max: 150000, lockIn: 0, risk: 'low', returns: 9, description: 'Education Loan Interest' }
        }
      },

      section80EE: {
        limit: 50000,
        description: 'Section 80EE - First-Time Home Buyer',
        conditions: {
          loanAmount: '≤ 35 Lakhs',
          propertyValue: '≤ 50 Lakhs',
          firstHome: true
        },
        categories: {
          homeLoanInterest: { max: 50000, lockIn: 0, risk: 'low', returns: 8.5, description: 'Home Loan Interest (Additional)' }
        }
      },

      section80TTA: {
        limit: 10000,
        description: 'Section 80TTA - Savings Account Interest',
        categories: {
          savingsInterest: { max: 10000, lockIn: 0, risk: 'low', returns: 100, description: 'Savings Account Interest' }
        }
      },

      section24: {
        limit: {
          selfOccupied: 200000,
          letOut: 'Actual Interest'
        },
        description: 'Section 24 - Home Loan Interest',
        categories: {
          homeLoanInterestSelfOccupied: { max: 200000, lockIn: 0, risk: 'low', returns: 8.5, description: 'Home Loan Interest (Self-Occupied)' },
          homeLoanInterestLetOut: { max: Infinity, lockIn: 0, risk: 'low', returns: 8.5, description: 'Home Loan Interest (Let Out)' }
        }
      }
    };
  }

  /**
   * Initialize investment options with detailed information
   */
  initializeInvestmentOptions() {
    return {
      aggressive: [
        {
          name: 'ELSS Mutual Funds',
          category: 'equityLinked',
          section: '80C',
          minInvestment: 500,
          maxInvestment: 150000,
          lockInPeriod: 3,
          expectedReturn: 12,
          riskLevel: 'high',
          liquidity: 'Medium',
          taxBenefit: 'Full 150K under 80C',
          description: 'Equity-linked saving scheme with potential for high returns'
        },
        {
          name: 'ULIP Plans',
          category: 'insurance',
          section: '80C',
          minInvestment: 10000,
          maxInvestment: 150000,
          lockInPeriod: 5,
          expectedReturn: 8,
          riskLevel: 'medium',
          liquidity: 'Low',
          taxBenefit: 'Full 150K under 80C',
          description: 'Unit Linked Insurance Plan with insurance + investment'
        }
      ],
      balanced: [
        {
          name: 'National Pension System (NPS)',
          category: 'equityLinked',
          section: '80CCD(1B)',
          minInvestment: 1000,
          maxInvestment: 50000,
          lockInPeriod: 60,
          expectedReturn: 9,
          riskLevel: 'medium',
          liquidity: 'Very Low',
          taxBenefit: 'Additional 50K over 80C',
          description: 'Retirement-focused investment with government backing'
        },
        {
          name: 'Public Provident Fund (PPF)',
          category: 'traditional',
          section: '80C',
          minInvestment: 500,
          maxInvestment: 150000,
          lockInPeriod: 15,
          expectedReturn: 7.1,
          riskLevel: 'low',
          liquidity: 'Very Low',
          taxBenefit: 'Full 150K under 80C',
          description: 'Government-backed savings scheme'
        }
      ],
      conservative: [
        {
          name: 'Tax Saving Fixed Deposit',
          category: 'traditional',
          section: '80C',
          minInvestment: 10000,
          maxInvestment: 150000,
          lockInPeriod: 5,
          expectedReturn: 6.5,
          riskLevel: 'low',
          liquidity: 'Low',
          taxBenefit: 'Full 150K under 80C',
          description: 'Bank fixed deposit with tax benefits'
        },
        {
          name: 'National Savings Certificate (NSC)',
          category: 'traditional',
          section: '80C',
          minInvestment: 1000,
          maxInvestment: 150000,
          lockInPeriod: 5,
          expectedReturn: 7,
          riskLevel: 'low',
          liquidity: 'Low',
          taxBenefit: 'Full 150K under 80C',
          description: 'Post office savings scheme'
        }
      ]
    };
  }

  /**
   * Generate personalized tax savings recommendations
   */
  async generateRecommendations(userProfile, currentInvestments = {}) {
    try {
      const requestData = {
        userProfile,
        currentInvestments,
        financialYear: '2024-25'
      };

      const response = await apiClient.post(this.apiEndpoint, requestData);

      if (!response.success) {
        throw new Error(`Failed to generate recommendations: ${response.message}`);
      }

      // Process and enhance recommendations
      const enhancedRecommendations = this.enhanceRecommendations(
        response.recommendations,
        userProfile,
        currentInvestments
      );

      return {
        success: true,
        recommendations: enhancedRecommendations,
        summary: this.generateRecommendationSummary(enhancedRecommendations),
        taxSavings: this.calculatePotentialTaxSavings(enhancedRecommendations),
        deadline: this.calculateInvestmentDeadline()
      };

    } catch (error) {
      console.error('Tax recommendations error:', error);
      // Fallback to client-side recommendations
      return this.generateClientSideRecommendations(userProfile, currentInvestments);
    }
  }

  /**
   * Generate client-side recommendations as fallback
   */
  async generateClientSideRecommendations(userProfile, currentInvestments = {}) {
    const recommendations = this.recommendationEngine.generateRecommendations(
      userProfile,
      currentInvestments
    );

    return {
      success: true,
      recommendations,
      summary: this.generateRecommendationSummary(recommendations),
      taxSavings: this.calculatePotentialTaxSavings(recommendations),
      deadline: this.calculateInvestmentDeadline(),
      disclaimer: 'Using AI-powered recommendations engine'
    };
  }

  /**
   * Enhance recommendations with additional insights
   */
  enhanceRecommendations(recommendations, userProfile, currentInvestments) {
    return recommendations.map(rec => ({
      ...rec,
      urgency: this.calculateUrgency(rec, userProfile),
      suitability: this.calculateSuitability(rec, userProfile),
      alternatives: this.findAlternatives(rec),
      implementation: this.generateImplementationSteps(rec),
      risk: this.assessRisk(rec, userProfile),
      expectedSavings: this.calculateExpectedSavings(rec)
    }));
  }

  /**
   * Calculate urgency level for recommendation
   */
  calculateUrgency(recommendation, userProfile) {
    const urgencyFactors = {
      timeLeft: this.getTimeUntilYearEnd(),
      age: userProfile.age || 30,
      riskProfile: userProfile.riskProfile || 'moderate',
      currentDeductions: this.getCurrentDeductions(userProfile.currentInvestments || {})
    };

    let urgencyScore = 0;

    // Time urgency (higher urgency as year end approaches)
    if (urgencyFactors.timeLeft < 30) urgencyScore += 30;
    else if (urgencyFactors.timeLeft < 90) urgencyScore += 20;
    else if (urgencyFactors.timeLeft < 180) urgencyScore += 10;

    // Age-based urgency
    if (urgencyFactors.age > 40) urgencyScore += 15;
    else if (urgencyFactors.age > 30) urgencyScore += 10;

    // Current deduction utilization
    const utilizationRate = urgencyFactors.currentDeductions / 150000;
    if (utilizationRate < 0.5) urgencyScore += 25;
    else if (utilizationRate < 0.8) urgencyScore += 15;

    if (urgencyScore >= 60) return 'high';
    if (urgencyScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Calculate suitability score for recommendation
   */
  calculateSuitability(recommendation, userProfile) {
    const suitabilityFactors = {
      age: userProfile.age || 30,
      riskProfile: userProfile.riskProfile || 'moderate',
      income: userProfile.annualIncome || 500000,
      financialGoals: userProfile.financialGoals || [],
      existingInvestments: userProfile.currentInvestments || {}
    };

    let suitabilityScore = 50; // Base score

    // Risk profile matching
    if (recommendation.riskLevel === suitabilityFactors.riskProfile) {
      suitabilityScore += 20;
    } else if (
      (recommendation.riskLevel === 'medium' && suitabilityFactors.riskProfile === 'moderate') ||
      (recommendation.riskLevel === 'high' && suitabilityFactors.riskProfile === 'aggressive') ||
      (recommendation.riskLevel === 'low' && suitabilityFactors.riskProfile === 'conservative')
    ) {
      suitabilityScore += 10;
    }

    // Age-based suitability
    if (recommendation.lockInPeriod > 0) {
      const agePlusLockIn = suitabilityFactors.age + recommendation.lockInPeriod;
      if (agePlusLockIn < 60) suitabilityScore += 15;
      else if (agePlusLockIn < 65) suitabilityScore += 5;
      else suitabilityScore -= 10;
    }

    // Income-based suitability
    const investmentRatio = recommendation.minInvestment / suitabilityFactors.income;
    if (investmentRatio < 0.1) suitabilityScore += 15;
    else if (investmentRatio < 0.2) suitabilityScore += 10;
    else if (investmentRatio < 0.3) suitabilityScore += 5;

    // Financial goals alignment
    if (recommendation.category === 'retirement' &&
        suitabilityFactors.financialGoals.some(goal => goal.toLowerCase().includes('retirement'))) {
      suitabilityScore += 20;
    }

    return Math.min(100, Math.max(0, suitabilityScore));
  }

  /**
   * Find alternative investment options
   */
  findAlternatives(recommendation) {
    const alternatives = [];

    Object.values(this.investmentOptions).forEach(riskCategory => {
      riskCategory.forEach(option => {
        if (
          option.name !== recommendation.name &&
          option.section === recommendation.section &&
          Math.abs(option.expectedReturn - recommendation.expectedReturn) <= 2
        ) {
          alternatives.push({
            name: option.name,
            returns: option.expectedReturn,
            risk: option.riskLevel,
            lockIn: option.lockInPeriod
          });
        }
      });
    });

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  /**
   * Generate implementation steps
   */
  generateImplementationSteps(recommendation) {
    const commonSteps = [
      'Complete KYC verification if required',
      'Set up investment account',
      'Arrange funds for investment'
    ];

    const specificSteps = {
      'ELSS Mutual Funds': [
        'Choose a mutual fund house (HDFC, ICICI, SBI, etc.)',
        'Select ELSS fund based on performance',
        'Complete online investment process',
        'Set up SIP or lumpsum investment'
      ],
      'National Pension System': [
        'Open NPS account with CRA',
        'Choose asset allocation (Equity/Corporate/Govt)',
        'Select pension fund manager',
        'Make contribution online'
      ],
      'Public Provident Fund': [
        'Visit bank or post office branch',
        'Fill PPF account opening form',
        'Submit KYC documents',
        'Make initial deposit'
      ],
      'Health Insurance': [
        'Compare insurance providers',
        'Check coverage and premiums',
        'Complete health check-up if required',
        'Pay first-year premium'
      ]
    };

    return commonSteps.concat(specificSteps[recommendation.name] || ['Complete investment process']);
  }

  /**
   * Assess investment risk
   */
  assessRisk(recommendation, userProfile) {
    const riskFactors = {
      investmentRisk: recommendation.riskLevel,
      marketRisk: recommendation.category === 'equityLinked' ? 'high' : 'low',
      liquidityRisk: recommendation.lockInPeriod > 5 ? 'high' : 'medium',
      inflationRisk: recommendation.expectedReturn < 7 ? 'high' : 'low',
      concentrationRisk: 'low'
    };

    const userRiskProfile = userProfile.riskProfile || 'moderate';

    const riskAssessment = {
      overallRisk: this.calculateOverallRisk(riskFactors),
      factors: riskFactors,
      userAlignment: this.assessRiskAlignment(riskFactors, userRiskProfile),
      recommendations: this.generateRiskRecommendations(riskFactors, userRiskProfile)
    };

    return riskAssessment;
  }

  /**
   * Calculate expected tax savings
   */
  calculateExpectedSavings(recommendation) {
    const taxSlabs = this.getCurrentTaxSlabs();
    const investmentAmount = Math.min(recommendation.maxInvestment, recommendation.suggestedAmount || 50000);

    let taxSaving = 0;

    // Calculate tax saved based on tax bracket
    if (investmentAmount <= taxSlabs.max80CBracket) {
      taxSaving = investmentAmount * taxSlabs.marginalRate;
    } else {
      taxSaving = (taxSlabs.max80CBracket * taxSlabs.marginalRate) +
                 ((investmentAmount - taxSlabs.max80CBracket) * taxSlabs.higherRate);
    }

    return {
      investmentAmount,
      taxSaved: taxSaving,
      effectiveRate: (taxSaving / investmentAmount) * 100,
      postTaxReturn: recommendation.expectedReturn - ((taxSaving / investmentAmount) * 100),
      timeToBreakEven: recommendation.lockInPeriod || 0
    };
  }

  /**
   * Generate recommendation summary
   */
  generateRecommendationSummary(recommendations) {
    const summary = {
      totalRecommendations: recommendations.length,
      potentialTaxSavings: 0,
      totalInvestmentSuggested: 0,
      riskDistribution: { high: 0, medium: 0, low: 0 },
      urgencyDistribution: { high: 0, medium: 0, low: 0 },
      sectionBreakdown: {}
    };

    recommendations.forEach(rec => {
      summary.potentialTaxSavings += rec.expectedSavings?.taxSaved || 0;
      summary.totalInvestmentSuggested += rec.suggestedAmount || 0;

      // Risk distribution
      if (rec.riskLevel) {
        summary.riskDistribution[rec.riskLevel]++;
      }

      // Urgency distribution
      if (rec.urgency) {
        summary.urgencyDistribution[rec.urgency]++;
      }

      // Section breakdown
      if (rec.section) {
        if (!summary.sectionBreakdown[rec.section]) {
          summary.sectionBreakdown[rec.section] = 0;
        }
        summary.sectionBreakdown[rec.section] += rec.suggestedAmount || 0;
      }
    });

    return summary;
  }

  /**
   * Calculate total potential tax savings
   */
  calculatePotentialTaxSavings(recommendations) {
    const totalSavings = {
      section80C: 0,
      section80D: 0,
      section80E: 0,
      other: 0,
      total: 0
    };

    recommendations.forEach(rec => {
      const savings = rec.expectedSavings?.taxSaved || 0;
      totalSavings.total += savings;

      switch (rec.section) {
        case '80C':
          totalSavings.section80C += savings;
          break;
        case '80D':
          totalSavings.section80D += savings;
          break;
        case '80E':
          totalSavings.section80E += savings;
          break;
        default:
          totalSavings.other += savings;
      }
    });

    return totalSavings;
  }

  /**
   * Calculate investment deadline
   */
  calculateInvestmentDeadline() {
    const today = new Date();
    const yearEnd = new Date(today.getFullYear(), 2, 31); // March 31st

    // If today is after March 31st, set deadline to next year
    if (today > yearEnd) {
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
    }

    const daysLeft = Math.ceil((yearEnd - today) / (1000 * 60 * 60 * 24));

    return {
      deadline: yearEnd.toISOString().split('T')[0],
      daysLeft,
      urgent: daysLeft < 90,
      message: this.generateDeadlineMessage(daysLeft)
    };
  }

  /**
   * Generate deadline message
   */
  generateDeadlineMessage(daysLeft) {
    if (daysLeft < 30) {
      return '🚨 URGENT: Less than a month left to invest for tax saving!';
    } else if (daysLeft < 90) {
      return '⏰ Time running out! Invest soon to save taxes for this year.';
    } else if (daysLeft < 180) {
      return '📅 Good time to plan your tax-saving investments.';
    } else {
      return '💡 Start planning your tax-saving investments early.';
    }
  }

  /**
   * Helper methods
   */
  getTimeUntilYearEnd() {
    const today = new Date();
    const yearEnd = new Date(today.getFullYear(), 2, 31); // March 31st
    if (today > yearEnd) {
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
    }
    return Math.ceil((yearEnd - today) / (1000 * 60 * 60 * 24));
  }

  getCurrentDeductions(currentInvestments) {
    return Object.values(currentInvestments).reduce((total, investment) => {
      return total + (investment.deductionAmount || 0);
    }, 0);
  }

  getCurrentTaxSlabs() {
    // FY 2024-25 tax slabs for calculation
    return {
      marginalRate: 0.3, // 30% for high income
      higherRate: 0.3,
      max80CBracket: 500000
    };
  }

  calculateOverallRisk(riskFactors) {
    const riskScores = {
      high: 3,
      medium: 2,
      low: 1
    };

    let totalScore = 0;
    let factorsCount = 0;

    Object.values(riskFactors).forEach(risk => {
      if (riskScores[risk]) {
        totalScore += riskScores[risk];
        factorsCount++;
      }
    });

    if (factorsCount === 0) return 'medium';

    const averageScore = totalScore / factorsCount;
    if (averageScore >= 2.5) return 'high';
    if (averageScore >= 1.5) return 'medium';
    return 'low';
  }

  assessRiskAlignment(riskFactors, userRiskProfile) {
    const riskLevels = ['low', 'medium', 'high'];
    const userRiskIndex = riskLevels.indexOf(userRiskProfile);

    let alignmentScore = 0;
    let factorCount = 0;

    Object.values(riskFactors).forEach(risk => {
      if (riskLevels.includes(risk)) {
        const riskIndex = riskLevels.indexOf(risk);
        alignmentScore += Math.abs(userRiskIndex - riskIndex);
        factorCount++;
      }
    });

    const averageAlignment = alignmentScore / factorCount;

    if (averageAlignment <= 0.5) return 'excellent';
    if (averageAlignment <= 1) return 'good';
    if (averageAlignment <= 1.5) return 'moderate';
    return 'poor';
  }

  generateRiskRecommendations(riskFactors, userRiskProfile) {
    const recommendations = [];

    if (riskFactors.investmentRisk === 'high' && userRiskProfile !== 'aggressive') {
      recommendations.push('Consider diversifying with lower-risk options');
    }

    if (riskFactors.liquidityRisk === 'high') {
      recommendations.push('Keep some funds liquid for emergencies');
    }

    if (riskFactors.marketRisk === 'high') {
      recommendations.push('Monitor market conditions regularly');
    }

    return recommendations;
  }
}

/**
 * Tax Recommendation Engine (AI-powered logic)
 */
class TaxRecommendationEngine {
  generateRecommendations(userProfile, currentInvestments = {}) {
    const recommendations = [];
    const income = userProfile.annualIncome || 500000;
    const age = userProfile.age || 30;
    const riskProfile = userProfile.riskProfile || 'moderate';

    // Analyze current deduction utilization
    const current80CDeduction = this.getCurrentDeductionAmount(currentInvestments, '80C');
    const remaining80C = Math.max(0, 150000 - current80CDeduction);

    // Generate 80C recommendations
    if (remaining80C > 0) {
      recommendations.push(...this.generate80CRecommendations(remaining80C, income, age, riskProfile));
    }

    // Generate 80D recommendations
    if (!currentInvestments.healthInsurance) {
      recommendations.push(this.generate80DRecommendation(age, userProfile.dependents || []));
    }

    // Generate home loan recommendations
    if (userProfile.hasHomeLoan && !currentInvestments.section24Deduction) {
      recommendations.push(this.generateSection24Recommendation());
    }

    // Generate NPS additional recommendation
    if (age < 60 && (!currentInvestments.nps || currentInvestments.nps < 50000)) {
      recommendations.push(this.generateNPSRecommendation(income, age));
    }

    return recommendations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  generate80CRecommendations(remainingAmount, income, age, riskProfile) {
    const recommendations = [];

    // ELSS recommendation for higher income
    if (income > 800000 && riskProfile !== 'conservative') {
      recommendations.push({
        name: 'ELSS Mutual Funds',
        section: '80C',
        category: 'investment',
        suggestedAmount: Math.min(remainingAmount, 50000),
        maxInvestment: 150000,
        riskLevel: 'high',
        expectedReturn: 12,
        priority: 9,
        description: 'High-return investment with 3-year lock-in',
        pros: ['High returns', 'Tax-free dividends', '3-year lock-in only'],
        cons: ['Market risk', 'NAV fluctuation']
      });
    }

    // PPF recommendation for conservative investors
    if (riskProfile === 'conservative' || age > 40) {
      recommendations.push({
        name: 'Public Provident Fund (PPF)',
        section: '80C',
        category: 'investment',
        suggestedAmount: Math.min(remainingAmount, 50000),
        maxInvestment: 150000,
        riskLevel: 'low',
        expectedReturn: 7.1,
        priority: 8,
        description: 'Government-backed guaranteed returns',
        pros: ['Guaranteed returns', 'Tax-free', 'Government backing'],
        cons: ['15-year lock-in', 'Lower returns than equity']
      });
    }

    // NPS recommendation for retirement planning
    if (age < 45) {
      recommendations.push({
        name: 'National Pension System (NPS)',
        section: '80CCD(1B)',
        category: 'retirement',
        suggestedAmount: Math.min(remainingAmount, 50000),
        maxInvestment: 50000,
        riskLevel: 'medium',
        expectedReturn: 9,
        priority: 7,
        description: 'Retirement planning with additional tax benefits',
        pros: ['Additional 50K over 80C', 'Retirement benefits', 'Flexible allocation'],
        cons: ['60-year lock-in', 'Partial withdrawal restrictions']
      });
    }

    return recommendations;
  }

  generate80DRecommendation(age, dependents) {
    const hasSeniorCitizens = dependents.some(dep => dep.age >= 60) || age >= 60;
    const limit = hasSeniorCitizens ? 50000 : 25000;

    return {
      name: 'Health Insurance',
      section: '80D',
      category: 'insurance',
      suggestedAmount: limit,
      maxInvestment: limit,
      riskLevel: 'low',
      expectedReturn: 100,
      priority: 8,
      description: 'Health insurance premium deduction',
      pros: ['Health coverage', 'Tax deduction', 'Family protection'],
      cons: ['Annual premium payment', 'Coverage limitations']
    };
  }

  generateSection24Recommendation() {
    return {
      name: 'Home Loan Interest',
      section: '24',
      category: 'housing',
      suggestedAmount: 200000,
      maxInvestment: 200000,
      riskLevel: 'low',
      expectedReturn: 8.5,
      priority: 6,
      description: 'Interest deduction on home loan',
      pros: ['Large deduction', 'Asset creation', 'Tax benefits'],
      cons: ['Requires home loan', 'Interest payment']
    };
  }

  generateNPSRecommendation(income, age) {
    return {
      name: 'Additional NPS Investment',
      section: '80CCD(1B)',
      category: 'retirement',
      suggestedAmount: 50000,
      maxInvestment: 50000,
      riskLevel: 'medium',
      expectedReturn: 9,
      priority: 7,
      description: 'Additional tax-saving over 80C limit',
      pros: ['Additional 50K deduction', 'Retirement corpus', 'Tax benefits'],
      cons: ['Long lock-in', 'Market exposure']
    };
  }

  getCurrentDeductionAmount(currentInvestments, section) {
    if (!currentInvestments) return 0;

    return Object.values(currentInvestments)
      .filter(inv => inv.section === section)
      .reduce((total, inv) => total + (inv.amount || 0), 0);
  }
}

export const taxSavingsService = new TaxSavingsService();
export default taxSavingsService;