/**
 * AutoFillService
 * Orchestrates the one-click auto-fill pipeline:
 *   PAN check → SurePass auth → fetch 26AS → fetch AIS → map → detect conflicts → return result
 *
 * AutoFillMapper (co-located)
 * Maps normalized 26AS/AIS transformer output to filing jsonPayload fields
 * and detects conflicts between existing and incoming data.
 */

const { AppError } = require('../../utils/errorClasses');
const logger = require('../../utils/logger');
const ITRFiling = require('../../models/ITRFiling');
const surePassClient = require('../common/SurePassITRClient');
const SurePass26ASTransformer = require('./transformers/SurePass26ASTransformer');
const SurePassAISTransformer = require('./transformers/SurePassAISTransformer');
const SurePassDataMapper = require('./SurePassDataMapper');

// ─── AutoFillMapper ─────────────────────────────────────────────────────────

class AutoFillMapper {
  /**
   * Map normalized 26AS data to filing payload fields.
   * TDS 192 → salary, 194A → FD interest, other sections → non-salary TDS.
   * Delegates heavy lifting to SurePassDataMapper.map26AS and enriches with source tags.
   * @param {object} data26as - Output from SurePass26ASTransformer.transform()
   * @param {object} existingPayload - Current filing jsonPayload
   * @returns {object} Partial jsonPayload structure
   */
  static mapFrom26AS(data26as, existingPayload = {}) {
    if (!data26as) return {};
    return SurePassDataMapper.map26AS(data26as, existingPayload);
  }

  /**
   * Map normalized AIS data to filing payload fields.
   * SFT codes → income fields (dividends, savings interest, FD interest, capital gains).
   * @param {object} aisData - Output from SurePassAISTransformer.transform()
   * @param {object} existingPayload - Current filing jsonPayload (unused currently, reserved for future merge logic)
   * @returns {object} Partial jsonPayload structure
   */
  static mapFromAIS(aisData, existingPayload = {}) {
    if (!aisData) return {};
    return SurePassDataMapper.mapAIS(aisData);
  }

  /**
   * Detect conflicts between existing payload fields and incoming mapped fields.
   * Walks the incoming object recursively, comparing leaf values against existing payload.
   * @param {object} existing - Current filing jsonPayload
   * @param {object} incoming - Merged mapped payload from 26AS + AIS
   * @returns {Array<{field: string, existingValue: *, newValue: *, source: string}>}
   */
  static detectConflicts(existing, incoming) {
    if (!existing || !incoming) return [];

    const conflicts = [];
    const flatExisting = AutoFillMapper._flatten(existing);
    const flatIncoming = AutoFillMapper._flatten(incoming);

    for (const [path, newValue] of Object.entries(flatIncoming)) {
      // Skip source metadata fields
      if (path.endsWith('._source')) continue;

      const existingValue = flatExisting[path];

      // No conflict if field doesn't exist yet or is empty
      if (existingValue === undefined || existingValue === null || existingValue === '') continue;

      // No conflict if values match
      if (existingValue === newValue) continue;

      // Numeric tolerance — ignore differences < ₹1
      if (typeof existingValue === 'number' && typeof newValue === 'number') {
        if (Math.abs(existingValue - newValue) < 1) continue;
      }

      // Determine source from nearby _source tag
      const source = AutoFillMapper._inferSource(flatIncoming, path);

      conflicts.push({
        field: path,
        existingValue,
        newValue,
        source,
      });
    }

    return conflicts;
  }

  /**
   * Flatten a nested object into dot-notation paths.
   * Arrays are indexed: employers[0].name
   * @param {object} obj
   * @param {string} prefix
   * @returns {object} flat map of path → value
   */
  static _flatten(obj, prefix = '') {
    const result = {};
    if (obj === null || obj === undefined) return result;

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (item !== null && typeof item === 'object') {
            Object.assign(result, AutoFillMapper._flatten(item, `${path}[${idx}]`));
          } else {
            result[`${path}[${idx}]`] = item;
          }
        });
      } else if (value !== null && typeof value === 'object') {
        Object.assign(result, AutoFillMapper._flatten(value, path));
      } else {
        result[path] = value;
      }
    }

    return result;
  }

  /**
   * Infer the data source for a given field path by looking for a nearby _source key.
   * @param {object} flatMap - Flattened incoming data
   * @param {string} path - Field path to find source for
   * @returns {string} Source identifier ('26as', 'ais', or 'auto-fill')
   */
  static _inferSource(flatMap, path) {
    // Walk up the path looking for a sibling _source
    const parts = path.split('.');
    while (parts.length > 0) {
      parts.pop();
      const parentPrefix = parts.join('.');
      const sourceKey = parentPrefix ? `${parentPrefix}._source` : '_source';
      if (flatMap[sourceKey]) return flatMap[sourceKey];
    }
    return 'auto-fill';
  }

  /**
   * Deep-merge two partial payloads. Arrays are concatenated, objects are recursively merged.
   * @param {object} base
   * @param {object} overlay
   * @returns {object} Merged result
   */
  static mergePayloads(base, overlay) {
    if (!base) return overlay || {};
    if (!overlay) return base;

    const result = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
      if (Array.isArray(value) && Array.isArray(result[key])) {
        result[key] = [...result[key], ...value];
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = AutoFillMapper.mergePayloads(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

// ─── AutoFillService ────────────────────────────────────────────────────────

class AutoFillService {
  /**
   * Run the full auto-fill pipeline for a filing.
   *
   * Steps:
   *   1. Load filing and validate PAN
   *   2. Check / reuse SurePass session (authenticate if needed)
   *   3. Fetch 26AS via SurePassITRClient
   *   4. Fetch AIS via SurePassITRClient
   *   5. Transform raw responses via 26AS/AIS transformers
   *   6. Map transformed data to payload fields via AutoFillMapper
   *   7. Detect conflicts with existing payload
   *   8. Return { mappedPayload, conflicts, summary }
   *
   * @param {string} filingId - UUID of the ITRFiling
   * @param {string} userId - UUID of the authenticated user
   * @returns {Promise<{mappedPayload: object, conflicts: Array, summary: object}>}
   */
  async autoFill(filingId, userId) {
    logger.info('AutoFillService.autoFill started', { filingId, userId });

    // 1. Load filing
    const filing = await ITRFiling.findByPk(filingId);
    if (!filing) {
      throw new AppError('Filing not found', 404, 'FILING_NOT_FOUND');
    }
    if (filing.createdBy !== userId && filing.userId !== userId) {
      throw new AppError('Not authorized to auto-fill this filing', 403, 'FORBIDDEN');
    }

    // 2. Check PAN
    const pan = filing.taxpayerPan;
    if (!pan) {
      throw new AppError(
        'PAN is required for auto-fill. Please verify your PAN first.',
        400,
        'PAN_NOT_VERIFIED',
      );
    }

    // 3. Check / reuse SurePass session
    let session = surePassClient.getSession(userId);
    if (!session) {
      logger.info('AutoFillService: no active SurePass session, needs authentication', { userId });
      throw new AppError(
        'ITD portal session required. Please authenticate with your e-filing credentials.',
        401,
        'ITR_SESSION_EXPIRED',
      );
    }

    const existingPayload = filing.jsonPayload || {};
    const assessmentYear = filing.assessmentYear; // e.g. '2024-25'
    // SurePass expects '2024-2025' format
    const ayForSurePass = assessmentYear.replace(/^(\d{4})-(\d{2})$/, (_, y1, y2) => {
      return `${y1}-20${y2}`;
    });
    // Financial year is one year before AY: '2024-25' → '2023-2024'
    const fyForSurePass = assessmentYear.replace(/^(\d{4})-(\d{2})$/, (_, y1, y2) => {
      const startYear = parseInt(y1, 10) - 1;
      return `${startYear}-${y1}`;
    });

    // 4. Fetch 26AS
    let raw26AS = null;
    let normalized26AS = null;
    try {
      raw26AS = await surePassClient.fetch26AS(userId, ayForSurePass);
      normalized26AS = SurePass26ASTransformer.transform(raw26AS, pan);
      logger.info('AutoFillService: 26AS fetched and transformed', {
        filingId,
        entryCount: normalized26AS?.summary?.entryCount || 0,
      });
    } catch (err) {
      logger.warn('AutoFillService: 26AS fetch failed, continuing with AIS only', {
        filingId,
        error: err.message,
      });
    }

    // 5. Fetch AIS
    let rawAIS = null;
    let normalizedAIS = null;
    try {
      rawAIS = await surePassClient.fetchAIS(userId, fyForSurePass);
      normalizedAIS = SurePassAISTransformer.transform(rawAIS, pan);
      logger.info('AutoFillService: AIS fetched and transformed', {
        filingId,
        entryCount: normalizedAIS?.summary?.entryCount || 0,
      });
    } catch (err) {
      logger.warn('AutoFillService: AIS fetch failed, continuing with 26AS only', {
        filingId,
        error: err.message,
      });
    }

    // If both failed, throw
    if (!normalized26AS && !normalizedAIS) {
      throw new AppError(
        'Unable to fetch tax data from ITD portal. Try uploading Form 16 or 26AS PDF instead.',
        503,
        'SUREPASS_SERVICE_UNAVAILABLE',
      );
    }

    // 6. Map fields
    const mapped26AS = AutoFillMapper.mapFrom26AS(normalized26AS, existingPayload);
    const mappedAIS = AutoFillMapper.mapFromAIS(normalizedAIS, existingPayload);
    const mappedPayload = AutoFillMapper.mergePayloads(mapped26AS, mappedAIS);

    // 7. Detect conflicts
    const conflicts = AutoFillMapper.detectConflicts(existingPayload, mappedPayload);

    // 8. Build summary
    const summary = AutoFillService._buildSummary(normalized26AS, normalizedAIS, mappedPayload, conflicts);

    logger.info('AutoFillService.autoFill completed', {
      filingId,
      fieldsPopulated: summary.fieldsPopulated,
      conflictCount: conflicts.length,
    });

    return { mappedPayload, conflicts, summary };
  }

  /**
   * Build a human-friendly summary of the auto-fill result.
   * @param {object|null} normalized26AS
   * @param {object|null} normalizedAIS
   * @param {object} mappedPayload
   * @param {Array} conflicts
   * @returns {object}
   */
  static _buildSummary(normalized26AS, normalizedAIS, mappedPayload, conflicts) {
    const flatMapped = AutoFillMapper._flatten(mappedPayload);
    // Count leaf values that are not _source metadata
    const fieldsPopulated = Object.keys(flatMapped).filter(k => !k.endsWith('._source')).length;

    const totalTDS = (normalized26AS?.summary?.totalTDS || 0);
    const totalIncome =
      (normalized26AS?.summary?.totalAmountPaid || 0) +
      (normalizedAIS?.summary?.totalSalary || 0) +
      (normalizedAIS?.summary?.totalInterest || 0) +
      (normalizedAIS?.summary?.totalDividends || 0) +
      (normalizedAIS?.summary?.totalCapitalGains || 0) +
      (normalizedAIS?.summary?.totalOther || 0);

    return {
      fieldsPopulated,
      totalIncome,
      totalTDS,
      conflictCount: conflicts.length,
      sources: [
        normalized26AS ? '26AS' : null,
        normalizedAIS ? 'AIS' : null,
      ].filter(Boolean),
      warnings: [
        ...(normalized26AS?.warnings || []),
        ...(normalizedAIS?.warnings || []),
      ],
    };
  }
}

module.exports = { AutoFillService: new AutoFillService(), AutoFillMapper };
