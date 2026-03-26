/**
 * PALETTE — Single source of truth for all colors used in JS components.
 * Mirrors the CSS variables in theme.css.
 * Import this instead of hardcoding hex values.
 */

const palette = {
  // Brand
  brand: '#2563eb',
  brandHover: '#1d4ed8',
  brandLight: '#eff6ff',
  brandDark: '#1e40af',

  // Text
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  textWhite: '#ffffff',

  // Backgrounds
  bgPage: '#f8fafc',
  bgCard: '#ffffff',
  bgCardHover: '#f9fafb',
  bgMuted: '#f3f4f6',
  bgDark: '#0f172a',

  // Borders
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',

  // Semantic
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

  // Specific UI
  logoBackground: '#0f172a',
  dangerHover: '#dc2626',
  dangerDark: '#b91c1c',
};

export default palette;
