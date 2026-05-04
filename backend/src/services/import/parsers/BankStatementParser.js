/**
 * Bank Statement Parser
 * Extracts interest income (savings, FD, RD) and TDS from bank statement PDFs/CSVs.
 * Uses pdfjs-dist for PDF text extraction + regex for interest entry matching.
 */

const { AppError } = require('../../../middleware/errorHandler');
const ErrorCodes = require('../../../constants/ErrorCodes');

const n = (v) => {
  const x = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return isNaN(x) ? 0 : Math.round(x * 100) / 100;
};

const INTEREST_PATTERNS = {
  savings: /\b(?:INT[\s.]?PD|INTEREST\s*PAID|INT\s*CREDIT|INTEREST\s*ON\s*(?:S[\/.]?B|SAV|BALANCE))/i,
  fd: /\b(?:FD\s*INT|FIXED\s*DEPOSIT|TDR\s*INT)/i,
  rd: /\b(?:RD\s*INT|RECURRING\s*DEPOSIT)/i,
  tds: /\b(?:TDS|TAX\s*DEDUCTED)/i,
};

// Bank-specific date + narration + amount line patterns for PDF text
const BANK_LINE_PATTERNS = {
  SBI: /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s+(?:[\d,]+\.\d{2})\s*$/gm,
  HDFC: /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s+(?:[\d,]+\.\d{2})\s*$/gm,
  ICICI: /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s+(?:[\d,]+\.\d{2})\s*$/gm,
  DEFAULT: /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})/gm,
};

const CSV_DATE_COLS = ['date', 'txn date', 'transaction date', 'value date', 'posting date'];
const CSV_DESC_COLS = ['description', 'narration', 'particulars', 'remarks', 'transaction details'];
const CSV_CREDIT_COLS = ['credit', 'credit amount', 'deposit', 'credit(inr)', 'cr'];
const CSV_AMOUNT_COLS = ['amount', 'transaction amount', 'amount(inr)'];

async function extractTextFromPDF(pdfBuffer, password) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const opts = { data: new Uint8Array(pdfBuffer) };
  if (password) opts.password = password;
  const doc = await pdfjsLib.getDocument(opts).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n');
}

function detectBank(text, hint) {
  if (hint) {
    const h = hint.toUpperCase();
    for (const bank of ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK', 'PNB']) {
      if (h.includes(bank)) return bank;
    }
  }
  const t = text.toUpperCase();
  if (t.includes('STATE BANK OF INDIA') || t.includes('SBI')) return 'SBI';
  if (t.includes('HDFC BANK')) return 'HDFC';
  if (t.includes('ICICI BANK')) return 'ICICI';
  if (t.includes('AXIS BANK')) return 'AXIS';
  if (t.includes('KOTAK MAHINDRA')) return 'KOTAK';
  if (t.includes('PUNJAB NATIONAL') || t.includes('PNB')) return 'PNB';
  return 'UNKNOWN';
}

function classifyEntry(description) {
  if (INTEREST_PATTERNS.tds.test(description)) return 'tds';
  if (INTEREST_PATTERNS.fd.test(description)) return 'fd';
  if (INTEREST_PATTERNS.rd.test(description)) return 'rd';
  if (INTEREST_PATTERNS.savings.test(description)) return 'savings';
  return null;
}

function parseCSVRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Find header row (first row containing a date-like column)
  let headerIdx = -1;
  let headers = [];
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, '').toLowerCase());
    if (cols.some((c) => CSV_DATE_COLS.includes(c) || CSV_DESC_COLS.includes(c))) {
      headerIdx = i;
      headers = cols;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const dateIdx = headers.findIndex((h) => CSV_DATE_COLS.includes(h));
  const descIdx = headers.findIndex((h) => CSV_DESC_COLS.includes(h));
  const creditIdx = headers.findIndex((h) => CSV_CREDIT_COLS.includes(h));
  const amountIdx = headers.findIndex((h) => CSV_AMOUNT_COLS.includes(h));

  if (descIdx === -1) return [];

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length <= descIdx) continue;
    const desc = cols[descIdx];
    const type = classifyEntry(desc);
    if (!type) continue;

    const amount = n(cols[creditIdx] ?? cols[amountIdx] ?? '0');
    if (amount === 0) continue;

    rows.push({
      date: dateIdx >= 0 ? cols[dateIdx] : null,
      description: desc,
      amount: Math.abs(amount),
      type,
    });
  }
  return rows;
}

function extractEntriesFromText(text, bank) {
  const pattern = BANK_LINE_PATTERNS[bank] || BANK_LINE_PATTERNS.DEFAULT;
  const entries = [];

  // Line-by-line scan for interest keywords with nearby amounts
  const lines = text.split('\n');
  for (const line of lines) {
    const type = classifyEntry(line);
    if (!type) continue;

    // Extract amount: find numbers that look like currency amounts
    const amounts = [...line.matchAll(/([\d,]+\.\d{2})/g)].map((m) => n(m[1]));
    if (amounts.length === 0) continue;

    // Extract date if present
    const dateMatch = line.match(/(\d{2}[\/-]\d{2}[\/-]\d{2,4})/);

    // For credit entries, take the second-to-last amount (credit column) or last
    const amount = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];

    entries.push({
      date: dateMatch ? dateMatch[1] : null,
      description: line.trim().substring(0, 120),
      amount: Math.abs(amount),
      type,
    });
  }

  // Fallback: regex-based extraction
  if (entries.length === 0) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const [, date, desc, amt] = match;
      const type = classifyEntry(desc);
      if (!type) continue;
      entries.push({ date, description: desc.trim().substring(0, 120), amount: Math.abs(n(amt)), type });
    }
  }

  return entries;
}

function aggregate(entries) {
  let savingsInterest = 0;
  let fdInterest = 0;
  let rdInterest = 0;
  let tdsOnInterest = 0;

  for (const e of entries) {
    switch (e.type) {
      case 'savings': savingsInterest += e.amount; break;
      case 'fd': fdInterest += e.amount; break;
      case 'rd': rdInterest += e.amount; break;
      case 'tds': tdsOnInterest += e.amount; break;
    }
  }

  return {
    savingsInterest: Math.round(savingsInterest * 100) / 100,
    fdInterest: Math.round(fdInterest * 100) / 100,
    rdInterest: Math.round(rdInterest * 100) / 100,
    tdsOnInterest: Math.round(tdsOnInterest * 100) / 100,
  };
}

class BankStatementParser {
  /**
   * Parse a bank statement buffer (PDF or CSV) and extract interest income
   * @param {Buffer} buffer - Raw file content
   * @param {{ bankName?: string, password?: string, format?: 'pdf'|'csv' }} options
   * @returns {Promise<object>} Extracted interest data
   */
  static async parse(buffer, options = {}) {
    if (!buffer || buffer.length === 0) {
      throw new AppError('Empty file uploaded', 400, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    const format = options.format || this.detectFormat(buffer);
    const warnings = [];

    if (format === 'csv') {
      return this.parseCSV(buffer, options.bankName);
    }

    return this.parsePDF(buffer, options);
  }

  static detectFormat(buffer) {
    // PDF starts with %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'pdf';
    }
    return 'csv';
  }

  static async parsePDF(buffer, options = {}) {
    const warnings = [];
    let text;

    try {
      text = await Promise.race([
        extractTextFromPDF(buffer, options.password),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)),
      ]);
    } catch (err) {
      if (err.message?.includes('password') && !options.password) {
        throw new AppError(
          'This PDF is password-protected. Please enter the password (usually your account number or customer ID).',
          422,
          'IMPORT_PASSWORD_REQUIRED'
        );
      }
      if (err.message?.includes('password') && options.password) {
        throw new AppError('Incorrect password for this PDF.', 422, 'IMPORT_PASSWORD_INCORRECT');
      }
      throw new AppError(`Could not read this PDF: ${err.message}`, 422, ErrorCodes.IMPORT_PARSE_FAILED);
    }

    if (!text || text.trim().length < 50) {
      throw new AppError(
        'This PDF appears to be a scanned image. Only digitally-generated bank statements are supported.',
        422,
        ErrorCodes.IMPORT_PARSE_FAILED
      );
    }

    const bankName = detectBank(text, options.bankName);
    const entries = extractEntriesFromText(text, bankName);
    const totals = aggregate(entries);

    if (entries.length === 0) {
      warnings.push('No interest entries found in this statement. Verify this is a complete bank statement.');
    }
    if (bankName === 'UNKNOWN') {
      warnings.push('Could not identify the bank. Results may be less accurate.');
    }

    return { ...totals, entries, bankName, warnings };
  }

  static parseCSV(buffer, bankNameHint) {
    const warnings = [];
    const csvText = buffer.toString('utf-8');
    const bankName = detectBank(csvText, bankNameHint);
    const entries = parseCSVRows(csvText);
    const totals = aggregate(entries);

    if (entries.length === 0) {
      warnings.push('No interest entries found in this CSV. Verify the file contains transaction data with narration/description columns.');
    }
    if (bankName === 'UNKNOWN') {
      warnings.push('Could not identify the bank. Results may be less accurate.');
    }

    return { ...totals, entries, bankName, warnings };
  }
}

module.exports = BankStatementParser;
