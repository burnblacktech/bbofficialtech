// =====================================================
// ITR-2 JSON BUILDER — ITD Schema Compliant
// =====================================================

const ITR2ComputationService = require('./ITR2ComputationService');
const { buildPersonalInfo, buildFilingStatus, buildTDSSchedules, buildBankDetails, buildVerification, buildDeductions } = require('./jsonHelpers');

class ITR2JsonBuilder {
  static build(payload, assessmentYear) {
    const computation = ITR2ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const agri = Number(payload.income?.agriculturalIncome) || 0;
    const tdsSchedules = buildTDSSchedules(payload);

    const json = {
      Form_ITR2: { FormName: 'ITR-2', AssessmentYear: assessmentYear, SchemaVer: 'Ver1.0', FormVer: 'Ver1.0' },
      PersonalInfo: buildPersonalInfo(pi),
      FilingStatus: buildFilingStatus(pi, regime, assessmentYear),

      ScheduleS: {
        Salaries: income.salary.grossSalary,
        AllwncExemptUs10: { TotalAllwncExemptUs10: income.salary.exemptAllowances },
        DeductionUs16: income.salary.standardDeduction + income.salary.professionalTax + income.salary.entertainmentAllowanceDeduction,
        IncomeFromSal: income.salary.netTaxable,
      },

      ScheduleHP: {
        Properties: (income.houseProperty.properties || [{ type: income.houseProperty.type, netIncome: income.houseProperty.netIncome, interestOnHomeLoan: income.houseProperty.interestOnHomeLoan || income.houseProperty.interestAllowed || 0 }]).map(p => ({
          TypeOfHP: p.type === 'SELF_OCCUPIED' ? 'S' : 'L',
          GrossRentReceived: p.annualRent || 0,
          TaxPaidlocalAuth: p.municipalTaxes || 0,
          AnnualValue: p.nav || 0,
          StandardDeduction: p.standardDeduction30 || 0,
          InterestPayable: p.interestOnHomeLoan || 0,
          IncomeFromHP: p.netIncome || 0,
        })),
        TotalHPIncome: income.houseProperty.netIncome,
      },

      ScheduleCG: {
        ShortTermCapGain: {
          STCGOnEquity111A: income.capitalGains.stcg.equity,
          STCGOnOthAssets: income.capitalGains.stcg.other,
          TotalSTCG: income.capitalGains.stcg.total,
        },
        LongTermCapGain: {
          LTCGOnEquity112A: income.capitalGains.ltcg.equity,
          LTCGOnProperty112: income.capitalGains.ltcg.property,
          LTCGOnOthAssets: income.capitalGains.ltcg.other,
          TotalLTCG: income.capitalGains.ltcg.total,
        },
        TotalCapGains: income.capitalGains.totalTaxable,
      },

      ScheduleOS: {
        IntrstFrmSavingBank: income.otherSources.savingsInterest || 0,
        IntrstFrmTermDeposit: income.otherSources.fdInterest || 0,
        DividendIncome: income.otherSources.dividends || 0,
        FamilyPension: income.otherSources.familyPension || 0,
        IncomeFromOtherSources: income.otherSources.total,
      },

      ...(income.foreignIncome.totalIncome > 0 ? {
        ScheduleFSI: {
          Incomes: income.foreignIncome.incomes.map(i => ({
            Country: i.country, IncomeType: i.type, AmountINR: i.amountINR, TaxPaidAbroad: i.taxPaidAbroad,
          })),
          TotalForeignIncome: income.foreignIncome.totalIncome,
        },
      } : {}),

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
        TaxPayableOnRebate: Math.max(0, result.taxOnIncome - result.rebate),
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

module.exports = ITR2JsonBuilder;
