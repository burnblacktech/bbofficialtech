/**
 * formatCurrency — Indian number system currency formatting.
 *
 * Uses Intl.NumberFormat('en-IN') for standard formatting.
 * Supports compact mode (L/Cr notation), sign mode (+/-),
 * and configurable decimal places.
 *
 * @param {number} value - The numeric value to format
 * @param {object} [options]
 * @param {boolean} [options.compact=false] - Use L/Cr notation
 * @param {boolean} [options.sign=false] - Show +/- prefix
 * @param {number} [options.decimals] - Override decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  const { compact = false, sign = false, decimals } = options;
  const abs = Math.abs(value);

  let formatted;

  if (compact && abs >= 1_00_00_000) {
    // ≥ 1 crore → "₹X.XXCr"
    formatted = `₹${(abs / 1_00_00_000).toFixed(decimals ?? 2)}Cr`;
  } else if (compact && abs >= 1_00_000) {
    // ≥ 1 lakh → "₹X.XXL"
    formatted = `₹${(abs / 1_00_000).toFixed(decimals ?? 2)}L`;
  } else {
    // Standard Indian formatting
    formatted = `₹${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: decimals ?? 0,
      minimumFractionDigits: decimals ?? 0,
    }).format(abs)}`;
  }

  if (sign) {
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
  } else if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

/** Compact notation (L/Cr) */
export const formatCompact = (v) => formatCurrency(v, { compact: true });

/** Full Indian number formatting */
export const formatFull = (v) => formatCurrency(v);

/** Signed full formatting (+/-) */
export const formatSigned = (v) => formatCurrency(v, { sign: true });

/** Signed compact formatting (+/- with L/Cr) */
export const formatSignedCompact = (v) => formatCurrency(v, { compact: true, sign: true });

export default formatCurrency;
