const DEDUCTION_LIMITS = {
  '80C': 150000, '80CCD(1B)': 50000, '80D_self': 25000, '80D_self_senior': 50000,
  '80D_parents': 25000, '80D_parents_senior': 50000, '80GG': 60000,
  '80DD': 125000, '80DDB': 100000, '80EE': 150000, '80E': Infinity,
};

const GOV_TAN_PREFIXES = ['DELG', 'MUMG', 'CHEG', 'KOLG', 'BANG', 'HYDG', 'JAIG', 'LUCK'];

export function getDefaults() {
  return { residentialStatus: 'RES', filingStatus: 'O', employerCategory: 'OTH' };
}

export function detectEmployerCategory(tan) {
  if (!tan || typeof tan !== 'string' || tan.length < 4) return 'OTH';
  const prefix = tan.slice(0, 4).toUpperCase();
  return GOV_TAN_PREFIXES.includes(prefix) ? 'GOV' : 'OTH';
}

export function validateRegimeSwitch(currentRegime, newRegime, computation) {
  if (!computation || currentRegime === newRegime) return { safe: true, taxIncrease: null };
  const currentTax = computation[currentRegime === 'old' ? 'oldRegime' : 'newRegime']?.totalTax || 0;
  const newTax = computation[newRegime === 'old' ? 'oldRegime' : 'newRegime']?.totalTax || 0;
  if (newTax > currentTax) return { safe: false, taxIncrease: newTax - currentTax };
  return { safe: true, taxIncrease: null };
}

export function checkITR1Applicability(grossTotal) {
  if (Number(grossTotal) > 5000000) {
    return {
      applicable: false,
      message: `Income ₹${Number(grossTotal).toLocaleString('en-IN')} exceeds ₹50L — ITR-1 not applicable. Consider ITR-2.`,
    };
  }
  return { applicable: true, message: null };
}

export function validateDeductionLimit(section, amount, isSenior = false) {
  let key = section;
  if (section === '80D_self' && isSenior) key = '80D_self_senior';
  if (section === '80D_parents' && isSenior) key = '80D_parents_senior';
  const limit = DEDUCTION_LIMITS[key];
  if (limit === undefined || limit === Infinity) return { withinLimit: true, limit: null, excess: 0 };
  const amt = Number(amount) || 0;
  if (amt > limit) return { withinLimit: false, limit, excess: amt - limit };
  return { withinLimit: true, limit, excess: 0 };
}
