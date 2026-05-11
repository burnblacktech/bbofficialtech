/**
 * Design Tokens — Single Source of Truth
 *
 * EVERY visual value on the platform comes from here.
 * Change a value here → entire platform updates.
 *
 * Usage: import { t } from '../../styles/tokens';
 *        <label style={t.label}>...</label>
 *        <input style={t.input}>...</input>
 */

const font = {
  family: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'DM Mono', 'SF Mono', monospace",
};

const color = {
  brand: '#D4AF37',
  brandHover: '#C4A030',
  brandLight: '#FBF5E4',
  brandDark: '#A68B2A',
  brandBlack: '#0F0F0F',

  text: '#111111',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  bg: '#FAFAF8',
  card: '#FFFFFF',
  muted: '#F3F4F6',

  border: '#E5E7EB',
  borderMedium: '#D1D5DB',
  borderFocus: '#D4AF37',

  success: '#16A34A',
  successBg: '#F0FDF4',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
};

const radius = { sm: 6, md: 8, lg: 12 };

// Pre-built style objects for direct use
export const t = {
  // Labels
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font.family,
    color: color.textSecondary,
    marginBottom: 4,
    lineHeight: 1.2,
  },

  // Text inputs
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 16,
    fontWeight: 500,
    fontFamily: font.family,
    color: color.text,
    background: color.card,
    border: `1px solid ${color.border}`,
    borderRadius: radius.sm,
    outline: 'none',
    boxSizing: 'border-box',
  },

  // Numeric inputs (with ₹ prefix space)
  inputCurrency: {
    width: '100%',
    padding: '9px 12px 9px 28px',
    fontSize: 16,
    fontWeight: 500,
    fontFamily: font.mono,
    fontVariantNumeric: 'tabular-nums',
    color: color.text,
    background: color.card,
    border: `1px solid ${color.border}`,
    borderRadius: radius.sm,
    outline: 'none',
    boxSizing: 'border-box',
  },

  // Select dropdowns
  select: {
    width: '100%',
    minWidth: 180,
    padding: '9px 32px 9px 12px',
    fontSize: 16,
    fontWeight: 500,
    fontFamily: font.family,
    color: color.text,
    background: color.card,
    border: `1px solid ${color.border}`,
    borderRadius: radius.sm,
    outline: 'none',
    appearance: 'none',
    boxSizing: 'border-box',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },

  // Hints
  hint: {
    fontSize: 12,
    fontWeight: 400,
    color: color.textLight,
    marginTop: 3,
  },

  // Error hints
  errorHint: {
    fontSize: 12,
    fontWeight: 500,
    color: color.error,
    marginTop: 3,
  },

  // ₹ prefix symbol
  currencyPrefix: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 15,
    fontFamily: font.mono,
    color: color.textLight,
    pointerEvents: 'none',
  },

  // Field container
  field: {
    marginBottom: 8,
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: color.text,
    letterSpacing: '-0.02em',
  },

  // Section header (gray strip)
  sectionHeader: {
    padding: '7px 14px',
    background: color.muted,
    borderBottom: `1px solid ${color.border}`,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: color.textMuted,
  },

  // Button primary
  btnPrimary: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: font.family,
    background: color.brand,
    color: color.brandBlack,
    border: 'none',
    borderRadius: radius.md,
    cursor: 'pointer',
  },

  // Button secondary
  btnSecondary: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: font.family,
    background: color.muted,
    color: color.text,
    border: `1px solid ${color.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
  },

  // Amount display
  amount: {
    fontFamily: font.mono,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
};

// Export raw values for custom use
export const tokens = { font, color, radius };
export default t;
