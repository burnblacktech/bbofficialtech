// =====================================================
// ITR JSON BUILDERS
// Reusable builders for common ITR sections shared across ITR types
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class ITRJsonBuilders {
  /**
   * Build PersonalInfo section for ITR
   * @param {object} sectionSnapshot - Section snapshot from draft/filing
   * @param {object} user - User model instance
   * @returns {object} PersonalInfo section in ITD format
   */
  buildPersonalInfo(sectionSnapshot, user) {
    const personalInfo = sectionSnapshot.personalInfo || sectionSnapshot.personal_info || {};
    const userData = user || {};

    // Get PAN (from snapshot first, then user)
    const pan = (personalInfo.pan || userData.pan || '').toUpperCase().trim();
    if (!pan || pan.length !== 10) {
      enterpriseLogger.warn('Invalid or missing PAN', { pan, userId: userData.id });
    }

    // Split name into First, Middle, Last
    const fullName = personalInfo.name || userData.fullName || userData.name || '';
    const nameParts = this.splitName(fullName);

    // Format DOB as DD/MM/YYYY
    const dob = this.formatDateForITD(
      personalInfo.dateOfBirth || personalInfo.date_of_birth || userData.dateOfBirth || userData.date_of_birth
    );

    // Get Aadhaar
    const aadhaar = personalInfo.aadhaar || personalInfo.aadhaarNumber || userData.aadhaarNumber || '';

    return {
      PAN: pan,
      AssesseeName: {
        First_Name: nameParts.firstName || '',
        Middle_Name: nameParts.middleName || '',
        Last_Name: nameParts.lastName || '',
      },
      DOB: dob,
      AadhaarCardNo: aadhaar,
    };
  }

  /**
   * Build FilingStatus section for ITR
   * @param {object} sectionSnapshot - Section snapshot from draft/filing
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @param {string} filingType - Optional filing type ('ORIGINAL', 'REVISED', etc.)
   * @returns {object} FilingStatus section in ITD format
   */
  buildFilingMeta(sectionSnapshot, assessmentYear, filingType = 'ORIGINAL') {
    return {
      ReturnFileSec: '139(1)', // Regular filing under section 139(1)
      SesTypeReturn: filingType, // ORIGINAL, REVISED, etc.
      AssessmentYear: assessmentYear || '',
    };
  }

  /**
   * Build AddressDetails section for ITR
   * @param {object} sectionSnapshot - Section snapshot from draft/filing
   * @param {object} user - User model instance
   * @returns {object} AddressDetails section in ITD format
   */
  buildAddressDetails(sectionSnapshot, user) {
    const personalInfo = sectionSnapshot.personalInfo || sectionSnapshot.personal_info || {};
    const userData = user || {};
    const address = personalInfo.address || userData.address || {};

    // Get address components
    const flatDoorBuildingBlockNo = address.flat || address.addressLine1 || address.address || '';
    const areaLocality = address.area || address.addressLine2 || address.locality || '';
    const cityTownDistrict = address.city || address.cityTownDistrict || '';
    const state = address.state || '';
    const stateCode = this.getStateCode(state);
    const pinCode = address.pincode || address.pinCode || address.zipCode || '';

    return {
      FlatDoorBuildingBlockNo: flatDoorBuildingBlockNo,
      AreaLocality: areaLocality,
      CityTownDistrict: cityTownDistrict,
      StateCode: stateCode,
      PinCode: pinCode,
    };
  }

  /**
   * Build TaxSummary (PartB_TTI) section from ComputationResult
   * @param {object} computationResult - Tax computation result from TaxComputationEngine
   * @param {object} sectionSnapshot - Section snapshot (optional, for validation)
   * @returns {object} PartB_TTI section in ITD format
   */
  buildTaxSummary(computationResult, sectionSnapshot = {}) {
    if (!computationResult) {
      enterpriseLogger.warn('No computation result provided to buildTaxSummary');
      return {
        GrossTotIncome: '0.00',
        DeductUndChapVIA: '0.00',
        TotalIncome: '0.00',
        TaxPayableOnTI: '0.00',
      };
    }

    // Map from computation result (no recomputation)
    const grossTotIncome = parseFloat(computationResult.grossTotalIncome || 0);
    const deductUndChapVIA = parseFloat(computationResult.totalDeductions || 0);
    const totalIncome = parseFloat(computationResult.taxableIncome || 0);
    const taxPayableOnTI = parseFloat(computationResult.finalTax || computationResult.totalTax || 0);

    return {
      GrossTotIncome: this.formatAmount(grossTotIncome),
      DeductUndChapVIA: this.formatAmount(deductUndChapVIA),
      TotalIncome: this.formatAmount(totalIncome),
      TaxPayableOnTI: this.formatAmount(taxPayableOnTI),
    };
  }

  /**
   * Build Verification section for ITR
   * @param {object} sectionSnapshot - Section snapshot from draft/filing
   * @param {object} user - User model instance
   * @returns {object} Verification section in ITD format
   */
  buildVerification(sectionSnapshot, user) {
    const personalInfo = sectionSnapshot.personalInfo || sectionSnapshot.personal_info || {};
    const userData = user || {};
    const address = personalInfo.address || userData.address || {};

    // Get place (city) for verification
    const place = address.city || address.cityTownDistrict || '';

    // Get current date in DD/MM/YYYY format
    const date = this.formatDateForITD(new Date().toISOString());

    return {
      Declaration: 'I declare that the information furnished above is true to the best of my knowledge and belief.',
      Place: place,
      Date: date,
      Signature_Type: 'DIGITAL',
    };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Split full name into First, Middle, Last
   * @param {string} fullName - Full name string
   * @returns {object} Object with firstName, middleName, lastName
   */
  splitName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', middleName: '', lastName: '' };
    }

    const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);

    if (nameParts.length === 0) {
      return { firstName: '', middleName: '', lastName: '' };
    }

    if (nameParts.length === 1) {
      return { firstName: nameParts[0], middleName: '', lastName: '' };
    }

    if (nameParts.length === 2) {
      return { firstName: nameParts[0], middleName: '', lastName: nameParts[1] };
    }

    // 3 or more parts: first is firstName, last is lastName, rest is middleName
    return {
      firstName: nameParts[0],
      middleName: nameParts.slice(1, -1).join(' '),
      lastName: nameParts[nameParts.length - 1],
    };
  }

  /**
   * Format date as DD/MM/YYYY for ITD
   * @param {string|Date} dateInput - Date string or Date object
   * @returns {string} Formatted date string (DD/MM/YYYY)
   */
  formatDateForITD(dateInput) {
    if (!dateInput) {
      return '';
    }

    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return '';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      enterpriseLogger.warn('Error formatting date for ITD', { dateInput, error: error.message });
      return '';
    }
  }

  /**
   * Get state code from state name
   * @param {string} stateName - State name
   * @returns {string} State code (2-digit)
   */
  getStateCode(stateName) {
    if (!stateName || typeof stateName !== 'string') {
      return '';
    }

    // State code mapping (ITD standard codes)
    const stateCodeMap = {
      'ANDHRA PRADESH': '37',
      'ARUNACHAL PRADESH': '12',
      'ASSAM': '18',
      'BIHAR': '10',
      'CHHATTISGARH': '22',
      'GOA': '30',
      'GUJARAT': '24',
      'HARYANA': '06',
      'HIMACHAL PRADESH': '02',
      'JAMMU AND KASHMIR': '01',
      'JHARKHAND': '20',
      'KARNATAKA': '29',
      'KERALA': '32',
      'MADHYA PRADESH': '23',
      'MAHARASHTRA': '27',
      'MANIPUR': '14',
      'MEGHALAYA': '17',
      'MIZORAM': '15',
      'NAGALAND': '13',
      'ODISHA': '21',
      'PUNJAB': '03',
      'RAJASTHAN': '08',
      'SIKKIM': '11',
      'TAMIL NADU': '33',
      'TELANGANA': '36',
      'TRIPURA': '16',
      'UTTAR PRADESH': '09',
      'UTTARAKHAND': '05',
      'WEST BENGAL': '19',
      'DELHI': '07',
      'PUDUCHERRY': '34',
      'CHANDIGARH': '04',
      'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
      'LAKSHADWEEP': '31',
      'LADAKH': '38',
      'ANDAMAN AND NICOBAR ISLANDS': '35',
    };

    const upperState = stateName.toUpperCase().trim();
    return stateCodeMap[upperState] || '';
  }

  /**
   * Format amount as string with 2 decimal places
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount string
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount || 0);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    return numAmount.toFixed(2);
  }
}

module.exports = new ITRJsonBuilders();

