// =====================================================
// BUTTON COMPONENT
// Ultra-Grade Modern UI Design System - newUI.md aligned
// Implements Section 9.3.4: Button States
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { springs, transitions } from '../../../lib/motion';

/**
 * Button Component
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'link'
 * @param {string} props.size - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} props.disabled
 * @param {boolean} props.loading
 * @param {boolean} props.success - Show success state with checkmark
 * @param {boolean} props.fullWidth
 * @param {React.ReactNode} props.icon
 * @param {string} props.iconPosition - 'left' | 'right'
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  success = false,
  fullWidth = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  ...props
}, ref) => {
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success state - show checkmark then reset
  React.useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Base classes - newUI.md Section 9.3.4
  const baseClasses = 'font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2 relative overflow-hidden';

  // Variant classes - newUI.md Section 9.3.4
  const variantClasses = {
    // Primary Button (Gold) - newUI.md Section 9.3.4
    primary: cn(
      'bg-gold-500 text-white', // Rest: BG Gold-500 (#D4AF37)
      'hover:bg-gold-700 hover:shadow-gold-accent hover:-translate-y-0.5', // Hover: BG Gold-700, Gold glow, translateY(-1px)
      'active:bg-gold-900 active:shadow-none active:translate-y-0.5', // Active: BG Gold-900, no shadow, translateY(1px)
      'focus:ring-gold-500',
      'shadow-elevation-1', // Shadow Level 1
      loading && 'bg-gold-400', // Loading: BG Gold-400
      showSuccess && 'bg-success-base', // Success: BG Success-Base
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && !loading && 'cursor-pointer',
    ),
    // Secondary Button (Outline) - newUI.md Section 9.3.4
    secondary: cn(
      'border-2 border-neutral-900 bg-transparent text-neutral-900', // Rest: Border Black-900, transparent BG
      'hover:bg-neutral-900/5 hover:text-neutral-900', // Hover: BG Black-900 (5%), text Black-900
      'active:bg-neutral-900/10', // Active: BG Black-900 (10%)
      'focus:ring-neutral-900',
      disabled && 'opacity-50 cursor-not-allowed border-neutral-300',
      !disabled && 'cursor-pointer',
    ),
    success: 'bg-success-base text-white hover:bg-success-dark focus:ring-success-base shadow-elevation-1',
    warning: 'bg-warning-base text-white hover:bg-warning-dark focus:ring-warning-base shadow-elevation-1',
    error: 'bg-error-base text-white hover:bg-error-dark focus:ring-error-base shadow-elevation-1',
    outline: 'border-2 border-gold-500 text-gold-700 hover:bg-gold-100 focus:ring-gold-500',
    ghost: 'text-gold-700 hover:bg-gold-100 focus:ring-gold-500',
    link: 'text-gold-700 hover:text-gold-900 hover:underline focus:ring-gold-500 p-0',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-body-regular',
    lg: 'px-6 py-3 text-body-large',
    xl: 'px-8 py-4 text-heading-3',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className,
  );

  // Transition: 150ms with ease-smooth - newUI.md Section 9.3.4
  const transitionConfig = {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1], // ease-smooth
  };

  const buttonContent = (
    <>
      {/* Loading Spinner - newUI.md Section 9.3.4 */}
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#B8960C' }} /> // Gold-700
      )}

      {/* Success Checkmark - newUI.md Section 9.3.4 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={springs.bouncy}
          >
            <CheckCircle className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      {Icon && iconPosition === 'left' && !loading && !showSuccess && (
        <Icon className="h-4 w-4" />
      )}
      {children}
      {Icon && iconPosition === 'right' && !loading && !showSuccess && (
        <Icon className="h-4 w-4" />
      )}
    </>
  );

  // Motion button with hover/tap states - newUI.md Section 9.3.4
  return (
    <motion.button
      ref={ref}
      className={classes}
      whileHover={!disabled && !loading ? {
        scale: variant === 'primary' ? 1 : 1.01,
        transition: transitionConfig,
      } : {}}
      whileTap={!disabled && !loading ? {
        scale: 0.98,
        transition: transitionConfig,
      } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        pointerEvents: loading ? 'none' : 'auto', // Loading: pointer-events: none
      }}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
