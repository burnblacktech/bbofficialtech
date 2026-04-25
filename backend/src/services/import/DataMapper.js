/**
 * DataMapper — Maps parsed document data to jsonPayload field paths.
 * Handles Form 16, 26AS, and AIS → canonical jsonPayload structure.
 */

const n = (v) => Number(v) || 0;
const { SOURCE_AUTHORITY } = require('./ConflictResolver');

class DataMapper {

  /**
   * Map Form 16 parsed data to jsonPayload paths
   * @param {object} parsed - Output from Form16Parser.parse()
   * @returns {object} { fieldPath: value } flat map
   */
  static mapForm16(parsed) {
    const map = {};
    const { partA, partB } = parsed;

    // Employer entry (index 0 — Form 16 is per-employer)
    if (partA.employerName) map['income.salary.employers[0].name'] = partA.employerName;
    if (partA.employerTAN) map['income.salary.employers[0].tan'] = partA.employerTAN;
    if (partA.tdsDeducted) map['income.salary.employers[0].tdsDeducted'] = partA.tdsDeducted;

    if (partB.grossSalary) map['income.salary.employers[0].grossSalary'] = partB.grossSalary;
    if (partB.hra) map['income.salary.employers[0].allowances.hra.exempt'] = partB.hra;
    if (partB.lta) map['income.salary.employers[0].allowances.lta.exempt'] = partB.lta;
    if (partB.professionalTax) map['income.salary.employers[0].deductions.professionalTax'] = partB.professionalTax;

    // Chapter VI-A deductions
    const ded = partB.deductions || {};
    if (ded['80C']) map['deductions.ppf'] = ded['80C']; // Map to flat deduction fields
    if (ded['80CCD1B']) map['deductions.nps'] = ded['80CCD1B'];
    if (ded['80D']) map['deductions.healthSelf'] = ded['80D'];
    if (ded['80E']) map['deductions.eduLoan'] = ded['80E'];
    if (ded['80G']) map['deductions.donations'] = ded['80G'];
    if (ded['80TTA']) map['deductions.savingsInt'] = ded['80TTA'];

    return map;
  }

  /**
   * Map 26AS parsed data to jsonPayload paths
   * @param {object} parsed - Output from TwentySixASParser.parse()
   * @param {object} existingPayload - Current jsonPayload for TAN matching
   * @returns {object} { fieldPath: value } flat map
   */
  static map26AS(parsed, existingPayload = {}) {
    const map = {};
    const existingEmployers = existingPayload?.income?.salary?.employers || [];

    // Part A: TDS entries
    let salaryIdx = 0;
    let totalInterestTDS = 0;
    let totalOtherTDS = 0;

    for (const entry of parsed.partA) {
      if (entry.category === 'salary') {
        // Match by TAN to existing employer
        const matchIdx = existingEmployers.findIndex(e => e.tan === entry.deductorTAN);
        const idx = matchIdx >= 0 ? matchIdx : salaryIdx;
        map[`income.salary.employers[${idx}].tdsDeducted`] = entry.tdsDeducted;
        if (!existingEmployers[idx]?.name && entry.deductorName) {
          map[`income.salary.employers[${idx}].name`] = entry.deductorName;
        }
        if (!existingEmployers[idx]?.tan && entry.deductorTAN) {
          map[`income.salary.employers[${idx}].tan`] = entry.deductorTAN;
        }
        salaryIdx = Math.max(salaryIdx, idx + 1);
      } else if (entry.category === 'interest') {
        totalInterestTDS += entry.tdsDeducted;
      } else {
        totalOtherTDS += entry.tdsDeducted;
      }
    }

    if (totalInterestTDS > 0) map['taxes.tds.fromFD'] = totalInterestTDS;
    if (totalOtherTDS > 0) map['taxes.tds.fromOther'] = totalOtherTDS;

    // Part C: Tax paid
    for (const entry of parsed.partC) {
      if (entry.type === 'advance_tax') map['taxes.advanceTax'] = (n(map['taxes.advanceTax']) || 0) + entry.amount;
      else if (entry.type === 'self_assessment') map['taxes.selfAssessmentTax'] = (n(map['taxes.selfAssessmentTax']) || 0) + entry.amount;
    }

    return map;
  }

  /**
   * Map AIS parsed data to jsonPayload paths
   * @param {object} parsed - Output from AISParser.parse()
   * @returns {object} { fieldPath: value } flat map
   */
  static mapAIS(parsed) {
    const map = {};

    // Salary
    parsed.salary.forEach((e, i) => {
      if (e.grossSalary) map[`income.salary.employers[${i}].grossSalary`] = e.grossSalary;
      if (e.employerName) map[`income.salary.employers[${i}].name`] = e.employerName;
      if (e.employerTAN) map[`income.salary.employers[${i}].tan`] = e.employerTAN;
      if (e.tdsDeducted) map[`income.salary.employers[${i}].tdsDeducted`] = e.tdsDeducted;
    });

    // Interest
    const totalSavings = parsed.interest.filter(e => e.type === 'savings').reduce((s, e) => s + e.amount, 0);
    const totalFD = parsed.interest.filter(e => e.type === 'fd' || e.type === 'rd').reduce((s, e) => s + e.amount, 0);
    if (totalSavings) map['income.otherSources.savingsInterest'] = totalSavings;
    if (totalFD) map['income.otherSources.fdInterest'] = totalFD;

    // Dividends
    const totalDiv = parsed.dividends.reduce((s, e) => s + e.amount, 0);
    if (totalDiv) map['income.otherSources.dividendIncome'] = totalDiv;

    // Capital gains
    parsed.capitalGains.forEach((e, i) => {
      map[`income.capitalGains.transactions[${i}].assetType`] = e.assetType;
      map[`income.capitalGains.transactions[${i}].saleValue`] = e.saleConsideration;
      map[`income.capitalGains.transactions[${i}].purchaseValue`] = e.purchaseCost;
      map[`income.capitalGains.transactions[${i}].gainType`] = e.holdingPeriod === 'long_term' ? 'LTCG' : 'STCG';
    });

    return map;
  }

  /**
   * Map Form 16A parsed data to jsonPayload paths
   * Routes section codes to income sections and TDS to nonSalaryEntries
   * @param {object} parsed - Output from Form16AParser.parse()
   * @returns {object} { fieldPath: value } flat map
   */
  static mapForm16A(parsed) {
    const map = {};
    const { data } = parsed;
    if (!data) return map;

    // Map section code to income section
    const section = (data.sectionCode || '').toUpperCase();
    if (section === '194A' || section === '194A') {
      // Interest income — FD/savings
      if (data.amountPaid) map['income.otherSources.fdInterest'] = data.amountPaid;
    } else if (section === '194I' || section === '194IA' || section === '194IB') {
      // Rent income — could be house property or other sources
      if (data.amountPaid) map['income.otherSources.otherIncome'] = data.amountPaid;
    } else if (section === '194J') {
      // Professional fees — other sources
      if (data.amountPaid) map['income.otherSources.otherIncome'] = data.amountPaid;
    } else if (data.amountPaid) {
      // Other section codes → other sources
      map['income.otherSources.otherIncome'] = data.amountPaid;
    }

    // TDS entry → nonSalaryEntries
    if (data.tdsDeducted || data.deductorTan) {
      map['taxes.tds.nonSalaryEntries[0].deductorTan'] = data.deductorTan || '';
      map['taxes.tds.nonSalaryEntries[0].deductorName'] = data.deductorName || '';
      map['taxes.tds.nonSalaryEntries[0].sectionCode'] = data.sectionCode || '';
      map['taxes.tds.nonSalaryEntries[0].amountPaid'] = n(data.amountPaid);
      map['taxes.tds.nonSalaryEntries[0].tdsDeducted'] = n(data.tdsDeducted);
      map['taxes.tds.nonSalaryEntries[0].tdsClaimed'] = n(data.tdsDeducted);
    }

    return map;
  }

  /**
   * Map Form 16B parsed data to jsonPayload paths
   * Maps property sale to capital gains and TDS to fromCapitalGains
   * @param {object} parsed - Output from Form16BParser.parse()
   * @returns {object} { fieldPath: value } flat map
   */
  static mapForm16B(parsed) {
    const map = {};
    const { data } = parsed;
    if (!data) return map;

    // Property sale → capital gains transaction
    if (data.propertySaleConsideration) {
      map['income.capitalGains.transactions[0].assetType'] = 'property';
      map['income.capitalGains.transactions[0].saleValue'] = n(data.propertySaleConsideration);
      map['income.capitalGains.transactions[0].gainType'] = 'LTCG';
      if (data.transactionDate) {
        map['income.capitalGains.transactions[0].saleDate'] = data.transactionDate;
      }
    }

    // TDS on property sale
    if (data.tdsDeducted) {
      map['taxes.tds.fromCapitalGains'] = n(data.tdsDeducted);
    }

    return map;
  }

  /**
   * Map Form 16C parsed data to jsonPayload paths
   * Maps rent to house property income and TDS to nonSalaryEntries
   * @param {object} parsed - Output from Form16CParser.parse()
   * @returns {object} { fieldPath: value } flat map
   */
  static mapForm16C(parsed) {
    const map = {};
    const { data } = parsed;
    if (!data) return map;

    // Rent income → house property (let-out rental income)
    if (data.rentAmount) {
      map['income.houseProperty.type'] = 'LET_OUT';
      map['income.houseProperty.annualRent'] = n(data.rentAmount);
    }

    // TDS on rent → nonSalaryEntries
    if (data.tdsDeducted || data.tenantTan) {
      map['taxes.tds.nonSalaryEntries[0].deductorTan'] = data.tenantTan || '';
      map['taxes.tds.nonSalaryEntries[0].deductorName'] = data.tenantName || '';
      map['taxes.tds.nonSalaryEntries[0].sectionCode'] = '194IB';
      map['taxes.tds.nonSalaryEntries[0].amountPaid'] = n(data.rentAmount);
      map['taxes.tds.nonSalaryEntries[0].tdsDeducted'] = n(data.tdsDeducted);
      map['taxes.tds.nonSalaryEntries[0].tdsClaimed'] = n(data.tdsDeducted);
    }

    return map;
  }

  /**
   * Merge mapped data into existing payload (non-destructive)
   * @param {object} existingPayload - Current jsonPayload
   * @param {object} mappedData - { fieldPath: value } from mapXxx()
   * @param {object} importMeta - { importId, documentType, ... }
   * @returns {{ mergedPayload: object, fieldsUpdated: string[] }}
   */
  static mergeIntoPayload(existingPayload, mappedData, importMeta) {
    const merged = JSON.parse(JSON.stringify(existingPayload || {}));
    const fieldsUpdated = [];

    for (const [path, value] of Object.entries(mappedData)) {
      this.setNestedValue(merged, path, value);
      fieldsUpdated.push(path);
    }

    // Update import metadata
    if (!merged._importMeta) merged._importMeta = { imports: [], fieldSources: {} };
    if (importMeta) {
      merged._importMeta.imports.push(importMeta);
      for (const field of fieldsUpdated) {
        const auth = SOURCE_AUTHORITY[importMeta.documentType] || SOURCE_AUTHORITY.manual;
        merged._importMeta.fieldSources[field] = {
          source: importMeta.documentType,
          importId: importMeta.importId,
          importedAt: importMeta.importedAt,
          authorityTier: auth.tier,
          editLock: auth.tier === 'itd' ? 'locked' : auth.tier === 'employer' ? 'warn' : 'free',
        };
      }
    }

    return { mergedPayload: merged, fieldsUpdated };
  }

  /**
   * Set a nested value using a dot-notation path with array support
   * e.g., 'income.salary.employers[0].name' → sets obj.income.salary.employers[0].name
   */
  static setNestedValue(obj, path, value) {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const nextKey = parts[i + 1];
      const isNextArray = /^\d+$/.test(nextKey);
      if (current[key] === undefined) {
        current[key] = isNextArray ? [] : {};
      }
      current = current[key];
    }
    current[parts[parts.length - 1]] = value;
  }
}

module.exports = DataMapper;
