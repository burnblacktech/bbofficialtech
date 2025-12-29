// =====================================================
// ITR-4 JSON BUILDER
// Builds complete ITR-4 JSON using ITR-2 schedules + Presumptive Schedule BP
// NO P&L, NO Balance Sheet, NO Depreciation
// =====================================================

const ITRJsonBuilders = require('./ITRJsonBuilders');
const ITR2ScheduleBuilders = require('./ITR2ScheduleBuilders');
const ITR4ScheduleBuilders = require('./ITR4ScheduleBuilders');
const enterpriseLogger = require('../../utils/logger');

class ITR4JsonBuilder {
  /**
   * Build complete ITR-4 JSON
   * @param {object} sectionSnapshot - Section-based snapshot from draft/filing
   * @param {object} computationResult - Final computation result from TaxComputationEngine
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @param {object} user - User model instance
   * @param {object} aggregatedSalary - Optional aggregated salary from Form16AggregationService
   * @param {string} filingId - Optional filing ID for Schedule FA
   * @returns {Promise<object>} Complete ITR-4 JSON in ITD format
   */
  async buildITR4(sectionSnapshot, computationResult, assessmentYear, user, aggregatedSalary = null, filingId = null) {
    try {
      enterpriseLogger.info('Building ITR-4 JSON', {
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

      // Build ITR-4 specific sections
      // Note: ITR-4 does NOT include Schedule CG (capital gains not allowed)
      const scheduleHP = ITR2ScheduleBuilders.buildScheduleHP(sectionSnapshot, computationResult);
      const scheduleOS = this.buildScheduleOS(sectionSnapshot);
      const scheduleVIA = this.buildScheduleVIA(sectionSnapshot);
      const scheduleBP = ITR4ScheduleBuilders.buildScheduleBP_Presumptive(sectionSnapshot, computationResult);
      const partC = this.buildPartC(sectionSnapshot, aggregatedSalary);
      const scheduleEI = ITR2ScheduleBuilders.buildScheduleEI(sectionSnapshot);

      // Conditional schedules
      const scheduleFA = await ITR2ScheduleBuilders.buildScheduleFA(sectionSnapshot, filingId);
      const scheduleAL = ITR2ScheduleBuilders.buildScheduleAL(sectionSnapshot, computationResult);

      // Build PartB_TI (Total Income)
      const partBTI = this.buildPartBTI(computationResult, scheduleHP, scheduleOS, scheduleBP);

      // Assemble complete ITR-4 JSON
      const itr4Json = {
        Form_ITR4: {
          PartA_GEN1: {
            PersonalInfo: personalInfo,
            FilingStatus: filingStatus,
            AddressDetails: addressDetails,
          },
          ScheduleBP: scheduleBP,
          ScheduleVIA: scheduleVIA,
          PartB_TI: partBTI,
          PartB_TTI: taxSummary,
          PartC: partC,
          Verification: verification,
        },
      };

      // Conditionally add Schedule HP if it has data
      if (scheduleHP && (Array.isArray(scheduleHP) ? scheduleHP.length > 0 : Object.keys(scheduleHP).length > 0)) {
        itr4Json.Form_ITR4.ScheduleHP = scheduleHP;
      }

      // Conditionally add Schedule OS if it has data
      if (scheduleOS && parseFloat(scheduleOS.TotalOS || 0) > 0) {
        itr4Json.Form_ITR4.ScheduleOS = scheduleOS;
      }

      // Conditionally add Schedule EI if it has exempt income
      // Schedule EI structure: { ExemptIncome: { entries: Array, total: string } }
      const exemptIncomeTotal = scheduleEI?.ExemptIncome?.total ? parseFloat(scheduleEI.ExemptIncome.total || 0) : 0;
      const hasExemptEntries = scheduleEI?.ExemptIncome?.entries && scheduleEI.ExemptIncome.entries.length > 0;
      if (scheduleEI && (exemptIncomeTotal > 0 || hasExemptEntries)) {
        itr4Json.Form_ITR4.ScheduleEI = scheduleEI;
      }

      // Conditionally add Schedule FA and Schedule AL
      if (scheduleFA) {
        itr4Json.Form_ITR4.ScheduleFA = scheduleFA;
      }

      if (scheduleAL) {
        itr4Json.Form_ITR4.ScheduleAL = scheduleAL;
      }

      // Explicitly ensure NO P&L, NO Balance Sheet, NO Depreciation
      // These should never be present in ITR-4
      if (sectionSnapshot.balanceSheet || sectionSnapshot.balance_sheet) {
        enterpriseLogger.warn('Balance Sheet data found in ITR-4 snapshot - this should not be included', {
          assessmentYear,
        });
      }

      if (sectionSnapshot.income?.businessIncome?.businesses || sectionSnapshot.income?.professionalIncome?.professions) {
        enterpriseLogger.warn('Regular business/professional income found in ITR-4 snapshot - this should be presumptive only', {
          assessmentYear,
        });
      }

      enterpriseLogger.info('ITR-4 JSON built successfully', { assessmentYear });
      return itr4Json;
    } catch (error) {
      enterpriseLogger.error('Error building ITR-4 JSON', {
        error: error.message,
        stack: error.stack,
        assessmentYear,
      });
      throw error;
    }
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
   * Build PartC (Taxes Paid and TDS)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} aggregatedSalary - Optional aggregated salary
   * @returns {object} PartC
   */
  buildPartC(sectionSnapshot, aggregatedSalary = null) {
    const taxesPaid = sectionSnapshot.taxesPaid || sectionSnapshot.taxes_paid || {};
    
    let totalTDS = 0;
    if (aggregatedSalary) {
      totalTDS = parseFloat(aggregatedSalary.totalTDS || 0);
    } else {
      totalTDS = parseFloat(taxesPaid.tds || taxesPaid.totalTDS || 0);
    }

    const advanceTax = parseFloat(taxesPaid.advanceTax || taxesPaid.advance_tax || 0);
    const selfAssessmentTax = parseFloat(taxesPaid.selfAssessmentTax || taxesPaid.self_assessment_tax || 0);

    // Bank details (consistent with ITR-1)
    const bankDetails = sectionSnapshot.bankDetails || sectionSnapshot.bank_details || {};
    const accountNumber = bankDetails.accountNumber || bankDetails.account_number || '';
    const ifscCode = bankDetails.ifsc || bankDetails.ifscCode || bankDetails.ifsc_code || '';
    const bankName = bankDetails.bankName || bankDetails.bank_name || '';

    return {
      TaxesPaid: {
        AdvanceTax: this.formatAmount(advanceTax),
        SelfAssessmentTax: this.formatAmount(selfAssessmentTax),
        TotalTaxesPaid: this.formatAmount(advanceTax + selfAssessmentTax),
      },
      TDS: {
        TotalTDS: this.formatAmount(totalTDS),
      },
      BankDetails: {
        AccountNumber: accountNumber,
        IFSCCode: ifscCode,
        BankName: bankName,
      },
    };
  }

  /**
   * Build PartB_TI (Total Income)
   * @param {object} computationResult - Computation result
   * @param {Array} scheduleHP - Schedule HP entries
   * @param {object} scheduleOS - Schedule OS
   * @param {object} scheduleBP - Schedule BP (presumptive)
   * @returns {object} PartB_TI
   */
  buildPartBTI(computationResult, scheduleHP, scheduleOS, scheduleBP) {
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

module.exports = new ITR4JsonBuilder();

