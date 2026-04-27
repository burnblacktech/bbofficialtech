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

      // SurePass eAadhaar API accepts multipart/form-data OR base64 in form field
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', pdfBuffer, { filename: 'eaadhaar.pdf', contentType: 'application/pdf' });
      if (password) formData.append('password', password);

      const response = await axios.post(
        'https://kyc-api.surepass.app/api/v1/aadhaar/upload/eaadhaar',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders(),
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
      if (error.response?.data?.message?.includes('password') || error.response?.data?.message_code === 'invalid_pdf') {
        throw new AppError(
          'Could not read eAadhaar PDF. Make sure it is a valid eAadhaar downloaded from UIDAI or DigiLocker.',
          422, 'AADHAAR_VERIFICATION_FAILED',
        );
      }
      enterpriseLogger.error('Aadhaar verification failed', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw new AppError(
        `Aadhaar verification failed: ${error.response?.data?.message || error.message}`,
        error.response?.status || 500,
        'AADHAAR_VERIFICATION_ERROR',
      );
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

  // ── OTP-Based Aadhaar Verification (SurePass eAadhaar OTP) ──

  /**
   * Step 1: Generate OTP — sends OTP to Aadhaar-linked mobile
   * @param {string} aadhaarNumber - 12-digit Aadhaar number
   * @returns {{ clientId: string, otpSent: boolean, validAadhaar: boolean }}
   */
  async generateOTP(aadhaarNumber) {
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      throw new AppError('Aadhaar number must be exactly 12 digits', 400, 'INVALID_AADHAAR');
    }

    if (!this.isLive || !this.apiKey) {
      enterpriseLogger.info('Aadhaar OTP mock mode — returning mock client_id');
      return { clientId: 'mock_eaadhaar_client_id', otpSent: true, validAadhaar: true, source: 'MOCK' };
    }

    try {
      enterpriseLogger.info('Generating Aadhaar OTP via SurePass', { aadhaarLast4: aadhaarNumber.slice(-4) });

      const response = await axios.post(
        `${this.baseUrl}/aadhaar/eaadhaar/generate-otp`,
        { id_number: aadhaarNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      enterpriseLogger.info('Aadhaar OTP response', {
        success: response.data?.success,
        statusCode: response.data?.status_code,
        otpSent: response.data?.data?.otp_sent,
        validAadhaar: response.data?.data?.valid_aadhaar,
      });

      if (!response.data?.success || !response.data?.data?.otp_sent) {
        const msg = response.data?.message || 'Failed to send OTP';
        throw new AppError(msg, response.data?.status_code || 422, 'AADHAAR_OTP_FAILED');
      }

      return {
        clientId: response.data.data.client_id,
        otpSent: true,
        validAadhaar: response.data.data.valid_aadhaar,
        source: 'SUREPASS_OTP',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      enterpriseLogger.error('Aadhaar OTP generation failed', { error: msg, status });

      if (status === 422) {
        throw new AppError(msg || 'Invalid Aadhaar number', 422, 'INVALID_AADHAAR');
      }
      if (status === 401 || status === 403) {
        throw new AppError('Aadhaar verification service configuration error', 500, 'AADHAAR_CONFIG_ERROR');
      }
      throw new AppError(msg || 'Aadhaar OTP generation failed', status || 500, 'AADHAAR_OTP_ERROR');
    }
  }

  /**
   * Step 2: Submit OTP — verifies OTP and returns full Aadhaar profile
   * @param {string} clientId - client_id from generateOTP response
   * @param {string} otp - 6-digit OTP entered by user
   * @returns {object} Full Aadhaar profile data
   */
  async submitOTP(clientId, otp) {
    if (!clientId) throw new AppError('Client ID is required', 400, 'MISSING_CLIENT_ID');
    if (!otp || !/^\d{6}$/.test(otp)) throw new AppError('OTP must be exactly 6 digits', 400, 'INVALID_OTP');

    if (!this.isLive || !this.apiKey) {
      enterpriseLogger.info('Aadhaar OTP submit mock mode');
      return this.mockVerification();
    }

    try {
      enterpriseLogger.info('Submitting Aadhaar OTP via SurePass', { clientId });

      const response = await axios.post(
        `${this.baseUrl}/aadhaar/eaadhaar/submit-otp`,
        { client_id: clientId, otp },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      enterpriseLogger.info('Aadhaar OTP submit response', {
        success: response.data?.success,
        statusCode: response.data?.status_code,
        hasData: !!response.data?.data,
      });

      if (!response.data?.success || response.data?.status_code !== 200) {
        const msg = response.data?.message || 'OTP verification failed';
        throw new AppError(msg, response.data?.status_code || 422, 'AADHAAR_OTP_VERIFY_FAILED');
      }

      const data = response.data.data;
      const splitAddr = data.split_address || {};

      // Parse DOB
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

      const genderMap = { M: 'Male', F: 'Female', T: 'Other', O: 'Other' };

      return {
        success: true,
        aadhaarNumber: (data.aadhaar_number || '').replace(/\s/g, '').replace(/X/g, ''),
        aadhaarMasked: data.aadhaar_number || '',
        name: data.full_name || data.name || '',
        dob,
        gender: genderMap[data.gender] || data.gender || '',
        address: {
          flatDoorBuilding: [splitAddr.house, splitAddr.street].filter(Boolean).join(', ') || '',
          premisesName: splitAddr.landmark || '',
          areaLocality: splitAddr.locality || splitAddr.vtc || '',
          city: splitAddr.district || '',
          stateCode: '',
          pincode: splitAddr.pincode || data.zip || '',
          fullAddress: data.address || '',
        },
        phone: data.mobile_hash ? '' : (data.phone || ''),
        email: data.email || '',
        photo: data.photo_link || data.profile_image || '',
        source: 'SUREPASS_OTP',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      enterpriseLogger.error('Aadhaar OTP submit failed', { error: msg, status, clientId });

      if (status === 422) {
        throw new AppError(msg || 'Invalid OTP', 422, 'INVALID_OTP');
      }
      throw new AppError(msg || 'Aadhaar OTP verification failed', status || 500, 'AADHAAR_OTP_ERROR');
    }
  }
}

module.exports = new AadhaarVerificationService();
