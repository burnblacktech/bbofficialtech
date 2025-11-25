// Theme Configuration
export const lightTheme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryAlpha: 'rgba(59, 130, 246, 0.1)',
    secondary: '#64748b',
    success: '#10b981',
    successAlpha: 'rgba(16, 185, 129, 0.1)',
    error: '#ef4444',
    errorAlpha: 'rgba(239, 68, 68, 0.1)',
    warning: '#f59e0b',
    warningAlpha: 'rgba(245, 158, 11, 0.1)',
    info: '#06b6d4',
    infoAlpha: 'rgba(6, 182, 212, 0.1)',
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      hover: '#e2e8f0',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8',
    },
    border: {
      primary: '#e2e8f0',
      light: '#f1f5f9',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      hover: '#333333',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      muted: '#6b7280',
    },
    border: {
      primary: '#333333',
      light: '#2a2a2a',
    },
  },
};

// Theme utility functions
export const getTheme = (themeName) => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};

export const getColor = (theme, colorPath) => {
  const keys = colorPath.split('.');
  let value = theme.colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found in theme`);
      return theme.colors.primary;
    }
  }

  return value;
};

export const getSpacing = (theme, size) => {
  return theme.spacing[size] || size;
};

export const getBorderRadius = (theme, size) => {
  return theme.borderRadius[size] || size;
};

export const getShadow = (theme, size) => {
  return theme.shadows[size] || 'none';
};

export const getFontSize = (theme, size) => {
  return theme.typography.fontSize[size] || size;
};

export const getFontWeight = (theme, weight) => {
  return theme.typography.fontWeight[weight] || weight;
};

export const getTransition = (theme, speed) => {
  return theme.transitions[speed] || speed;
};

export const getZIndex = (theme, level) => {
  return theme.zIndex[level] || level;
};

// Responsive breakpoints
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Media query helpers
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

// Animation presets
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideInUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInDown: {
    from: { transform: 'translateY(-20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInLeft: {
    from: { transform: 'translateX(-20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInRight: {
    from: { transform: 'translateX(20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.9)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  bounce: {
    '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
    '40%, 43%': { transform: 'translate3d(0,-30px,0)' },
    '70%': { transform: 'translate3d(0,-15px,0)' },
    '90%': { transform: 'translate3d(0,-4px,0)' },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
};

// Common component styles
export const componentStyles = {
  button: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: 'none',
      textDecoration: 'none',
    },
    primary: {
      background: 'var(--accent-color)',
      color: 'white',
      '&:hover': {
        background: 'var(--accent-color-dark)',
        transform: 'translateY(-1px)',
      },
    },
    secondary: {
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      '&:hover': {
        background: 'var(--bg-hover)',
      },
    },
  },
  card: {
    base: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'var(--accent-color)',
        boxShadow: 'var(--shadow-md)',
      },
    },
  },
  input: {
    base: {
      width: '100%',
      padding: '8px 16px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      fontSize: '14px',
      color: 'var(--text-primary)',
      transition: 'all 0.15s ease',
      '&:focus': {
        outline: 'none',
        borderColor: 'var(--accent-color)',
        boxShadow: '0 0 0 3px var(--accent-color-alpha)',
      },
      '&::placeholder': {
        color: 'var(--text-muted)',
      },
    },
  },
};

// Export default
const themes = {
  lightTheme,
  darkTheme,
  getTheme,
  getColor,
  getSpacing,
  getBorderRadius,
  getShadow,
  getFontSize,
  getFontWeight,
  getTransition,
  getZIndex,
  breakpoints,
  mediaQueries,
  animations,
  componentStyles,
};

export default themes;
