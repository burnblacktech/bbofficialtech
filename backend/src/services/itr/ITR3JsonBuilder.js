// =====================================================
// ITR-3 JSON BUILDER — ITD Schema Compliant
// =====================================================

const ITR3ComputationService = require('./ITR3ComputationService');
const { buildPersonalInfo, buildFilingStatus, buildTDSSchedules, buildBankDetails, buildVerification, buildDeductions } = require('./jsonHelpers');

const n = (v) => Number(v) || 0;

class ITR3JsonBuilder {
  static build(payload, assessmentYear) {
    const computation = ITR3ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const agri = n(payload.income?.agriculturalIncome);
    const bs = payload.income?.business?.balanceSheet || {};
    const tdsSchedules = buildTDSSchedules(payload);

    const json = {
      Form_ITR3: { FormName: 'ITR-3', AssessmentYear: assessmentYear, SchemaVer: 'Ver1.0', FormVer: 'Ver1.0' },
      PersonalInfo: buildPersonalInfo(pi),
      FilingStatus: buildFilingStatus(pi, regime, assessmentYear),

      ScheduleS: { Salaries: income.salary.grossSalary, IncomeFromSal: income.salary.netTaxable },
      ScheduleHP: { TotalHPIncome: income.houseProperty.netIncome },
      ScheduleOS: { IncomeFromOtherSources: income.otherSources.total },

      ScheduleCG: {
        STCGOnEquity111A: income.capitalGains.stcg.equity,
        STCGOnOthAssets: income.capitalGains.stcg.other,
        LTCGOnEquity112A: income.capitalGains.ltcg.equity,
        LTCGOnProperty112: income.capitalGains.ltcg.property,
        LTCGOnOthAssets: income.capitalGains.ltcg.other,
        TotalCapGains: income.capitalGains.totalTaxable,
      },

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

      ScheduleBS: {
        FixedAssets: n(bs.fixedAssets), CurrentAssets: n(bs.currentAssets),
        Investments: n(bs.investments), OtherAssets: n(bs.otherAssets),
        TotalAssets: n(bs.fixedAssets) + n(bs.currentAssets) + n(bs.investments) + n(bs.otherAssets),
        Capital: n(bs.capital), Reserves: n(bs.reserves),
        SecuredLoans: n(bs.securedLoans), UnsecuredLoans: n(bs.unsecuredLoans),
        CurrentLiabilities: n(bs.currentLiabilities),
        TotalLiabilities: n(bs.capital) + n(bs.reserves) + n(bs.securedLoans) + n(bs.unsecuredLoans) + n(bs.currentLiabilities),
      },

      ...tdsSchedules,
      DeductionUnderChapterVIA: buildDeductions(result, regime),

      IncomeDeductions: {
        GrossTotIncome: computation.grossTotalIncome,
        DeductUndChapVIA: result.deductions,
        TotalIncome: result.taxableIncome,
        AgriculturalIncome: agri,
      },

      TaxComputation: {
        NormalIncomeTax: result.normalTax,
        TaxOnSTCGEquity: result.stcgEquityTax,
        TaxOnLTCGEquity: result.ltcgEquityTax,
        TaxOnLTCGOther: result.ltcgOtherTax || 0,
        TotalTaxPayable: result.taxOnIncome,
        Rebate87A: result.rebate,
        Surcharge25: result.surcharge,
        EducationCess: result.cess,
        GrossTaxLiability: result.totalTax,
        TaxPaid: { TotalTaxesPaid: computation.tds.total },
        BalTaxPayable: Math.max(0, result.totalTax - computation.tds.total - (computation.foreignTaxCredit?.credit || 0)),
        RefundDue: Math.max(0, computation.tds.total + (computation.foreignTaxCredit?.credit || 0) - result.totalTax),
      },

      BankAccountDtls: buildBankDetails(payload),
      Verification: buildVerification(pi),
    };

    Object.keys(json).forEach(k => { if (json[k] === undefined || json[k] === null) delete json[k]; });
    return json;
  }
}

module.exports = ITR3JsonBuilder;
