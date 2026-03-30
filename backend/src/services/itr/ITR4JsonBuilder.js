// =====================================================
// ITR-4 JSON BUILDER (Sugam) — ITD Schema Compliant
// =====================================================

const ITR4ComputationService = require('./ITR4ComputationService');
const { buildPersonalInfo, buildFilingStatus, buildTDSSchedules, buildBankDetails, buildVerification, buildDeductions } = require('./jsonHelpers');

class ITR4JsonBuilder {
  static build(payload, assessmentYear) {
    const computation = ITR4ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const agri = Number(payload.income?.agriculturalIncome) || 0;
    const tdsSchedules = buildTDSSchedules(payload);

    const json = {
      Form_ITR4: { FormName: 'ITR-4', Description: 'Sugam — Presumptive Income', AssessmentYear: assessmentYear, SchemaVer: 'Ver1.0', FormVer: 'Ver1.0' },
      PersonalInfo: buildPersonalInfo(pi),
      FilingStatus: buildFilingStatus(pi, regime, assessmentYear),

      ScheduleS: { Salaries: income.salary.grossSalary, IncomeFromSal: income.salary.netTaxable },
      ScheduleHP: { IncomeFromHP: income.houseProperty.netIncome },
      ScheduleOS: { IncomeFromOtherSources: income.otherSources.total },

      ScheduleBP44AD: income.presumptive.entries.filter(e => e.section === '44AD').map(e => ({
        BusinessName: e.businessName, GrossReceipts: e.grossReceipts,
        DigitalReceipts: e.digitalReceipts, Rate: e.rate, PresumptiveIncome: e.declaredIncome,
      })),
      ScheduleBP44ADA: income.presumptive.entries.filter(e => e.section === '44ADA').map(e => ({
        ProfessionName: e.businessName, GrossReceipts: e.grossReceipts,
        Rate: e.rate, PresumptiveIncome: e.declaredIncome,
      })),
      ScheduleBP44AE: income.presumptive.entries.filter(e => e.section === '44AE').map(e => ({
        Vehicles: e.vehicles, MonthsOwned: e.monthsOwned, PresumptiveIncome: e.declaredIncome,
      })),

      TotalPresumptiveIncome: income.presumptive.totalIncome,

      ...tdsSchedules,
      DeductionUnderChapterVIA: buildDeductions(result, regime),

      IncomeDeductions: {
        GrossTotIncome: computation.grossTotalIncome,
        DeductUndChapVIA: result.deductions,
        TotalIncome: result.taxableIncome,
        AgriculturalIncome: agri,
      },

      TaxComputation: {
        TotalTaxPayable: result.taxOnIncome,
        Rebate87A: result.rebate,
        Surcharge25: result.surcharge,
        EducationCess: result.cess,
        GrossTaxLiability: result.totalTax,
        TaxPaid: { TotalTaxesPaid: computation.tds.total },
        BalTaxPayable: Math.max(0, result.totalTax - computation.tds.total),
        RefundDue: Math.max(0, computation.tds.total - result.totalTax),
      },

      BankAccountDtls: buildBankDetails(payload),
      Verification: buildVerification(pi),
    };

    Object.keys(json).forEach(k => { if (json[k] === undefined || json[k] === null) delete json[k]; });
    return json;
  }
}

module.exports = ITR4JsonBuilder;
