/**
 * GSTCheckerService — GST verification via SurePass API with 30-day cache.
 * Follows the same patterns as PANVerificationService.
 */

const axios = require('axios');
const { GSTLookup } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../utils/errorClasses');

class GSTCheckerService {
  constructor() {
    this.CACHE_TTL_DAYS = 30;
    this.surepassBaseUrl = process.env.SUREPASS_API_BASE_URL || 'https://kyc-api.surepass.io/api/v1';
    this.surepassApiKey = process.env.SUREPASS_API_KEY;
  }

  // ── 2.1 Format validation ──

  validateGSTINFormat(gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return typeof gstin === 'string' && gstinRegex.test(gstin);
  }

  // ── 2.2 Cache validity ──

  isCacheValid(record) {
    if (!record || !record.fetchedAt) return false;
    const now = new Date();
    const fetchedAt = new Date(record.fetchedAt);
    const diffMs = now.getTime() - fetchedAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < this.CACHE_TTL_DAYS;
  }

  // ── 2.3 SurePass API call ──

  async callSurePassAPI(gstin) {
    if (!this.surepassApiKey) {
      throw new AppError('GST verification service is not configured', 500);
    }

    const instance = axios.create({
      baseURL: this.surepassBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.surepassApiKey}`,
      },
      timeout: 30000,
    });

    try {
      /* eslint-disable camelcase */
      const response = await instance.post('/corporate/gstin', {
        id_number: gstin,
      });
      /* eslint-enable camelcase */

      if (!response.data?.success || response.data?.status_code !== 200) {
        throw new AppError(
          response.data?.message || 'GST verification failed',
          response.data?.status_code || 400,
        );
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new AppError('Invalid SurePass API key', 500);
        } else if (status === 429) {
          throw new AppError('Rate limit exceeded. Please try again later.', 429);
        } else if (status === 400) {
          throw new AppError(
            error.response.data?.message || 'Invalid GSTIN',
            400,
          );
        } else if (status >= 500) {
          throw new AppError('GST verification service is temporarily unavailable', 503);
        }
      } else if (error.request) {
        throw new AppError('GST verification service is temporarily unavailable', 503);
      }
      throw error;
    }
  }

  // ── 2.4 Parse API response ──

  parseAPIResponse(rawData) {
    /* eslint-disable camelcase */
    const addr = [
      rawData.door_number || rawData.building_number,
      rawData.floor_number,
      rawData.building_name,
      rawData.street,
      rawData.location,
      rawData.district,
      rawData.state,
      rawData.pincode,
    ].filter(Boolean).join(', ');
    /* eslint-enable camelcase */

    return {
      businessName: rawData.business_name || rawData.trade_name || null,
      legalName: rawData.legal_name || null,
      status: rawData.status || null,
      registrationDate: rawData.registration_date || rawData.date_of_registration || null,
      lastUpdatedDate: rawData.last_updated_date || null,
      address: rawData.address || addr || null,
      stateCode: rawData.state_code || (rawData.gstin ? rawData.gstin.substring(0, 2) : null),
      constitutionOfBusiness: rawData.constitution_of_business || null,
      taxpayerType: rawData.taxpayer_type || null,
      gstinStatus: rawData.gstin_status || rawData.status || null,
      cancellationDate: rawData.cancellation_date || null,
    };
  }

  // ── 2.5 Upsert lookup ──

  async upsertLookup(gstin, parsed, rawData) {
    const [record] = await GSTLookup.upsert({
      gstin,
      businessName: parsed.businessName,
      legalName: parsed.legalName,
      status: parsed.status,
      registrationDate: parsed.registrationDate,
      lastUpdatedDate: parsed.lastUpdatedDate,
      address: parsed.address,
      stateCode: parsed.stateCode,
      constitutionOfBusiness: parsed.constitutionOfBusiness,
      taxpayerType: parsed.taxpayerType,
      gstinStatus: parsed.gstinStatus,
      cancellationDate: parsed.cancellationDate,
      rawResponse: rawData,
      fetchedAt: new Date(),
    }, {
      conflictFields: ['gstin'],
    });

    return record;
  }

  // ── 2.6 Main lookup ──

  async lookup(gstin, forceRefresh = false) {
    const normalized = gstin.trim().toUpperCase();

    if (!this.validateGSTINFormat(normalized)) {
      throw new AppError('Invalid GSTIN format. Must be 15 characters.', 400);
    }

    // Check cache unless forceRefresh
    if (!forceRefresh) {
      const cached = await GSTLookup.findOne({ where: { gstin: normalized } });

      if (cached && this.isCacheValid(cached)) {
        enterpriseLogger.info('GST lookup cache hit', { gstin: normalized });
        return {
          data: this.formatResponse(cached),
          fromCache: true,
          fetchedAt: cached.fetchedAt,
        };
      }
    }

    enterpriseLogger.info('GST lookup calling SurePass API', { gstin: normalized, forceRefresh });
    const rawData = await this.callSurePassAPI(normalized);
    const parsed = this.parseAPIResponse(rawData);
    const record = await this.upsertLookup(normalized, parsed, rawData);

    return {
      data: this.formatResponse(record),
      fromCache: false,
      fetchedAt: record.fetchedAt,
    };
  }

  // ── 2.7 Format response ──

  formatResponse(record) {
    return {
      gstin: record.gstin,
      businessName: record.businessName,
      legalName: record.legalName,
      status: record.status,
      registrationDate: record.registrationDate,
      lastUpdatedDate: record.lastUpdatedDate,
      address: record.address,
      stateCode: record.stateCode,
      constitutionOfBusiness: record.constitutionOfBusiness,
      taxpayerType: record.taxpayerType,
      gstinStatus: record.gstinStatus,
      cancellationDate: record.cancellationDate,
    };
  }
}

module.exports = new GSTCheckerService();
