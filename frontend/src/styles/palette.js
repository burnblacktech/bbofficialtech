/**
 * PALETTE — Central color control for JS inline styles.
 * Must stay in sync with theme.css variables.
 *
 * BurnBlack: Gold + Black primary. Teal secondary. Warm neutrals.
 */

const palette = {
  // ── Brand: Gold + Black ──
  brand: '#D4AF37',
  brandHover: '#C4A030',
  brandLight: '#FBF5E4',
  brandDark: '#A68B2A',
  brandBlack: '#0F0F0F',
  brandBlackSoft: '#1A1A1A',

  // ── Secondary: Teal ──
  secondary: '#0D9488',
  secondaryHover: '#0F766E',
  secondaryLight: '#F0FDFA',

  // ── Text (warm neutrals) ──
  textPrimary: '#111111',
  textSecondary: '#333333',
  textMuted: '#666666',
  textLight: '#999999',
  textWhite: '#ffffff',

  // ── Backgrounds (warm white) ──
  bgPage: '#FAFAF8',
  bgCard: '#ffffff',
  bgCardHover: '#F9F9F7',
  bgMuted: '#F3F3F0',
  bgDark: '#0F0F0F',

  // ── Borders (warm) ──
  borderLight: '#E8E8E4',
  borderMedium: '#D4D4D0',

  // ── Semantic ──
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorDark: '#991B1B',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
  warningBorder: '#FDE68A',
  info: '#0D9488',
  infoBg: '#F0FDFA',
  infoBorder: '#99F6E4',

  // ── UI Specific ──
  logoBackground: '#0F0F0F',
  dangerHover: '#B91C1C',
  dangerDark: '#7F1D1D',
};

export default palette;
