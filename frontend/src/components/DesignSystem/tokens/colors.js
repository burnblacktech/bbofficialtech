// =====================================================
// DESIGN TOKENS - COLORS
// Ultra-Grade Modern UI Design System - newUI.md aligned
// =====================================================

export const COLORS = {
  // Gold (Primary Brand) - newUI.md Section 5.1
  gold: {
    100: '#FFF8E7',
    300: '#FFE4A0',
    400: '#E5C158', // For dark mode
    500: '#D4AF37', // Main primary color
    700: '#B8960C',
    900: '#7A6508',
  },
  // Yellow (Accent/Warning) - newUI.md Section 5.1
  yellow: {
    100: '#FFFDE7',
    300: '#FFF59D',
    500: '#FFEB3B',
    700: '#FBC02D',
    900: '#F57F17',
  },
  // Neutral (Black to White) - newUI.md Section 5.1
  neutral: {
    50: '#FAFAFA',
    100: '#E5E5E5',
    300: '#A6A6A6',
    500: '#737373',
    700: '#404040',
    900: '#0D0D0D',
  },
  // Semantic Colors - newUI.md Section 5.2
  success: {
    light: '#ECFDF5',
    base: '#10B981',
    dark: '#065F46',
  },
  warning: {
    light: '#FFF8E7',
    base: '#D4AF37', // Uses Gold - brand-aligned
    dark: '#92750C',
  },
  error: {
    light: '#FEF2F2',
    base: '#EF4444',
    dark: '#991B1B',
  },
  info: {
    light: '#EFF6FF',
    base: '#3B82F6',
    dark: '#1E40AF',
  },
  // Dark Mode Background Hierarchy - newUI.md Section 5.4
  dark: {
    base: '#0D0D0D',    // Page background
    level1: '#171717',   // Card background
    level2: '#262626',   // Hover state
    level3: '#363636',   // Modal background
  },
  // Primary alias (for backward compatibility - maps to Gold)
  primary: {
    50: '#FFF8E7',
    100: '#FFF8E7',
    300: '#FFE4A0',
    400: '#E5C158',
    500: '#D4AF37', // Main primary
    600: '#B8960C',
    700: '#B8960C',
    800: '#7A6508',
    900: '#7A6508',
  },
  // Secondary alias (for backward compatibility - maps to Yellow)
  secondary: {
    50: '#FFFDE7',
    100: '#FFFDE7',
    300: '#FFF59D',
    400: '#FFEB3B',
    500: '#FFEB3B',
    600: '#FBC02D',
    700: '#FBC02D',
    800: '#F57F17',
    900: '#F57F17',
  },
};

export default COLORS;
