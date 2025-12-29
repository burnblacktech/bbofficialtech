// =====================================================
// TAX SIMULATION SERVICE
// Service for simulating tax-saving scenarios (What-if Analysis)
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const TaxComputationEngine = require('../core/TaxComputationEngine');
const AIRecommendationService = require('./AIRecommendationService');
const ITRFiling = require('../../models/ITRFiling');

class TaxSimulationService {
  /**
   * Simulate a tax-saving scenario
   * @param {string} filingId - Filing ID
   * @param {object} scenario - Simulation scenario
   * @returns {Promise<object>} - Simulation results
   */
  async simulateScenario(filingId, scenario) {
    try {
      enterpriseLogger.info('Simulating tax scenario', { filingId, scenarioType: scenario.type });

      // Get current filing data
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const baseFormData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';
      const assessmentYear = filing.assessmentYear || '2024-25';

      // Apply scenario changes to form data
      const simulatedFormData = this.applyScenarioChanges(baseFormData, scenario);

      // Compute base tax
      const baseTaxComputation = await TaxComputationEngine.computeTax(
        baseFormData,
        itrType,
        assessmentYear,
        baseFormData.taxRegime || 'old'
      );

      // Compute simulated tax
      const simulatedTaxComputation = await TaxComputationEngine.computeTax(
        simulatedFormData,
        itrType,
        assessmentYear,
        simulatedFormData.taxRegime || baseFormData.taxRegime || 'old'
      );

      // Calculate savings
      const savings = this.calculateSavings(baseTaxComputation, simulatedTaxComputation);

      // Generate breakdown
      const breakdown = this.generateBreakdown(baseTaxComputation, simulatedTaxComputation, scenario);

      enterpriseLogger.info('Tax scenario simulated successfully', {
        filingId,
        scenarioType: scenario.type,
        savings: savings.totalSavings,
      });

      return {
        success: true,
        scenario: {
          id: scenario.id || `scenario-${Date.now()}`,
          type: scenario.type,
          changes: scenario.changes,
        },
        baseTax: baseTaxComputation,
        simulatedTax: simulatedTaxComputation,
        savings,
        breakdown,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to simulate tax scenario', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to simulate scenario: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Compare multiple scenarios side-by-side
   * @param {string} filingId - Filing ID
   * @param {Array} scenarios - Array of scenarios to compare
   * @returns {Promise<object>} - Comparison results
   */
  async compareScenarios(filingId, scenarios) {
    try {
      enterpriseLogger.info('Comparing tax scenarios', { filingId, scenarioCount: scenarios.length });

      if (!scenarios || scenarios.length === 0) {
        throw new AppError('At least one scenario is required', 400);
      }

      // Get base tax computation
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const baseFormData = filing.jsonPayload || {};
      const itrType = filing.itrType || 'ITR-1';
      const assessmentYear = filing.assessmentYear || '2024-25';

      const baseTaxComputation = await TaxComputationEngine.computeTax(
        baseFormData,
        itrType,
        assessmentYear,
        baseFormData.taxRegime || 'old'
      );

      // Simulate each scenario
      const scenarioResults = await Promise.all(
        scenarios.map(async (scenario) => {
          const simulatedFormData = this.applyScenarioChanges(baseFormData, scenario);
          const simulatedTaxComputation = await TaxComputationEngine.computeTax(
            simulatedFormData,
            itrType,
            assessmentYear,
            simulatedFormData.taxRegime || baseFormData.taxRegime || 'old'
          );
          const savings = this.calculateSavings(baseTaxComputation, simulatedTaxComputation);

          return {
            scenario: {
              id: scenario.id || `scenario-${Date.now()}`,
              type: scenario.type,
              name: scenario.name || scenario.type,
              changes: scenario.changes,
            },
            taxComputation: simulatedTaxComputation,
            savings,
          };
        })
      );

      // Sort by savings (highest first)
      scenarioResults.sort((a, b) => b.savings.totalSavings - a.savings.totalSavings);

      return {
        success: true,
        baseTax: baseTaxComputation,
        scenarios: scenarioResults,
        bestScenario: scenarioResults[0],
      };
    } catch (error) {
      enterpriseLogger.error('Failed to compare scenarios', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to compare scenarios: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Get optimization opportunities with AI-powered analysis
   * @param {object} formData - Current form data
   * @param {string} itrType - ITR type
   * @returns {Promise<Array>} - Array of optimization opportunities
   */
  async getOptimizationOpportunities(formData, itrType) {
    try {
      enterpriseLogger.info('Identifying optimization opportunities with AI', { itrType });

      const opportunities = [];

      // Get AI-powered recommendations
      const aiRecommendations = await AIRecommendationService.generateOptimizationSuggestions(formData, itrType);
      
      // Convert AI recommendations to opportunities format
      aiRecommendations.forEach((rec) => {
        opportunities.push({
          type: rec.type,
          title: rec.title,
          description: rec.description,
          potentialSavings: rec.potentialSavings || 0,
          investmentAmount: rec.investmentAmount || 0,
          priority: rec.priority || 'medium',
          explanation: AIRecommendationService.explainSuggestion(rec),
          impactScore: rec.impactScore || 0,
          changes: rec.changes || {},
        });
      });

      // Analyze current deductions
      const currentDeductions = formData.deductions || {};
      const current80C = parseFloat(currentDeductions.section80C || 0);
      const current80D = parseFloat(currentDeductions.section80D || 0);
      const current80CCD = parseFloat(currentDeductions.section80CCD || 0); // NPS
      const current80G = parseFloat(currentDeductions.section80G || 0);
      const current80EE = parseFloat(currentDeductions.section80EE || 0);
      const current24 = parseFloat(formData.income?.houseProperty?.interestOnLoan || 0);

      // Calculate total income for context
      const totalIncome = this.calculateTotalIncome(formData);
      const taxRegime = formData.taxRegime || 'old';

      // Opportunity 1: Additional 80C investment (if not already suggested by AI)
      if (current80C < 150000 && totalIncome > 500000) {
        const remaining80C = 150000 - current80C;
        const existing = opportunities.find(o => o.type === 'section80C');
        if (!existing) {
          const savings = this.estimateSavings(remaining80C, totalIncome);
          opportunities.push({
            type: 'section80C',
            title: 'Maximize Section 80C Deduction',
            description: `Invest ₹${remaining80C.toLocaleString('en-IN')} more to maximize Section 80C deduction (max ₹1.5L)`,
            potentialSavings: savings,
            investmentAmount: remaining80C,
            priority: remaining80C > 50000 ? 'high' : 'medium',
            explanation: 'Section 80C allows deduction up to ₹1.5 lakhs for investments in ELSS, PPF, NSC, Tax-saving FD, Life Insurance, etc.',
            impactScore: this.calculateImpactScore(savings, totalIncome, remaining80C > 50000),
            changes: {
              amount: remaining80C,
            },
          });
        }
      }

      // Opportunity 2: NPS Contribution (Section 80CCD) - Additional deduction beyond 80C
      if (current80CCD < 50000 && totalIncome > 500000) {
        const remainingNPS = 50000 - current80CCD;
        const existing = opportunities.find(o => o.type === 'section80CCD');
        if (!existing) {
          const savings = this.estimateSavings(remainingNPS, totalIncome);
          opportunities.push({
            type: 'section80CCD',
            title: 'Additional NPS Contribution',
            description: `Contribute ₹${remainingNPS.toLocaleString('en-IN')} more to NPS for additional deduction beyond Section 80C limit`,
            potentialSavings: savings,
            investmentAmount: remainingNPS,
            priority: 'medium',
            explanation: 'Section 80CCD provides additional deduction up to ₹50,000 for NPS contributions beyond the ₹1.5 lakhs limit of Section 80C.',
            impactScore: this.calculateImpactScore(savings, totalIncome, false),
            changes: {
              amount: remainingNPS,
            },
          });
        }
      }

      // Opportunity 3: Health Insurance (Section 80D) - Enhanced analysis
      if (current80D < 25000 && totalIncome > 300000) {
        const remaining80D = 25000 - current80D;
        const existing = opportunities.find(o => o.type === 'section80D');
        if (!existing) {
          const savings = this.estimateSavings(remaining80D, totalIncome);
          const personalInfo = formData.personalInfo || {};
          const isSeniorCitizen = personalInfo.age >= 60;
          const maxLimit = isSeniorCitizen ? 50000 : 25000;
          
          opportunities.push({
            type: 'section80D',
            title: 'Health Insurance Premium Deduction',
            description: `Purchase health insurance with premium ₹${remaining80D.toLocaleString('en-IN')} for deduction${isSeniorCitizen ? ' (Higher limit for senior citizens)' : ''}`,
            potentialSavings: savings,
            investmentAmount: remaining80D,
            priority: 'high',
            explanation: `Section 80D allows deduction for health insurance premiums paid for self, family, and parents. Limit: ₹${maxLimit.toLocaleString('en-IN')}${isSeniorCitizen ? ' for senior citizens' : ''}.`,
            impactScore: this.calculateImpactScore(savings, totalIncome, true),
            changes: {
              amount: remaining80D,
            },
          });
        }
      }

      // Opportunity 4: HRA Optimization - Enhanced analysis
      if (formData.income?.salary && formData.personalInfo?.residentialStatus === 'resident') {
        const salary = formData.income.salary;
        const hra = salary.hra || 0;
        const basicSalary = salary.basic || 0;
        const rentPaid = salary.rentPaid || 0;
        const cityType = salary.cityType || 'non-metro'; // metro or non-metro

        // Check if HRA can be optimized
        if (hra > 0 && rentPaid > 0 && basicSalary > 0) {
          const hraExempt = Math.min(
            hra,
            rentPaid - (basicSalary * 0.1),
            basicSalary * (cityType === 'metro' ? 0.5 : 0.4)
          );
          
          const currentHRAExempt = salary.hraExempt || hraExempt;
          const potentialOptimization = hraExempt - currentHRAExempt;
          
          if (potentialOptimization > 1000) {
            const savings = this.estimateHRASavings({ ...salary, hraExempt });
            opportunities.push({
              type: 'hraOptimization',
              title: 'HRA Optimization Opportunity',
              description: `Optimize HRA exemption calculation to maximize tax benefit`,
              potentialSavings: savings,
              priority: savings > 10000 ? 'high' : 'medium',
              explanation: `HRA exemption is calculated as the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of basic salary, (3) ${cityType === 'metro' ? '50%' : '40%'} of basic salary (${cityType === 'metro' ? 'metro' : 'non-metro'} city).`,
              impactScore: this.calculateImpactScore(savings, totalIncome, savings > 10000),
              changes: {
                rentPaid: rentPaid,
                hra: hra,
                cityType: cityType,
              },
            });
          }
        }
      }

      // Opportunity 5: Tax Regime Comparison
      if (taxRegime === 'old') {
        const oldRegimeTax = await this.estimateTaxForRegime(formData, itrType, 'old');
        const newRegimeTax = await this.estimateTaxForRegime(formData, itrType, 'new');
        
        if (newRegimeTax < oldRegimeTax && (oldRegimeTax - newRegimeTax) > 5000) {
          opportunities.push({
            type: 'regimeSwitch',
            title: 'Consider New Tax Regime',
            description: `Switching to new tax regime could save ₹${(oldRegimeTax - newRegimeTax).toLocaleString('en-IN')}`,
            potentialSavings: oldRegimeTax - newRegimeTax,
            priority: (oldRegimeTax - newRegimeTax) > 50000 ? 'high' : 'medium',
            explanation: 'New tax regime offers lower tax rates but removes most deductions. Compare both regimes to find the best option.',
            impactScore: this.calculateImpactScore(oldRegimeTax - newRegimeTax, totalIncome, (oldRegimeTax - newRegimeTax) > 50000),
            changes: {
              taxRegime: 'new',
            },
          });
        }
      }

      // Opportunity 6: Section 80G (Donations)
      if (current80G === 0 && totalIncome > 1000000) {
        opportunities.push({
          type: 'section80G',
          title: 'Charitable Donations Deduction',
          description: 'Consider making donations to eligible organizations for Section 80G deduction',
          potentialSavings: 0, // User needs to specify amount
          priority: 'low',
          explanation: 'Section 80G allows deduction for donations made to eligible charitable organizations. Deduction ranges from 50% to 100% depending on the organization.',
          impactScore: 0,
          changes: {},
        });
      }

      // Opportunity 7: Section 80EE (Home Loan Interest - First-time homebuyers)
      if (current80EE === 0 && current24 > 0 && totalIncome < 5000000) {
        const interestAmount = Math.min(200000, current24);
        if (interestAmount > 0) {
          opportunities.push({
            type: 'section80EE',
            title: 'First-time Homebuyer Deduction',
            description: 'Check eligibility for Section 80EE (additional deduction for first-time homebuyers)',
            potentialSavings: this.estimateSavings(50000, totalIncome), // Max 50K under 80EE
            investmentAmount: 50000,
            priority: 'medium',
            explanation: 'Section 80EE provides additional deduction of up to ₹50,000 for interest on home loan for first-time homebuyers (loan amount < ₹35L, property value < ₹50L).',
            impactScore: this.calculateImpactScore(this.estimateSavings(50000, totalIncome), totalIncome, false),
            changes: {
              amount: 50000,
            },
          });
        }
      }

      // Rank opportunities by impact score and priority
      opportunities.forEach(opp => {
        if (!opp.impactScore && opp.potentialSavings > 0) {
          opp.impactScore = this.calculateImpactScore(opp.potentialSavings, totalIncome, opp.priority === 'high');
        }
      });

      opportunities.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (b.impactScore || 0) - (a.impactScore || 0);
      });

      return {
        success: true,
        opportunities,
        summary: {
          totalOpportunities: opportunities.length,
          highPriority: opportunities.filter(o => o.priority === 'high').length,
          estimatedTotalSavings: opportunities.reduce((sum, o) => sum + (o.potentialSavings || 0), 0),
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get optimization opportunities', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(`Failed to get opportunities: ${error.message}`, 500);
    }
  }

  /**
   * Apply simulation to actual filing
   * @param {string} filingId - Filing ID
   * @param {string} scenarioId - Scenario ID
   * @param {object} changes - Changes to apply
   * @returns {Promise<object>} - Application result
   */
  async applySimulation(filingId, scenarioId, changes) {
    try {
      enterpriseLogger.info('Applying simulation to filing', { filingId, scenarioId });

      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      const formData = filing.jsonPayload || {};

      // Apply changes to form data
      const updatedFormData = this.applyChanges(formData, changes);

      // Update filing
      await filing.update({
        jsonPayload: updatedFormData,
        updatedAt: new Date(),
      });

      enterpriseLogger.info('Simulation applied successfully', {
        filingId,
        scenarioId,
      });

      return {
        success: true,
        message: 'Simulation applied successfully',
        filing: {
          id: filing.id,
          updatedAt: filing.updatedAt,
        },
      };
    } catch (error) {
      enterpriseLogger.error('Failed to apply simulation', {
        filingId,
        scenarioId,
        error: error.message,
      });
      throw new AppError(`Failed to apply simulation: ${error.message}`, error.statusCode || 500);
    }
  }

  // Helper methods

  /**
   * Apply scenario changes to form data
   * @param {object} formData - Base form data
   * @param {object} scenario - Scenario with changes
   * @returns {object} - Modified form data
   */
  applyScenarioChanges(formData, scenario) {
    const simulated = JSON.parse(JSON.stringify(formData)); // Deep clone

    if (scenario.type === 'section80C') {
      // Add to Section 80C deduction
      if (!simulated.deductions) simulated.deductions = {};
      simulated.deductions.section80C = (parseFloat(simulated.deductions.section80C || 0) + parseFloat(scenario.changes.amount || 0));
      simulated.deductions.section80C = Math.min(150000, simulated.deductions.section80C); // Cap at 1.5L
    } else if (scenario.type === 'section80CCD') {
      // Add NPS contribution
      if (!simulated.deductions) simulated.deductions = {};
      simulated.deductions.section80CCD = (parseFloat(simulated.deductions.section80CCD || 0) + parseFloat(scenario.changes.amount || 0));
      simulated.deductions.section80CCD = Math.min(50000, simulated.deductions.section80CCD); // Cap at 50K
    } else if (scenario.type === 'section80D') {
      // Add health insurance premium
      if (!simulated.deductions) simulated.deductions = {};
      simulated.deductions.section80D = (parseFloat(simulated.deductions.section80D || 0) + parseFloat(scenario.changes.amount || 0));
      simulated.deductions.section80D = Math.min(25000, simulated.deductions.section80D); // Cap at 25K
    } else if (scenario.type === 'hraOptimization') {
      // Optimize HRA
      if (simulated.income?.salary) {
        if (!simulated.income.salary) simulated.income.salary = {};
        simulated.income.salary.rentPaid = parseFloat(scenario.changes.rentPaid || simulated.income.salary.rentPaid || 0);
        simulated.income.salary.hra = parseFloat(scenario.changes.hra || simulated.income.salary.hra || 0);
      }
    } else if (scenario.type === 'section24') {
      // Add home loan interest deduction
      if (!simulated.income) simulated.income = {};
      if (!simulated.income.houseProperty) simulated.income.houseProperty = {};
      simulated.income.houseProperty.interestOnLoan = (parseFloat(simulated.income.houseProperty.interestOnLoan || 0) + parseFloat(scenario.changes.interestAmount || 0));
      simulated.income.houseProperty.interestOnLoan = Math.min(200000, simulated.income.houseProperty.interestOnLoan); // Cap at 2L
    }

    return simulated;
  }

  /**
   * Calculate savings from simulation
   * @param {object} baseTax - Base tax computation
   * @param {object} simulatedTax - Simulated tax computation
   * @returns {object} - Savings breakdown
   */
  calculateSavings(baseTax, simulatedTax) {
    const totalTaxLiabilityBase = parseFloat(baseTax.totalTaxLiability || 0);
    const totalTaxLiabilitySimulated = parseFloat(simulatedTax.totalTaxLiability || 0);

    const totalSavings = totalTaxLiabilityBase - totalTaxLiabilitySimulated;
    const savingsPercentage = totalTaxLiabilityBase > 0
      ? (totalSavings / totalTaxLiabilityBase) * 100
      : 0;

    return {
      totalSavings: Math.max(0, totalSavings),
      savingsPercentage: Math.max(0, savingsPercentage),
      baseTaxLiability: totalTaxLiabilityBase,
      simulatedTaxLiability: totalTaxLiabilitySimulated,
      breakdown: {
        incomeTax: (parseFloat(baseTax.incomeTax || 0) - parseFloat(simulatedTax.incomeTax || 0)),
        cess: (parseFloat(baseTax.cess || 0) - parseFloat(simulatedTax.cess || 0)),
        surcharge: (parseFloat(baseTax.surcharge || 0) - parseFloat(simulatedTax.surcharge || 0)),
      },
    };
  }

  /**
   * Generate breakdown of changes
   * @param {object} baseTax - Base tax computation
   * @param {object} simulatedTax - Simulated tax computation
   * @param {object} scenario - Scenario details
   * @returns {object} - Breakdown
   */
  generateBreakdown(baseTax, simulatedTax, scenario) {
    return {
      scenarioType: scenario.type,
      changes: scenario.changes,
      taxBreakdown: {
        base: {
          grossTotalIncome: baseTax.grossTotalIncome || 0,
          totalDeductions: baseTax.totalDeductions || 0,
          taxableIncome: baseTax.taxableIncome || 0,
          totalTaxLiability: baseTax.totalTaxLiability || 0,
        },
        simulated: {
          grossTotalIncome: simulatedTax.grossTotalIncome || 0,
          totalDeductions: simulatedTax.totalDeductions || 0,
          taxableIncome: simulatedTax.taxableIncome || 0,
          totalTaxLiability: simulatedTax.totalTaxLiability || 0,
        },
      },
    };
  }

  /**
   * Estimate tax savings for an investment amount
   * @param {number} investmentAmount - Investment amount
   * @param {number} totalIncome - Total income
   * @returns {number} - Estimated savings
   */
  estimateSavings(investmentAmount, totalIncome) {
    // Simple estimation: assume 30% tax bracket
    // This is a rough estimate, actual calculation depends on tax slab
    const taxRate = totalIncome > 1000000 ? 0.30 : totalIncome > 500000 ? 0.20 : 0.10;
    return investmentAmount * taxRate;
  }

  /**
   * Estimate HRA savings
   * @param {object} salary - Salary details
   * @returns {number} - Estimated savings
   */
  estimateHRASavings(salary) {
    // Simplified HRA calculation
    const hra = salary.hra || 0;
    const rentPaid = salary.rentPaid || 0;
    const basicSalary = salary.basic || 0;

    const hraExempt = Math.min(
      hra,
      rentPaid - (basicSalary * 0.1),
      basicSalary * 0.5
    );

    return hraExempt * 0.30; // Rough estimate at 30% tax rate
  }

  /**
   * Calculate total income from form data
   * @param {object} formData - Form data
   * @returns {number} - Total income
   */
  calculateTotalIncome(formData) {
    const income = formData.income || {};
    return (
      (parseFloat(income.salary?.grossSalary || 0)) +
      (parseFloat(income.businessIncome || 0)) +
      (parseFloat(income.professionalIncome || 0)) +
      (parseFloat(income.capitalGains || 0)) +
      (parseFloat(income.houseProperty?.annualRentalIncome || 0)) +
      (parseFloat(income.otherIncome || 0))
    );
  }

  /**
   * Apply changes to form data
   * @param {object} formData - Base form data
   * @param {object} changes - Changes to apply
   * @returns {object} - Updated form data
   */
  applyChanges(formData, changes) {
    const updated = JSON.parse(JSON.stringify(formData)); // Deep clone

    // Apply changes based on structure
    Object.keys(changes).forEach((key) => {
      const keys = key.split('.');
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = changes[key];
    });

    return updated;
  }

  /**
   * Calculate impact score for ranking opportunities
   * @param {number} savings - Potential savings
   * @param {number} totalIncome - Total income
   * @param {boolean} isHighPriority - Whether it's high priority
   * @returns {number} - Impact score
   */
  calculateImpactScore(savings, totalIncome, isHighPriority) {
    if (!savings || totalIncome === 0) return 0;
    const savingsPercentage = (savings / totalIncome) * 100;
    const priorityMultiplier = isHighPriority ? 1.5 : 1.0;
    return savingsPercentage * priorityMultiplier * (savings / 1000); // Scale by absolute savings
  }

  /**
   * Estimate tax for a specific regime
   * @param {object} formData - Form data
   * @param {string} itrType - ITR type
   * @param {string} regime - Tax regime ('old' or 'new')
   * @returns {Promise<number>} - Estimated tax
   */
  async estimateTaxForRegime(formData, itrType, regime) {
    try {
      const assessmentYear = formData.assessmentYear || '2024-25';
      const modifiedFormData = { ...formData, taxRegime: regime };
      const computation = await TaxComputationEngine.computeTax(
        modifiedFormData,
        itrType,
        assessmentYear,
        regime
      );
      return parseFloat(computation.totalTaxLiability || 0);
    } catch (error) {
      enterpriseLogger.warn('Failed to estimate tax for regime', { regime, error: error.message });
      return 0;
    }
  }
}

module.exports = new TaxSimulationService();

