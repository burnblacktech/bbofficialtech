// =====================================================
// ITR SCHEMA VALIDATOR
// Validates ITR JSON against IT Department Schema v3.0
// =====================================================

// ITR-1 (Sahaj) Schema Structure
const ITR1_SCHEMA = {
  required: [
    'Form_ITR1',
  ],
  Form_ITR1: {
    required: [
      'PartA_GEN1',
      'PartB_TI',
      'PartB_TTI',
      'PartC',
      'PartD',
      'Verification',
    ],
    PartA_GEN1: {
      required: ['PersonalInfo', 'FilingStatus', 'AddressDetails'],
      PersonalInfo: ['PAN', 'AssesseeName', 'DOB', 'AadhaarCardNo'],
      FilingStatus: ['ReturnFileSec', 'SesTypeReturn'],
      AddressDetails: ['FlatDoorBuildingBlockNo', 'AreaLocality', 'CityTownDistrict', 'StateCode', 'PinCode'],
    },
    PartB_TI: {
      required: ['Salaries', 'IncomeFromHP', 'IncFromOthSources'],
      Salaries: ['GrossSalary', 'Salary16ia', 'ProfessionalTaxUs16iii', 'NetSalary'],
    },
    PartB_TTI: {
      required: ['GrossTotIncome', 'DeductUndChapVIA', 'TotalIncome', 'TaxPayableOnTI'],
    },
    PartC: {
      required: ['TaxesPaid', 'TDS'],
    },
    PartD: {
      required: ['RefundOrTaxPayable'],
    },
    Verification: {
      required: ['Declaration', 'Place'],
    },
  },
};

// ITR-2 Schema Structure
const ITR2_SCHEMA = {
  required: ['Form_ITR2'],
  Form_ITR2: {
    required: [
      'PartA_GEN',
      'ScheduleS',
      'ScheduleHP',
      'ScheduleCG',
      'ScheduleOS',
      'ScheduleVIA',
      'PartB_TI',
      'PartB_TTI',
      'Schedule80G',
      'ScheduleTDS1',
      'ScheduleTDS2',
      'ScheduleIT',
      'ScheduleAL',
      'Verification',
    ],
  },
};

// ITR-3 Schema Structure  
const ITR3_SCHEMA = {
  required: ['Form_ITR3'],
  Form_ITR3: {
    required: [
      'PartA_GEN',
      'ScheduleS',
      'ScheduleHP',
      'ScheduleBP',
      'ScheduleCG',
      'ScheduleOS',
      'ScheduleVIA',
      'ScheduleCYLA',
      'ScheduleBFLA',
      'PartB_TI',
      'PartB_TTI',
      'PartA_BS',
      'PartA_PL',
      'Schedule80G',
      'ScheduleTDS1',
      'ScheduleTDS2',
      'ScheduleIT',
      'ScheduleAL',
      'Verification',
    ],
  },
};

// ITR-4 (Sugam) Schema Structure
const ITR4_SCHEMA = {
  required: ['Form_ITR4'],
  Form_ITR4: {
    required: [
      'PartA_GEN1',
      'ScheduleBP',
      'ScheduleVIA',
      'PartB_TI',
      'PartB_TTI',
      'PartC',
      'Verification',
    ],
    ScheduleBP: {
      required: ['NatOfBus44AD', 'PresumpIncDtls'],
      PresumpIncDtls: ['TotPresumpBusInc', 'GrossTurnoverReceipts'],
    },
  },
};

/**
 * Get schema for ITR type
 */
const getSchema = (itrType) => {
  switch (itrType) {
    case 'ITR-1':
    case 'ITR1':
      return ITR1_SCHEMA;
    case 'ITR-2':
    case 'ITR2':
      return ITR2_SCHEMA;
    case 'ITR-3':
    case 'ITR3':
      return ITR3_SCHEMA;
    case 'ITR-4':
    case 'ITR4':
      return ITR4_SCHEMA;
    default:
      throw new Error(`Unknown ITR type: ${itrType}`);
  }
};

/**
 * Validation result structure
 */
const createValidationResult = () => ({
  isValid: true,
  errors: [],
  warnings: [],
  info: [],
});

/**
 * Add error to result
 */
const addError = (result, path, message, code = 'MISSING_FIELD') => {
  result.isValid = false;
  result.errors.push({ path, message, code });
};

/**
 * Add warning to result
 */
const addWarning = (result, path, message, code = 'WARNING') => {
  result.warnings.push({ path, message, code });
};

/**
 * Validate required fields exist
 */
const validateRequired = (data, requiredFields, basePath, result) => {
  for (const field of requiredFields) {
    const value = data?.[field];
    if (value === undefined || value === null || value === '') {
      addError(result, `${basePath}.${field}`, `Missing required field: ${field}`);
    }
  }
};

/**
 * Validate PAN format
 */
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Validate Aadhaar format
 */
const validateAadhaar = (aadhaar) => {
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(aadhaar);
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate mobile format
 */
const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9][0-9]{9}$/;
  return mobileRegex.test(mobile);
};

/**
 * Validate PIN code format
 */
const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Validate IFSC format
 */
const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

/**
 * Validate ITR-1 JSON structure
 */
const validateITR1 = (json, result) => {
  const form = json.Form_ITR1;
  if (!form) {
    addError(result, 'Form_ITR1', 'Missing Form_ITR1 root element');
    return;
  }

  // Validate PartA_GEN1
  if (form.PartA_GEN1) {
    const gen = form.PartA_GEN1;
    
    // Personal Info
    if (gen.PersonalInfo) {
      const pi = gen.PersonalInfo;
      if (!validatePAN(pi.PAN)) {
        addError(result, 'PartA_GEN1.PersonalInfo.PAN', 'Invalid PAN format', 'INVALID_FORMAT');
      }
      if (pi.AadhaarCardNo && !validateAadhaar(pi.AadhaarCardNo)) {
        addError(result, 'PartA_GEN1.PersonalInfo.AadhaarCardNo', 'Invalid Aadhaar format', 'INVALID_FORMAT');
      }
    } else {
      addError(result, 'PartA_GEN1.PersonalInfo', 'Missing PersonalInfo section');
    }

    // Address
    if (gen.AddressDetails) {
      const addr = gen.AddressDetails;
      if (addr.PinCode && !validatePincode(addr.PinCode)) {
        addError(result, 'PartA_GEN1.AddressDetails.PinCode', 'Invalid PIN code format', 'INVALID_FORMAT');
      }
    }
  } else {
    addError(result, 'PartA_GEN1', 'Missing PartA_GEN1 section');
  }

  // Validate PartB_TI (Income)
  if (form.PartB_TI) {
    const ti = form.PartB_TI;
    
    // Salary validation
    if (ti.Salaries) {
      const sal = ti.Salaries;
      if (sal.GrossSalary < 0) {
        addError(result, 'PartB_TI.Salaries.GrossSalary', 'Gross salary cannot be negative', 'INVALID_VALUE');
      }
      // Net salary should not exceed gross salary
      if (sal.NetSalary > sal.GrossSalary) {
        addWarning(result, 'PartB_TI.Salaries', 'Net salary exceeds gross salary');
      }
    }

    // House property income validation
    if (ti.IncomeFromHP) {
      const hp = ti.IncomeFromHP;
      if (hp.AnnualValue < 0 && !hp.SelfOccupied) {
        addWarning(result, 'PartB_TI.IncomeFromHP', 'Annual value is negative for non-self-occupied property');
      }
    }

    // Agricultural income validation (ITR-1 limit)
    if (ti.ExemptIncAgri) {
      if (ti.ExemptIncAgri > 5000) {
        addError(result, 'PartB_TI.ExemptIncAgri', 'ITR-1 allows agricultural income up to ₹5,000 only', 'LIMIT_EXCEEDED');
      }
    }
  } else {
    addError(result, 'PartB_TI', 'Missing PartB_TI section');
  }

  // Validate PartB_TTI (Tax computation)
  if (form.PartB_TTI) {
    const tti = form.PartB_TTI;
    
    // Validate computation
    if (tti.TotalIncome > 5000000 && tti.TotalIncome <= form.PartB_TI?.GrossTotIncome) {
      addWarning(result, 'PartB_TTI', 'Total income exceeds ₹50 lakh - verify ITR-1 eligibility');
    }
  } else {
    addError(result, 'PartB_TTI', 'Missing PartB_TTI section');
  }

  // Validate PartD (Refund/Tax payable)
  if (form.PartD) {
    const pd = form.PartD;
    // Either refund or tax payable should be present
    if (pd.RefundDue === undefined && pd.BalTaxPayable === undefined) {
      addError(result, 'PartD', 'Either RefundDue or BalTaxPayable must be specified');
    }
  }

  // Validate Verification
  if (form.Verification) {
    const ver = form.Verification;
    if (!ver.Declaration) {
      addError(result, 'Verification.Declaration', 'Declaration is required');
    }
    if (!ver.Place) {
      addError(result, 'Verification.Place', 'Place of filing is required');
    }
  } else {
    addError(result, 'Verification', 'Missing Verification section');
  }

  // Bank details validation
  if (form.PartC?.BankDetails || form.BankDetails) {
    const bank = form.PartC?.BankDetails || form.BankDetails;
    if (bank.IFSCCode && !validateIFSC(bank.IFSCCode)) {
      addError(result, 'BankDetails.IFSCCode', 'Invalid IFSC code format', 'INVALID_FORMAT');
    }
  }
};

/**
 * Validate ITR-4 JSON structure
 */
const validateITR4 = (json, result) => {
  const form = json.Form_ITR4;
  if (!form) {
    addError(result, 'Form_ITR4', 'Missing Form_ITR4 root element');
    return;
  }

  // Validate presumptive income section
  if (form.ScheduleBP) {
    const bp = form.ScheduleBP;
    
    // Section 44AD validation
    if (bp.PresumpIncDtls) {
      const pid = bp.PresumpIncDtls;
      
      // 44AD turnover limit
      if (pid.GrossTurnoverReceipts > 20000000) { // 2 Cr
        addError(result, 'ScheduleBP.PresumpIncDtls.GrossTurnoverReceipts', 
          'Turnover exceeds ₹2 Cr limit for Section 44AD', 'LIMIT_EXCEEDED');
      }
      
      // Minimum presumptive rate check (8% for non-digital, 6% for digital)
      const minRate = 0.06; // Assuming digital
      const declaredRate = pid.TotPresumpBusInc / pid.GrossTurnoverReceipts;
      if (declaredRate < minRate) {
        addWarning(result, 'ScheduleBP.PresumpIncDtls', 
          'Declared presumptive income is less than minimum 6%');
      }
    }

    // Section 44ADA validation
    if (bp.PresumpProfDtls) {
      const ppd = bp.PresumpProfDtls;
      
      // 44ADA gross receipts limit
      if (ppd.GrossReceipts > 5000000) { // 50L
        addError(result, 'ScheduleBP.PresumpProfDtls.GrossReceipts',
          'Gross receipts exceed ₹50 Lakh limit for Section 44ADA', 'LIMIT_EXCEEDED');
      }
      
      // Minimum 50% presumptive rate
      const declaredRate = ppd.PresumpProfInc / ppd.GrossReceipts;
      if (declaredRate < 0.5) {
        addWarning(result, 'ScheduleBP.PresumpProfDtls',
          'Declared presumptive income is less than minimum 50%');
      }
    }

    // Section 44AE validation
    if (bp.GoodsCarriageDtls) {
      const gc = bp.GoodsCarriageDtls;
      
      // Maximum 10 vehicles
      if (gc.TotalVehicles > 10) {
        addError(result, 'ScheduleBP.GoodsCarriageDtls.TotalVehicles',
          'ITR-4 allows maximum 10 goods carriages', 'LIMIT_EXCEEDED');
      }
    }
  }
};

/**
 * Main validation function
 */
export const validateITRJson = (json, itrType) => {
  const result = createValidationResult();

  try {
    // Get schema for ITR type
    const schema = getSchema(itrType);

    // Check root element
    const rootKey = schema.required[0];
    if (!json[rootKey]) {
      addError(result, rootKey, `Missing root element: ${rootKey}`);
      return result;
    }

    // ITR-specific validation
    switch (itrType) {
      case 'ITR-1':
      case 'ITR1':
        validateITR1(json, result);
        break;
      case 'ITR-4':
      case 'ITR4':
        validateITR4(json, result);
        break;
      default:
        // Generic validation for other ITR types
        addWarning(result, '', `Detailed validation not implemented for ${itrType}`);
    }

    // Add info about validation
    result.info.push({
      message: `Validated against ITD Schema for ${itrType}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    addError(result, '', `Validation error: ${error.message}`, 'VALIDATION_ERROR');
  }

  return result;
};

/**
 * Quick validation - checks only critical fields
 */
export const quickValidateITRJson = (json, itrType) => {
  const result = createValidationResult();

  try {
    // Check root element
    const rootKey = `Form_${itrType.replace('-', '')}`;
    if (!json[rootKey]) {
      addError(result, rootKey, `Missing root element: ${rootKey}`);
    }

    // Check for PAN
    const form = json[rootKey] || {};
    const personalInfo = form.PartA_GEN1?.PersonalInfo || form.PartA_GEN?.PersonalInfo;
    if (!personalInfo?.PAN) {
      addError(result, 'PersonalInfo.PAN', 'PAN is required');
    }

    // Check for verification
    if (!form.Verification) {
      addError(result, 'Verification', 'Verification section is required');
    }

  } catch (error) {
    addError(result, '', `Quick validation error: ${error.message}`);
  }

  return result;
};

export default {
  validateITRJson,
  quickValidateITRJson,
  validatePAN,
  validateAadhaar,
  validateEmail,
  validateMobile,
  validatePincode,
  validateIFSC,
};

