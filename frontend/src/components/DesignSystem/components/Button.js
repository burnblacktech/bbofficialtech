// =====================================================
// BUTTON COMPONENT
// Reusable button component with design system integration
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../tokens';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  animated = true,
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-md hover:shadow-lg',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-md hover:shadow-lg',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 shadow-md hover:shadow-lg',
    error: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    link: 'text-primary-600 hover:text-primary-700 hover:underline focus:ring-primary-500 p-0'
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `;

  const buttonContent = (
    <>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon className="h-4 w-4" />}
      {children}
      {Icon && iconPosition === 'right' && !loading && <Icon className="h-4 w-4" />}
    </>
  );

  if (animated && !disabled) {
    return (
      <motion.button
        ref={ref}
        className={classes}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;