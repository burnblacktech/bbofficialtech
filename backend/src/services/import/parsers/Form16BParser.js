/**
 * Form 16B PDF Parser
 * Extracts TDS on property sale data from Form 16B PDFs.
 * Form 16B is issued for TDS under Section 194-IA (1% on property sale consideration).
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

class Form16BParser {

  /**
   * Parse a Form 16B PDF buffer and extract structured data
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
      throw new AppError('This PDF appears to be a scanned image. Only digitally-generated Form 16B PDFs are supported.', 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    const data = this.extractFields(text);
    const errors = [];
    const warnings = [];

    if (!data.buyerName && !data.buyerTan) {
      warnings.push('Could not extract buyer details. This may not be a Form 16B.');
    }
    if (!data.propertySaleConsideration) {
      warnings.push('Could not extract property sale consideration.');
    }
    if (!data.tdsDeducted) {
      warnings.push('Could not extract TDS deducted amount.');
    }

    return { success: true, data, errors, warnings };
  }

  /**
   * Extract Form 16B fields from PDF text
   */
  static extractFields(text) {
    const result = {
      buyerName: null,
      buyerTan: null,
      propertySaleConsideration: 0,
      tdsDeducted: 0,
      transactionDate: null,
    };

    // TAN: 10-char alphanumeric (4 alpha + 5 digit + 1 alpha)
    const tanMatch = text.match(/(?:TAN|Tax\s*Deduction.*?Number)\s*[:\-]?\s*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) result.buyerTan = tanMatch[1].toUpperCase();

    // Buyer name
    const nameMatch = text.match(/Name\s*(?:and\s*address\s*)?of\s*the\s*(?:Buyer|Transferee|Deductor)\s*[:\-]?\s*(.+?)(?:\n|TAN|PAN)/i);
    if (nameMatch) result.buyerName = nameMatch[1].trim().replace(/\s+/g, ' ');

    // Property sale consideration / Total value of consideration
    const saleMatch = text.match(/(?:(?:Total\s*)?(?:Value\s*of\s*)?(?:Sale\s*)?Consideration|Property\s*Value|Amount\s*(?:Paid|Credited))\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (saleMatch) result.propertySaleConsideration = n(saleMatch[1]);

    // TDS deducted (1% under 194-IA)
    const tdsMatch = text.match(/(?:Tax\s*Deducted|TDS\s*Deducted|Total\s*Tax\s*Deducted)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (tdsMatch) result.tdsDeducted = n(tdsMatch[1]);

    // Transaction date
    const dateMatch = text.match(/(?:Date\s*of\s*(?:Transaction|Transfer|Payment|Agreement))\s*[:\-]?\s*(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2})/i);
    if (dateMatch) result.transactionDate = dateMatch[1].trim();

    return result;
  }

  /**
   * Validate extracted data looks like a real Form 16B
   * @param {object} data - Extracted data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(data) {
    const errors = [];
    if (!data.buyerTan && !data.buyerName) errors.push('No buyer details found — this may not be a Form 16B');
    if (!data.propertySaleConsideration) errors.push('Property sale consideration not found');
    if (data.tdsDeducted < 0) errors.push('TDS amount is negative');
    if (data.propertySaleConsideration < 0) errors.push('Sale consideration is negative');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = Form16BParser;
