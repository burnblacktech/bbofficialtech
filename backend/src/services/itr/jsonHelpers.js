// Shared helpers for ITR JSON builders — ITD schema compliance

/** Format ISO date to DD/MM/YYYY */
function fmtDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return String(isoDate);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Map gender to ITD code M/F/O */
function genderCode(g) {
  if (!g) return 'M';
  const u = String(g).toUpperCase();
  if (u === 'MALE' || u === 'M') return 'M';
  if (u === 'FEMALE' || u === 'F') return 'F';
  return 'O';
}

/** Build ITD-compliant PersonalInfo block */
function buildPersonalInfo(pi) {
  return {
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
      MobileNo: String(pi.phone || ''),
      EmailAddress: pi.email || '',
    },
    EmployerCategory: pi.employerCategory || 'OTH',
    Status: pi.residentialStatus === 'NRI' ? 'NRI' : 'RES',
  };
}

/** Build ITD-compliant FilingStatus block */
function buildFilingStatus(pi, regime, assessmentYear) {
  return {
    ReturnFileSec: regime === 'new' ? 115 : 11,
    FilingDueDate: '31/07/' + (assessmentYear ? assessmentYear.split('-')[0] : '2025'),
    OptOutNewTaxRegime: regime === 'old' ? 'Y' : 'N',
    ItrFilingType: pi.filingStatus === 'R' ? 'R' : pi.filingStatus === 'U' ? 'U' : pi.filingStatus === 'B' ? 'B' : 'O',
    ...(pi.filingStatus === 'R' ? { OrigReturnAckNo: pi.originalAckNumber || '' } : {}),
    ...(pi.filingStatus === 'U' ? { ReasonForUpdatedReturn: pi.updatedReturnReason || '' } : {}),
  };
}

/** Build TDS schedules */
function buildTDSSchedules(payload) {
  const taxes = payload.taxes || {};
  return {
    ScheduleTDS1: (payload.income?.salary?.employers || []).map(emp => ({
      TANOfDeductor: (emp.tan || '').toUpperCase(),
      NameOfDeductor: emp.name || '',
      GrossSalary: Number(emp.grossSalary) || 0,
      TDSDeducted: Number(emp.tdsDeducted) || 0,
    })),
    ScheduleTDS2: (taxes.tds?.nonSalaryEntries || []).filter(e => e.deductorTan || e.deductorName).map(e => ({
      TANOfDeductor: (e.deductorTan || '').toUpperCase(),
      NameOfDeductor: e.deductorName || '',
      SectionCode: e.sectionCode || '',
      GrossAmount: Number(e.amountPaid) || 0,
      TDSDeducted: Number(e.tdsDeducted) || 0,
      TDSClaimed: Number(e.tdsClaimed || e.tdsDeducted) || 0,
    })),
    ScheduleIT: [
      ...(taxes.advanceTaxEntries || []).filter(e => Number(e.amount) > 0).map(e => ({
        BSRCode: e.bsrCode || '', DateDep: fmtDate(e.dateOfDeposit), SrlNoOfChaln: e.challanNo || '', Amt: Number(e.amount) || 0, Type: 'AdvanceTax',
      })),
      ...(taxes.selfAssessmentTaxEntries || []).filter(e => Number(e.amount) > 0).map(e => ({
        BSRCode: e.bsrCode || '', DateDep: fmtDate(e.dateOfDeposit), SrlNoOfChaln: e.challanNo || '', Amt: Number(e.amount) || 0, Type: 'SelfAssessmentTax',
      })),
    ],
  };
}

/** Build bank details block */
function buildBankDetails(payload) {
  const bank = payload.bankDetails || payload.bankAccount || {};
  return {
    AddtnlBankDetails: [{
      IFSCCode: bank.ifsc || '',
      BankName: bank.bankName || '',
      BankAccountNo: bank.accountNumber || '',
      UseForRefund: 'true',
    }],
  };
}

/** Build verification block */
function buildVerification(pi) {
  return {
    Declaration: { AssesseeVerName: `${pi.firstName || ''} ${pi.lastName || ''}`.trim().toUpperCase() },
    Place: pi.address?.city || '',
    Date: fmtDate(new Date().toISOString().split('T')[0]),
    Capacity: 'S',
  };
}

/** Build Chapter VI-A deductions block */
function buildDeductions(result, regime) {
  if (regime !== 'old') return { TotalChapVIADeductions: result.deductionBreakdown?.section80CCD2 || 0 };
  const b = result.deductionBreakdown || {};
  return {
    Section80C: b.section80C || 0,
    Section80CCC: 0,
    Section80CCD1B: b.section80CCD1B || 0,
    Section80CCD2: b.section80CCD2 || 0,
    Section80D: b.section80D || 0,
    Section80E: b.section80E || 0,
    Section80G: b.section80G || 0,
    Section80GG: b.section80GG || 0,
    Section80TTA: b.section80TTA || 0,
    Section80TTB: b.section80TTB || 0,
    Section80U: b.section80U || 0,
    TotalChapVIADeductions: result.deductions,
  };
}

module.exports = { fmtDate, genderCode, buildPersonalInfo, buildFilingStatus, buildTDSSchedules, buildBankDetails, buildVerification, buildDeductions };
