// =====================================================
// DESIGN TOKENS - ANIMATIONS
// Ultra-Grade Modern UI Design System - newUI.md aligned
// =====================================================

export const ANIMATIONS = {
  // Easing Curves - newUI.md Section 9.2
  easings: {
    'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',        // Most UI transitions
    'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Success states, celebrations
    'ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Modals, popups
    // Legacy aliases
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // Animation Durations - newUI.md Section 9.1
  durations: {
    small: '150ms',        // Button state changes
    medium: '250ms',       // Card expand
    large: '350ms',        // Page transitions
    cardExpand: '300ms',   // Card expand/collapse
    valueUpdate: '400ms',  // Value update animations
    regimeSwitch: '500ms', // Regime toggle
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    '4xl': '2rem',   // 32px
    '5xl': '2.5rem', // 40px
    full: '9999px',
  },
};

export default ANIMATIONS;
