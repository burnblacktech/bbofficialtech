// =====================================================
// AADHAAR VERIFICATION SERVICE
// Extracts data from eAadhaar PDF via SurePass API
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class AadhaarVerificationService {
  constructor() {
    this.baseUrl = process.env.SUREPASS_API_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
    this.apiKey = process.env.SUREPASS_API_KEY;
    this.isLive = process.env.FEATURE_PAN_VERIFICATION_LIVE === 'true';
  }

  /**
   * Extract data from eAadhaar PDF
   * @param {Buffer} pdfBuffer - The eAadhaar PDF file content
   * @param {string} password - PDF password (Aadhaar number or share code)
   * @returns {object} Extracted Aadhaar data
   */
  async verifyFromPDF(pdfBuffer, password) {
    if (!this.isLive || !this.apiKey) {
      return this.mockVerification();
    }

    try {
      const base64 = pdfBuffer.toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/aadhaar-v2/upload-eaadhaar`,
        { file: base64, password: password || '' },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      if (!response.data?.success || response.data?.status_code !== 200) {
        const msg = response.data?.message || 'Aadhaar verification failed';
        throw new AppError(msg, 422, 'AADHAAR_VERIFICATION_FAILED');
      }

      const data = response.data.data;
      const splitAddr = data.split_address || {};

      // Parse DOB from DD/MM/YYYY to YYYY-MM-DD
      let dob = '';
      if (data.dob) {
        const parts = String(data.dob).split(/[\/\-\.]/);
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          let year = parts[2];
          if (year.length === 2) year = (Number(year) > 50 ? '19' : '20') + year;
          dob = `${year}-${month}-${day}`;
        }
      }

      // Map gender
      const genderMap = { M: 'Male', F: 'Female', T: 'Other', O: 'Other' };

      return {
        success: true,
        aadhaarNumber: (data.aadhaar_number || '').replace(/\s/g, '').replace(/X/g, ''),
        aadhaarMasked: data.aadhaar_number || '',
        name: data.name || '',
        dob,
        gender: genderMap[data.gender] || data.gender || '',
        address: {
          flatDoorBuilding: [splitAddr.house, splitAddr.street].filter(Boolean).join(', ') || '',
          premisesName: splitAddr.landmark || '',
          areaLocality: splitAddr.locality || splitAddr.vtc || '',
          city: splitAddr.district || '',
          stateCode: '', // Need to map state name to code
          pincode: splitAddr.pincode || '',
          fullAddress: data.address || '',
        },
        phone: data.phone || '',
        email: data.email || '',
        source: 'SUREPASS_EAADHAAR',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.response?.data?.message?.includes('password')) {
        throw new AppError(
          'Incorrect eAadhaar password. The password is usually your Aadhaar number or the share code.',
          422, 'AADHAAR_PASSWORD_INCORRECT',
        );
      }
      enterpriseLogger.error('Aadhaar verification failed', { error: error.message });
      throw new AppError(`Aadhaar verification failed: ${error.message}`, 500, 'AADHAAR_VERIFICATION_ERROR');
    }
  }

  /**
   * Mock verification for development
   */
  mockVerification() {
    return {
      success: true,
      aadhaarNumber: '123456789012',
      aadhaarMasked: 'XXXX XXXX 9012',
      name: 'MOCK USER',
      dob: '1990-01-15',
      gender: 'Male',
      address: {
        flatDoorBuilding: '42 MG Road',
        premisesName: 'Sunrise Apartments',
        areaLocality: 'Koramangala',
        city: 'Bengaluru',
        stateCode: '29',
        pincode: '560034',
        fullAddress: '42 MG Road, Sunrise Apartments, Koramangala, Bengaluru - 560034',
      },
      phone: '9876543210',
      email: 'mock@example.com',
      source: 'MOCK',
    };
  }
}

module.exports = new AadhaarVerificationService();
