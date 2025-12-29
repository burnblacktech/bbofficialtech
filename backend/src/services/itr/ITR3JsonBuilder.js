// =====================================================
// ITR-3 JSON BUILDER
// Builds complete ITR-3 JSON using ITR-2 schedules + ITR-3 specific schedules
// =====================================================

const ITRJsonBuilders = require('./ITRJsonBuilders');
const ITR2ScheduleBuilders = require('./ITR2ScheduleBuilders');
const ITR3ScheduleBuilders = require('./ITR3ScheduleBuilders');
const enterpriseLogger = require('../../utils/logger');

class ITR3JsonBuilder {
  /**
   * Build complete ITR-3 JSON
   * @param {object} sectionSnapshot - Section-based snapshot from draft/filing
   * @param {object} computationResult - Final computation result from TaxComputationEngine
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @param {object} user - User model instance
   * @param {object} aggregatedSalary - Optional aggregated salary from Form16AggregationService
   * @param {string} filingId - Optional filing ID for Schedule FA
   * @returns {Promise<object>} Complete ITR-3 JSON in ITD format
   */
  async buildITR3(sectionSnapshot, computationResult, assessmentYear, user, aggregatedSalary = null, filingId = null) {
    try {
      enterpriseLogger.info('Building ITR-3 JSON', {
        assessmentYear,
        hasComputationResult: !!computationResult,
        hasAggregatedSalary: !!aggregatedSalary,
        filingId,
      });

      // Use common builders for shared sections
      const personalInfo = ITRJsonBuilders.buildPersonalInfo(sectionSnapshot, user);
      const filingStatus = ITRJsonBuilders.buildFilingMeta(sectionSnapshot, assessmentYear);
      const addressDetails = ITRJsonBuilders.buildAddressDetails(sectionSnapshot, user);
      const taxSummary = ITRJsonBuilders.buildTaxSummary(computationResult, sectionSnapshot);
      const verification = ITRJsonBuilders.buildVerification(sectionSnapshot, user);

      // Build ITR-2 schedules (reused)
      const scheduleS = this.buildScheduleS(sectionSnapshot, aggregatedSalary);
      const scheduleHP = ITR2ScheduleBuilders.buildScheduleHP(sectionSnapshot, computationResult);
      const scheduleCG = ITR2ScheduleBuilders.buildScheduleCG(sectionSnapshot, computationResult);
      const scheduleOS = this.buildScheduleOS(sectionSnapshot);
      const scheduleVIA = this.buildScheduleVIA(sectionSnapshot);
      const schedule80G = this.buildSchedule80G(sectionSnapshot);
      const scheduleTDS1 = this.buildScheduleTDS1(sectionSnapshot, aggregatedSalary);
      const scheduleTDS2 = this.buildScheduleTDS2(sectionSnapshot);
      const scheduleIT = this.buildScheduleIT(sectionSnapshot);
      const scheduleEI = ITR2ScheduleBuilders.buildScheduleEI(sectionSnapshot);

      // Build ITR-3 specific schedules
      const scheduleBP = ITR3ScheduleBuilders.buildScheduleBP(sectionSnapshot, computationResult);
      const partAPL = ITR3ScheduleBuilders.buildProfitAndLoss(sectionSnapshot, computationResult);
      const partABS = ITR3ScheduleBuilders.buildBalanceSheet(sectionSnapshot, computationResult);
      const scheduleCYLA = ITR3ScheduleBuilders.buildScheduleCYLA(sectionSnapshot);
      const scheduleBFLA = ITR3ScheduleBuilders.buildScheduleBFLA(sectionSnapshot);

      // Conditional schedules
      const scheduleDEP = ITR3ScheduleBuilders.buildScheduleDEP(sectionSnapshot, partABS);
      const scheduleFA = await ITR2ScheduleBuilders.buildScheduleFA(sectionSnapshot, filingId);
      const scheduleAL = ITR2ScheduleBuilders.buildScheduleAL(sectionSnapshot, computationResult);

      // Build PartB_TI (Total Income)
      const partBTI = this.buildPartBTI(computationResult, scheduleHP, scheduleCG, scheduleOS, scheduleBP);

      // Assemble complete ITR-3 JSON
      const itr3Json = {
        Form_ITR3: {
          PartA_GEN: {
            PersonalInfo: personalInfo,
            FilingStatus: filingStatus,
            AddressDetails: addressDetails,
          },
          ScheduleS: scheduleS,
          ScheduleHP: scheduleHP,
          ScheduleBP: scheduleBP,
          ScheduleCG: scheduleCG,
          ScheduleOS: scheduleOS,
          ScheduleVIA: scheduleVIA,
          ScheduleCYLA: scheduleCYLA,
          ScheduleBFLA: scheduleBFLA,
          PartB_TI: partBTI,
          PartB_TTI: taxSummary,
          PartA_BS: partABS,
          PartA_PL: partAPL,
          Schedule80G: schedule80G,
          ScheduleTDS1: scheduleTDS1,
          ScheduleTDS2: scheduleTDS2,
          ScheduleIT: scheduleIT,
          ScheduleEI: scheduleEI,
          Verification: verification,
        },
      };

      // Schedule AL is required per schema - always include (even if empty)
      itr3Json.Form_ITR3.ScheduleAL = scheduleAL || {
        Assets: { Total: '0.00' },
        Liabilities: { Total: '0.00' },
      };

      // Conditionally add Schedule DEP and Schedule FA
      if (scheduleDEP) {
        itr3Json.Form_ITR3.ScheduleDEP = scheduleDEP;
      }

      if (scheduleFA) {
        itr3Json.Form_ITR3.ScheduleFA = scheduleFA;
      }

      enterpriseLogger.info('ITR-3 JSON built successfully', { assessmentYear });
      return itr3Json;
    } catch (error) {
      enterpriseLogger.error('Error building ITR-3 JSON', {
        error: error.message,
        stack: error.stack,
        assessmentYear,
      });
      throw error;
    }
  }

  /**
   * Build Schedule S (Salaries)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} aggregatedSalary - Optional aggregated salary
   * @returns {object} Schedule S
   */
  buildScheduleS(sectionSnapshot, aggregatedSalary = null) {
    let grossSalary = 0;
    let standardDeduction = 0;
    let professionalTax = 0;

    if (aggregatedSalary) {
      grossSalary = parseFloat(aggregatedSalary.totalGrossSalary || 0);
      standardDeduction = parseFloat(aggregatedSalary.totalStandardDeduction || 0);
      professionalTax = parseFloat(aggregatedSalary.totalProfessionalTax || 0);
    } else {
      const income = sectionSnapshot.income || {};
      const salary = income.salary || {};
      
      grossSalary = parseFloat(salary.grossSalary || salary.totalSalary || income.salary || 0);
      standardDeduction = parseFloat(salary.standardDeduction || 0);
      professionalTax = parseFloat(salary.professionalTax || 0);
    }

    standardDeduction = Math.min(standardDeduction, 50000);
    const netSalary = Math.max(0, grossSalary - standardDeduction - professionalTax);

    return {
      GrossSalary: this.formatAmount(grossSalary),
      StandardDeduction: this.formatAmount(standardDeduction),
      ProfessionalTax: this.formatAmount(professionalTax),
      NetSalary: this.formatAmount(netSalary),
    };
  }

  /**
   * Build Schedule OS (Other Sources)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule OS
   */
  buildScheduleOS(sectionSnapshot) {
    const income = sectionSnapshot.income || {};
    const otherSources = income.otherSources || {};
    
    const interestIncome = parseFloat(otherSources.totalInterestIncome || income.interestIncome || income.otherIncome || 0);
    const otherIncome = parseFloat(otherSources.totalOtherIncome || 0);
    const totalOS = interestIncome + otherIncome;

    return {
      InterestIncome: this.formatAmount(interestIncome),
      OtherIncome: this.formatAmount(otherIncome),
      TotalOS: this.formatAmount(totalOS),
    };
  }

  /**
   * Build Schedule VIA (Deductions)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule VIA
   */
  buildScheduleVIA(sectionSnapshot) {
    const deductions = sectionSnapshot.deductions || {};

    const section80C = parseFloat(deductions.section80C || deductions.section_80C || 0);
    const section80D = parseFloat(deductions.section80D || deductions.section_80D || 0);
    const section80E = parseFloat(deductions.section80E || deductions.section_80E || 0);
    const section80G = parseFloat(deductions.section80G || deductions.section_80G || 0);
    const section80TTA = parseFloat(deductions.section80TTA || deductions.section_80TTA || 0);
    const section80TTB = parseFloat(deductions.section80TTB || deductions.section_80TTB || 0);

    const totalDeductions = section80C + section80D + section80E + section80G + section80TTA + section80TTB;

    return {
      Section80C: this.formatAmount(section80C),
      Section80D: this.formatAmount(section80D),
      Section80E: this.formatAmount(section80E),
      Section80G: this.formatAmount(section80G),
      Section80TTA: this.formatAmount(section80TTA),
      Section80TTB: this.formatAmount(section80TTB),
      TotalDeductions: this.formatAmount(totalDeductions),
    };
  }

  /**
   * Build Schedule 80G (Donations)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule 80G
   */
  buildSchedule80G(sectionSnapshot) {
    const deductions = sectionSnapshot.deductions || {};
    const section80G = parseFloat(deductions.section80G || deductions.section_80G || 0);

    return {
      Total80G: this.formatAmount(section80G),
    };
  }

  /**
   * Build Schedule TDS1 (TDS Summary)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} aggregatedSalary - Optional aggregated salary
   * @returns {object} Schedule TDS1
   */
  buildScheduleTDS1(sectionSnapshot, aggregatedSalary = null) {
    let totalTDS = 0;

    if (aggregatedSalary) {
      totalTDS = parseFloat(aggregatedSalary.totalTDS || 0);
    } else {
      const taxesPaid = sectionSnapshot.taxesPaid || sectionSnapshot.taxes_paid || {};
      totalTDS = parseFloat(taxesPaid.tds || taxesPaid.totalTDS || 0);
    }

    return {
      TotalTDS: this.formatAmount(totalTDS),
    };
  }

  /**
   * Build Schedule TDS2 (TDS Details) - Empty for now
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule TDS2
   */
  buildScheduleTDS2(sectionSnapshot) {
    // Schedule TDS2 contains detailed TDS entries per employer/deductor
    // For now, return empty structure (can be enhanced later)
    return {};
  }

  /**
   * Build Schedule IT (Advance Tax and Self-Assessment Tax)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} Schedule IT
   */
  buildScheduleIT(sectionSnapshot) {
    const taxesPaid = sectionSnapshot.taxesPaid || sectionSnapshot.taxes_paid || {};
    
    const advanceTax = parseFloat(taxesPaid.advanceTax || taxesPaid.advance_tax || 0);
    const selfAssessmentTax = parseFloat(taxesPaid.selfAssessmentTax || taxesPaid.self_assessment_tax || 0);

    return {
      AdvanceTax: this.formatAmount(advanceTax),
      SelfAssessmentTax: this.formatAmount(selfAssessmentTax),
      TotalTaxPaid: this.formatAmount(advanceTax + selfAssessmentTax),
    };
  }

  /**
   * Build PartB_TI (Total Income)
   * @param {object} computationResult - Computation result
   * @param {Array} scheduleHP - Schedule HP entries
   * @param {object} scheduleCG - Schedule CG
   * @param {object} scheduleOS - Schedule OS
   * @param {object} scheduleBP - Schedule BP
   * @returns {object} PartB_TI
   */
  buildPartBTI(computationResult, scheduleHP, scheduleCG, scheduleOS, scheduleBP) {
    // Use computation result for gross total income
    const grossTotIncome = parseFloat(computationResult.grossTotalIncome || 0);

    return {
      GrossTotIncome: this.formatAmount(grossTotIncome),
    };
  }

  /**
   * Format amount as string with 2 decimal places
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount string
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount || 0);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    return numAmount.toFixed(2);
  }
}

module.exports = new ITR3JsonBuilder();

