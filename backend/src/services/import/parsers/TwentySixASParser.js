/**
 * 26AS JSON Parser
 * Extracts TDS/TCS/tax paid/refund data from Form 26AS JSON.
 * 26AS is downloaded from the ITD compliance portal as JSON.
 */

const { AppError } = require('../../../middleware/errorHandler');
const ErrorCodes = require('../../../constants/ErrorCodes');

const n = (v) => Number(v) || 0;

// Section code → income category mapping
const SECTION_MAP = {
  '192': 'salary',
  '194A': 'interest',
  '194B': 'lottery',
  '194C': 'contractor',
  '194D': 'insurance_commission',
  '194H': 'commission',
  '194I': 'rent',
  '194IA': 'property_sale',
  '194J': 'professional_fees',
  '194K': 'mutual_fund',
  '194N': 'cash_withdrawal',
  '194Q': 'purchase',
};

class TwentySixASParser {

  /**
   * Parse 26AS JSON and extract all parts
   * @param {object} jsonData - Parsed JSON object
   * @returns {object} Extracted data from all parts
   */
  static parse(jsonData) {
    const validation = this.validate(jsonData);
    if (!validation.valid) {
      throw new AppError(`Invalid 26AS format: ${validation.errors.join(', ')}`, 422, ErrorCodes.IMPORT_INVALID_SCHEMA);
    }

    const partA = (jsonData.partA?.entries || []).map(e => ({
      deductorName: e.deductorName || '',
      deductorTAN: (e.deductorTAN || '').toUpperCase(),
      sectionCode: e.sectionCode || '',
      amountPaid: n(e.amountPaid),
      tdsDeducted: n(e.tdsDeducted),
      transactionDate: e.transactionDate || null,
      category: SECTION_MAP[e.sectionCode] || 'other',
    }));

    const partB = (jsonData.partB?.entries || []).map(e => ({
      collectorName: e.collectorName || '',
      collectorTAN: (e.collectorTAN || '').toUpperCase(),
      amountPaid: n(e.amountPaid),
      tcsCollected: n(e.tcsCollected),
    }));

    const partC = (jsonData.partC?.entries || []).map(e => ({
      bsrCode: e.bsrCode || '',
      challanNo: e.challanNo || '',
      amount: n(e.amount),
      type: e.type || 'other', // advance_tax, self_assessment, regular
      depositDate: e.depositDate || null,
    }));

    const partD = (jsonData.partD?.entries || []).map(e => ({
      assessmentYear: e.assessmentYear || '',
      refundAmount: n(e.refundAmount),
      refundDate: e.refundDate || null,
    }));

    return {
      pan: (jsonData.pan || '').toUpperCase(),
      assessmentYear: jsonData.assessmentYear || '',
      partA,
      partB,
      partC,
      partD,
      summary: {
        totalTDS: partA.reduce((s, e) => s + e.tdsDeducted, 0),
        totalTCS: partB.reduce((s, e) => s + e.tcsCollected, 0),
        totalTaxPaid: partC.reduce((s, e) => s + e.amount, 0),
        totalRefunds: partD.reduce((s, e) => s + e.refundAmount, 0),
      },
    };
  }

  /**
   * Validate 26AS JSON schema
   * @param {object} jsonData
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(jsonData) {
    const errors = [];
    if (!jsonData || typeof jsonData !== 'object') errors.push('Not a valid JSON object');
    if (!jsonData?.pan) errors.push('Missing PAN');
    if (!jsonData?.assessmentYear) errors.push('Missing assessment year');
    if (!jsonData?.partA) errors.push('Missing Part A (TDS details)');
    if (jsonData?.partA && !Array.isArray(jsonData.partA.entries)) errors.push('Part A entries must be an array');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get the income category for a section code
   * @param {string} sectionCode
   * @returns {string} Category name
   */
  static getCategoryForSection(sectionCode) {
    return SECTION_MAP[sectionCode] || 'other';
  }
}

module.exports = TwentySixASParser;
