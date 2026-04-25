/**
 * Form 16A PDF Parser
 * Extracts non-salary TDS certificate data from Form 16A PDFs.
 * Form 16A is issued for TDS on income other than salary (interest, rent, professional fees, etc.)
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

class Form16AParser {

  /**
   * Parse a Form 16A PDF buffer and extract structured data
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
      throw new AppError('This PDF appears to be a scanned image. Only digitally-generated Form 16A PDFs are supported.', 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    const data = this.extractFields(text);
    const errors = [];
    const warnings = [];

    if (!data.deductorName && !data.deductorTan) {
      warnings.push('Could not extract deductor details. This may not be a Form 16A.');
    }
    if (!data.tdsDeducted) {
      warnings.push('Could not extract TDS deducted amount.');
    }
    if (!data.sectionCode) {
      warnings.push('Could not determine the TDS section code.');
    }

    return { success: true, data, errors, warnings };
  }

  /**
   * Extract Form 16A fields from PDF text
   */
  static extractFields(text) {
    const result = {
      deductorName: null,
      deductorTan: null,
      sectionCode: null,
      amountPaid: 0,
      tdsDeducted: 0,
      certificateNo: null,
    };

    // TAN: 10-char alphanumeric (4 alpha + 5 digit + 1 alpha)
    const tanMatch = text.match(/(?:TAN|Tax\s*Deduction.*?Number)\s*[:\-]?\s*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) result.deductorTan = tanMatch[1].toUpperCase();

    // Deductor name
    const nameMatch = text.match(/Name\s*(?:and\s*address\s*)?of\s*the\s*(?:Deductor|Employer)\s*[:\-]?\s*(.+?)(?:\n|TAN|PAN)/i);
    if (nameMatch) result.deductorName = nameMatch[1].trim().replace(/\s+/g, ' ');

    // Section code: look for "Section 194A", "u/s 194J", etc.
    const sectionMatch = text.match(/(?:Section|u\/s|under\s*section)\s*[:\-]?\s*(194[A-Z]?(?:\([A-Z]+\))?|194-?I[AB]?|196[A-D])/i);
    if (sectionMatch) {
      result.sectionCode = sectionMatch[1].replace(/-/g, '').toUpperCase();
    }

    // Amount paid/credited
    const amountMatch = text.match(/(?:Amount\s*(?:Paid|Credited)|Total\s*(?:Payment|Amount))\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (amountMatch) result.amountPaid = n(amountMatch[1]);

    // TDS deducted
    const tdsMatch = text.match(/(?:Tax\s*Deducted|TDS\s*Deducted|Total\s*Tax\s*Deducted)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (tdsMatch) result.tdsDeducted = n(tdsMatch[1]);

    // Certificate number
    const certMatch = text.match(/(?:Certificate\s*No|Certificate\s*Number)\s*[:\-]?\s*(\S+)/i);
    if (certMatch) result.certificateNo = certMatch[1].trim();

    return result;
  }

  /**
   * Validate extracted data looks like a real Form 16A
   * @param {object} data - Extracted data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(data) {
    const errors = [];
    if (!data.deductorTan && !data.deductorName) errors.push('No deductor details found — this may not be a Form 16A');
    if (!data.sectionCode) errors.push('TDS section code not found');
    if (data.tdsDeducted < 0) errors.push('TDS amount is negative');
    if (data.amountPaid < 0) errors.push('Amount paid is negative');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = Form16AParser;
