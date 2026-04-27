/**
 * SurePass26ASTransformer
 * Transforms SurePass `get-26as-details` response into the
 * TwentySixASParser.parse() output shape for downstream DataMapper consumption.
 */

const SECTION_MAP = {
  '192': 'salary',
  '194A': 'interest',
  '194B': 'lottery',
  '194C': 'contractor',
  '194D': 'insurance',
  '194H': 'commission',
  '194I': 'rent',
  '194J': 'professional',
  '194K': 'mfIncome',
  '194N': 'cashWithdrawal',
  '194S': 'vda',
};

class SurePass26ASTransformer {
  /**
   * Transform SurePass 26AS response to normalized TwentySixASParser shape
   * @param {object} surePassData - Raw response from SurePass get-26as-details
   * @param {string} pan - PAN from authenticated session
   * @returns {object} Normalized 26AS data matching TwentySixASParser output
   */
  static transform(surePassData, pan) {
    const warnings = [];
    const tdsEntries = (surePassData?.tds_data || []).map(entry => ({
      deductorName: entry.name_of_deductor || '',
      deductorTAN: entry.tan_of_deductor || '',
      sectionCode: entry.section || '',
      amountPaid: parseFloat(entry.amount_paid || entry.total_amount_paid || 0),
      tdsDeducted: parseFloat(entry.tax_deducted || entry.total_tax_deducted || 0),
      transactionDate: entry.transaction_date || '',
      category: SECTION_MAP[entry.section] || 'other',
    }));

    if (surePassData?.tds_data && tdsEntries.length === 0) {
      warnings.push('26AS data was present but contained no parseable TDS entries.');
    }

    const partA = tdsEntries.filter(e => e.category === 'salary');
    const partA1 = tdsEntries.filter(e => e.category !== 'salary');

    return {
      pan,
      assessmentYear: surePassData?.assessment_year || '',
      partA,
      partA1,
      partB: [],
      partC: [],
      partD: [],
      summary: {
        totalTDS: tdsEntries.reduce((s, e) => s + e.tdsDeducted, 0),
        totalAmountPaid: tdsEntries.reduce((s, e) => s + e.amountPaid, 0),
        entryCount: tdsEntries.length,
      },
      source: 'SUREPASS_API',
      warnings,
    };
  }
}

module.exports = SurePass26ASTransformer;
