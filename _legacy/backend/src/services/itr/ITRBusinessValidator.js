// =====================================================
// ITR BUSINESS VALIDATOR
// Validates business rules beyond schema validation
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class ITRBusinessValidator {
  /**
   * Validate ITR-1 business rules
   * @param {object} itr1Json - ITR-1 JSON to validate
   * @param {object} sectionSnapshot - Section snapshot (for cross-validation)
   * @param {object} computationResult - Computation result (for cross-validation)
   * @returns {object} Validation result with isValid, errors, and warnings
   */
  validateITR1BusinessRules(itr1Json, sectionSnapshot = {}, computationResult = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const formITR1 = itr1Json.Form_ITR1;
      if (!formITR1) {
        result.isValid = false;
        result.errors.push({
          path: 'Form_ITR1',
          message: 'Missing Form_ITR1 root element',
          code: 'MISSING_ROOT',
        });
        return result;
      }

      // Validate TDS
      this.validateTDS(formITR1, sectionSnapshot, result);

      // Validate deduction limits
      this.validateDeductionLimits(formITR1, sectionSnapshot, result);

      // Validate tax calculation
      this.validateTaxCalculation(formITR1, computationResult, result);

      // Validate refund/tax payable
      this.validateRefundTaxPayable(formITR1, computationResult, result);

      // Validate house property
      this.validateHouseProperty(formITR1, sectionSnapshot, result);

      // Update isValid based on errors
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      enterpriseLogger.error('Error validating ITR-1 business rules', {
        error: error.message,
        stack: error.stack,
      });
      result.isValid = false;
      result.errors.push({
        path: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
      });
      return result;
    }
  }

  /**
   * Validate TDS rules (works for both ITR-1 and ITR-2)
   * @param {object} formITR - Form ITR-1 or ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateTDS(formITR, sectionSnapshot, result) {
    // ITR-1 has PartC.TDS, ITR-2 has ScheduleTDS1
    let totalTDS = 0;
    if (formITR.PartC && formITR.PartC.TDS) {
      totalTDS = parseFloat(formITR.PartC.TDS.TotalTDS || 0);
    } else if (formITR.ScheduleTDS1) {
      totalTDS = parseFloat(formITR.ScheduleTDS1.TotalTDS || 0);
    }

    // ITR-1 has PartB_TI.Salaries, ITR-2 has ScheduleS
    let grossSalary = 0;
    if (formITR.PartB_TI && formITR.PartB_TI.Salaries) {
      grossSalary = parseFloat(formITR.PartB_TI.Salaries.GrossSalary || 0);
    } else if (formITR.ScheduleS) {
      grossSalary = parseFloat(formITR.ScheduleS.GrossSalary || 0);
    }

    // TDS should not exceed gross salary
    if (totalTDS > grossSalary) {
      const tdsPath = formITR.PartC ? 'PartC.TDS.TotalTDS' : 'ScheduleTDS1.TotalTDS';
      result.errors.push({
        path: tdsPath,
        message: `Total TDS (${totalTDS}) exceeds gross salary (${grossSalary})`,
        code: 'TDS_EXCEEDS_SALARY',
      });
    }

    // Warning if TDS is very high relative to salary
    if (grossSalary > 0 && totalTDS / grossSalary > 0.3) {
      const tdsPath = formITR.PartC ? 'PartC.TDS.TotalTDS' : 'ScheduleTDS1.TotalTDS';
      result.warnings.push({
        path: tdsPath,
        message: `TDS (${totalTDS}) is more than 30% of gross salary (${grossSalary}). Please verify.`,
        code: 'HIGH_TDS_RATIO',
      });
    }
  }

  /**
   * Validate deduction limits
   * @param {object} formITR1 - Form ITR-1 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateDeductionLimits(formITR1, sectionSnapshot, result) {
    const deductions = sectionSnapshot.deductions || {};
    const partBTTI = formITR1.PartB_TTI || {};
    const deductUndChapVIA = parseFloat(partBTTI.DeductUndChapVIA || 0);

    // Section 80C limit: 150000
    const section80C = parseFloat(deductions.section80C || deductions.section_80C || 0);
    if (section80C > 150000) {
      result.errors.push({
        path: 'deductions.section80C',
        message: `Section 80C deduction (${section80C}) exceeds limit of 150000`,
        code: 'DEDUCTION_EXCEEDS_LIMIT',
      });
    }

    // Section 80D limit: 25000 (self) or 50000 (parents)
    const section80D = parseFloat(deductions.section80D || deductions.section_80D || 0);
    if (section80D > 50000) {
      result.errors.push({
        path: 'deductions.section80D',
        message: `Section 80D deduction (${section80D}) exceeds limit of 50000`,
        code: 'DEDUCTION_EXCEEDS_LIMIT',
      });
    }

    // Section 80TTA limit: 10000
    const section80TTA = parseFloat(deductions.section80TTA || deductions.section_80TTA || 0);
    if (section80TTA > 10000) {
      result.errors.push({
        path: 'deductions.section80TTA',
        message: `Section 80TTA deduction (${section80TTA}) exceeds limit of 10000`,
        code: 'DEDUCTION_EXCEEDS_LIMIT',
      });
    }

    // Section 80TTB limit: 50000 (for senior citizens)
    const section80TTB = parseFloat(deductions.section80TTB || deductions.section_80TTB || 0);
    if (section80TTB > 50000) {
      result.errors.push({
        path: 'deductions.section80TTB',
        message: `Section 80TTB deduction (${section80TTB}) exceeds limit of 50000`,
        code: 'DEDUCTION_EXCEEDS_LIMIT',
      });
    }

    // Section 80E and 80G have no limits, so no validation needed
  }

  /**
   * Validate tax calculation matches computation result (works for both ITR-1 and ITR-2)
   * @param {object} formITR - Form ITR-1 or ITR-2 object
   * @param {object} computationResult - Computation result
   * @param {object} result - Validation result object (mutated)
   */
  validateTaxCalculation(formITR, computationResult, result) {
    if (!computationResult || Object.keys(computationResult).length === 0) {
      result.warnings.push({
        path: 'taxCalculation',
        message: 'No computation result provided for validation',
        code: 'NO_COMPUTATION_RESULT',
      });
      return;
    }

    const partBTTI = formITR.PartB_TTI || {};

    // Validate GrossTotIncome
    const jsonGrossTotIncome = parseFloat(partBTTI.GrossTotIncome || 0);
    const computedGrossTotIncome = parseFloat(computationResult.grossTotalIncome || 0);
    const grossIncomeDiff = Math.abs(jsonGrossTotIncome - computedGrossTotIncome);
    if (grossIncomeDiff > 1) { // Allow 1 rupee difference for rounding
      result.errors.push({
        path: 'PartB_TTI.GrossTotIncome',
        message: `Gross total income mismatch: JSON (${jsonGrossTotIncome}) vs Computation (${computedGrossTotIncome})`,
        code: 'TAX_CALCULATION_MISMATCH',
      });
    }

    // Validate TotalIncome (taxable income)
    const jsonTotalIncome = parseFloat(partBTTI.TotalIncome || 0);
    const computedTaxableIncome = parseFloat(computationResult.taxableIncome || 0);
    const totalIncomeDiff = Math.abs(jsonTotalIncome - computedTaxableIncome);
    if (totalIncomeDiff > 1) {
      result.errors.push({
        path: 'PartB_TTI.TotalIncome',
        message: `Total income mismatch: JSON (${jsonTotalIncome}) vs Computation (${computedTaxableIncome})`,
        code: 'TAX_CALCULATION_MISMATCH',
      });
    }

    // Validate TaxPayableOnTI
    const jsonTaxPayable = parseFloat(partBTTI.TaxPayableOnTI || 0);
    const computedFinalTax = parseFloat(computationResult.finalTax || computationResult.totalTax || 0);
    const taxPayableDiff = Math.abs(jsonTaxPayable - computedFinalTax);
    if (taxPayableDiff > 1) {
      result.errors.push({
        path: 'PartB_TTI.TaxPayableOnTI',
        message: `Tax payable mismatch: JSON (${jsonTaxPayable}) vs Computation (${computedFinalTax})`,
        code: 'TAX_CALCULATION_MISMATCH',
      });
    }
  }

  /**
   * Validate refund/tax payable calculation (works for both ITR-1 and ITR-2)
   * @param {object} formITR - Form ITR-1 or ITR-2 object
   * @param {object} computationResult - Computation result
   * @param {object} result - Validation result object (mutated)
   */
  validateRefundTaxPayable(formITR, computationResult, result) {
    if (!computationResult || Object.keys(computationResult).length === 0) {
      return;
    }

    // ITR-1 has PartD, ITR-2 may not have PartD (check both)
    const partD = formITR.PartD || {};
    const refundOrTaxPayable = partD.RefundOrTaxPayable || {};

    const jsonRefundDue = parseFloat(refundOrTaxPayable.RefundDue || 0);
    const jsonBalTaxPayable = parseFloat(refundOrTaxPayable.BalTaxPayable || 0);

    const computedRefundAmount = parseFloat(computationResult.refundAmount || 0);
    const computedFinalTax = parseFloat(computationResult.finalTax || computationResult.totalTax || 0);
    const computedTaxPaid = parseFloat(computationResult.taxPaid || 0);
    const computedBalancePayable = Math.max(0, computedFinalTax - computedTaxPaid);

    // Validate refund
    if (computedRefundAmount > 0) {
      const refundDiff = Math.abs(jsonRefundDue - computedRefundAmount);
      if (refundDiff > 1) {
        result.errors.push({
          path: 'PartD.RefundOrTaxPayable.RefundDue',
          message: `Refund amount mismatch: JSON (${jsonRefundDue}) vs Computation (${computedRefundAmount})`,
          code: 'REFUND_MISMATCH',
        });
      }
      // If refund, balance payable should be 0
      if (jsonBalTaxPayable > 1) {
        result.warnings.push({
          path: 'PartD.RefundOrTaxPayable.BalTaxPayable',
          message: `Balance tax payable (${jsonBalTaxPayable}) should be 0 when refund is due`,
          code: 'REFUND_TAX_PAYABLE_CONFLICT',
        });
      }
    } else {
      // If no refund, validate balance payable
      const balanceDiff = Math.abs(jsonBalTaxPayable - computedBalancePayable);
      if (balanceDiff > 1) {
        result.errors.push({
          path: 'PartD.RefundOrTaxPayable.BalTaxPayable',
          message: `Balance tax payable mismatch: JSON (${jsonBalTaxPayable}) vs Computation (${computedBalancePayable})`,
          code: 'TAX_PAYABLE_MISMATCH',
        });
      }
      // If tax payable, refund should be 0
      if (jsonRefundDue > 1) {
        result.warnings.push({
          path: 'PartD.RefundOrTaxPayable.RefundDue',
          message: `Refund due (${jsonRefundDue}) should be 0 when tax is payable`,
          code: 'REFUND_TAX_PAYABLE_CONFLICT',
        });
      }
    }
  }

  /**
   * Validate ITR-2 business rules
   * @param {object} itr2Json - ITR-2 JSON to validate
   * @param {object} sectionSnapshot - Section snapshot (for cross-validation)
   * @param {object} computationResult - Computation result (for cross-validation)
   * @returns {object} Validation result with isValid, errors, and warnings
   */
  validateITR2BusinessRules(itr2Json, sectionSnapshot = {}, computationResult = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const formITR2 = itr2Json.Form_ITR2;
      if (!formITR2) {
        result.isValid = false;
        result.errors.push({
          path: 'Form_ITR2',
          message: 'Missing Form_ITR2 root element',
          code: 'MISSING_ROOT',
        });
        return result;
      }

      // Validate TDS (same as ITR-1)
      this.validateTDS(formITR2, sectionSnapshot, result);

      // Validate deduction limits (same as ITR-1)
      this.validateDeductionLimits(formITR2, sectionSnapshot, result);

      // Validate tax calculation (same as ITR-1)
      this.validateTaxCalculation(formITR2, computationResult, result);

      // Validate refund/tax payable (same as ITR-1)
      this.validateRefundTaxPayable(formITR2, computationResult, result);

      // ITR-2 specific validations
      this.validateITR2CapitalGains(formITR2, sectionSnapshot, result);
      this.validateITR2HouseProperty(formITR2, sectionSnapshot, result);
      this.validateITR2ExemptIncome(formITR2, sectionSnapshot, result);
      this.validateITR2ForeignAssets(formITR2, sectionSnapshot, result);
      this.validateITR2NoBusinessIncome(formITR2, sectionSnapshot, result);

      // Update isValid based on errors
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      enterpriseLogger.error('Error validating ITR-2 business rules', {
        error: error.message,
        stack: error.stack,
      });
      result.isValid = false;
      result.errors.push({
        path: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
      });
      return result;
    }
  }

  /**
   * Validate ITR-2 capital gains
   * @param {object} formITR2 - Form ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR2CapitalGains(formITR2, sectionSnapshot, result) {
    const scheduleCG = formITR2.ScheduleCG || {};
    const income = sectionSnapshot.income || {};
    const capitalGains = income.capitalGains || {};

    const hasSTCG = capitalGains.stcgDetails && Array.isArray(capitalGains.stcgDetails) && capitalGains.stcgDetails.length > 0;
    const hasLTCG = capitalGains.ltcgDetails && Array.isArray(capitalGains.ltcgDetails) && capitalGains.ltcgDetails.length > 0;

    // If capital gains exist in snapshot, Schedule CG must be present and non-zero
    if (hasSTCG || hasLTCG) {
      const stcgTotal = parseFloat(scheduleCG.STCG?.total || 0);
      const ltcgTotal = parseFloat(scheduleCG.LTCG?.total || 0);
      const totalCG = parseFloat(scheduleCG.TotalCapitalGains || 0);

      if (totalCG === 0) {
        result.errors.push({
          path: 'ScheduleCG.TotalCapitalGains',
          message: 'Schedule CG is present but TotalCapitalGains is zero when capital gains exist',
          code: 'CG_SCHEDULE_MISMATCH',
        });
      }

      // Validate STCG entries match snapshot
      if (hasSTCG && (!scheduleCG.STCG || !scheduleCG.STCG.entries || scheduleCG.STCG.entries.length === 0)) {
        result.errors.push({
          path: 'ScheduleCG.STCG',
          message: 'STCG details exist in snapshot but Schedule CG STCG entries are missing',
          code: 'STCG_ENTRIES_MISSING',
        });
      }

      // Validate LTCG entries match snapshot
      if (hasLTCG && (!scheduleCG.LTCG || !scheduleCG.LTCG.entries || scheduleCG.LTCG.entries.length === 0)) {
        result.errors.push({
          path: 'ScheduleCG.LTCG',
          message: 'LTCG details exist in snapshot but Schedule CG LTCG entries are missing',
          code: 'LTCG_ENTRIES_MISSING',
        });
      }
    }

    // Validate section codes are correct
    if (scheduleCG.STCG && scheduleCG.STCG.entries) {
      for (const entry of scheduleCG.STCG.entries) {
        if (!entry.SectionCode || (entry.SectionCode !== '111A' && entry.SectionCode !== 'non-111A')) {
          result.warnings.push({
            path: 'ScheduleCG.STCG.entries.SectionCode',
            message: `Invalid STCG section code: ${entry.SectionCode}`,
            code: 'INVALID_STCG_SECTION_CODE',
          });
        }
      }
    }

    if (scheduleCG.LTCG && scheduleCG.LTCG.entries) {
      for (const entry of scheduleCG.LTCG.entries) {
        if (!entry.SectionCode || (entry.SectionCode !== '112' && entry.SectionCode !== '112A')) {
          result.warnings.push({
            path: 'ScheduleCG.LTCG.entries.SectionCode',
            message: `Invalid LTCG section code: ${entry.SectionCode}`,
            code: 'INVALID_LTCG_SECTION_CODE',
          });
        }
      }
    }
  }

  /**
   * Validate ITR-2 house property (multiple properties allowed)
   * @param {object} formITR2 - Form ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR2HouseProperty(formITR2, sectionSnapshot, result) {
    const scheduleHP = formITR2.ScheduleHP || [];
    const income = sectionSnapshot.income || {};
    const houseProperty = income.houseProperty || {};

    // ITR-2 allows multiple properties
    const properties = Array.isArray(houseProperty.properties) ? houseProperty.properties : 
                      (houseProperty.properties ? [houseProperty.properties] : []);

    // Validate HP count matches
    if (properties.length !== scheduleHP.length) {
      result.warnings.push({
        path: 'ScheduleHP',
        message: `House property count mismatch: snapshot has ${properties.length}, schedule has ${scheduleHP.length}`,
        code: 'HP_COUNT_MISMATCH',
      });
    }

    // Validate each property
    for (let i = 0; i < scheduleHP.length; i++) {
      const hp = scheduleHP[i];
      const incomeFromHP = parseFloat(hp.IncomeFromHP || 0);

      // ITR-2 allows negative income (loss) for let-out properties
      // But self-occupied loss should be 0
      if (hp.PropertyType === 'Self-Occupied' && incomeFromHP < 0) {
        result.errors.push({
          path: `ScheduleHP[${i}].IncomeFromHP`,
          message: `Self-occupied property income cannot be negative: ${incomeFromHP}`,
          code: 'SELF_OCCUPIED_NEGATIVE_INCOME',
        });
      }

      // Validate interest deduction
      const deductionUs24 = parseFloat(hp.DeductionUs24 || 0);
      if (hp.PropertyType === 'Let-Out' && deductionUs24 > 200000) {
        result.errors.push({
          path: `ScheduleHP[${i}].DeductionUs24`,
          message: `Interest deduction u/s 24 (${deductionUs24}) exceeds limit of 200000 for let-out property`,
          code: 'INTEREST_DEDUCTION_EXCEEDS_LIMIT',
        });
      }
    }
  }

  /**
   * Validate ITR-2 exempt income (critical: agricultural income > ₹5,000)
   * @param {object} formITR2 - Form ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR2ExemptIncome(formITR2, sectionSnapshot, result) {
    const scheduleEI = formITR2.ScheduleEI || {};
    const exemptIncome = sectionSnapshot.exemptIncome || sectionSnapshot.exempt_income || {};
    const agriculturalIncome = exemptIncome.agriculturalIncome || {};
    const netAgriculturalIncome = parseFloat(
      agriculturalIncome.netAgriculturalIncome ||
      exemptIncome.netAgriculturalIncome ||
      sectionSnapshot.income?.agriculturalIncome ||
      0
    );

    // Critical: If agricultural income > ₹5,000, Schedule EI must include it
    if (netAgriculturalIncome > 5000) {
      const exemptEntries = scheduleEI.ExemptIncome?.entries || [];
      const hasAgriIncome = exemptEntries.some(entry => 
        entry.IncomeType === 'Agricultural Income' && parseFloat(entry.Amount || 0) > 0
      );

      if (!hasAgriIncome) {
        result.errors.push({
          path: 'ScheduleEI.ExemptIncome',
          message: `Agricultural income (${netAgriculturalIncome}) exceeds ₹5,000 but is missing from Schedule EI`,
          code: 'MISSING_AGRICULTURAL_INCOME_IN_EI',
        });
      }
    }

    // Validate exempt income total
    const exemptTotal = parseFloat(scheduleEI.ExemptIncome?.total || 0);
    if (exemptTotal < 0) {
      result.errors.push({
        path: 'ScheduleEI.ExemptIncome.total',
        message: `Exempt income total cannot be negative: ${exemptTotal}`,
        code: 'NEGATIVE_EXEMPT_INCOME',
      });
    }
  }

  /**
   * Validate ITR-2 foreign assets (conditional)
   * @param {object} formITR2 - Form ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR2ForeignAssets(formITR2, sectionSnapshot, result) {
    const scheduleFA = formITR2.ScheduleFA;
    const income = sectionSnapshot.income || {};
    const foreignIncome = income.foreignIncome || {};
    const hasForeignIncome = foreignIncome.hasForeignIncome || 
                             (foreignIncome.foreignIncomeDetails && foreignIncome.foreignIncomeDetails.length > 0);

    // If foreign income exists, Schedule FA should be present
    if (hasForeignIncome && !scheduleFA) {
      result.warnings.push({
        path: 'ScheduleFA',
        message: 'Foreign income exists but Schedule FA is missing',
        code: 'MISSING_SCHEDULE_FA',
      });
    }

    // If Schedule FA exists, validate it's not empty
    if (scheduleFA) {
      const totalValue = parseFloat(scheduleFA.TotalValue || 0);
      if (totalValue === 0) {
        result.warnings.push({
          path: 'ScheduleFA.TotalValue',
          message: 'Schedule FA is present but TotalValue is zero',
          code: 'EMPTY_SCHEDULE_FA',
        });
      }

      // Validate at least one asset type has entries
      const hasAssets = (scheduleFA.BankAccounts && scheduleFA.BankAccounts.length > 0) ||
                       (scheduleFA.EquityHoldings && scheduleFA.EquityHoldings.length > 0) ||
                       (scheduleFA.ImmovableProperties && scheduleFA.ImmovableProperties.length > 0) ||
                       (scheduleFA.OtherAssets && scheduleFA.OtherAssets.length > 0);

      if (!hasAssets) {
        result.errors.push({
          path: 'ScheduleFA',
          message: 'Schedule FA is present but has no asset entries',
          code: 'EMPTY_SCHEDULE_FA_ENTRIES',
        });
      }
    }
  }

  /**
   * Validate ITR-2 has no business income
   * @param {object} formITR2 - Form ITR-2 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR2NoBusinessIncome(formITR2, sectionSnapshot, result) {
    const income = sectionSnapshot.income || {};
    const businessIncome = parseFloat(income.businessIncome || income.business_income || 0);
    const professionalIncome = parseFloat(income.professionalIncome || income.professional_income || 0);

    // ITR-2 does not allow business or professional income
    if (businessIncome > 0) {
      result.errors.push({
        path: 'income.businessIncome',
        message: `ITR-2 does not allow business income (${businessIncome}). Use ITR-3 instead.`,
        code: 'ITR2_BUSINESS_INCOME_NOT_ALLOWED',
      });
    }

    if (professionalIncome > 0) {
      result.errors.push({
        path: 'income.professionalIncome',
        message: `ITR-2 does not allow professional income (${professionalIncome}). Use ITR-3 instead.`,
        code: 'ITR2_PROFESSIONAL_INCOME_NOT_ALLOWED',
      });
    }

    // Check for Schedule BP (should not exist in ITR-2)
    if (formITR2.ScheduleBP) {
      result.errors.push({
        path: 'ScheduleBP',
        message: 'Schedule BP (Business/Profession) should not exist in ITR-2',
        code: 'ITR2_SCHEDULE_BP_NOT_ALLOWED',
      });
    }
  }

  /**
   * Validate ITR-3 business rules
   * @param {object} itr3Json - ITR-3 JSON to validate
   * @param {object} sectionSnapshot - Section snapshot (for cross-validation)
   * @param {object} computationResult - Computation result (for cross-validation)
   * @returns {object} Validation result with isValid, errors, and warnings
   */
  validateITR3BusinessRules(itr3Json, sectionSnapshot = {}, computationResult = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const formITR3 = itr3Json.Form_ITR3;
      if (!formITR3) {
        result.isValid = false;
        result.errors.push({
          path: 'Form_ITR3',
          message: 'Missing Form_ITR3 root element',
          code: 'MISSING_ROOT',
        });
        return result;
      }

      // Validate TDS (same as ITR-1/ITR-2)
      this.validateTDS(formITR3, sectionSnapshot, result);

      // Validate deduction limits (same as ITR-1/ITR-2)
      this.validateDeductionLimits(formITR3, sectionSnapshot, result);

      // Validate tax calculation (same as ITR-1/ITR-2)
      this.validateTaxCalculation(formITR3, computationResult, result);

      // Validate refund/tax payable (same as ITR-1/ITR-2)
      this.validateRefundTaxPayable(formITR3, computationResult, result);

      // ITR-3 specific validations (STRICT)
      this.validateITR3ScheduleBP(formITR3, sectionSnapshot, result);
      this.validateITR3ProfitAndLoss(formITR3, sectionSnapshot, result);
      this.validateITR3BalanceSheet(formITR3, sectionSnapshot, result);
      this.validateITR3PandLBalanceSheetConsistency(formITR3, sectionSnapshot, result);
      this.validateITR3Depreciation(formITR3, sectionSnapshot, result);
      this.validateITR3NoPresumptiveIncome(formITR3, sectionSnapshot, result);
      this.validateITR3CapitalGains(formITR3, sectionSnapshot, result);

      // Update isValid based on errors
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      enterpriseLogger.error('Error validating ITR-3 business rules', {
        error: error.message,
        stack: error.stack,
      });
      result.isValid = false;
      result.errors.push({
        path: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
      });
      return result;
    }
  }

  /**
   * Validate ITR-3 Schedule BP (Business/Profession)
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3ScheduleBP(formITR3, sectionSnapshot, result) {
    const scheduleBP = formITR3.ScheduleBP || {};
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    const hasBusinesses = businessIncome.businesses && Array.isArray(businessIncome.businesses) && businessIncome.businesses.length > 0;
    const hasProfessions = professionalIncome.professions && Array.isArray(professionalIncome.professions) && professionalIncome.professions.length > 0;

    // Schedule BP must exist if business/professional income exists
    if ((hasBusinesses || hasProfessions) && (!scheduleBP.Businesses || !scheduleBP.Professions)) {
      result.errors.push({
        path: 'ScheduleBP',
        message: 'Schedule BP is missing when business/professional income exists',
        code: 'MISSING_SCHEDULE_BP',
      });
    }

    // Validate business entries match snapshot
    if (hasBusinesses) {
      const jsonBusinesses = scheduleBP.Businesses || [];
      if (jsonBusinesses.length !== businessIncome.businesses.length) {
        result.errors.push({
          path: 'ScheduleBP.Businesses',
          message: `Business count mismatch: snapshot has ${businessIncome.businesses.length}, schedule has ${jsonBusinesses.length}`,
          code: 'BUSINESS_COUNT_MISMATCH',
        });
      }

      // Validate net profit matches P&L
      for (let i = 0; i < jsonBusinesses.length; i++) {
        const jsonBusiness = jsonBusinesses[i];
        const snapshotBusiness = businessIncome.businesses[i];
        const jsonNetProfit = parseFloat(jsonBusiness.NetProfit || 0);
        const snapshotNetProfit = parseFloat(snapshotBusiness.pnl?.netProfit || 0);

        if (snapshotNetProfit !== 0 && Math.abs(jsonNetProfit - snapshotNetProfit) > 0.01) {
          result.errors.push({
            path: `ScheduleBP.Businesses[${i}].NetProfit`,
            message: `Net profit mismatch: JSON (${jsonNetProfit}) vs Snapshot (${snapshotNetProfit})`,
            code: 'NET_PROFIT_MISMATCH',
          });
        }
      }
    }

    // Validate profession entries match snapshot
    if (hasProfessions) {
      const jsonProfessions = scheduleBP.Professions || [];
      if (jsonProfessions.length !== professionalIncome.professions.length) {
        result.errors.push({
          path: 'ScheduleBP.Professions',
          message: `Profession count mismatch: snapshot has ${professionalIncome.professions.length}, schedule has ${jsonProfessions.length}`,
          code: 'PROFESSION_COUNT_MISMATCH',
        });
      }
    }
  }

  /**
   * Validate ITR-3 Profit & Loss Account (MANDATORY)
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3ProfitAndLoss(formITR3, sectionSnapshot, result) {
    const partAPL = formITR3.PartA_PL;
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    const hasBusinessIncome = (businessIncome.businesses && businessIncome.businesses.length > 0) ||
                             (professionalIncome.professions && professionalIncome.professions.length > 0);

    // P&L is MANDATORY if business/professional income exists
    if (hasBusinessIncome && !partAPL) {
      result.errors.push({
        path: 'PartA_PL',
        message: 'Profit & Loss Account is MANDATORY for ITR-3 when business/professional income exists',
        code: 'MISSING_PL_MANDATORY',
      });
      return;
    }

    if (!partAPL) {
      return; // No business income, no P&L required
    }

    // Validate turnover is non-negative
    const turnover = parseFloat(partAPL.Turnover || 0);
    if (turnover < 0) {
      result.errors.push({
        path: 'PartA_PL.Turnover',
        message: `Turnover cannot be negative: ${turnover}`,
        code: 'NEGATIVE_TURNOVER',
      });
    }

    // Validate totals reconcile
    const directExpensesTotal = parseFloat(partAPL.DirectExpenses?.Total || 0);
    const indirectExpensesTotal = parseFloat(partAPL.IndirectExpenses?.Total || 0);
    const depreciation = parseFloat(partAPL.Depreciation || 0);
    const otherExpenses = parseFloat(partAPL.OtherExpenses || 0);
    const openingStock = parseFloat(partAPL.OpeningStock || 0);
    const closingStock = parseFloat(partAPL.ClosingStock || 0);
    const purchases = parseFloat(partAPL.Purchases || 0);
    const netProfit = parseFloat(partAPL.NetProfit || 0);

    // Calculate expected net profit
    const expectedNetProfit = turnover +
      openingStock -
      closingStock -
      purchases -
      directExpensesTotal -
      indirectExpensesTotal -
      depreciation -
      otherExpenses;

    if (Math.abs(netProfit - expectedNetProfit) > 0.01) {
      result.errors.push({
        path: 'PartA_PL.NetProfit',
        message: `Net profit calculation mismatch: JSON (${netProfit}) vs Calculated (${expectedNetProfit})`,
        code: 'PL_CALCULATION_MISMATCH',
      });
    }
  }

  /**
   * Validate ITR-3 Balance Sheet (MANDATORY)
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3BalanceSheet(formITR3, sectionSnapshot, result) {
    const partABS = formITR3.PartA_BS;
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    const hasBusinessIncome = (businessIncome.businesses && businessIncome.businesses.length > 0) ||
                             (professionalIncome.professions && professionalIncome.professions.length > 0);

    // Balance Sheet is MANDATORY if business/professional income exists
    if (hasBusinessIncome && !partABS) {
      result.errors.push({
        path: 'PartA_BS',
        message: 'Balance Sheet is MANDATORY for ITR-3 when business/professional income exists',
        code: 'MISSING_BS_MANDATORY',
      });
      return;
    }

    if (!partABS) {
      return; // No business income, no BS required
    }

    // Validate balance: Assets = Liabilities + Capital
    const totalAssets = parseFloat(partABS.Assets?.TotalAssets || 0);
    const totalLiabilities = parseFloat(partABS.Liabilities?.TotalLiabilities || 0);
    const capital = parseFloat(partABS.Liabilities?.Capital || 0);
    const expectedLiabilities = totalLiabilities + capital;

    if (Math.abs(totalAssets - expectedLiabilities) > 0.01) {
      result.errors.push({
        path: 'PartA_BS',
        message: `Balance Sheet does not balance: Assets (${totalAssets}) != Liabilities + Capital (${expectedLiabilities})`,
        code: 'BALANCE_SHEET_NOT_BALANCED',
      });
    }

    // Validate no zero-filled dummy nodes
    if (totalAssets === 0 && totalLiabilities === 0 && capital === 0) {
      result.warnings.push({
        path: 'PartA_BS',
        message: 'Balance Sheet has all zero values. Please verify if this is correct.',
        code: 'ZERO_BALANCE_SHEET',
      });
    }
  }

  /**
   * Validate P&L and Balance Sheet consistency
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3PandLBalanceSheetConsistency(formITR3, sectionSnapshot, result) {
    const partAPL = formITR3.PartA_PL;
    const partABS = formITR3.PartA_BS;

    if (!partAPL || !partABS) {
      return; // Both must exist for consistency check
    }

    // Net profit from P&L should affect capital in Balance Sheet
    // This is a simplified check - actual accounting rules are more complex
    const netProfit = parseFloat(partAPL.NetProfit || 0);
    const capital = parseFloat(partABS.Liabilities?.Capital || 0);

    // Warning if capital is zero but there's profit
    if (netProfit > 0 && capital === 0) {
      result.warnings.push({
        path: 'PartA_BS.Liabilities.Capital',
        message: `Net profit (${netProfit}) exists but capital is zero. Please verify Balance Sheet.`,
        code: 'CAPITAL_ZERO_WITH_PROFIT',
      });
    }
  }

  /**
   * Validate ITR-3 Depreciation
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3Depreciation(formITR3, sectionSnapshot, result) {
    const scheduleDEP = formITR3.ScheduleDEP;
    const partABS = formITR3.PartA_BS;
    const partAPL = formITR3.PartA_PL;

    if (!scheduleDEP) {
      return; // Depreciation is optional
    }

    // Validate depreciation in Schedule DEP matches P&L
    const depInSchedule = parseFloat(scheduleDEP.TotalDepreciation || 0);
    const depInPL = parseFloat(partAPL?.Depreciation || 0);

    if (Math.abs(depInSchedule - depInPL) > 0.01) {
      result.errors.push({
        path: 'ScheduleDEP.TotalDepreciation',
        message: `Depreciation mismatch: Schedule DEP (${depInSchedule}) vs P&L (${depInPL})`,
        code: 'DEPRECIATION_MISMATCH',
      });
    }

    // Validate depreciation aligns with fixed assets in Balance Sheet
    if (partABS) {
      const fixedAssetsTotal = parseFloat(partABS.Assets?.FixedAssets?.Total || 0);
      if (fixedAssetsTotal > 0 && depInSchedule === 0) {
        result.warnings.push({
          path: 'ScheduleDEP',
          message: `Fixed assets (${fixedAssetsTotal}) exist but no depreciation claimed`,
          code: 'NO_DEPRECIATION_WITH_FIXED_ASSETS',
        });
      }
    }
  }

  /**
   * Validate ITR-3 has no presumptive income
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3NoPresumptiveIncome(formITR3, sectionSnapshot, result) {
    const income = sectionSnapshot.income || {};
    const presumptiveBusiness = parseFloat(income.presumptiveBusiness || income.presumptive_business || 0);
    const presumptiveProfessional = parseFloat(income.presumptiveProfessional || income.presumptive_professional || 0);

    // ITR-3 does not allow presumptive taxation (that's ITR-4)
    if (presumptiveBusiness > 0) {
      result.errors.push({
        path: 'income.presumptiveBusiness',
        message: `ITR-3 does not allow presumptive business income (${presumptiveBusiness}). Use ITR-4 instead.`,
        code: 'ITR3_PRESUMPTIVE_BUSINESS_NOT_ALLOWED',
      });
    }

    if (presumptiveProfessional > 0) {
      result.errors.push({
        path: 'income.presumptiveProfessional',
        message: `ITR-3 does not allow presumptive professional income (${presumptiveProfessional}). Use ITR-4 instead.`,
        code: 'ITR3_PRESUMPTIVE_PROFESSIONAL_NOT_ALLOWED',
      });
    }
  }

  /**
   * Validate ITR-3 capital gains (reuse ITR-2 validation)
   * @param {object} formITR3 - Form ITR-3 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR3CapitalGains(formITR3, sectionSnapshot, result) {
    // Reuse ITR-2 capital gains validation
    this.validateITR2CapitalGains(formITR3, sectionSnapshot, result);
  }

  /**
   * Validate ITR-4 business rules
   * @param {object} itr4Json - ITR-4 JSON to validate
   * @param {object} sectionSnapshot - Section snapshot (for cross-validation)
   * @param {object} computationResult - Computation result (for cross-validation)
   * @returns {object} Validation result with isValid, errors, and warnings
   */
  validateITR4BusinessRules(itr4Json, sectionSnapshot = {}, computationResult = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const formITR4 = itr4Json.Form_ITR4;
      if (!formITR4) {
        result.isValid = false;
        result.errors.push({
          path: 'Form_ITR4',
          message: 'Missing Form_ITR4 root element',
          code: 'MISSING_ROOT',
        });
        return result;
      }

      // Validate TDS (same as other ITR types)
      this.validateTDS(formITR4, sectionSnapshot, result);

      // Validate deduction limits (same as other ITR types)
      this.validateDeductionLimits(formITR4, sectionSnapshot, result);

      // Validate tax calculation (same as other ITR types)
      this.validateTaxCalculation(formITR4, computationResult, result);

      // Validate refund/tax payable (same as other ITR types)
      this.validateRefundTaxPayable(formITR4, computationResult, result);

      // ITR-4 specific validations (STRICT)
      this.validateITR4ScheduleBP(formITR4, sectionSnapshot, result);
      this.validateITR4NoPLBS(formITR4, sectionSnapshot, result);
      this.validateITR4NoRegularBusiness(formITR4, sectionSnapshot, result);
      this.validateITR4NoCapitalGains(formITR4, sectionSnapshot, result);

      // Update isValid based on errors
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      enterpriseLogger.error('Error validating ITR-4 business rules', {
        error: error.message,
        stack: error.stack,
      });
      result.isValid = false;
      result.errors.push({
        path: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
      });
      return result;
    }
  }

  /**
   * Validate ITR-4 Schedule BP (Presumptive)
   * @param {object} formITR4 - Form ITR-4 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR4ScheduleBP(formITR4, sectionSnapshot, result) {
    const scheduleBP = formITR4.ScheduleBP || {};
    const income = sectionSnapshot.income || {};
    const presumptiveBusiness = income.presumptiveBusiness || income.presumptive_business || {};
    const presumptiveProfessional = income.presumptiveProfessional || income.presumptive_professional || {};
    const goodsCarriage = income.goodsCarriage || sectionSnapshot.goodsCarriage || {};

    const hasPresumptiveBusiness = presumptiveBusiness && (presumptiveBusiness.hasPresumptiveBusiness || presumptiveBusiness.presumptiveIncome > 0);
    const hasPresumptiveProfessional = presumptiveProfessional && (presumptiveProfessional.hasPresumptiveProfessional || presumptiveProfessional.presumptiveIncome > 0);
    const hasGoodsCarriage = goodsCarriage && (goodsCarriage.hasGoodsCarriage || (goodsCarriage.vehicles && goodsCarriage.vehicles.length > 0));

    // Schedule BP must exist if presumptive income exists
    if ((hasPresumptiveBusiness || hasPresumptiveProfessional || hasGoodsCarriage) && !scheduleBP.NatOfBus44AD) {
      result.errors.push({
        path: 'ScheduleBP',
        message: 'Schedule BP is missing when presumptive income exists',
        code: 'MISSING_SCHEDULE_BP',
      });
    }

    // Validate turnover limits
    if (hasPresumptiveBusiness) {
      const grossTurnover = parseFloat(presumptiveBusiness.grossReceipts || presumptiveBusiness.grossTurnover || 0);
      const maxTurnover = 2000000; // ₹20 lakh for business

      if (grossTurnover > maxTurnover) {
        result.errors.push({
          path: 'ScheduleBP.PresumpIncDtls.GrossTurnoverReceipts',
          message: `Gross turnover (${grossTurnover}) exceeds limit of ₹${maxTurnover} for Section 44AD`,
          code: 'TURNOVER_LIMIT_EXCEEDED',
        });
      }
    }

    if (hasPresumptiveProfessional) {
      const grossReceipts = parseFloat(presumptiveProfessional.grossReceipts || 0);
      const maxReceipts = 500000; // ₹5 lakh for profession

      if (grossReceipts > maxReceipts) {
        result.errors.push({
          path: 'ScheduleBP.PresumpProfDtls.GrossReceipts',
          message: `Gross receipts (${grossReceipts}) exceeds limit of ₹${maxReceipts} for Section 44ADA`,
          code: 'RECEIPTS_LIMIT_EXCEEDED',
        });
      }
    }

    // Validate section codes
    if (scheduleBP.Section44ADDetails && scheduleBP.Section44ADDetails.SectionCode !== '44AD') {
      result.errors.push({
        path: 'ScheduleBP.Section44ADDetails.SectionCode',
        message: `Invalid section code: ${scheduleBP.Section44ADDetails.SectionCode}. Must be 44AD.`,
        code: 'INVALID_SECTION_CODE',
      });
    }

    if (scheduleBP.PresumpProfDtls && scheduleBP.PresumpProfDtls.SectionCode !== '44ADA') {
      result.errors.push({
        path: 'ScheduleBP.PresumpProfDtls.SectionCode',
        message: `Invalid section code: ${scheduleBP.PresumpProfDtls.SectionCode}. Must be 44ADA.`,
        code: 'INVALID_SECTION_CODE',
      });
    }
  }

  /**
   * Validate ITR-4 has NO P&L, NO Balance Sheet, NO Depreciation
   * @param {object} formITR4 - Form ITR-4 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR4NoPLBS(formITR4, sectionSnapshot, result) {
    // P&L must NOT exist
    if (formITR4.PartA_PL) {
      result.errors.push({
        path: 'PartA_PL',
        message: 'Profit & Loss Account must NOT exist in ITR-4. Use ITR-3 for regular business income.',
        code: 'ITR4_PL_NOT_ALLOWED',
      });
    }

    // Balance Sheet must NOT exist
    if (formITR4.PartA_BS) {
      result.errors.push({
        path: 'PartA_BS',
        message: 'Balance Sheet must NOT exist in ITR-4. Use ITR-3 for regular business income.',
        code: 'ITR4_BS_NOT_ALLOWED',
      });
    }

    // Depreciation schedule must NOT exist
    if (formITR4.ScheduleDEP) {
      result.errors.push({
        path: 'ScheduleDEP',
        message: 'Depreciation schedule must NOT exist in ITR-4. Use ITR-3 for regular business income.',
        code: 'ITR4_DEP_NOT_ALLOWED',
      });
    }

    // Check snapshot for accounting data
    if (sectionSnapshot.balanceSheet || sectionSnapshot.balance_sheet) {
      result.errors.push({
        path: 'sectionSnapshot.balanceSheet',
        message: 'Balance Sheet data found in snapshot for ITR-4. This is not allowed.',
        code: 'ITR4_BALANCE_SHEET_IN_SNAPSHOT',
      });
    }
  }

  /**
   * Validate ITR-4 has NO regular business income
   * @param {object} formITR4 - Form ITR-4 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR4NoRegularBusiness(formITR4, sectionSnapshot, result) {
    const income = sectionSnapshot.income || {};
    const businessIncome = income.businessIncome || {};
    const professionalIncome = income.professionalIncome || {};

    // Regular business income (with P&L) must NOT exist
    if (businessIncome.businesses && Array.isArray(businessIncome.businesses) && businessIncome.businesses.length > 0) {
      result.errors.push({
        path: 'income.businessIncome.businesses',
        message: 'Regular business income with P&L found. ITR-4 only allows presumptive business income. Use ITR-3 instead.',
        code: 'ITR4_REGULAR_BUSINESS_NOT_ALLOWED',
      });
    }

    // Regular professional income (with P&L) must NOT exist
    if (professionalIncome.professions && Array.isArray(professionalIncome.professions) && professionalIncome.professions.length > 0) {
      result.errors.push({
        path: 'income.professionalIncome.professions',
        message: 'Regular professional income with P&L found. ITR-4 only allows presumptive professional income. Use ITR-3 instead.',
        code: 'ITR4_REGULAR_PROFESSIONAL_NOT_ALLOWED',
      });
    }

    // Check for P&L data in businesses/professions
    if (businessIncome.businesses) {
      for (const business of businessIncome.businesses) {
        if (business.pnl) {
          result.errors.push({
            path: 'income.businessIncome.businesses.pnl',
            message: 'P&L data found in business income. ITR-4 does not allow P&L. Use ITR-3 instead.',
            code: 'ITR4_PL_DATA_IN_BUSINESS',
          });
        }
      }
    }
  }

  /**
   * Validate ITR-4 has NO capital gains schedule
   * @param {object} formITR4 - Form ITR-4 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateITR4NoCapitalGains(formITR4, sectionSnapshot, result) {
    // Schedule CG must NOT exist in ITR-4
    if (formITR4.ScheduleCG) {
      result.errors.push({
        path: 'ScheduleCG',
        message: 'Schedule CG (Capital Gains) must NOT exist in ITR-4. Capital gains are not allowed in ITR-4.',
        code: 'ITR4_CAPITAL_GAINS_NOT_ALLOWED',
      });
    }

    // Check snapshot for capital gains
    const income = sectionSnapshot.income || {};
    const capitalGains = income.capitalGains || {};
    const hasCapitalGains = capitalGains.stcgDetails && capitalGains.stcgDetails.length > 0 ||
                           capitalGains.ltcgDetails && capitalGains.ltcgDetails.length > 0 ||
                           parseFloat(capitalGains || 0) > 0;

    if (hasCapitalGains) {
      result.errors.push({
        path: 'income.capitalGains',
        message: 'Capital gains found in snapshot for ITR-4. Capital gains are not allowed in ITR-4. Use ITR-2 or ITR-3 instead.',
        code: 'ITR4_CAPITAL_GAINS_IN_SNAPSHOT',
      });
    }
  }

  /**
   * Validate house property income
   * @param {object} formITR1 - Form ITR-1 object
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} result - Validation result object (mutated)
   */
  validateHouseProperty(formITR1, sectionSnapshot, result) {
    const partBTI = formITR1.PartB_TI || {};
    const incomeFromHP = partBTI.IncomeFromHP || {};

    const annualValue = parseFloat(incomeFromHP.AnnualValue || 0);
    const netAnnualValue = parseFloat(incomeFromHP.NetAnnualValue || 0);
    const deductionUs24 = parseFloat(incomeFromHP.DeductionUs24 || 0);
    const incomeFromHPValue = parseFloat(incomeFromHP.IncomeFromHP || 0);

    // Net annual value should be non-negative
    if (netAnnualValue < 0) {
      result.errors.push({
        path: 'PartB_TI.IncomeFromHP.NetAnnualValue',
        message: `Net annual value (${netAnnualValue}) cannot be negative`,
        code: 'NEGATIVE_NET_ANNUAL_VALUE',
      });
    }

    // Income from house property should be non-negative (ITR-1 doesn't allow loss)
    if (incomeFromHPValue < 0) {
      result.errors.push({
        path: 'PartB_TI.IncomeFromHP.IncomeFromHP',
        message: `Income from house property (${incomeFromHPValue}) cannot be negative in ITR-1`,
        code: 'NEGATIVE_HOUSE_PROPERTY_INCOME',
      });
    }

    // Interest deduction u/s 24 should not exceed 200000
    if (deductionUs24 > 200000) {
      result.errors.push({
        path: 'PartB_TI.IncomeFromHP.DeductionUs24',
        message: `Interest deduction u/s 24 (${deductionUs24}) exceeds limit of 200000`,
        code: 'INTEREST_DEDUCTION_EXCEEDS_LIMIT',
      });
    }

    // Validate calculation: NetAnnualValue = AnnualValue - MunicipalTaxes
    // This is already handled in builder, but validate consistency
    if (annualValue > 0 && netAnnualValue > annualValue) {
      result.warnings.push({
        path: 'PartB_TI.IncomeFromHP',
        message: `Net annual value (${netAnnualValue}) exceeds annual value (${annualValue})`,
        code: 'NET_ANNUAL_VALUE_EXCEEDS_ANNUAL_VALUE',
      });
    }
  }
}

module.exports = new ITRBusinessValidator();

