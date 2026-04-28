/**
 * Tax Brain — Contextual tax advice engine.
 *
 * Generates intelligent whispers based on the user's filing data.
 * Each whisper has: { id, type, message, section, priority }
 *   type: 'tip' | 'warning' | 'saving' | 'info'
 *   priority: 1 (critical) | 2 (important) | 3 (nice-to-know)
 *
 * Usage: const whispers = generateWhispers(payload, computation, selectedRegime);
 *        const salaryWhispers = whispers.filter(w => w.section === 'salary');
 */

const n = (v) => Number(v) || 0;
const rs = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

/** Calculate age from DOB string (YYYY-MM-DD) as of March 31 of current FY */
function getAge(dob) {
  if (!dob) return 0;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  // Age as of March 31 of the financial year
  const fyEnd = new Date(now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear(), 2, 31);
  let age = fyEnd.getFullYear() - d.getFullYear();
  if (fyEnd < new Date(fyEnd.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

export function generateWhispers(payload, computation, selectedRegime) {
  if (!payload) return [];
  const w = [];
  const pi = payload.personalInfo || {};
  const sal = payload.income?.salary || {};
  const hp = payload.income?.houseProperty || {};
  const os = payload.income?.otherSources || {};
  const ded = payload.deductions || {};
  const taxes = payload.taxes || {};
  const comp = computation || {};
  const regime = selectedRegime || 'new';
  const employers = sal.employers || [];
  const agri = n(payload.income?.agriculturalIncome);

  // ── Personal Info whispers ──
  if (pi.employerCategory === 'GOV') {
    w.push({ id: 'pi-gov', type: 'info', section: 'personalInfo', priority: 3,
      message: 'Government employees get entertainment allowance deduction (up to \u20B95,000) and higher gratuity/leave encashment exemptions.' });
  }
  if (pi.filingStatus === 'O' && pi.residentialStatus === 'NRI') {
    w.push({ id: 'pi-nri-itr1', type: 'warning', section: 'personalInfo', priority: 1,
      message: 'NRIs with income above \u20B950L or foreign assets should use ITR-2, not ITR-1.' });
  }

  // ── Salary whispers ──
  if (employers.length > 1) {
    const totalTDS = employers.reduce((s, e) => s + n(e.tdsDeducted), 0);
    const totalGross = employers.reduce((s, e) => s + n(e.grossSalary), 0);
    w.push({ id: 'sal-multi', type: 'warning', section: 'salary', priority: 2,
      message: `You have ${employers.length} employers. Each deducts TDS assuming they're your only employer. Your combined income of ${rs(totalGross)} may push you into a higher slab. Verify your total TDS of ${rs(totalTDS)} covers your actual liability.` });
  }

  if (employers.length === 1) {
    const emp = employers[0];
    const hraRcvd = n(emp.allowances?.hra?.received);
    const hraExempt = n(emp.allowances?.hra?.exempt);
    const rent = n(emp.rentPaid);
    const basic = n(emp.basicPlusDA);
    if (hraRcvd > 0 && hraExempt === 0 && rent > 0 && basic > 0) {
      w.push({ id: 'sal-hra-unclaimed', type: 'saving', section: 'salary', priority: 1,
        message: 'You receive HRA and pay rent but haven\'t claimed the HRA exemption. Fill in the exempt amount to reduce your taxable salary.' });
    }
    if (hraRcvd > 0 && rent === 0) {
      w.push({ id: 'sal-hra-no-rent', type: 'tip', section: 'salary', priority: 3,
        message: 'You receive HRA but haven\'t entered rent paid. If you pay rent, enter it to claim HRA exemption.' });
    }
    if (n(emp.grossSalary) > 0 && n(emp.tdsDeducted) === 0) {
      w.push({ id: 'sal-no-tds', type: 'warning', section: 'salary', priority: 2,
        message: 'No TDS deducted on your salary. If your income is taxable, you may need to pay self-assessment tax before filing.' });
    }
    if (pi.employerCategory === 'GOV' && n(emp.entertainmentAllowance) === 0) {
      w.push({ id: 'sal-gov-ea', type: 'tip', section: 'salary', priority: 3,
        message: 'Government employees can claim entertainment allowance deduction (up to \u20B95,000). Check your Form 16 Part B.' });
    }
  }

  // NPS employer contribution hint
  const hasNPSEmployer = employers.some(e => n(e.allowances?.npsEmployer) > 0);
  if (!hasNPSEmployer && employers.length > 0) {
    const totalBasic = employers.reduce((s, e) => s + n(e.basicPlusDA), 0);
    if (totalBasic > 0) {
      w.push({ id: 'sal-nps-employer', type: 'tip', section: 'salary', priority: 3,
        message: `Your employer can contribute up to 10% of basic (${rs(Math.round(totalBasic * 0.1))}) to NPS under 80CCD(2) — this is over and above the \u20B91.5L 80C limit. Check with your HR.` });
    }
  }

  // ── Other Income whispers ──
  const savInt = n(os.savingsInterest);
  const fdInt = n(os.fdInterest);
  if (savInt > 10000 && regime === 'old') {
    w.push({ id: 'oi-80tta-cap', type: 'info', section: 'other', priority: 2,
      message: `Savings interest of ${rs(savInt)} exceeds the \u20B910,000 80TTA deduction limit. Only \u20B910,000 will be deducted. Consider splitting across family members' accounts.` });
  }
  if (fdInt > 40000) {
    w.push({ id: 'oi-fd-tds', type: 'info', section: 'other', priority: 3,
      message: `FD interest of ${rs(fdInt)} exceeds \u20B940,000 — your bank should have deducted TDS. Check Form 26AS to verify TDS credit.` });
  }
  if (n(os.dividendIncome) > 5000) {
    w.push({ id: 'oi-div-tds', type: 'info', section: 'other', priority: 3,
      message: 'Dividends above \u20B95,000 attract 10% TDS. Verify this TDS is reflected in your 26AS.' });
  }
  if (agri > 500000) {
    w.push({ id: 'oi-agri-high', type: 'warning', section: 'other', priority: 2,
      message: `Agricultural income of ${rs(agri)} is exempt but significantly increases the tax rate on your other income through partial integration. Consider consulting a CA.` });
  }
  if (n(os.winnings) > 0) {
    w.push({ id: 'oi-winnings', type: 'info', section: 'other', priority: 2,
      message: `Lottery/betting winnings of ${rs(os.winnings)} are taxed at flat 30% (no slab benefit). TDS should have been deducted at source.` });
  }
  if (n(os.gifts) > 0 && n(os.gifts) <= 50000) {
    w.push({ id: 'oi-gifts-exempt', type: 'tip', section: 'other', priority: 3,
      message: 'Gifts from non-relatives up to \u20B950,000 in a year are exempt. You only need to report the taxable portion above \u20B950,000.' });
  }

  // ── House Property whispers ──
  if (hp.type === 'selfOccupied') {
    const interest = n(hp.interestOnHomeLoan);
    if (interest > 200000) {
      w.push({ id: 'hp-cap', type: 'info', section: 'house_property', priority: 2,
        message: `Home loan interest of ${rs(interest)} exceeds the \u20B92,00,000 cap for self-occupied property. Only \u20B92,00,000 will be allowed. If you let out the property, there's no cap on interest deduction.` });
    }
    if (interest > 0 && interest < 200000) {
      w.push({ id: 'hp-under-cap', type: 'info', section: 'house_property', priority: 3,
        message: `You're using ${rs(interest)} of the \u20B92,00,000 home loan interest limit. ${rs(200000 - interest)} remaining.` });
    }
  }
  if (hp.type === 'letOut') {
    const rent = n(hp.annualRentReceived);
    const muni = n(hp.municipalTaxesPaid);
    if (rent > 0 && muni === 0) {
      w.push({ id: 'hp-no-muni', type: 'tip', section: 'house_property', priority: 2,
        message: 'You haven\'t entered municipal taxes. Property tax paid to the local body is deductible from rental income. Check your property tax receipt.' });
    }
    if (rent > 0) {
      const netAV = Math.max(rent - muni, 0);
      const stdDed = Math.round(netAV * 0.3);
      w.push({ id: 'hp-std-ded', type: 'info', section: 'house_property', priority: 3,
        message: `30% standard deduction of ${rs(stdDed)} is automatically applied on net annual value. No receipts needed for this.` });
    }
  }
  if (hp.type === 'none' && n(ded.rentPaid) > 0) {
    w.push({ id: 'hp-80gg-hint', type: 'info', section: 'house_property', priority: 3,
      message: 'You\'re claiming 80GG rent deduction. This is only available if you don\'t own a house property and don\'t receive HRA.' });
  }

  // ── Deductions whispers ──
  const raw80C = n(ded.ppf) + n(ded.elss) + n(ded.lic) + n(ded.tuitionFees) + n(ded.homeLoanPrincipal) + n(ded.sukanyaSamriddhi) + n(ded.fiveYearFD) + n(ded.nsc) + n(ded.otherC);

  if (regime === 'old') {
    if (raw80C > 0 && raw80C < 150000) {
      const remaining = 150000 - raw80C;
      const suggestions = [];
      if (n(ded.ppf) === 0) suggestions.push('PPF (7.1% guaranteed, 15yr lock-in)');
      if (n(ded.elss) === 0) suggestions.push('ELSS mutual funds (3yr lock-in, market-linked)');
      if (n(ded.fiveYearFD) === 0) suggestions.push('5-year tax saver FD');
      w.push({ id: 'ded-80c-room', type: 'saving', section: 'deductions', priority: 1,
        message: `You've used ${rs(raw80C)} of the \u20B91,50,000 80C limit. ${rs(remaining)} remaining.${suggestions.length > 0 ? ` Consider: ${suggestions.slice(0, 2).join(', ')}.` : ''}` });
    }
    if (raw80C > 150000) {
      w.push({ id: 'ded-80c-over', type: 'warning', section: 'deductions', priority: 2,
        message: `Your 80C investments total ${rs(raw80C)} but only \u20B91,50,000 is deductible. The excess ${rs(raw80C - 150000)} won't reduce your tax.` });
    }
    if (n(ded.nps) === 0) {
      w.push({ id: 'ded-nps-unused', type: 'saving', section: 'deductions', priority: 2,
        message: 'You haven\'t claimed 80CCD(1B) NPS deduction. Invest up to \u20B950,000 in NPS for an additional deduction beyond the \u20B91.5L 80C limit. This alone can save up to \u20B915,600 in tax (30% slab).' });
    }
    if (n(ded.healthSelf) === 0 && n(ded.healthParents) === 0) {
      w.push({ id: 'ded-80d-unused', type: 'saving', section: 'deductions', priority: 2,
        message: 'No health insurance premium claimed under 80D. Self/family: up to \u20B925,000 (\u20B950,000 if senior). Parents: additional \u20B925,000 (\u20B950,000 if senior). Max saving: \u20B931,200 (30% slab).' });
    }

    // ── HRA vs 80GG comparison (Requirement 4.2) ──
    const hasHRA = employers.some(e => n(e.allowances?.hra?.received) > 0);
    const hraExemptTotal = employers.reduce((s, e) => s + n(e.allowances?.hra?.exempt), 0);
    const rentPaid80GG = n(ded.rentPaid);

    if (hasHRA && rentPaid80GG > 0) {
      w.push({ id: 'ded-hra-80gg', type: 'warning', section: 'deductions', priority: 1,
        message: 'You\'re claiming both HRA exemption and 80GG rent deduction. These are mutually exclusive — you can only claim one. HRA is usually more beneficial.' });
    } else if (!hasHRA && rentPaid80GG === 0 && employers.length > 0) {
      // Check if 80GG would be beneficial
      const totalRent = employers.reduce((s, e) => s + n(e.rentPaid), 0);
      if (totalRent > 0) {
        const potential80GG = Math.min(totalRent, 60000);
        if (potential80GG > 1000) {
          w.push({ id: 'ded-80gg-suggest', type: 'saving', section: 'deductions', priority: 2,
            message: `You pay rent of ${rs(totalRent)}/year but haven't claimed 80GG. You could deduct up to ${rs(potential80GG)} (max \u20B95,000/month). Add it in the Deductions section.` });
        }
      }
    } else if (hasHRA && hraExemptTotal > 0 && !hasHRA) {
      // Compare HRA vs 80GG benefit
      const potential80GG = Math.min(n(ded.rentPaid), 60000);
      if (potential80GG > hraExemptTotal + 1000) {
        w.push({ id: 'ded-80gg-better', type: 'saving', section: 'deductions', priority: 1,
          message: `80GG deduction (${rs(potential80GG)}) would save more than your current HRA exemption (${rs(hraExemptTotal)}). Consider restructuring with your employer.` });
      }
    }

    // ── 80TTA vs 80TTB age-based (Requirement 4.4) ──
    const dob = pi.dob;
    if (dob && savInt > 0) {
      const age = getAge(dob);
      if (age >= 60) {
        const ttbLimit = 50000;
        const ttbBenefit = Math.min(savInt + fdInt, ttbLimit);
        w.push({ id: 'ded-80ttb-senior', type: 'saving', section: 'deductions', priority: 1,
          message: `As a senior citizen (age ${age}), you qualify for Section 80TTB with a \u20B950,000 limit (not 80TTA's \u20B910,000). You can deduct up to ${rs(ttbBenefit)} of your interest income.` });
      } else if (savInt > 10000) {
        w.push({ id: 'ded-80tta-cap', type: 'info', section: 'deductions', priority: 3,
          message: `Your savings interest of ${rs(savInt)} exceeds the 80TTA limit of \u20B910,000. Only \u20B910,000 is deductible. (Senior citizens get 80TTB with \u20B950,000 limit.)` });
      }
    }

    // ── Education loan interest (80E) — no upper limit ──
    if (n(ded.eduLoan) > 0) {
      w.push({ id: 'ded-80e-info', type: 'info', section: 'deductions', priority: 3,
        message: `Education loan interest of ${rs(ded.eduLoan)} is fully deductible under 80E (no upper limit). This deduction is available for 8 years from the year you start repaying.` });
    }
  }

  // ── Regime comparison whisper (enhanced — Requirement 5) ──
  if (comp.savings > 0) {
    const better = comp.recommended;
    const worse = better === 'old' ? 'new' : 'old';
    const bestR = comp[better + 'Regime'] || {};
    const worseR = comp[worse + 'Regime'] || {};

    if (regime !== better) {
      let explanation = '';
      if (better === 'old') {
        // Old regime is better — explain which deductions make it worthwhile
        const totalDed = n(bestR.deductions);
        explanation = `Your deductions of ${rs(totalDed)} (80C, 80D, NPS, etc.) reduce your taxable income enough to offset the higher old regime rates.`;
      } else {
        // New regime is better — explain rate advantage
        const totalDed = n(worseR.deductions);
        explanation = `Your deductions of ${rs(totalDed)} aren't enough to offset the new regime's lower tax rates. You'd need ~\u20B93,75,000+ in deductions for old regime to be better.`;
      }
      w.push({ id: 'ded-regime-switch', type: 'saving', section: 'deductions', priority: 1,
        message: `Switching to ${better} regime saves ${rs(comp.savings)}. ${explanation}` });
    } else {
      w.push({ id: 'ded-regime-optimal', type: 'info', section: 'deductions', priority: 3,
        message: `You're on the optimal regime. ${better === 'old' ? 'Old' : 'New'} regime saves ${rs(comp.savings)} compared to ${worse}.` });
    }
  }

  // ── Incomplete data prompts (Requirement 4.6) ──
  if (employers.length === 0 && !hp.type && n(os.savingsInterest) + n(os.fdInterest) === 0) {
    w.push({ id: 'global-no-income', type: 'info', section: 'summary', priority: 2,
      message: 'Add your income sources to get personalized tax-saving suggestions. Start with salary (Form 16) or other income.' });
  }
  if (employers.length > 0 && raw80C === 0 && n(ded.nps) === 0 && n(ded.healthSelf) === 0 && regime === 'old') {
    w.push({ id: 'global-no-deductions', type: 'tip', section: 'deductions', priority: 2,
      message: 'You haven\'t entered any deductions yet. Add your investments (PPF, ELSS, NPS) and insurance premiums to see how much tax you can save.' });
  }

  // ── Bank & TDS whispers ──
  const tds = comp.tds || {};
  const salaryTDS = n(tds.fromSalary);
  const nonSalaryTDS = n(tds.fromNonSalary);
  const totalTDS = n(tds.total);
  const bestRegime = comp[comp.recommended + 'Regime'] || comp.oldRegime || {};

  if (totalTDS > 0 && bestRegime.totalTax > 0) {
    const gap = bestRegime.totalTax - totalTDS;
    if (gap > 0) {
      w.push({ id: 'bank-tds-shortfall', type: 'warning', section: 'bank', priority: 1,
        message: `Your TDS of ${rs(totalTDS)} is ${rs(gap)} short of your tax liability of ${rs(bestRegime.totalTax)}. You'll need to pay ${rs(gap)} as self-assessment tax before filing.` });
    }
    if (gap < -1000) {
      w.push({ id: 'bank-refund', type: 'info', section: 'bank', priority: 2,
        message: `Your TDS of ${rs(totalTDS)} exceeds your tax liability by ${rs(Math.abs(gap))}. This will be refunded after filing. Ensure your bank details are correct for refund credit.` });
    }
  }

  if (fdInt > 0 && nonSalaryTDS === 0) {
    w.push({ id: 'bank-fd-no-tds', type: 'warning', section: 'bank', priority: 2,
      message: `You have FD interest of ${rs(fdInt)} but no non-salary TDS entered. If your bank deducted TDS on FD, add it here to claim the credit.` });
  }

  // Income limit warning for ITR-1/4
  const grossTotal = n(comp.grossTotalIncome || comp.income?.grossTotal);
  if (grossTotal > 5000000) {
    w.push({ id: 'bank-income-limit', type: 'warning', section: 'bank', priority: 1,
      message: `Your gross total income of ${rs(grossTotal)} exceeds \u20B950L. ITR-1 is not applicable for income above \u20B950L. Consider switching to ITR-2.` });
  }

  // ── Summary / global whispers ──
  if (bestRegime.netPayable === 0 && totalTDS === 0 && grossTotal > 0 && grossTotal <= 700000) {
    w.push({ id: 'sum-zero-tax', type: 'info', section: 'summary', priority: 2,
      message: 'Your income is within the rebate limit. Zero tax is payable under Section 87A.' });
  }

  if (bestRegime.netPayable < 0 && salaryTDS > 0) {
    w.push({ id: 'sum-refund-explain', type: 'info', section: 'summary', priority: 2,
      message: `Your employer deducted ${rs(salaryTDS)} as TDS, which is more than your actual tax. The excess ${rs(Math.abs(bestRegime.netPayable))} will be refunded after filing and e-verification.` });
  }

  return w;
}

/**
 * Get whispers for a specific section.
 */
export function getWhispersForSection(whispers, section) {
  return (whispers || [])
    .filter(w => w.section === section)
    .sort((a, b) => a.priority - b.priority);
}

export function generateRecommendations(payload, comp, regime) {
  if (!payload || !comp) return [];
  const recommendations = [];

  if (regime === 'new') {
    // Under new regime, only show regime comparison suggestion
    const oldTax = comp.oldRegime?.totalTax || 0;
    const newTax = comp.newRegime?.totalTax || 0;
    if (oldTax < newTax) {
      recommendations.push({
        id: 'switch_old', title: 'Consider Old Regime',
        description: `Old regime would save you ₹${(newTax - oldTax).toLocaleString('en-IN')}. You have deductions that make old regime beneficial.`,
        savingsAmount: newTax - oldTax, section: 'regime', actionType: 'switch', priority: 1,
      });
    }
    return recommendations.slice(0, 5);
  }

  // Old regime recommendations
  const d = payload.deductions || {};
  const marginalRate = (comp.oldRegime?.taxableIncome || 0) > 1000000 ? 30
    : (comp.oldRegime?.taxableIncome || 0) > 500000 ? 20 : 5;

  // 80C gap
  const raw80C = n(d.ppf) + n(d.elss) + n(d.lic) + n(d.nsc) + n(d.tuitionFees)
    + n(d.homeLoanPrincipal) + n(d.sukanyaSamriddhi) + n(d.fiveYearFD) + n(d.otherC);
  const remaining80C = 150000 - raw80C;
  if (remaining80C > 0) {
    const savings = Math.round(remaining80C * marginalRate / 100);
    recommendations.push({
      id: '80c_gap', title: 'Maximize 80C Investments',
      description: `You have ₹${remaining80C.toLocaleString('en-IN')} remaining in 80C. Invest in PPF, ELSS, or tax-saver FDs to save ₹${savings.toLocaleString('en-IN')} in tax.`,
      savingsAmount: savings, section: 'deductions', actionType: 'invest', priority: 2,
    });
  }

  // NPS 80CCD(1B)
  if (!n(d.nps)) {
    const npsSavings = Math.round(50000 * marginalRate / 100);
    recommendations.push({
      id: 'nps', title: 'Invest in NPS',
      description: `Invest up to ₹50,000 in NPS for an additional deduction under 80CCD(1B) — save ₹${npsSavings.toLocaleString('en-IN')} in tax.`,
      savingsAmount: npsSavings, section: 'deductions', actionType: 'invest', priority: 3,
    });
  }

  // Health insurance 80D
  if (!n(d.healthSelf)) {
    const healthSavings = Math.round(25000 * marginalRate / 100);
    recommendations.push({
      id: 'health', title: 'Get Health Insurance',
      description: `Claim up to ₹25,000 under 80D for health insurance premium — save ₹${healthSavings.toLocaleString('en-IN')} in tax.`,
      savingsAmount: healthSavings, section: 'deductions', actionType: 'claim', priority: 4,
    });
  }

  // Parents health insurance
  if (!n(d.healthParents) && n(d.healthSelf) > 0) {
    const parentSavings = Math.round(25000 * marginalRate / 100);
    recommendations.push({
      id: 'health_parents', title: 'Insure Your Parents',
      description: `Claim up to ₹25,000 (₹50,000 if senior) under 80D for parents' health insurance — save ₹${parentSavings.toLocaleString('en-IN')}.`,
      savingsAmount: parentSavings, section: 'deductions', actionType: 'claim', priority: 5,
    });
  }

  // Education loan
  if (!n(d.eduLoan) && (payload.income?.salary?.employers?.length > 0)) {
    recommendations.push({
      id: 'edu_loan', title: 'Education Loan Interest',
      description: 'If you have an education loan, claim the full interest amount under 80E — no upper limit.',
      savingsAmount: 0, section: 'deductions', actionType: 'info', priority: 10,
    });
  }

  // Sort by savings descending, limit to 5
  return recommendations.sort((a, b) => b.savingsAmount - a.savingsAmount).slice(0, 5);
}

export default { generateWhispers, getWhispersForSection, generateRecommendations };
