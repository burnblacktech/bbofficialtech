// =====================================================
// ITR-2 JSON BUILDER
// Generates ITD-format JSON for ITR-2
// =====================================================

const ITR2ComputationService = require('./ITR2ComputationService');

class ITR2JsonBuilder {

  static build(payload, assessmentYear) {
    const computation = ITR2ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const income = computation.income;
    const bank = payload.bankAccount || {};

    return {
      Form_ITR2: {
        FormName: 'ITR-2',
        Description: 'For Individuals and HUFs not having income from profits and gains of business or profession',
        AssessmentYear: assessmentYear,
        SchemaVer: 'Ver1.0',
        FormVer: 'Ver1.0',
      },

      PersonalInfo: {
        AssesseeName: { FirstName: pi.firstName, MiddleName: pi.middleName, SurNameOrOrgName: pi.lastName },
        PAN: pi.pan,
        DOB: pi.dob,
        Gender: pi.gender,
        AadhaarCardNo: pi.aadhaar,
        Address: {
          ResidenceNo: pi.address?.flatDoorBuilding,
          ResidenceName: pi.address?.premisesName,
          RoadOrStreet: pi.address?.roadStreet,
          AreaOrLocality: pi.address?.areaLocality,
          CityOrTownOrDistrict: pi.address?.city,
          StateCode: pi.address?.stateCode,
          PinCode: pi.address?.pincode,
          CountryCode: pi.residentialStatus === 'RES' ? '91' : '91',
        },
        MobileNo: pi.phone,
        EmailAddress: pi.email,
        EmployerCategory: pi.employerCategory,
      },

      FilingStatus: {
        FilingStatus: pi.filingStatus || 'O',
        ReturnFileSec: regime === 'new' ? 115 : 11,
        OptOutNewTaxRegime: regime === 'old' ? 'Y' : 'N',
        ...(pi.filingStatus === 'R' ? { OriginalAckNo: pi.originalAckNumber, OriginalFilingDate: pi.originalFilingDate } : {}),
        ...(pi.filingStatus === 'U' ? { ReasonForUpdatedReturn: pi.updatedReturnReason } : {}),
      },

      // Schedule S — Salary
      ScheduleS: {
        GrossSalary: income.salary.grossSalary,
        ExemptAllowances: income.salary.exemptAllowances,
        StandardDeduction: income.salary.standardDeduction,
        ProfessionalTax: income.salary.professionalTax,
        IncomeFromSalary: income.salary.netTaxable,
      },

      // Schedule HP — House Property (multiple)
      ScheduleHP: {
        Properties: (income.houseProperty.properties || []).map(p => ({
          PropertyType: p.type,
          AnnualRent: p.annualRent || 0,
          MunicipalTaxes: p.municipalTaxes || 0,
          NetAnnualValue: p.nav || 0,
          StandardDeduction30: p.standardDeduction30 || 0,
          InterestOnLoan: p.interestOnHomeLoan || 0,
          NetIncome: p.netIncome || 0,
        })),
        TotalHPIncome: income.houseProperty.netIncome,
        CarryForwardLoss: income.houseProperty.carryForwardLoss || 0,
      },

      // Schedule CG — Capital Gains
      ScheduleCG: {
        ShortTermCapitalGains: {
          STCGEquity: income.capitalGains.stcg.equity,
          STCGOther: income.capitalGains.stcg.other,
          TotalSTCG: income.capitalGains.stcg.total,
        },
        LongTermCapitalGains: {
          LTCGEquity: income.capitalGains.ltcg.equity,
          LTCGProperty: income.capitalGains.ltcg.property,
          LTCGOther: income.capitalGains.ltcg.other,
          TotalLTCG: income.capitalGains.ltcg.total,
          ExemptionUnder54: income.capitalGains.exemptions,
        },
        TotalCapitalGains: income.capitalGains.totalTaxable,
        Transactions: income.capitalGains.transactions.map(t => ({
          AssetType: t.assetType, GainType: t.gainType,
          SaleDate: t.saleDate, PurchaseDate: t.purchaseDate,
          SaleValue: t.saleValue, PurchaseValue: t.purchaseValue,
          IndexedCost: t.indexedCost || 0, Expenses: t.expenses || 0,
          Gain: t.gain, Exemption: t.exemption || 0, TaxableGain: t.taxableGain,
        })),
      },

      // Schedule OS — Other Sources
      ScheduleOS: {
        SavingsInterest: income.otherSources.savingsInterest,
        FDInterest: income.otherSources.fdInterest,
        Dividends: income.otherSources.dividends,
        FamilyPension: income.otherSources.familyPension,
        FamilyPensionExempt: income.otherSources.familyPensionExempt,
        OtherIncome: income.otherSources.other,
        TotalOtherIncome: income.otherSources.total,
      },

      // Schedule FSI — Foreign Source Income
      ScheduleFSI: income.foreignIncome.incomes.length > 0 ? {
        Incomes: income.foreignIncome.incomes.map(i => ({
          Country: i.country, IncomeType: i.type,
          AmountINR: i.amountINR, TaxPaidAbroad: i.taxPaidAbroad,
          DTAAApplicable: i.dtaaApplicable,
        })),
        TotalForeignIncome: income.foreignIncome.totalIncome,
        TotalTaxPaidAbroad: income.foreignIncome.totalTaxPaidAbroad,
      } : undefined,

      // Schedule TR — Tax Relief (DTAA)
      ScheduleTR: computation.foreignTaxCredit.credit > 0 ? {
        TotalForeignTaxCredit: computation.foreignTaxCredit.credit,
        Details: computation.foreignTaxCredit.breakdown,
      } : undefined,

      // Deductions
      DeductionUnderChapterVIA: regime === 'old' ? {
        Section80C: result.deductionBreakdown.section80C || 0,
        Section80CCD1B: result.deductionBreakdown.section80CCD1B || 0,
        Section80D: result.deductionBreakdown.section80D || 0,
        Section80E: result.deductionBreakdown.section80E || 0,
        Section80G: result.deductionBreakdown.section80G || 0,
        Section80TTA: result.deductionBreakdown.section80TTA || 0,
        TotalChapVIADeductions: result.deductions,
      } : { TotalChapVIADeductions: 0 },

      // Tax Computation
      TaxComputation: {
        GrossTotalIncome: computation.grossTotalIncome,
        TotalDeductions: result.deductions,
        TotalTaxableIncome: result.taxableIncome,
        NormalIncomeTax: result.normalTax,
        STCGEquityTax: result.stcgEquityTax,
        LTCGEquityTax: result.ltcgEquityTax,
        LTCGOtherTax: result.ltcgOtherTax,
        TotalTaxOnIncome: result.taxOnIncome,
        Rebate87A: result.rebate,
        Surcharge: result.surcharge,
        HealthEducationCess: result.cess,
        GrossTaxLiability: result.totalTax,
        ForeignTaxCredit: computation.foreignTaxCredit.credit,
        TaxPaid: {
          TDSSalary: computation.tds.fromSalary,
          TDSFD: computation.tds.fromFD,
          TDSCapitalGains: computation.tds.fromCapitalGains || 0,
          TDSOther: computation.tds.fromOther,
          AdvanceTax: computation.tds.advanceTax,
          SelfAssessmentTax: computation.tds.selfAssessment,
          TotalTaxesPaid: computation.tds.total,
        },
        NetTaxPayable: Math.max(0, result.totalTax - computation.tds.total - computation.foreignTaxCredit.credit),
        RefundDue: Math.max(0, computation.tds.total + computation.foreignTaxCredit.credit - result.totalTax),
      },

      Refund: {
        BankAccountDtls: { BankName: bank.bankName || '', IFSCCode: bank.ifsc || '', BankAccountNo: bank.accountNumber || '' },
      },

      Verification: {
        Place: payload.verification?.place || '', Date: payload.verification?.date || new Date().toISOString().split('T')[0], Capacity: 'S',
      },

      _meta: {
        generatedAt: new Date().toISOString(), regime,
        computation: { grossTotalIncome: computation.grossTotalIncome, totalDeductions: result.deductions, taxableIncome: result.taxableIncome, totalTax: result.totalTax, tdsCredit: computation.tds.total, foreignTaxCredit: computation.foreignTaxCredit.credit, netPayable: result.netPayable },
      },
    };
  }
}

module.exports = ITR2JsonBuilder;
