// =====================================================
// ITR-1 JSON BUILDER
// Generates ITD-format JSON for upload/submission
// =====================================================

const ITR1ComputationService = require('./ITR1ComputationService');

class ITR1JsonBuilder {

  /**
   * Build ITD-format ITR-1 JSON from filing payload
   * @param {object} payload - The filing's jsonPayload
   * @param {string} assessmentYear - e.g. "2025-26"
   * @returns {object} ITD-format JSON
   */
  static build(payload, assessmentYear) {
    const computation = ITR1ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const salary = computation.income.salary;
    const hp = computation.income.houseProperty;
    const other = computation.income.otherSources;
    const bank = payload.bankAccount || {};

    return {
      Form_ITR1: {
        FormName: 'ITR-1',
        Description: 'For Individuals having Income from Salaries, one house property, other sources (Interest etc.)',
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

      // Schedule CG for Section 112A (LTCG ≤ ₹1.25L) — ITR-1 only
      ScheduleCGFor112A: pi.ltcg112A?.amount ? {
        LTCGAmount: Number(pi.ltcg112A.amount),
        ExemptAmount: Math.min(Number(pi.ltcg112A.amount), 125000),
        TaxableAmount: Math.max(0, Number(pi.ltcg112A.amount) - 125000),
        TaxRate: 12.5,
      } : undefined,

      IncomeDeductions: {
        GrossSalary: salary.grossSalary,
        Salary: salary.grossSalary - salary.exemptAllowances,
        IncomeFromSal: salary.netTaxable,
        AllwncExemptUs10: {
          TotalAllwncExemptUs10: salary.exemptAllowances,
        },
        DeductionUs16: {
          StandardDeduction: salary.standardDeduction,
          EntertainmentAlwnc: 0,
          ProfessionalTaxUs16iii: salary.professionalTax,
        },
        IncomeFromHP: hp.netIncome,
        ...(hp.type === 'LET_OUT' || hp.type === 'DEEMED_LET_OUT' ? {
          GrossRentReceived: hp.annualRent || 0,
          TaxPaidlocalAuth: hp.municipalTaxes || 0,
          AnnualValue: hp.netAnnualValue || 0,
          StandardDeduction: hp.standardDeduction30 || 0,
          InterestPayable: hp.interestOnHomeLoan || 0,
        } : {
          InterestPayable: hp.interestAllowed || 0,
        }),
        IncomeOthSrc: other.total,
        GrossTotIncome: computation.grossTotalIncome,
        TotalIncome: result.taxableIncome,
      },

      DeductionUnderChapterVIA: regime === 'old' ? {
        Section80C: result.deductionBreakdown.section80C || 0,
        Section80CCD1B: result.deductionBreakdown.section80CCD1B || 0,
        Section80D: result.deductionBreakdown.section80D || 0,
        Section80E: result.deductionBreakdown.section80E || 0,
        Section80G: result.deductionBreakdown.section80G || 0,
        Section80TTA: result.deductionBreakdown.section80TTA || 0,
        TotalChapVIADeductions: result.deductions,
      } : {
        TotalChapVIADeductions: 0,
      },

      TaxComputation: {
        TotalTaxPayable: result.taxOnIncome,
        Rebate87A: result.rebate,
        TaxPayableOnRebate: result.taxOnIncome - result.rebate,
        Surcharge: result.surcharge,
        EducationCess: result.cess,
        GrossTaxLiability: result.totalTax,
        TaxPaid: {
          TDS: computation.tds.fromSalary + computation.tds.fromFD + computation.tds.fromOther,
          AdvanceTax: computation.tds.advanceTax,
          SelfAssessmentTax: computation.tds.selfAssessment,
          TotalTaxesPaid: computation.tds.total,
        },
        BalTaxPayable: Math.max(0, result.totalTax - computation.tds.total),
        RefundDue: Math.max(0, computation.tds.total - result.totalTax),
      },

      Refund: {
        BankAccountDtls: {
          BankName: bank.bankName || '',
          IFSCCode: bank.ifsc || '',
          BankAccountNo: bank.accountNumber || '',
        },
      },

      Verification: {
        Place: payload.verification?.place || '',
        Date: payload.verification?.date || new Date().toISOString().split('T')[0],
        Capacity: 'S', // S = Self
      },

      _meta: {
        generatedAt: new Date().toISOString(),
        regime,
        computation: {
          grossTotalIncome: computation.grossTotalIncome,
          totalDeductions: result.deductions,
          taxableIncome: result.taxableIncome,
          totalTax: result.totalTax,
          tdsCredit: computation.tds.total,
          netPayable: result.netPayable,
        },
      },
    };
  }
}

module.exports = ITR1JsonBuilder;
