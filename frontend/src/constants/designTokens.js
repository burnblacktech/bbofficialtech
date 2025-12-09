// =====================================================
// BURNBLACK DESIGN TOKENS
// Centralized design system constants from UI.md
// =====================================================

export const COLORS = {
  // Brand Colors
  gold: {
    50: '#FFF8E7',
    100: '#FFF8E7',
    300: '#FFE4A0',
    400: '#FFD700',
    500: '#D4AF37',
    600: '#B8960C',
    700: '#B8960C',
    900: '#7A6508',
  },
  black: {
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  // Semantic Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
  },
  // Regime Colors
  regime: {
    old: '#6366F1',
    new: '#8B5CF6',
  },
  // Source Colors
  source: {
    form16: '#3B82F6',
    ais: '#06B6D4',
    '26as': '#14B8A6',
    broker: '#8B5CF6',
    manual: '#737373',
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Courier New', 'monospace'],
  },
  fontSize: {
    'display-lg': { size: '36px', lineHeight: '44px', weight: '700' },
    'display-md': { size: '30px', lineHeight: '38px', weight: '700' },
    'display-sm': { size: '24px', lineHeight: '32px', weight: '600' },
    'heading-lg': { size: '20px', lineHeight: '28px', weight: '600' },
    'heading-md': { size: '18px', lineHeight: '26px', weight: '600' },
    'heading-sm': { size: '16px', lineHeight: '24px', weight: '600' },
    'body-lg': { size: '16px', lineHeight: '24px', weight: '400' },
    'body-md': { size: '14px', lineHeight: '22px', weight: '400' },
    'body-sm': { size: '13px', lineHeight: '20px', weight: '400' },
    'label-lg': { size: '14px', lineHeight: '20px', weight: '500' },
    'label-md': { size: '13px', lineHeight: '18px', weight: '500' },
    'label-sm': { size: '11px', lineHeight: '16px', weight: '500' },
    'number-lg': { size: '24px', lineHeight: '32px', weight: '600' },
    'number-md': { size: '18px', lineHeight: '26px', weight: '600' },
    'number-sm': { size: '14px', lineHeight: '22px', weight: '500' },
  },
};

export const SPACING = {
  // 8px base grid
  px: '1px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  // Component spacing
  cardPadding: {
    desktop: '24px',
    mobile: '16px',
  },
  cardGap: '16px',
  formFieldGap: '20px',
  formGroupGap: '32px',
  inputPadding: {
    horizontal: '12px',
    vertical: '10px',
  },
};

export const ELEVATION = {
  card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
  elevated: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
  floating: '0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.08)',
  overlay: '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
};

export const ANIMATIONS = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    relaxed: '300ms',
    slow: '500ms',
    slower: '700ms',
    breathing: '400ms',
  },
  easing: {
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-both': 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const BREATHING_GRID = {
  cardWidths: {
    glance: '72px',
    summary: '180px', // min 180px, max 220px
    summaryMax: '220px',
    expanded: '720px', // max-width
    expandedMin: '480px',
  },
  gaps: {
    grid: '16px',
    card: '16px',
  },
  padding: {
    desktop: '24px',
    tablet: '32px',
    mobile: '16px',
  },
  transitions: {
    cardExpand: '400ms cubic-bezier(0, 0, 0.2, 1)',
    contentFade: '200ms cubic-bezier(0, 0, 0.2, 1)',
    contentDelay: '100ms',
    staggerDelay: '30ms',
  },
};

export const GRADIENTS = {
  burn: 'linear-gradient(135deg, #D4AF37 0%, #FFE4A0 100%)', // Gold gradient
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  ELEVATION,
  ANIMATIONS,
  BREATHING_GRID,
  GRADIENTS,
};

