// =====================================================
// ITR-4 JSON BUILDER (Sugam)
// =====================================================

const ITR4ComputationService = require('./ITR4ComputationService');

class ITR4JsonBuilder {
  static build(payload, assessmentYear) {
    const computation = ITR4ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const bank = payload.bankAccount || {};

    return {
      Form_ITR4: { FormName: 'ITR-4', Description: 'Sugam — Presumptive Income', AssessmentYear: assessmentYear, SchemaVer: 'Ver1.0' },
      PersonalInfo: {
        AssesseeName: { FirstName: pi.firstName || '', SurNameOrOrgName: pi.lastName || '' },
        PAN: pi.pan || '', DOB: pi.dob || '', Gender: pi.gender || '',
      },
      FilingStatus: { ReturnFileSec: regime === 'new' ? 115 : 11, OptOutNewTaxRegime: regime === 'old' ? 'Y' : 'N' },

      ScheduleS: { IncomeFromSalary: income.salary.netTaxable },
      ScheduleHP: { IncomeFromHP: income.houseProperty.netIncome },
      ScheduleOS: { TotalOtherIncome: income.otherSources.total },

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
      GrossTotalIncome: computation.grossTotalIncome,

      DeductionUnderChapterVIA: { TotalChapVIADeductions: result.deductions },
      TaxComputation: {
        TaxableIncome: result.taxableIncome, TotalTax: result.totalTax,
        TaxPaid: { TotalTaxesPaid: computation.tds.total },
        NetPayable: Math.max(0, result.totalTax - computation.tds.total),
        RefundDue: Math.max(0, computation.tds.total - result.totalTax),
      },
      Refund: { BankAccountDtls: { BankName: bank.bankName || '', IFSCCode: bank.ifsc || '', BankAccountNo: bank.accountNumber || '' } },
      _meta: { generatedAt: new Date().toISOString(), regime },
    };
  }
}

module.exports = ITR4JsonBuilder;
