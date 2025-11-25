// =====================================================
// BURNBACK DESIGN SYSTEM - COMPREHENSIVE UI FOUNDATION
// Enterprise-grade design system for consistent, accessible, and delightful UX
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';

// =====================================================
// DESIGN TOKENS - SINGLE SOURCE OF TRUTH
// =====================================================

export const DesignTokens = {
  // Color System
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f5f5f5',
      100: '#e8e8e8',
      200: '#b3b3b3',
      300: '#4d4d4d',
      400: '#2c2c2c',
      500: '#0b0b0b', // Main brand color
      600: '#080808',
      700: '#050505',
      800: '#030303',
      900: '#000000',
    },

    // Secondary Brand Colors
    secondary: {
      50: '#fffdf7',
      100: '#fff9e6',
      200: '#fff2cc',
      300: '#ffe699',
      400: '#ffd966',
      500: '#d4af37', // Gold accent
      600: '#b8941f',
      700: '#9c7a17',
      800: '#80600f',
      900: '#644607',
    },

    // Semantic Colors
    success: {
      50: '#e8f8f5',
      100: '#d1f2eb',
      200: '#a3e4d7',
      300: '#76d7c4',
      400: '#48c9b0',
      500: '#2ecc71', // Success green
      600: '#28b463',
      700: '#229954',
      800: '#1d7e45',
      900: '#176336',
    },

    warning: {
      50: '#fef5e7',
      100: '#fdebd0',
      200: '#fad7a0',
      300: '#f8c471',
      400: '#f5b041',
      500: '#e67e22', // Warning orange
      600: '#d68910',
      700: '#c77c0e',
      800: '#b86f0c',
      900: '#a9620a',
    },

    error: {
      50: '#fdf2f2',
      100: '#fce7e7',
      200: '#f9d1d1',
      300: '#f5bbbb',
      400: '#f1a5a5',
      500: '#c0392b', // Error red
      600: '#a93226',
      700: '#922b21',
      800: '#7b241c',
      900: '#641d17',
    },

    // Neutral Colors
    neutral: {
      50: '#ffffff',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing Scale
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Animation Durations
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
};

// =====================================================
// ENHANCED BUTTON COMPONENT
// =====================================================

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500 shadow-sm hover:shadow-md',
    outline: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-primary-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus-visible:ring-primary-500',
    success: 'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500 shadow-sm hover:shadow-md',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus-visible:ring-warning-500 shadow-sm hover:shadow-md',
    error: 'bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500 shadow-sm hover:shadow-md',
  };

  const sizes = {
    xs: 'h-8 px-2 text-xs rounded-md',
    sm: 'h-9 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-11 px-6 text-base rounded-lg',
    xl: 'h-12 px-8 text-lg rounded-xl',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

// =====================================================
// ENHANCED INPUT COMPONENT
// =====================================================

export const Input = React.forwardRef(({
  className = '',
  type = 'text',
  error = false,
  success = false,
  disabled = false,
  ...props
}, ref) => {
  const baseClasses = 'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const stateClasses = error
    ? 'border-error-300 focus-visible:ring-error-500'
    : success
    ? 'border-success-300 focus-visible:ring-success-500'
    : 'border-neutral-300 focus-visible:ring-primary-500';

  const classes = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <motion.input
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.1 }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

// =====================================================
// ENHANCED CARD COMPONENT
// =====================================================

export const Card = React.forwardRef(({
  children,
  className = '',
  hover = false,
  ...props
}, ref) => {
  const baseClasses = 'rounded-xl border bg-white text-neutral-900 shadow-sm transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer' : '';
  const classes = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <motion.div
      ref={ref}
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => {
  const baseClasses = 'flex flex-col space-y-1.5 p-6';
  const classes = `${baseClasses} ${className}`;

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => {
  const baseClasses = 'text-xl font-semibold leading-none tracking-tight';
  const classes = `${baseClasses} ${className}`;

  return (
    <h3 ref={ref} className={classes} {...props}>
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ children, className = '', ...props }, ref) => {
  const baseClasses = 'text-sm text-neutral-600';
  const classes = `${baseClasses} ${className}`;

  return (
    <p ref={ref} className={classes} {...props}>
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ children, className = '', ...props }, ref) => {
  const baseClasses = 'p-6 pt-0';
  const classes = `${baseClasses} ${className}`;

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => {
  const baseClasses = 'flex items-center p-6 pt-0';
  const classes = `${baseClasses} ${className}`;

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

// =====================================================
// TYPOGRAPHY COMPONENTS
// =====================================================

export const Typography = {
  H1: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <h1 ref={ref} className={`text-4xl font-bold text-neutral-900 ${className}`} {...props}>
      {children}
    </h1>
  )),

  H2: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <h2 ref={ref} className={`text-3xl font-semibold text-neutral-900 ${className}`} {...props}>
      {children}
    </h2>
  )),

  H3: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-2xl font-semibold text-neutral-900 ${className}`} {...props}>
      {children}
    </h3>
  )),

  H4: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <h4 ref={ref} className={`text-xl font-semibold text-neutral-900 ${className}`} {...props}>
      {children}
    </h4>
  )),

  Body: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`text-base text-neutral-700 ${className}`} {...props}>
      {children}
    </p>
  )),

  Small: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm text-neutral-600 ${className}`} {...props}>
      {children}
    </p>
  )),

  Label: React.forwardRef(({ children, className = '', ...props }, ref) => (
    <label ref={ref} className={`text-sm font-medium text-neutral-700 ${className}`} {...props}>
      {children}
    </label>
  )),
};

// =====================================================
// LOADING COMPONENTS
// =====================================================

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="w-full h-full border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
};

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-200 rounded ${className}`}
      {...props}
    />
  );
};

// =====================================================
// ACCESSIBILITY UTILITIES
// =====================================================

export const A11y = {
  // Screen reader only text
  ScreenReaderOnly: ({ children, className = '', ...props }) => (
    <span className={`sr-only ${className}`} {...props}>
      {children}
    </span>
  ),

  // Focus trap for modals
  FocusTrap: ({ children, isActive = false }) => {
    const trapRef = React.useRef(null);

    React.useEffect(() => {
      if (!isActive || !trapRef.current) return;

      const focusableElements = trapRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }, [isActive]);

    return <div ref={trapRef}>{children}</div>;
  },
};

// =====================================================
// EXPORTS
// =====================================================

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default DesignTokens;
