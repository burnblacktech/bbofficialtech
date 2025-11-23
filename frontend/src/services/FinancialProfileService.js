// =====================================================
// FINANCIAL PROFILE SERVICE - YEAR-ROUND TAX PLANNING
// Maintains comprehensive financial profile for continuous optimization
// =====================================================

import { apiClient } from './core/APIClient';
import { taxSavingsService } from './taxSavingsService';
import { dataIntegrationService } from './DataIntegrationService';

class FinancialProfileService {
  constructor() {
    this.profileCategories = {
      PERSONAL_INFO: 'personal_info',
      EMPLOYMENT_INFO: 'employment_info',
      INCOME_PROFILE: 'income_profile',
      INVESTMENT_PROFILE: 'investment_profile',
      DEDUCTION_PROFILE: 'deduction_profile',
      TAX_HISTORY: 'tax_history',
      FINANCIAL_GOALS: 'financial_goals',
      RISK_PROFILE: 'risk_profile'
    };

    this.incomeTypes = {
      SALARY: 'salary',
      BUSINESS: 'business',
      PROFESSIONAL: 'professional',
      CAPITAL_GAINS: 'capital_gains',
      INTEREST: 'interest',
      DIVIDEND: 'dividend',
      RENTAL: 'rental',
      OTHER: 'other'
    };

    this.investmentTypes = {
      EQUITY: 'equity',
      DEBT: 'debt',
      MUTUAL_FUNDS: 'mutual_funds',
      REAL_ESTATE: 'real_estate',
      GOLD: 'gold',
      FIXED_DEPOSITS: 'fixed_deposits',
      PPF: 'ppf',
      EPF: 'epf',
      NPS: 'nps'
    };
  }

  /**
   * Create or update comprehensive financial profile
   */
  async createFinancialProfile(userId, profileData) {
    try {
      console.log('📊 Creating comprehensive financial profile...');

      const profile = {
        userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assessmentYear: '2024-25',

        // Personal Information
        personalInfo: {
          fullName: profileData.fullName,
          pan: profileData.pan,
          aadhaar: profileData.aadhaar,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          maritalStatus: profileData.maritalStatus,
          residentialStatus: profileData.residentialStatus,
          address: profileData.address,
          contact: {
            email: profileData.email,
            phone: profileData.phone
          }
        },

        // Employment Information
        employmentInfo: {
          currentEmployer: profileData.currentEmployer,
          employmentType: profileData.employmentType, // salaried, business, professional
          employmentStatus: profileData.employmentStatus,
          workLocation: profileData.workLocation,
          hasForm16: profileData.hasForm16,
          additionalEmployers: profileData.additionalEmployers || []
        },

        // Income Profile
        incomeProfile: {
          currentYearEstimate: profileData.incomeEstimate || {},
          previousYearsIncome: profileData.previousYearsIncome || [],
          incomeStreams: this.analyzeIncomeStreams(profileData),
          projectedIncome: this.projectIncomeGrowth(profileData)
        },

        // Investment Profile
        investmentProfile: {
          currentPortfolio: profileData.investments || {},
          investmentGoals: profileData.investmentGoals || [],
          riskTolerance: profileData.riskTolerance || 'moderate',
          investmentHorizon: profileData.investmentHorizon || 'medium',
          monthlyInvestmentCapacity: profileData.monthlyInvestmentCapacity || 0
        },

        // Deduction Profile
        deductionProfile: {
          availableDeductions: await this.analyzeAvailableDeductions(profileData),
          claimedDeductions: profileData.claimedDeductions || {},
          optimizationOpportunities: []
        },

        // Tax History
        taxHistory: {
          previousReturns: profileData.previousReturns || [],
          filingHistory: this.analyzeFilingHistory(profileData.previousReturns || []),
          complianceStatus: 'compliant',
          outstandingTaxes: 0,
          refundsPending: 0
        },

        // Financial Goals
        financialGoals: {
          shortTerm: profileData.shortTermGoals || [],
          mediumTerm: profileData.mediumTermGoals || [],
          longTerm: profileData.longTermGoals || [],
          taxOptimizationGoals: this.generateTaxOptimizationGoals(profileData)
        },

        // Risk Profile
        riskProfile: {
          investmentRisk: profileData.investmentRisk || 'moderate',
          taxRisk: profileData.taxRisk || 'conservative',
          liquidityNeeds: profileData.liquidityNeeds || 'medium',
          insuranceCoverage: profileData.insuranceCoverage || {}
        }
      };

      // Save profile to backend
      const response = await apiClient.post('/financial-profile/create', profile);

      if (response.success) {
        console.log('✅ Financial profile created successfully');
        await this.performInitialAnalysis(userId);
        return { success: true, profileId: response.data.profileId, profile };
      }

      return { success: false, error: 'Failed to create profile' };

    } catch (error) {
      console.error('❌ Error creating financial profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update financial profile with new data
   */
  async updateFinancialProfile(userId, updates) {
    try {
      console.log('📝 Updating financial profile...');

      const currentProfile = await this.getFinancialProfile(userId);
      if (!currentProfile.success) {
        return { success: false, error: 'Profile not found' };
      }

      const updatedProfile = {
        ...currentProfile.profile,
        lastUpdated: new Date().toISOString(),
        ...updates
      };

      // Re-analyze affected sections
      if (updates.incomeProfile) {
        updatedProfile.incomeProfile.projectedIncome = this.projectIncomeGrowth(updatedProfile);
        updatedProfile.incomeProfile.incomeStreams = this.analyzeIncomeStreams(updatedProfile);
      }

      if (updates.investmentProfile) {
        updatedProfile.deductionProfile.optimizationOpportunities =
          await this.analyzeInvestmentDeductions(updatedProfile);
      }

      if (updates.deductionProfile) {
        updatedProfile.deductionProfile.optimizationOpportunities =
          await this.identifyDeductionOpportunities(updatedProfile);
      }

      const response = await apiClient.put(`/financial-profile/${userId}`, updatedProfile);

      if (response.success) {
        console.log('✅ Financial profile updated successfully');
        return { success: true, profile: updatedProfile };
      }

      return { success: false, error: 'Failed to update profile' };

    } catch (error) {
      console.error('❌ Error updating financial profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get financial profile with analysis
   */
  async getFinancialProfile(userId) {
    try {
      const response = await apiClient.get(`/financial-profile/${userId}`);

      if (response.success) {
        const profile = response.data;

        // Add real-time analysis
        profile.analysis = await this.performRealTimeAnalysis(profile);
        profile.recommendations = await this.generatePersonalizedRecommendations(profile);

        return { success: true, profile };
      }

      return { success: false, error: 'Profile not found' };

    } catch (error) {
      console.error('❌ Error fetching financial profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Year-round tax planning engine
   */
  async generateTaxPlan(userId, planningHorizon = 12) {
    try {
      console.log('🎯 Generating comprehensive tax plan...');

      const profile = await this.getFinancialProfile(userId);
      if (!profile.success) {
        return { success: false, error: 'Profile not found' };
      }

      const currentIncome = profile.profile.incomeProfile.currentYearEstimate;
      const currentDeductions = profile.profile.deductionProfile.claimedDeductions;

      // Calculate projected tax liability
      const projectedTax = await this.calculateProjectedTax(currentIncome, currentDeductions);

      // Generate optimization opportunities
      const optimizationOpportunities = await this.identifyOptimizationOpportunities(
        profile.profile,
        projectedTax
      );

      // Create monthly action plan
      const monthlyActionPlan = this.createMonthlyActionPlan(
        optimizationOpportunities,
        planningHorizon
      );

      // Generate tax-saving recommendations
      const taxSavingRecommendations = await taxSavingsService.generateRecommendations(
        currentIncome,
        currentDeductions,
        profile.profile.riskProfile
      );

      const taxPlan = {
        userId,
        generatedAt: new Date().toISOString(),
        planningHorizon,
        assessmentYear: '2024-25',

        projectedLiability: projectedTax,
        currentLiability: projectedTax.total,
        potentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0),

        optimizationOpportunities,
        monthlyActionPlan,
        taxSavingRecommendations,

        keyMetrics: {
          effectiveTaxRate: (projectedTax.total / currentIncome.total) * 100,
          deductionUtilization: this.calculateDeductionUtilization(currentDeductions),
          optimizationPotential: this.calculateOptimizationPotential(optimizationOpportunities)
        }
      };

      // Save tax plan
      await apiClient.post('/financial-profile/tax-plan', taxPlan);

      console.log('✅ Tax plan generated successfully');
      return { success: true, taxPlan };

    } catch (error) {
      console.error('❌ Error generating tax plan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Real-time portfolio optimization
   */
  async optimizePortfolio(userId, constraints = {}) {
    try {
      console.log('📈 Optimizing investment portfolio...');

      const profile = await this.getFinancialProfile(userId);
      if (!profile.success) {
        return { success: false, error: 'Profile not found' };
      }

      const currentPortfolio = profile.profile.investmentProfile.currentPortfolio;
      const riskTolerance = profile.profile.riskProfile.investmentRisk;

      // Analyze current portfolio performance
      const portfolioAnalysis = await this.analyzePortfolioPerformance(currentPortfolio);

      // Identify optimization opportunities
      const optimizationOpportunities = this.identifyPortfolioOptimizations(
        portfolioAnalysis,
        riskTolerance,
        constraints
      );

      // Generate rebalancing recommendations
      const rebalancingRecommendations = this.generateRebalancingRecommendations(
        currentPortfolio,
        optimizationOpportunities,
        riskTolerance
      );

      // Calculate tax implications of rebalancing
      const taxImplications = await this.calculateRebalancingTaxImplications(
        currentPortfolio,
        rebalancingRecommendations
      );

      const optimizationPlan = {
        userId,
        generatedAt: new Date().toISOString(),
        currentAnalysis: portfolioAnalysis,
        optimizationOpportunities,
        rebalancingRecommendations,
        taxImplications,
        expectedBenefits: this.calculateOptimizationBenefits(
          portfolioAnalysis,
          rebalancingRecommendations
        ),
        implementationTimeline: this.createImplementationTimeline(rebalancingRecommendations)
      };

      console.log('✅ Portfolio optimization completed');
      return { success: true, optimizationPlan };

    } catch (error) {
      console.error('❌ Error optimizing portfolio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Tax-saving investment recommendations
   */
  async generateTaxSavingInvestments(userId, availableAmount = null) {
    try {
      console.log('💰 Generating tax-saving investment recommendations...');

      const profile = await this.getFinancialProfile(userId);
      if (!profile.success) {
        return { success: false, error: 'Profile not found' };
      }

      const currentDeductions = profile.profile.deductionProfile.claimedDeductions;
      const riskProfile = profile.profile.riskProfile;
      const investmentProfile = profile.profile.investmentProfile;

      // Calculate remaining deduction capacity
      const remainingCapacity = this.calculateRemainingDeductionCapacity(currentDeductions);

      // Generate recommendations by section
      const recommendations = {
        section80C: await this.generateSection80CRecommendations(
          remainingCapacity.section80C,
          riskProfile,
          investmentProfile
        ),
        section80D: await this.generateSection80DRecommendations(
          remainingCapacity.section80D,
          profile.profile.personalInfo
        ),
        section80E: await this.generateSection80ERecommendations(
          remainingCapacity.section80E,
          profile.profile.educationLoans || []
        ),
        housingDeductions: await this.generateHousingDeductions(
          remainingCapacity.housing,
          profile.profile.personalInfo.residentialStatus
        )
      };

      // Prioritize recommendations based on user profile
      const prioritizedRecommendations = this.prioritizeInvestmentRecommendations(
        recommendations,
        profile.profile,
        availableAmount
      );

      // Calculate expected tax savings
      const expectedSavings = this.calculateExpectedTaxSavings(prioritizedRecommendations);

      const investmentPlan = {
        userId,
        generatedAt: new Date().toISOString(),
        recommendations: prioritizedRecommendations,
        expectedTaxSavings,
        totalInvestmentRequired: prioritizedRecommendations.reduce(
          (sum, rec) => sum + rec.investmentAmount, 0
        ),
        implementationSchedule: this.createInvestmentSchedule(prioritizedRecommendations),
        riskAnalysis: this.analyzeInvestmentRisks(prioritizedRecommendations, riskProfile)
      };

      console.log('✅ Tax-saving investment recommendations generated');
      return { success: true, investmentPlan };

    } catch (error) {
      console.error('❌ Error generating tax-saving investments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Periodic portfolio review and rebalancing
   */
  async performPeriodicReview(userId) {
    try {
      console.log('🔍 Performing periodic portfolio review...');

      const profile = await this.getFinancialProfile(userId);
      if (!profile.success) {
        return { success: false, error: 'Profile not found' };
      }

      const reviewDate = new Date().toISOString();
      const lastReview = profile.profile.lastReview || profile.profile.createdAt;

      // Sync latest data
      const syncResults = await dataIntegrationService.syncAllFinancialData(userId);

      // Compare current vs target allocation
      const allocationAnalysis = this.analyzeAssetAllocation(
        profile.profile.investmentProfile.currentPortfolio
      );

      // Performance review
      const performanceReview = await this.reviewInvestmentPerformance(
        profile.profile.investmentProfile.currentPortfolio,
        lastReview
      );

      // Tax optimization review
      const taxOptimizationReview = await this.reviewTaxOptimization(
        profile.profile,
        syncResults
      );

      // Generate action items
      const actionItems = this.generateReviewActionItems({
        allocationAnalysis,
        performanceReview,
        taxOptimizationReview,
        syncResults
      });

      const reviewResults = {
        userId,
        reviewDate,
        lastReviewDate: lastReview,
        syncResults,
        allocationAnalysis,
        performanceReview,
        taxOptimizationReview,
        actionItems,
        nextReviewDate: this.calculateNextReviewDate()
      };

      // Update profile with review results
      await this.updateFinancialProfile(userId, {
        lastReview: reviewDate,
        lastReviewResults: reviewResults
      });

      console.log('✅ Periodic review completed');
      return { success: true, reviewResults };

    } catch (error) {
      console.error('❌ Error performing periodic review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  analyzeIncomeStreams(profile) {
    const streams = [];
    const { employmentInfo, incomeProfile } = profile;

    if (employmentInfo.employmentType === 'salaried') {
      streams.push({
        type: this.incomeTypes.SALARY,
        frequency: 'monthly',
        stability: 'high',
        growth: 'moderate',
        taxable: true
      });
    }

    // Analyze other income sources from data integration
    // This would be populated by the DataIntegrationService

    return streams;
  }

  projectIncomeGrowth(profile) {
    const { incomeProfile } = profile;
    const currentIncome = incomeProfile.currentYearEstimate;
    const historicalGrowth = incomeProfile.previousYearsIncome || [];

    // Simple projection based on historical data
    const avgGrowthRate = this.calculateAverageGrowthRate(historicalGrowth);

    return {
      nextYear: currentIncome.total * (1 + avgGrowthRate),
      threeYears: currentIncome.total * Math.pow(1 + avgGrowthRate, 3),
      fiveYears: currentIncome.total * Math.pow(1 + avgGrowthRate, 5),
      assumptions: 'Based on historical growth rate of ' + (avgGrowthRate * 100).toFixed(1) + '%'
    };
  }

  async analyzeAvailableDeductions(profile) {
    const deductions = {
      section80C: {
        limit: 150000,
        claimed: profile.deductionProfile?.claimedDeductions?.section80C || 0,
        available: 150000 - (profile.deductionProfile?.claimedDeductions?.section80C || 0)
      },
      section80D: {
        limit: 25000, // Standard limit for self
        claimed: profile.deductionProfile?.claimedDeductions?.section80D || 0,
        available: 25000 - (profile.deductionProfile?.claimedDeductions?.section80D || 0)
      }
    };

    return deductions;
  }

  generateTaxOptimizationGoals(profile) {
    return [
      {
        goal: 'Minimize tax liability through legal deductions',
        priority: 'high',
        target: 'Utilize all available deduction limits',
        timeframe: 'current fiscal year'
      },
      {
        goal: 'Optimize investment portfolio for tax efficiency',
        priority: 'medium',
        target: 'Maximize post-tax returns',
        timeframe: 'ongoing'
      },
      {
        goal: 'Maintain tax compliance',
        priority: 'high',
        target: '100% timely filing and payment',
        timeframe: 'ongoing'
      }
    ];
  }

  analyzeFilingHistory(previousReturns) {
    if (!previousReturns || previousReturns.length === 0) {
      return {
        filingFrequency: 'first-time',
        onTimePercentage: 100,
        averageRefundTime: 0,
        complianceScore: 100
      };
    }

    const onTimeFilings = previousReturns.filter(r => r.filedOnTime).length;
    const averageRefundTime = previousReturns
      .filter(r => r.refundAmount > 0)
      .reduce((sum, r) => sum + r.refundProcessingDays, 0) /
      previousReturns.filter(r => r.refundAmount > 0).length || 0;

    return {
      filingFrequency: previousReturns.length,
      onTimePercentage: (onTimeFilings / previousReturns.length) * 100,
      averageRefundTime,
      complianceScore: Math.min(100, (onTimeFilings / previousReturns.length) * 100)
    };
  }

  async performRealTimeAnalysis(profile) {
    // This would integrate with market data, tax regulations, etc.
    return {
      marketConditions: 'favorable',
      taxOutlook: 'stable',
      economicIndicators: {
        inflation: 'moderate',
        interestRates: 'rising',
        marketGrowth: 'positive'
      }
    };
  }

  async generatePersonalizedRecommendations(profile) {
    const recommendations = [];

    // Analyze gaps and opportunities
    if (profile.investmentProfile.monthlyInvestmentCapacity === 0) {
      recommendations.push({
        type: 'investment',
        priority: 'high',
        title: 'Start Systematic Investment Plan (SIP)',
        description: 'Begin with small monthly investments for long-term wealth creation',
        action: 'Start SIP with ₹1000-5000 monthly'
      });
    }

    if (profile.deductionProfile.availableDeductions?.section80C?.available > 50000) {
      recommendations.push({
        type: 'tax_saving',
        priority: 'high',
        title: 'Maximize Section 80C Deductions',
        description: `You have ₹${profile.deductionProfile.availableDeductions.section80C.available.toLocaleString()} remaining in 80C limit`,
        action: 'Consider ELSS, PPF, or tax-saving fixed deposits'
      });
    }

    return recommendations;
  }

  calculateNextReviewDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  calculateAverageGrowthRate(historicalData) {
    if (!historicalData || historicalData.length < 2) return 0.1; // Default 10%

    let totalGrowth = 0;
    for (let i = 1; i < historicalData.length; i++) {
      const growth = (historicalData[i].total - historicalData[i-1].total) / historicalData[i-1].total;
      totalGrowth += growth;
    }
    return totalGrowth / (historicalData.length - 1);
  }

  calculateRemainingDeductionCapacity(claimedDeductions) {
    return {
      section80C: Math.max(0, 150000 - (claimedDeductions?.section80C || 0)),
      section80D: Math.max(0, 25000 - (claimedDeductions?.section80D || 0)),
      section80E: Math.max(0, 150000 - (claimedDeductions?.section80E || 0)),
      housing: Math.max(0, 200000 - (claimedDeductions?.housing || 0))
    };
  }

  async performInitialAnalysis(userId) {
    console.log('🔍 Performing initial financial analysis...');

    // Trigger comprehensive data sync
    await dataIntegrationService.syncAllFinancialData(userId);

    // Generate initial tax plan
    await this.generateTaxPlan(userId);

    console.log('✅ Initial analysis completed');
  }
}

// Export singleton instance
export const financialProfileService = new FinancialProfileService();
export default financialProfileService;