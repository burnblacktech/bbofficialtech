/**
 * SurePassDataMapper
 * Maps normalized 26AS and AIS transformer output to jsonPayload field paths.
 * Works with the object-shaped output from SurePass transformers (not flat maps).
 * The existing DataMapper handles flat field-path maps; this mapper produces
 * structured partial payloads that can be deep-merged.
 */

class SurePassDataMapper {
  /**
   * Map normalized 26AS data to jsonPayload fields
   * @param {object} normalized26AS - Output from SurePass26ASTransformer.transform()
   * @param {object} existingPayload - Current jsonPayload for TAN matching
   * @returns {object} Partial jsonPayload structure
   */
  static map26AS(normalized26AS, existingPayload) {
    const mapped = {};
    const existingEmployers = existingPayload?.income?.salary?.employers || [];

    // Salary TDS (Section 192) — match by TAN
    for (const entry of (normalized26AS.partA || [])) {
      const existingIdx = existingEmployers.findIndex(e => e.tan === entry.deductorTAN);
      if (existingIdx >= 0) {
        // Enrich existing employer
        if (!mapped.income) mapped.income = { salary: { employers: [...existingEmployers] } };
        mapped.income.salary.employers[existingIdx] = {
          ...existingEmployers[existingIdx],
          tdsDeducted: entry.tdsDeducted,
          name: existingEmployers[existingIdx].name || entry.deductorName,
          tan: existingEmployers[existingIdx].tan || entry.deductorTAN,
        };
      } else {
        // New employer from 26AS
        if (!mapped.income) mapped.income = { salary: { employers: [...existingEmployers] } };
        mapped.income.salary.employers.push({
          name: entry.deductorName,
          tan: entry.deductorTAN,
          grossSalary: entry.amountPaid,
          tdsDeducted: entry.tdsDeducted,
          _source: '26as',
        });
      }
    }

    // Non-salary TDS → taxes.tds.nonSalaryEntries
    const nonSalaryEntries = (normalized26AS.partA1 || []).map(entry => ({
      deductorTan: entry.deductorTAN,
      deductorName: entry.deductorName,
      sectionCode: entry.sectionCode,
      amountPaid: entry.amountPaid,
      tdsDeducted: entry.tdsDeducted,
      tdsClaimed: entry.tdsDeducted,
      _source: '26as',
    }));
    if (nonSalaryEntries.length > 0) {
      mapped.taxes = { tds: { nonSalaryEntries } };
    }

    // Part C: advance/self-assessment tax
    for (const entry of (normalized26AS.partC || [])) {
      if (!mapped.taxes) mapped.taxes = {};
      if (entry.type === 'advance') {
        mapped.taxes.advanceTax = (mapped.taxes.advanceTax || 0) + entry.amount;
      } else if (entry.type === 'selfAssessment') {
        mapped.taxes.selfAssessmentTax = (mapped.taxes.selfAssessmentTax || 0) + entry.amount;
      }
    }

    return mapped;
  }

  /**
   * Map normalized AIS data to jsonPayload fields
   * @param {object} normalizedAIS - Output from SurePassAISTransformer.transform()
   * @returns {object} Partial jsonPayload structure
   */
  static mapAIS(normalizedAIS) {
    const mapped = {};

    // Dividends
    const totalDiv = (normalizedAIS.dividends || []).reduce((s, e) => s + e.amount, 0);
    if (totalDiv > 0) {
      if (!mapped.income) mapped.income = {};
      if (!mapped.income.otherSources) mapped.income.otherSources = {};
      mapped.income.otherSources.dividendIncome = totalDiv;
    }

    // Interest
    const savingsInt = (normalizedAIS.interest || [])
      .filter(e => e.type === 'savings')
      .reduce((s, e) => s + e.amount, 0);
    const fdInt = (normalizedAIS.interest || [])
      .filter(e => e.type !== 'savings')
      .reduce((s, e) => s + e.amount, 0);
    if (savingsInt > 0 || fdInt > 0) {
      if (!mapped.income) mapped.income = {};
      if (!mapped.income.otherSources) mapped.income.otherSources = {};
      if (savingsInt > 0) mapped.income.otherSources.savingsInterest = savingsInt;
      if (fdInt > 0) mapped.income.otherSources.fdInterest = fdInt;
    }

    // Capital gains
    if (normalizedAIS.capitalGains?.length > 0) {
      if (!mapped.income) mapped.income = {};
      mapped.income.capitalGains = {
        transactions: normalizedAIS.capitalGains.map(e => ({
          assetType: 'equity',
          gainType: 'STCG',
          saleValue: e.saleConsideration,
          purchaseValue: e.purchaseCost || 0,
          _source: 'ais',
        })),
      };
    }

    return mapped;
  }
}

module.exports = SurePassDataMapper;
