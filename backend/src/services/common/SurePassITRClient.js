// =====================================================
// SUREPASS ITR CLIENT SERVICE
// Authenticates with ITD portal via SurePass API,
// fetches 26AS and AIS data with in-memory session cache
// =====================================================

const axios = require('axios');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../utils/errorClasses');

class SurePassITRClient {
  constructor() {
    this.baseUrl = process.env.SUREPASS_COMPREHENSIVE_BASE_URL || 'https://kyc-api.surepass.app/api/v1';
    this.apiKey = process.env.SUREPASS_API_KEY;
    this.isLive = process.env.FEATURE_ITR_FETCH_LIVE === 'true';
    this.sessions = new Map(); // userId → { clientId, pan, expiresAt }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      timeout: 30000,
    });

    enterpriseLogger.info('SurePassITRClient initialized', {
      mode: this.isLive ? 'LIVE' : 'MOCK',
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
    });
  }

  /**
   * Authenticate with ITD portal via SurePass create-client
   * NEVER logs or persists itdPassword
   * @param {string} pan - PAN number
   * @param {string} itdPassword - ITD e-filing portal password (never persisted)
   * @param {string} userId - User ID for session keying
   * @returns {{ clientId: string, pan: string }}
   */
  async authenticate(pan, itdPassword, userId) {
    if (!this.isLive) {
      enterpriseLogger.info('SurePassITRClient mock auth', { pan, userId });
      const mockSession = { clientId: 'mock_itr_client', pan };
      this.sessions.set(userId, {
        clientId: mockSession.clientId,
        pan,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
      return mockSession;
    }

    try {
      enterpriseLogger.info('SurePassITRClient authenticating', { pan, userId });

      const response = await this.axiosInstance.post('/itr/create-client', {
        pan,
        password: itdPassword,
      });

      const clientId = response.data?.data?.client_id;
      if (!clientId) {
        throw new AppError('SurePass returned no client_id', 502, 'SUREPASS_SERVICE_UNAVAILABLE');
      }

      // Store session with 30-minute TTL
      this.sessions.set(userId, {
        clientId,
        pan,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      enterpriseLogger.info('SurePassITRClient auth success', { userId, hasClientId: true });
      return { clientId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleApiError(error, 'authenticate');
    }
  }

  /**
   * Get active session for a user (null if expired or missing)
   * @param {string} userId
   * @returns {{ clientId: string, pan: string, expiresAt: number } | null}
   */
  getSession(userId) {
    const session = this.sessions.get(userId);
    if (!session) return null;
    if (Date.now() >= session.expiresAt) {
      this.sessions.delete(userId);
      return null;
    }
    return session;
  }

  /**
   * Clear session for a user
   * @param {string} userId
   */
  clearSession(userId) {
    this.sessions.delete(userId);
  }

  /**
   * Fetch 26AS data from SurePass API
   * Returns raw SurePass response data — transformer handles normalization
   * @param {string} userId
   * @param {string} assessmentYear - e.g. '2024-2025'
   * @returns {object} Raw SurePass 26AS response data
   */
  async fetch26AS(userId, assessmentYear) {
    const session = this.getSession(userId);
    if (!session) {
      throw new AppError(
        'Your ITD session has expired. Please re-enter your credentials.',
        401,
        'ITR_SESSION_EXPIRED',
      );
    }

    if (!this.isLive) {
      enterpriseLogger.info('SurePassITRClient mock fetch26AS', { userId, assessmentYear });
      return this._mock26ASData(session.pan, assessmentYear);
    }

    try {
      enterpriseLogger.info('SurePassITRClient fetching 26AS', { userId, assessmentYear });

      const response = await this.axiosInstance.post('/itr/get-26as-details', {
        client_id: session.clientId,
        assessment_year: assessmentYear,
      });

      const data = response.data?.data;
      if (!data || (Array.isArray(data.tds_data) && data.tds_data.length === 0)) {
        enterpriseLogger.warn('SurePassITRClient 26AS returned empty data', { userId, assessmentYear });
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleApiError(error, 'fetch26AS');
    }
  }

  /**
   * Fetch AIS data from SurePass API
   * Returns raw SurePass response data — transformer handles normalization
   * @param {string} userId
   * @param {string} financialYear - e.g. '2023-2024'
   * @returns {object} Raw SurePass AIS response data
   */
  async fetchAIS(userId, financialYear) {
    const session = this.getSession(userId);
    if (!session) {
      throw new AppError(
        'Your ITD session has expired. Please re-enter your credentials.',
        401,
        'ITR_SESSION_EXPIRED',
      );
    }

    if (!this.isLive) {
      enterpriseLogger.info('SurePassITRClient mock fetchAIS', { userId, financialYear });
      return this._mockAISData(session.pan, financialYear);
    }

    try {
      enterpriseLogger.info('SurePassITRClient fetching AIS', { userId, financialYear });

      const response = await this.axiosInstance.post('/itr/get-ais', {
        client_id: session.clientId,
        financial_year: financialYear,
      });

      const data = response.data?.data;
      if (!data) {
        enterpriseLogger.warn('SurePassITRClient AIS returned empty data', { userId, financialYear });
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleApiError(error, 'fetchAIS');
    }
  }

  // ── Error Handling ──

  /**
   * Map SurePass API errors to AppError codes
   * @param {Error} error - Axios error
   * @param {string} operation - Method name for logging
   */
  _handleApiError(error, operation) {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message;

    enterpriseLogger.error(`SurePassITRClient ${operation} failed`, {
      status,
      message: msg,
      code: error.code,
    });

    if (status === 401 || status === 403) {
      throw new AppError(
        'ITD portal login failed. Check your PAN and e-filing password.',
        401,
        'ITR_AUTH_FAILED',
      );
    }

    if (status === 429) {
      throw new AppError(
        'Too many requests. Please wait a few minutes before trying again.',
        429,
        'SUREPASS_RATE_LIMITED',
      );
    }

    if ((status && status >= 500) || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new AppError(
        'ITD portal service is temporarily unavailable. Try uploading the PDF instead.',
        503,
        'SUREPASS_SERVICE_UNAVAILABLE',
      );
    }

    // Network errors (no response at all)
    if (!error.response) {
      throw new AppError(
        'ITD portal service is temporarily unavailable. Try uploading the PDF instead.',
        503,
        'SUREPASS_SERVICE_UNAVAILABLE',
      );
    }

    throw new AppError(
      `SurePass ITR ${operation} failed: ${msg}`,
      status || 500,
      'SUREPASS_SERVICE_UNAVAILABLE',
    );
  }

  // ── Mock Data ──

  _mock26ASData(pan, assessmentYear) {
    return {
      assessment_year: assessmentYear,
      tds_data: [
        {
          name_of_deductor: 'MOCK EMPLOYER PVT LTD',
          tan_of_deductor: 'DELM12345A',
          section: '192',
          total_amount_paid: '1200000.00',
          total_tax_deducted: '120000.00',
          amount_paid: '100000.00',
          tax_deducted: '10000.00',
          transaction_date: '31-Mar-2024',
        },
        {
          name_of_deductor: 'MOCK BANK LTD',
          tan_of_deductor: 'MUMM67890B',
          section: '194A',
          total_amount_paid: '50000.00',
          total_tax_deducted: '5000.00',
          amount_paid: '50000.00',
          tax_deducted: '5000.00',
          transaction_date: '30-Jun-2023',
        },
      ],
    };
  }

  _mockAISData(pan, financialYear) {
    return {
      financial_year: financialYear,
      sft_data: [
        {
          information_code: 'SFT-015',
          information_description: 'Dividend',
          reported_by_source: '25000.00',
          accepted_by_taxpayer: '25000.00',
          payer_name: 'MOCK INVESTMENTS LTD',
          payer_tan: 'DELM11111A',
        },
        {
          information_code: 'SFT-004',
          information_description: 'Interest from savings account',
          reported_by_source: '15000.00',
          accepted_by_taxpayer: '14500.00',
          payer_name: 'MOCK BANK LTD',
          payer_tan: 'MUMM67890B',
        },
      ],
    };
  }
}

module.exports = new SurePassITRClient();
