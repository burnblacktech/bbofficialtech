// =====================================================
// ITR-1 JSON BUILDER
// Builds complete ITR-1 JSON using common builders + ITR-1 specific logic
// =====================================================

const ITRJsonBuilders = require('./ITRJsonBuilders');
const enterpriseLogger = require('../../utils/logger');

class ITR1JsonBuilder {
  /**
   * Build complete ITR-1 JSON
   * @param {object} sectionSnapshot - Section-based snapshot from draft/filing
   * @param {object} computationResult - Final computation result from TaxComputationEngine
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @param {object} user - User model instance
   * @param {object} aggregatedSalary - Optional aggregated salary from Form16AggregationService
   * @returns {object} Complete ITR-1 JSON in ITD format
   */
  buildITR1(sectionSnapshot, computationResult, assessmentYear, user, aggregatedSalary = null) {
    try {
      enterpriseLogger.info('Building ITR-1 JSON', {
        assessmentYear,
        hasComputationResult: !!computationResult,
        hasAggregatedSalary: !!aggregatedSalary,
      });

      // Use common builders for shared sections
      const personalInfo = ITRJsonBuilders.buildPersonalInfo(sectionSnapshot, user);
      const filingStatus = ITRJsonBuilders.buildFilingMeta(sectionSnapshot, assessmentYear);
      const addressDetails = ITRJsonBuilders.buildAddressDetails(sectionSnapshot, user);
      const taxSummary = ITRJsonBuilders.buildTaxSummary(computationResult, sectionSnapshot);
      const verification = ITRJsonBuilders.buildVerification(sectionSnapshot, user);

      // Build ITR-1 specific sections
      const salaries = this.buildSalariesSection(sectionSnapshot, aggregatedSalary);
      const incomeFromHP = this.buildHousePropertySection(sectionSnapshot);
      const incFromOthSources = this.buildOtherIncomeSection(sectionSnapshot);
      const partC = this.buildPartC(sectionSnapshot, aggregatedSalary);
      const partD = this.buildPartD(computationResult);

      // Assemble complete ITR-1 JSON
      const itr1Json = {
        Form_ITR1: {
          PartA_GEN1: {
            PersonalInfo: personalInfo,
            FilingStatus: filingStatus,
            AddressDetails: addressDetails,
          },
          PartB_TI: {
            Salaries: salaries,
            IncomeFromHP: incomeFromHP,
            IncFromOthSources: incFromOthSources,
          },
          PartB_TTI: taxSummary,
          PartC: partC,
          PartD: partD,
          Verification: verification,
        },
      };

      enterpriseLogger.info('ITR-1 JSON built successfully', { assessmentYear });
      return itr1Json;
    } catch (error) {
      enterpriseLogger.error('Error building ITR-1 JSON', {
        error: error.message,
        stack: error.stack,
        assessmentYear,
      });
      throw error;
    }
  }

  /**
   * Build Salaries section (PartB_TI.Salaries)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} aggregatedSalary - Optional aggregated salary from Form-16s
   * @returns {object} Salaries section
   */
  buildSalariesSection(sectionSnapshot, aggregatedSalary = null) {
    let grossSalary = 0;
    let standardDeduction = 0;
    let professionalTax = 0;

    if (aggregatedSalary) {
      // Use aggregated salary from Form-16s
      grossSalary = parseFloat(aggregatedSalary.totalGrossSalary || 0);
      standardDeduction = parseFloat(aggregatedSalary.totalStandardDeduction || 0);
      professionalTax = parseFloat(aggregatedSalary.totalProfessionalTax || 0);
    } else {
      // Use manual entry from section snapshot
      const income = sectionSnapshot.income || {};
      const salary = income.salary || {};
      
      grossSalary = parseFloat(salary.grossSalary || salary.totalSalary || income.salary || 0);
      standardDeduction = parseFloat(salary.standardDeduction || 0);
      professionalTax = parseFloat(salary.professionalTax || 0);
    }

    // Ensure standard deduction doesn't exceed 50000
    standardDeduction = Math.min(standardDeduction, 50000);

    // Calculate net salary
    const netSalary = Math.max(0, grossSalary - standardDeduction - professionalTax);

    return {
      GrossSalary: this.formatAmount(grossSalary),
      Salary16ia: this.formatAmount(standardDeduction),
      ProfessionalTaxUs16iii: this.formatAmount(professionalTax),
      NetSalary: this.formatAmount(netSalary),
    };
  }

  /**
   * Build House Property section (PartB_TI.IncomeFromHP)
   * ITR-1 allows only one house property
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} IncomeFromHP section
   */
  buildHousePropertySection(sectionSnapshot) {
    const income = sectionSnapshot.income || {};
    const houseProperty = income.houseProperty || {};

    let annualValue = 0;
    let municipalTaxes = 0;
    let interestOnLoan = 0;

    // ITR-1 allows only one house property
    if (Array.isArray(houseProperty.properties) && houseProperty.properties.length > 0) {
      // Use first property
      const property = houseProperty.properties[0];
      annualValue = parseFloat(property.annualRentalIncome || property.annualValue || 0);
      municipalTaxes = parseFloat(property.municipalTaxes || 0);
      interestOnLoan = parseFloat(property.interestOnLoan || 0);
    } else if (houseProperty.annualRentalIncome || houseProperty.annualValue) {
      // Single property format
      annualValue = parseFloat(houseProperty.annualRentalIncome || houseProperty.annualValue || 0);
      municipalTaxes = parseFloat(houseProperty.municipalTaxes || 0);
      interestOnLoan = parseFloat(houseProperty.interestOnLoan || 0);
    } else if (typeof houseProperty === 'number') {
      // Simple number format
      annualValue = parseFloat(houseProperty);
    }

    // Calculate net annual value
    const netAnnualValue = Math.max(0, annualValue - municipalTaxes);

    // Deduction u/s 24: Interest on loan (capped at 200000) + 30% of Net Annual Value
    const interestDeduction = Math.min(200000, interestOnLoan);
    const standardDeduction = netAnnualValue * 0.3;
    const deductionUs24 = interestDeduction + standardDeduction;

    // Calculate income from house property (can be negative, but ITR-1 shows as 0 if negative)
    const incomeFromHP = Math.max(0, netAnnualValue - deductionUs24);

    return {
      AnnualValue: this.formatAmount(annualValue),
      NetAnnualValue: this.formatAmount(netAnnualValue),
      DeductionUs24: this.formatAmount(deductionUs24),
      IncomeFromHP: this.formatAmount(incomeFromHP),
    };
  }

  /**
   * Build Other Income section (PartB_TI.IncFromOthSources)
   * @param {object} sectionSnapshot - Section snapshot
   * @returns {object} IncFromOthSources section
   */
  buildOtherIncomeSection(sectionSnapshot) {
    const income = sectionSnapshot.income || {};
    
    // Map otherIncome to InterestIncome
    const interestIncome = parseFloat(income.otherIncome || income.interestIncome || 0);
    const otherIncome = parseFloat(income.otherSources || 0);
    const totalOthSrcInc = interestIncome + otherIncome;

    return {
      InterestIncome: this.formatAmount(interestIncome),
      OtherIncome: this.formatAmount(otherIncome),
      TotalOthSrcInc: this.formatAmount(totalOthSrcInc),
    };
  }

  /**
   * Build PartC (Taxes Paid, TDS, Bank Details)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} aggregatedSalary - Optional aggregated salary
   * @returns {object} PartC section
   */
  buildPartC(sectionSnapshot, aggregatedSalary = null) {
    const taxesPaid = sectionSnapshot.taxesPaid || sectionSnapshot.taxes_paid || {};
    
    // Taxes paid
    const advanceTax = parseFloat(taxesPaid.advanceTax || taxesPaid.advance_tax || 0);
    const selfAssessmentTax = parseFloat(taxesPaid.selfAssessmentTax || taxesPaid.self_assessment_tax || 0);
    const totalTaxesPaid = advanceTax + selfAssessmentTax;

    // TDS - from aggregated salary or section snapshot
    let totalTDS = 0;
    if (aggregatedSalary) {
      totalTDS = parseFloat(aggregatedSalary.totalTDS || 0);
    } else {
      totalTDS = parseFloat(taxesPaid.tds || taxesPaid.totalTDS || 0);
    }

    // Bank details
    const bankDetails = sectionSnapshot.bankDetails || sectionSnapshot.bank_details || {};
    const accountNumber = bankDetails.accountNumber || bankDetails.account_number || '';
    const ifscCode = bankDetails.ifsc || bankDetails.ifscCode || bankDetails.ifsc_code || '';
    const bankName = bankDetails.bankName || bankDetails.bank_name || '';

    return {
      TaxesPaid: {
        AdvanceTax: this.formatAmount(advanceTax),
        SelfAssessmentTax: this.formatAmount(selfAssessmentTax),
        TotalTaxesPaid: this.formatAmount(totalTaxesPaid),
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
   * Build PartD (Refund or Tax Payable)
   * @param {object} computationResult - Computation result
   * @returns {object} PartD section
   */
  buildPartD(computationResult) {
    if (!computationResult) {
      return {
        RefundOrTaxPayable: {
          RefundDue: '0.00',
          BalTaxPayable: '0.00',
        },
      };
    }

    const refundAmount = parseFloat(computationResult.refundAmount || 0);
    const finalTax = parseFloat(computationResult.finalTax || computationResult.totalTax || 0);
    const taxPaid = parseFloat(computationResult.taxPaid || 0);
    const balancePayable = Math.max(0, finalTax - taxPaid);

    return {
      RefundOrTaxPayable: {
        RefundDue: this.formatAmount(refundAmount > 0 ? refundAmount : 0),
        BalTaxPayable: this.formatAmount(refundAmount <= 0 ? balancePayable : 0),
      },
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

module.exports = new ITR1JsonBuilder();

