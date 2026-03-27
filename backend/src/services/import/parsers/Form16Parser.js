/**
 * Form 16 PDF Parser
 * Extracts salary, TDS, employer, and deduction data from Form 16 PDFs.
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

const n = (v) => { const x = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, '')); return isNaN(x) ? 0 : Math.round(x); };

class Form16Parser {

  /**
   * Parse a Form 16 PDF buffer and extract structured data
   * @param {Buffer} pdfBuffer - Raw PDF file content
   * @returns {Promise<object>} Extracted Part A + Part B data
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
      throw new AppError('This PDF appears to be a scanned image. Only digitally-generated Form 16 PDFs are supported.', 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    const partA = this.extractPartA(text);
    const partB = this.extractPartB(text);
    const warnings = [];

    if (!partA.employerName && !partA.employerTAN) {
      warnings.push('Could not extract Part A (employer details). This may not be a Form 16.');
    }
    if (!partB.grossSalary) {
      warnings.push('Could not extract Part B (salary details).');
    }

    return { partA, partB, warnings, rawTextLength: text.length };
  }

  /** Extract Part A: employer name, TAN, TDS, assessment year */
  static extractPartA(text) {
    const result = { employerName: null, employerTAN: null, tdsDeducted: 0, assessmentYear: null };

    // Assessment Year: "Assessment Year 2025-26" or "AY 2025-26"
    const ayMatch = text.match(/(?:Assessment\s*Year|A\.?Y\.?)\s*[:\-]?\s*(20\d{2}\s*-\s*\d{2})/i);
    if (ayMatch) result.assessmentYear = ayMatch[1].replace(/\s/g, '');

    // TAN: 10-char alphanumeric (4 alpha + 5 digit + 1 alpha)
    const tanMatch = text.match(/(?:TAN|Tax\s*Deduction.*?Number)\s*[:\-]?\s*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) result.employerTAN = tanMatch[1].toUpperCase();

    // Employer name: after "Name of the Employer" or "Name and address of the Employer"
    const empMatch = text.match(/Name\s*(?:and\s*address\s*)?of\s*the\s*(?:Employer|Deductor)\s*[:\-]?\s*(.+?)(?:\n|TAN|PAN)/i);
    if (empMatch) result.employerName = empMatch[1].trim().replace(/\s+/g, ' ');

    // Total TDS: "Total Tax Deposited" or "Total amount of tax deposited"
    const tdsMatch = text.match(/Total\s*(?:Tax\s*Deposited|amount\s*of\s*tax\s*deposited)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (tdsMatch) result.tdsDeducted = n(tdsMatch[1]);

    return result;
  }

  /** Extract Part B: salary breakup, allowances, deductions */
  static extractPartB(text) {
    const result = {
      grossSalary: 0, hra: 0, lta: 0, professionalTax: 0, standardDeduction: 0,
      deductions: { '80C': 0, '80CCD1B': 0, '80D': 0, '80E': 0, '80G': 0, '80TTA': 0 },
    };

    // Gross Salary: "Gross Salary" or "1. Salary as per provisions"
    const grossMatch = text.match(/(?:Gross\s*(?:Total\s*)?Salary|Salary\s*as\s*per\s*provisions.*?)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (grossMatch) result.grossSalary = n(grossMatch[1]);

    // HRA Exempt
    const hraMatch = text.match(/(?:House\s*Rent\s*Allowance|HRA)\s*(?:exempt|exemption)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (hraMatch) result.hra = n(hraMatch[1]);

    // LTA Exempt
    const ltaMatch = text.match(/(?:Leave\s*Travel\s*(?:Allowance|Concession)|LTA|LTC)\s*(?:exempt)?\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (ltaMatch) result.lta = n(ltaMatch[1]);

    // Professional Tax
    const ptMatch = text.match(/(?:Professional\s*Tax|Tax\s*on\s*employment)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (ptMatch) result.professionalTax = n(ptMatch[1]);

    // Standard Deduction
    const sdMatch = text.match(/Standard\s*Deduction\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (sdMatch) result.standardDeduction = n(sdMatch[1]);

    // Chapter VI-A Deductions
    const dedPatterns = [
      { key: '80C', regex: /(?:80C(?!\w)|Section\s*80C)\b.*?[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
      { key: '80CCD1B', regex: /(?:80CCD\s*\(?1B\)?|80CCD\(1B\))\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
      { key: '80D', regex: /(?:80D\b|Section\s*80D)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
      { key: '80E', regex: /(?:80E\b|Section\s*80E)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
      { key: '80G', regex: /(?:80G\b|Section\s*80G)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
      { key: '80TTA', regex: /(?:80TTA\b|Section\s*80TTA)\s*[:\-]?\s*[₹Rs.]*\s*([\d,]+(?:\.\d{2})?)/i },
    ];

    for (const { key, regex } of dedPatterns) {
      const match = text.match(regex);
      if (match) result.deductions[key] = n(match[1]);
    }

    return result;
  }

  /**
   * Validate extracted data looks like a real Form 16
   * @param {object} data - Extracted { partA, partB }
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(data) {
    const errors = [];
    if (!data.partA?.assessmentYear) errors.push('Assessment year not found in document');
    if (!data.partA?.employerTAN && !data.partA?.employerName) errors.push('No employer details found — this may not be a Form 16');
    if (!data.partB?.grossSalary) errors.push('Gross salary not found in Part B');
    if (data.partB?.grossSalary < 0) errors.push('Gross salary is negative');
    if (data.partA?.tdsDeducted < 0) errors.push('TDS amount is negative');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = Form16Parser;
