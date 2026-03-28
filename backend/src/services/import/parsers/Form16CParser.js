/**
 * Form 16C PDF Parser
 * Extracts TDS on rent data from Form 16C PDFs.
 * Form 16C is issued for TDS under Section 194-IB (5% on rent > ₹50,000/month).
 * Uses pdfjs-dist for text extraction + regex for field matching.
 * Only supports digitally-generated PDFs (not scanned images).
 */

const { AppError } = require('../../../middleware/errorHandler');
const ErrorCodes = require('../../../constants/ErrorCodes');

/**
 * Extract text from a PDF buffer using pdfjs-dist (legacy Node.js build)
 */
async function extractTextFromPDF(pdfBuffer) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n');
}

const n = (v) => {
  const x = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return isNaN(x) ? 0 : Math.round(x);
};

class Form16CParser {

  /**
   * Parse a Form 16C PDF buffer and extract structured data
   * @param {Buffer} pdfBuffer - Raw PDF file content
   * @returns {Promise<object>} { success, data, errors, warnings }
   */
  static async parse(pdfBuffer) {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new AppError('Empty file uploaded', 400, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    let text;
    try {
      const result = await Promise.race([
        extractTextFromPDF(pdfBuffer),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)),
      ]);
      text = result;
    } catch (err) {
      if (err.message?.includes('password')) {
        throw new AppError('This PDF is password-protected. Please remove the password and try again.', 422, ErrorCodes.IMPORT_PARSE_FAILED);
      }
      throw new AppError(`Could not read this PDF: ${err.message}`, 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    if (!text || text.trim().length < 50) {
      throw new AppError('This PDF appears to be a scanned image. Only digitally-generated Form 16C PDFs are supported.', 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    const data = this.extractFields(text);
    const errors = [];
    const warnings = [];

    if (!data.tenantName && !data.tenantTan) {
      warnings.push('Could not extract tenant details. This may not be a Form 16C.');
    }
    if (!data.rentAmount) {
      warnings.push('Could not extract rent amount.');
    }
    if (!data.tdsDeducted) {
      warnings.push('Could not extract TDS deducted amount.');
    }

    return { success: true, data, errors, warnings };
  }

  /**
   * Extract Form 16C fields from PDF text
   */
  static extractFields(text) {
    const result = {
      tenantName: null,
      tenantTan: null,
      rentAmount: 0,
      tdsDeducted: 0,
      period: null,
    };

    // TAN: 10-char alphanumeric (4 alpha + 5 digit + 1 alpha)
    const tanMatch = text.match(/(?:TAN|Tax\s*Deduction.*?Number)\s*[:\-]?\s*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) result.tenantTan = tanMatch[1].toUpperCase();

    // Tenant name
    const nameMatch = text.match(/Name\s*(?:and\s*address\s*)?of\s*the\s*(?:Tenant|Payer|Deductor)\s*[:\-]?\s*(.+?)(?:\n|TAN|PAN)/i);
    if (nameMatch) result.tenantName = nameMatch[1].trim().replace(/\s+/g, ' ');

    // Rent amount
    const rentMatch = text.match(/(?:Rent\s*(?:Amount|Paid)|Total\s*Rent|Amount\s*(?:Paid|Credited))\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (rentMatch) result.rentAmount = n(rentMatch[1]);

    // TDS deducted (5% under 194-IB for rent > ₹50K/month)
    const tdsMatch = text.match(/(?:Tax\s*Deducted|TDS\s*Deducted|Total\s*Tax\s*Deducted)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (tdsMatch) result.tdsDeducted = n(tdsMatch[1]);

    // Period (e.g., "April 2024 to March 2025" or "FY 2024-25")
    const periodMatch = text.match(/(?:Period|Duration|For\s*the\s*period)\s*[:\-]?\s*(.+?)(?:\n|$)/i);
    if (periodMatch) result.period = periodMatch[1].trim().replace(/\s+/g, ' ');

    return result;
  }

  /**
   * Validate extracted data looks like a real Form 16C
   * @param {object} data - Extracted data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(data) {
    const errors = [];
    if (!data.tenantTan && !data.tenantName) errors.push('No tenant details found — this may not be a Form 16C');
    if (!data.rentAmount) errors.push('Rent amount not found');
    if (data.tdsDeducted < 0) errors.push('TDS amount is negative');
    if (data.rentAmount < 0) errors.push('Rent amount is negative');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = Form16CParser;
