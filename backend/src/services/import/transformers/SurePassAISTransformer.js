/**
 * SurePassAISTransformer
 * Transforms SurePass AIS/TIS response into the
 * AISParser.parse() output shape for downstream DataMapper consumption.
 * Uses `accepted_by_taxpayer` as primary amount when available.
 */

const SFT_MAP = {
  'SFT-015': 'dividends',
  'SFT-005': 'capitalGains',
  'SFT-004': 'interest',
  'SFT-003': 'salary',
  'SFT-017': 'capitalGains',
  'SFT-016': 'interest',
};

class SurePassAISTransformer {
  /**
   * Transform SurePass AIS response to normalized AISParser shape
   * @param {object} surePassData - Raw response from SurePass get-ais
   * @param {string} pan - PAN from authenticated session
   * @returns {object} Normalized AIS data matching AISParser output
   */
  static transform(surePassData, pan) {
    const warnings = [];
    const sftEntries = surePassData?.sft_data || [];
    const salary = [];
    const interest = [];
    const dividends = [];
    const capitalGains = [];
    const otherIncome = [];

    for (const entry of sftEntries) {
      const code = entry.information_code || '';
      const category = SFT_MAP[code] || 'other';
      const amount = parseFloat(entry.accepted_by_taxpayer || entry.reported_by_source || 0);
      const item = {
        payerName: entry.payer_name || entry.information_source || '',
        payerTAN: entry.payer_tan || '',
        amount,
        description: entry.information_description || '',
        sftCode: code,
      };

      switch (category) {
        case 'salary':
          salary.push({ ...item, grossSalary: amount, tdsDeducted: 0 });
          break;
        case 'interest':
          interest.push({ ...item, type: code === 'SFT-004' ? 'savings' : 'fd' });
          break;
        case 'dividends':
          dividends.push(item);
          break;
        case 'capitalGains':
          capitalGains.push({ ...item, saleConsideration: amount, purchaseCost: 0, gainOrLoss: amount });
          break;
        default:
          otherIncome.push(item);
      }
    }

    if (surePassData?.sft_data && sftEntries.length === 0) {
      warnings.push('AIS data was present but contained no parseable SFT entries.');
    }

    return {
      pan,
      assessmentYear: surePassData?.assessment_year || '',
      financialYear: surePassData?.financial_year || '',
      salary,
      interest,
      dividends,
      capitalGains,
      otherIncome,
      summary: {
        totalSalary: salary.reduce((s, e) => s + e.amount, 0),
        totalInterest: interest.reduce((s, e) => s + e.amount, 0),
        totalDividends: dividends.reduce((s, e) => s + e.amount, 0),
        totalCapitalGains: capitalGains.reduce((s, e) => s + e.amount, 0),
        totalOther: otherIncome.reduce((s, e) => s + e.amount, 0),
        entryCount: sftEntries.length,
      },
      source: 'SUREPASS_API',
      warnings,
    };
  }
}

module.exports = SurePassAISTransformer;
