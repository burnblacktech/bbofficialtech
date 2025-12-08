// =====================================================
// DESIGN TOKENS - TYPOGRAPHY
// Ultra-Grade Modern UI Design System - newUI.md aligned
// =====================================================

export const TYPOGRAPHY = {
  fontFamily: {
    // Primary font - newUI.md Section 6.1
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    // Display font - newUI.md Section 6.1
    display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    // Monospace font - newUI.md Section 6.1
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
  },
  fontSize: {
    // Display sizes - newUI.md Section 6.2
    'display-1': ['48px', { lineHeight: '56px', fontWeight: '600' }], // Plus Jakarta Sans
    'display-2': ['36px', { lineHeight: '44px', fontWeight: '600' }], // Plus Jakarta Sans
    // Headings - newUI.md Section 6.2
    'heading-1': ['28px', { lineHeight: '36px', fontWeight: '600', letterSpacing: '-0.02em' }], // H1, Inter
    'heading-2': ['24px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.01em' }], // H2, Inter
    'heading-3': ['20px', { lineHeight: '28px', fontWeight: '600' }], // H3, Inter
    'heading-4': ['16px', { lineHeight: '24px', fontWeight: '600' }], // H4, Inter
    // Body text - newUI.md Section 6.2
    'body-large': ['16px', { lineHeight: '26px', fontWeight: '400' }],
    'body-regular': ['14px', { lineHeight: '22px', fontWeight: '400' }],
    'body-small': ['12px', { lineHeight: '18px', fontWeight: '400' }],
    // Special - newUI.md Section 6.2
    label: ['12px', { lineHeight: '16px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }],
    amount: ['20px', { lineHeight: '28px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
    code: ['14px', { lineHeight: '20px', fontWeight: '400' }], // JetBrains Mono
    // Legacy sizes (for backward compatibility)
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem',  // 60px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.02em', // H1
    tight: '-0.01em',   // H2
    normal: '0',
    wide: '0.05em',     // Label
  },
};

export default TYPOGRAPHY;
