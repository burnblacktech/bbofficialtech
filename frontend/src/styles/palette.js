/**
 * PALETTE — Central color control for JS inline styles.
 *
 * HOW TO SWITCH THEMES:
 * 1. Change values in theme.css (CSS variables)
 * 2. Update the matching values below
 * Both must stay in sync. CSS controls the CSS-styled components,
 * this file controls the JS inline-styled components.
 *
 * Future: could read from CSS vars at runtime via getComputedStyle,
 * but static values are faster and work in SSR/serverless.
 */

const palette = {
  // ── Brand ──
  brand: '#2563eb',
  brandHover: '#1d4ed8',
  brandLight: '#eff6ff',
  brandDark: '#1e40af',

  // ── Text ──
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  textWhite: '#ffffff',

  // ── Backgrounds ──
  bgPage: '#f8fafc',
  bgCard: '#ffffff',
  bgCardHover: '#f9fafb',
  bgMuted: '#f3f4f6',
  bgDark: '#0f172a',

  // ── Borders ──
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',

  // ── Semantic ──
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  error: '#ef4444',
  errorBg: '#fef2f2',
  errorDark: '#991b1b',
  warning: '#d97706',
  warningBg: '#fffbeb',
  info: '#2563eb',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',

  // ── UI Specific ──
  logoBackground: '#0f172a',
  dangerHover: '#dc2626',
  dangerDark: '#b91c1c',
};

export default palette;
