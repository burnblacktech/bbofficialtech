const n = (v) => Number(v) || 0;

export function buildComparison(computation) {
  if (!computation?.oldRegime || !computation?.newRegime) return null;

  const old = computation.oldRegime;
  const nw = computation.newRegime;

  const recommended = old.totalTax <= nw.totalTax ? 'old' : 'new';
  const totalSavings = Math.abs(old.totalTax - nw.totalTax);

  // Per-section savings (deduction breakdown diff)
  const oldBreakdown = old.deductionBreakdown || {};
  const newBreakdown = nw.deductionBreakdown || {};
  const allSections = new Set([...Object.keys(oldBreakdown), ...Object.keys(newBreakdown)]);

  const perSectionSavings = [...allSections].map(section => ({
    section: section.replace('section', ''),
    oldAmount: n(oldBreakdown[section]),
    newAmount: n(newBreakdown[section]),
    difference: n(oldBreakdown[section]) - n(newBreakdown[section]),
  })).filter(s => s.difference !== 0);

  const explanation = recommended === 'old'
    ? `Old regime saves ₹${totalSavings.toLocaleString('en-IN')} because your deductions (${perSectionSavings.filter(s => s.difference > 0).map(s => s.section).join(', ')}) reduce taxable income significantly.`
    : `New regime saves ₹${totalSavings.toLocaleString('en-IN')} because the lower slab rates offset the loss of deductions.`;

  return {
    oldRegime: {
      grossIncome: old.grossTotalIncome, deductions: old.deductions,
      deductionBreakdown: oldBreakdown, taxableIncome: old.taxableIncome,
      taxOnIncome: old.taxOnIncome, rebate: old.rebate, surcharge: old.surcharge,
      cess: old.cess, totalTax: old.totalTax, tdsCredit: old.tdsCredit,
      netPayable: old.netPayable,
    },
    newRegime: {
      grossIncome: nw.grossTotalIncome, deductions: nw.deductions,
      deductionBreakdown: newBreakdown, taxableIncome: nw.taxableIncome,
      taxOnIncome: nw.taxOnIncome, rebate: nw.rebate, surcharge: nw.surcharge,
      cess: nw.cess, totalTax: nw.totalTax, tdsCredit: nw.tdsCredit,
      netPayable: nw.netPayable,
    },
    recommended,
    totalSavings,
    perSectionSavings,
    explanation,
  };
}
