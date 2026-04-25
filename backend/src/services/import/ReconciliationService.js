/**
 * ReconciliationService — Pure computation module.
 * Compares 26AS TDS entries against filing income entries.
 * No DB access, no side effects.
 */

class ReconciliationService {
  /**
   * Reconcile 26AS TDS entries against filing income entries
   * @param {object} jsonPayload - Filing jsonPayload
   * @returns {{ matches: Array, unmatchedTDS: Array, unmatchedIncome: Array, mismatches: Array }}
   */
  static reconcile(jsonPayload) {
    const tdsEntries = this.extract26ASTDSEntries(jsonPayload);
    const incomeEntries = this.extractIncomeEntries(jsonPayload);

    const matches = [];
    const unmatchedTDS = [];
    const mismatches = [];

    const matchedIncomeTANs = new Set();

    for (const tds of tdsEntries) {
      const match = incomeEntries.find(inc => inc.tan && tds.deductorTAN && inc.tan === tds.deductorTAN);
      if (!match) {
        unmatchedTDS.push({ ...tds, flag: 'TDS credit without declared income' });
      } else if (Math.abs(tds.tdsDeducted - match.tdsAmount) > 1) {
        mismatches.push({ tds, income: match, difference: tds.tdsDeducted - match.tdsAmount });
        matchedIncomeTANs.add(match.tan);
      } else {
        matches.push({ tds, income: match });
        matchedIncomeTANs.add(match.tan);
      }
    }

    // Check income entries without TDS
    const unmatchedIncome = [];
    for (const inc of incomeEntries) {
      if (inc.tan && !matchedIncomeTANs.has(inc.tan) && !tdsEntries.find(t => t.deductorTAN === inc.tan)) {
        unmatchedIncome.push({ ...inc, flag: 'Declared income without TDS credit' });
      }
    }

    return { matches, unmatchedTDS, unmatchedIncome, mismatches };
  }

  /**
   * Extract TDS entries from 26AS data in jsonPayload
   */
  static extract26ASTDSEntries(jsonPayload) {
    const entries = [];
    const employers = jsonPayload?.income?.salary?.employers || [];

    // Salary employer TDS (from 26AS import)
    for (const emp of employers) {
      if (emp.tan && emp.tdsDeducted) {
        entries.push({
          deductorTAN: emp.tan,
          deductorName: emp.name || '',
          tdsDeducted: Number(emp.tdsDeducted) || 0,
          source: 'salary',
        });
      }
    }

    // Non-salary TDS entries
    const nonSalary = jsonPayload?.taxes?.tds?.nonSalaryEntries || [];
    for (const entry of nonSalary) {
      if (entry.deductorTan && entry.tdsDeducted) {
        entries.push({
          deductorTAN: entry.deductorTan,
          deductorName: entry.deductorName || '',
          tdsDeducted: Number(entry.tdsDeducted) || 0,
          source: entry.sectionCode || 'other',
        });
      }
    }

    return entries;
  }

  /**
   * Extract income entries with TANs from jsonPayload
   */
  static extractIncomeEntries(jsonPayload) {
    const entries = [];
    const employers = jsonPayload?.income?.salary?.employers || [];

    for (const emp of employers) {
      if (emp.tan) {
        entries.push({
          tan: emp.tan,
          source: 'salary',
          amount: Number(emp.grossSalary) || 0,
          tdsAmount: Number(emp.tdsDeducted) || 0,
        });
      }
    }

    // Non-salary entries with TANs
    const nonSalary = jsonPayload?.taxes?.tds?.nonSalaryEntries || [];
    for (const entry of nonSalary) {
      if (entry.deductorTan) {
        entries.push({
          tan: entry.deductorTan,
          source: entry.sectionCode || 'other',
          amount: Number(entry.amountPaid) || 0,
          tdsAmount: Number(entry.tdsDeducted) || 0,
        });
      }
    }

    return entries;
  }
}

module.exports = ReconciliationService;
