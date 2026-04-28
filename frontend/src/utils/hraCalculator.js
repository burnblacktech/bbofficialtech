const n = (v) => Math.max(0, Number(v) || 0);

export function computeHRA(basic, hraReceived, rentPaid, isMetro) {
  const b = n(basic);
  const hra = n(hraReceived);
  const rent = n(rentPaid);

  if (b <= 0 || hra <= 0 || rent <= 0) {
    return {
      exemption: 0,
      components: { actualHRA: hra, percentOfBasic: 0, rentMinusTenPercent: 0 },
      limitingFactor: 'none',
      breakdown: 'No HRA exemption — basic, HRA, or rent is zero',
    };
  }

  const actualHRA = hra;
  const percentOfBasic = Math.round(b * (isMetro ? 0.50 : 0.40));
  const rentMinusTenPercent = Math.max(0, rent - Math.round(b * 0.10));

  const exemption = Math.min(actualHRA, percentOfBasic, rentMinusTenPercent);

  let limitingFactor = 'actualHRA';
  if (exemption === percentOfBasic) limitingFactor = 'percentOfBasic';
  if (exemption === rentMinusTenPercent) limitingFactor = 'rentMinusTenPercent';

  const pctLabel = isMetro ? '50%' : '40%';
  const breakdown = `HRA Exemption: ₹${exemption.toLocaleString('en-IN')} (limited by ${limitingFactor === 'actualHRA' ? 'actual HRA received' : limitingFactor === 'percentOfBasic' ? `${pctLabel} of basic salary` : 'rent paid minus 10% of basic'})`;

  return { exemption, components: { actualHRA, percentOfBasic, rentMinusTenPercent }, limitingFactor, breakdown };
}

export function detectHRADiscrepancy(computed, manual) {
  return Math.abs((Number(computed) || 0) - (Number(manual) || 0)) > 100;
}
