// =====================================================
// ITR-3 JSON BUILDER
// =====================================================

const ITR3ComputationService = require('./ITR3ComputationService');

class ITR3JsonBuilder {
  static build(payload, assessmentYear) {
    const computation = ITR3ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const bank = payload.bankAccount || {};
    const bs = payload.income?.business?.balanceSheet || {};

    return {
      Form_ITR3: { FormName: 'ITR-3', AssessmentYear: assessmentYear, SchemaVer: 'Ver1.0' },
      PersonalInfo: {
        AssesseeName: { FirstName: pi.firstName || '', SurNameOrOrgName: pi.lastName || '' },
        PAN: pi.pan || '', DOB: pi.dob || '', Gender: pi.gender || '',
      },
      FilingStatus: { ReturnFileSec: regime === 'new' ? 115 : 11, OptOutNewTaxRegime: regime === 'old' ? 'Y' : 'N' },

      ScheduleS: { IncomeFromSalary: income.salary.netTaxable },
      ScheduleHP: { TotalHPIncome: income.houseProperty.netIncome },
      ScheduleCG: {
        STCGEquity: income.capitalGains.stcg.equity, STCGOther: income.capitalGains.stcg.other,
        LTCGEquity: income.capitalGains.ltcg.equity, LTCGOther: income.capitalGains.ltcg.property + income.capitalGains.ltcg.other,
        TotalCapitalGains: income.capitalGains.totalTaxable,
      },
      ScheduleOS: { TotalOtherIncome: income.otherSources.total },

      // Business-specific schedules
      ScheduleBP: {
        Businesses: income.business.businesses.map(b => ({
          Name: b.name, NatureOfBusiness: b.natureOfBusiness,
          Turnover: b.turnover, GrossProfit: b.grossProfit,
          Expenses: b.expenses, Depreciation: b.depreciation, NetProfit: b.netProfit,
        })),
        TotalTurnover: income.business.totalTurnover,
        TotalNetProfit: income.business.netProfit,
        AuditRequired: income.business.auditRequired,
      },

      SchedulePL: {
        GrossReceipts: income.business.totalTurnover,
        GrossProfit: income.business.totalGrossProfit,
        TotalExpenses: income.business.totalExpenses,
        Depreciation: income.business.totalDepreciation,
        NetProfit: income.business.netProfit,
      },

      ScheduleBS: {
        FixedAssets: n(bs.fixedAssets), CurrentAssets: n(bs.currentAssets),
        Investments: n(bs.investments), OtherAssets: n(bs.otherAssets),
        TotalAssets: n(bs.fixedAssets) + n(bs.currentAssets) + n(bs.investments) + n(bs.otherAssets),
        Capital: n(bs.capital), Reserves: n(bs.reserves),
        SecuredLoans: n(bs.securedLoans), UnsecuredLoans: n(bs.unsecuredLoans),
        CurrentLiabilities: n(bs.currentLiabilities),
        TotalLiabilities: n(bs.capital) + n(bs.reserves) + n(bs.securedLoans) + n(bs.unsecuredLoans) + n(bs.currentLiabilities),
      },

      DeductionUnderChapterVIA: { TotalChapVIADeductions: result.deductions },
      TaxComputation: {
        GrossTotalIncome: computation.grossTotalIncome, TotalDeductions: result.deductions,
        TaxableIncome: result.taxableIncome, TotalTax: result.totalTax,
        TaxPaid: { TotalTaxesPaid: computation.tds.total },
        NetPayable: Math.max(0, result.totalTax - computation.tds.total - computation.foreignTaxCredit.credit),
        RefundDue: Math.max(0, computation.tds.total + computation.foreignTaxCredit.credit - result.totalTax),
      },
      Refund: { BankAccountDtls: { BankName: bank.bankName || '', IFSCCode: bank.ifsc || '', BankAccountNo: bank.accountNumber || '' } },
      _meta: { generatedAt: new Date().toISOString(), regime },
    };
  }
}

function n(val) { return Number(val) || 0; }
module.exports = ITR3JsonBuilder;
