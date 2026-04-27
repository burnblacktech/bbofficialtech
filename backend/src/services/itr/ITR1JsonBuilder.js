// =====================================================
// ITR-1 JSON BUILDER
// Generates ITD-format JSON for upload/submission
// AY 2025-26 schema
// =====================================================

const ITR1ComputationService = require('./ITR1ComputationService');

// Format date from ISO (2026-03-15) to ITD format (15/03/2026)
function fmtDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Map gender to ITD code
function genderCode(g) {
  if (!g) return 'M';
  const u = g.toUpperCase();
  if (u === 'MALE' || u === 'M') return 'M';
  if (u === 'FEMALE' || u === 'F') return 'F';
  return 'O';
}

class ITR1JsonBuilder {

  static build(payload, assessmentYear) {
    const computation = ITR1ComputationService.compute(payload);
    const regime = payload.selectedRegime || computation.recommended;
    const result = regime === 'old' ? computation.oldRegime : computation.newRegime;
    const pi = payload.personalInfo || {};
    const salary = computation.income.salary;
    const hp = computation.income.houseProperty;
    const other = computation.income.otherSources;
    const vda = ITR1ComputationService.computeVDA(payload.income?.otherSources);
    const bank = payload.bankDetails || payload.bankAccount || {};
    const taxes = payload.taxes || {};
    const agri = Number(payload.income?.agriculturalIncome) || 0;

    const json = {
      Form_ITR1: {
        FormName: 'ITR-1',
        Description: 'For Individuals having Income from Salaries, one house property, other sources (Interest etc.)',
        AssessmentYear: assessmentYear,
        SchemaVer: 'Ver1.0',
        FormVer: 'Ver1.0',
      },

      PersonalInfo: {
        AssesseeName: {
          FirstName: (pi.firstName || '').toUpperCase(),
          MiddleName: (pi.middleName || '').toUpperCase(),
          SurNameOrOrgName: (pi.lastName || '').toUpperCase(),
        },
        PAN: (pi.pan || '').toUpperCase(),
        DOB: fmtDate(pi.dob),
        Gender: genderCode(pi.gender),
        AadhaarCardNo: pi.aadhaar || '',
        Address: {
          ResidenceNo: pi.address?.flatDoorBuilding || '',
          ResidenceName: pi.address?.premisesName || '',
          RoadOrStreet: pi.address?.roadStreet || '',
          AreaOrLocality: pi.address?.areaLocality || '',
          CityOrTownOrDistrict: pi.address?.city || '',
          StateCode: String(pi.address?.stateCode || ''),
          PinCode: String(pi.address?.pincode || ''),
          CountryCode: '91',
          Phone: { STDcode: '', PhoneNo: '' },
          MobileNo: String(pi.phone || ''),
          EmailAddress: pi.email || '',
        },
        EmployerCategory: pi.employerCategory || 'OTH',
        Status: pi.residentialStatus === 'NRI' ? 'NRI' : 'RES',
      },

      FilingStatus: {
        ReturnFileSec: regime === 'new' ? 115 : 11,
        FilingDueDate: '31/07/' + (assessmentYear ? assessmentYear.split('-')[0] : '2025'),
        OptOutNewTaxRegime: regime === 'old' ? 'Y' : 'N',
        ItrFilingType: pi.filingStatus === 'R' ? 'R' : pi.filingStatus === 'U' ? 'U' : pi.filingStatus === 'B' ? 'B' : 'O',
        ...(pi.filingStatus === 'R' ? { OrigReturnAckNo: pi.originalAckNumber || '' } : {}),
        ...(pi.filingStatus === 'U' ? { ReasonForUpdatedReturn: pi.updatedReturnReason || '' } : {}),
      },

      // Schedule S — Salary
      ScheduleS: {
        Salaries: salary.grossSalary,
        AllwncExemptUs10: { TotalAllwncExemptUs10: salary.exemptAllowances },
        PerquisitesValue: 0,
        ProfitsInSalary: 0,
        DeductionUs16: salary.standardDeduction + salary.professionalTax + salary.entertainmentAllowanceDeduction,
        DeductionUs16ia: salary.standardDeduction,
        DeductionUs16ii: salary.entertainmentAllowanceDeduction,
        DeductionUs16iii: salary.professionalTax,
        IncomeFromSal: salary.netTaxable,
        NatureOfEmployment: pi.employerCategory || 'OTH',
      },

      // Schedule HP — House Property
      ScheduleHP: hp.type === 'NONE' ? { TypeOfHP: 'S', GrossRentReceived: 0, TaxPaidlocalAuth: 0, AnnualValue: 0, StandardDeduction: 0, InterestPayable: 0, IncomeFromHP: 0 } : {
        TypeOfHP: hp.type === 'SELF_OCCUPIED' ? 'S' : 'L',
        GrossRentReceived: hp.annualRent || 0,
        TaxPaidlocalAuth: hp.municipalTaxes || 0,
        AnnualValue: hp.netAnnualValue || 0,
        StandardDeduction: hp.standardDeduction30 || 0,
        InterestPayable: hp.interestOnHomeLoan || hp.interestAllowed || 0,
        IncomeFromHP: hp.netIncome,
      },

      // Schedule OS — Other Sources
      ScheduleOS: {
        IntrstFrmSavingBank: other.savingsInterest || 0,
        IntrstFrmTermDeposit: other.fdInterest || 0,
        IntrstFrmIncmTaxRefund: other.interestOnITRefund || 0,
        FamilyPension: other.familyPension || 0,
        FamilyPensionDeductUs57iia: other.familyPensionExempt || 0,
        DividendIncome: other.dividends || 0,
        WinningsFromLotteryEtc: other.winnings || 0,
        AnyOtherIncome: (other.gifts || 0) + (other.other || 0),
        IncomeFromVDA: vda.gain || 0,
        IncomeFromOtherSources: other.total,
      },

      // Schedule VDA — Virtual Digital Assets (when VDA gain > 0)
      ...(vda.gain > 0 ? {
        ScheduleVDA: {
          SaleValue: vda.saleValue,
          CostOfAcquisition: vda.costOfAcquisition,
          NetGain: vda.gain,
          TaxAtSpecialRate: vda.tax,
        },
      } : {}),

      // Schedule TDS1 — TDS on Salary
      ScheduleTDS1: (payload.income?.salary?.employers || []).map(emp => ({
        TANOfDeductor: (emp.tan || '').toUpperCase(),
        NameOfDeductor: emp.name || '',
        GrossSalary: Number(emp.grossSalary) || 0,
        TDSDeducted: Number(emp.tdsDeducted) || 0,
      })),

      // Schedule TDS2 — TDS on Non-Salary
      ScheduleTDS2: (taxes.tds?.nonSalaryEntries || []).filter(e => e.deductorTan || e.deductorName).map(e => ({
        TANOfDeductor: (e.deductorTan || '').toUpperCase(),
        NameOfDeductor: e.deductorName || '',
        SectionCode: e.sectionCode || '',
        GrossAmount: Number(e.amountPaid) || 0,
        TDSDeducted: Number(e.tdsDeducted) || 0,
        TDSClaimed: Number(e.tdsClaimed || e.tdsDeducted) || 0,
      })),

      // Schedule IT — Advance Tax + Self-Assessment Tax
      ScheduleIT: [
        ...(taxes.advanceTaxEntries || []).filter(e => Number(e.amount) > 0).map(e => ({
          BSRCode: e.bsrCode || '',
          DateDep: fmtDate(e.dateOfDeposit),
          SrlNoOfChaln: e.challanNo || '',
          Amt: Number(e.amount) || 0,
          Type: 'AdvanceTax',
        })),
        ...(taxes.selfAssessmentTaxEntries || []).filter(e => Number(e.amount) > 0).map(e => ({
          BSRCode: e.bsrCode || '',
          DateDep: fmtDate(e.dateOfDeposit),
          SrlNoOfChaln: e.challanNo || '',
          Amt: Number(e.amount) || 0,
          Type: 'SelfAssessmentTax',
        })),
      ],

      // Deductions under Chapter VI-A
      DeductionUnderChapterVIA: regime === 'old' ? {
        Section80C: result.deductionBreakdown?.section80C || 0,
        Section80CCC: 0,
        Section80CCDEmployeeOrSE: 0,
        Section80CCD1B: result.deductionBreakdown?.section80CCD1B || 0,
        Section80CCD2: result.deductionBreakdown?.section80CCD2 || 0,
        Section80CCDTotal: (result.deductionBreakdown?.section80C || 0) + (result.deductionBreakdown?.section80CCD1B || 0) + (result.deductionBreakdown?.section80CCD2 || 0),
        Section80D: result.deductionBreakdown?.section80D || 0,
        Section80DD: result.deductionBreakdown?.section80DD || 0,
        Section80DDB: result.deductionBreakdown?.section80DDB || 0,
        Section80E: result.deductionBreakdown?.section80E || 0,
        Section80EE: result.deductionBreakdown?.section80EE || 0,
        Section80EEA: 0,
        Section80EEB: 0,
        Section80G: result.deductionBreakdown?.section80G || 0,
        Section80GG: result.deductionBreakdown?.section80GG || 0,
        Section80GGA: 0,
        Section80GGC: 0,
        Section80TTA: result.deductionBreakdown?.section80TTA || 0,
        Section80TTB: result.deductionBreakdown?.section80TTB || 0,
        Section80U: result.deductionBreakdown?.section80U || 0,
        TotalChapVIADeductions: result.deductions,
      } : {
        Section80CCD2: result.deductionBreakdown?.section80CCD2 || 0,
        TotalChapVIADeductions: result.deductionBreakdown?.section80CCD2 || 0,
      },

      // Schedule 80G — Donation details (if claimed)
      ...(result.deductionBreakdown?.section80G > 0 && Array.isArray(payload.deductions?.donations80G) ? {
        Schedule80G: {
          Don100Percent: (payload.deductions.donations80G || []).filter(d => d.category === '100_no_limit').map(d => ({
            DoneeName: d.doneeName, DoneePAN: d.doneePan, AddressDetail: '', Amount: Number(d.amount) || 0,
          })),
          Don50Percent: (payload.deductions.donations80G || []).filter(d => d.category === '50_no_limit').map(d => ({
            DoneeName: d.doneeName, DoneePAN: d.doneePan, AddressDetail: '', Amount: Number(d.amount) || 0,
          })),
          Don100PercentApprReqd: (payload.deductions.donations80G || []).filter(d => d.category === '100_with_limit').map(d => ({
            DoneeName: d.doneeName, DoneePAN: d.doneePan, AddressDetail: '', Amount: Number(d.amount) || 0,
          })),
          Don50PercentApprReqd: (payload.deductions.donations80G || []).filter(d => d.category === '50_with_limit').map(d => ({
            DoneeName: d.doneeName, DoneePAN: d.doneePan, AddressDetail: '', Amount: Number(d.amount) || 0,
          })),
          TotalDonationsUs80G: result.deductionBreakdown.section80G,
        },
      } : {}),

      // Income and Tax Computation
      IncomeDeductions: {
        GrossSalary: salary.grossSalary,
        IncomeFromSal: salary.netTaxable,
        IncomeFromHP: hp.netIncome,
        IncomeOthSrc: other.total,
        GrossTotIncome: computation.grossTotalIncome,
        DeductUndChapVIA: result.deductions,
        TotalIncome: result.taxableIncome,
        AgriculturalIncome: agri,
      },

      TaxComputation: {
        TotalTaxPayable: result.taxOnIncome,
        Rebate87A: result.rebate,
        TaxPayableOnRebate: Math.max(0, result.taxOnIncome - result.rebate),
        Surcharge25: result.surcharge,
        EducationCess: result.cess,
        GrossTaxLiability: result.totalTax,
        Section89: 0,
        NetTaxLiability: result.totalTax,
        IntrstPay: { IntrstPayUs234A: 0, IntrstPayUs234B: 0, IntrstPayUs234C: 0, LateFilingFee234F: 0 },
        TotTaxPlusIntrstPay: result.totalTax,
        TaxPaid: {
          TaxesPaid: {
            AdvanceTax: computation.tds.advanceTax,
            TDS: computation.tds.total - computation.tds.advanceTax - computation.tds.selfAssessment,
            SelfAssessmentTax: computation.tds.selfAssessment,
            TotalTaxesPaid: computation.tds.total,
          },
        },
        BalTaxPayable: Math.max(0, result.totalTax - computation.tds.total),
        RefundDue: Math.max(0, computation.tds.total - result.totalTax),
      },

      // Schedule CG for Section 112A (LTCG ≤ ₹1.25L)
      ...(pi.ltcg112A?.amount ? {
        ScheduleCGFor112A: {
          LTCGBeforeExemption: Number(pi.ltcg112A.amount),
          DeductionUs112A: Math.min(Number(pi.ltcg112A.amount), 125000),
          CurrYrCapGain: Math.max(0, Number(pi.ltcg112A.amount) - 125000),
        },
      } : {}),

      // Bank Account for Refund
      BankAccountDtls: {
        AddtnlBankDetails: [{
          IFSCCode: bank.ifsc || '',
          BankName: bank.bankName || '',
          BankAccountNo: bank.accountNumber || '',
          UseForRefund: 'true',
        }],
      },

      Verification: {
        Declaration: { AssesseeVerName: `${pi.firstName || ''} ${pi.lastName || ''}`.trim().toUpperCase() },
        Place: pi.address?.city || '',
        Date: fmtDate(new Date().toISOString().split('T')[0]),
        Capacity: 'S',
      },
    };

    // Remove undefined/null top-level keys
    Object.keys(json).forEach(k => { if (json[k] === undefined || json[k] === null) delete json[k]; });

    return json;
  }
}

module.exports = ITR1JsonBuilder;
