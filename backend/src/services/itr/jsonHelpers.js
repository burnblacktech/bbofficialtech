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
  if (regime !== 'old') return { Section80CCD2: result.deductionBreakdown?.section80CCD2 || 0, TotalChapVIADeductions: result.deductionBreakdown?.section80CCD2 || 0 };
  const b = result.deductionBreakdown || {};

  const section80C = b.section80C || 0;
  const section80CCC = 0;
  const section80CCDEmployeeOrSE = 0;
  const section80CCD1B = b.section80CCD1B || 0;
  const section80CCD2 = b.section80CCD2 || 0;
  const section80D = b.section80D || 0;
  const section80DD = b.section80DD || 0;
  const section80DDB = b.section80DDB || 0;
  const section80E = b.section80E || 0;
  const section80EE = b.section80EE || 0;
  const section80EEA = 0;
  const section80EEB = 0;
  const section80G = b.section80G || 0;
  const section80GG = b.section80GG || 0;
  const section80GGA = 0;
  const section80GGC = 0;
  const section80TTA = b.section80TTA || 0;
  const section80TTB = b.section80TTB || 0;
  const section80U = b.section80U || 0;

  const total = section80C + section80CCC + section80CCDEmployeeOrSE + section80CCD1B + section80CCD2
    + section80D + section80DD + section80DDB + section80E + section80EE + section80EEA + section80EEB
    + section80G + section80GG + section80GGA + section80GGC + section80TTA + section80TTB + section80U;

  return {
    Section80C: section80C,
    Section80CCC: section80CCC,
    Section80CCDEmployeeOrSE: section80CCDEmployeeOrSE,
    Section80CCD1B: section80CCD1B,
    Section80CCD2: section80CCD2,
    Section80CCDTotal: section80C + section80CCD1B + section80CCD2,
    Section80D: section80D,
    Section80DD: section80DD,
    Section80DDB: section80DDB,
    Section80E: section80E,
    Section80EE: section80EE,
    Section80EEA: section80EEA,
    Section80EEB: section80EEB,
    Section80G: section80G,
    Section80GG: section80GG,
    Section80GGA: section80GGA,
    Section80GGC: section80GGC,
    Section80TTA: section80TTA,
    Section80TTB: section80TTB,
    Section80U: section80U,
    TotalChapVIADeductions: total,
  };
}

module.exports = { fmtDate, genderCode, buildPersonalInfo, buildFilingStatus, buildTDSSchedules, buildBankDetails, buildVerification, buildDeductions };
