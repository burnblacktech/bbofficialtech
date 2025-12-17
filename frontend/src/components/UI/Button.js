// =====================================================
// BUTTON COMPONENT
// Reusable button component with multiple variants
// =====================================================

import React from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = {
  variant: {
    primary: 'bg-gold-500 hover:bg-gold-600 text-white shadow-elevation-1',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-700',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-elevation-1',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-elevation-1',
    danger: 'bg-error-500 hover:bg-error-600 text-white shadow-elevation-1',
    link: 'text-gold-600 hover:text-gold-700 underline-offset-4 hover:underline p-0 h-auto',
  },
  size: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg',
    xl: 'h-12 px-10 text-xl',
    icon: 'h-10 w-10',
    'icon-sm': 'h-8 w-8',
    'icon-lg': 'h-12 w-12',
  },
  fullWidth: {
    true: 'w-full',
    false: 'w-auto',
  },
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-xl',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },
};

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  rounded = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  onClick,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center font-medium transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

    // Variant styles
    buttonVariants.variant[variant],

    // Size styles
    buttonVariants.size[size],

    // Width styles
    buttonVariants.fullWidth[fullWidth],

    // Border radius styles
    buttonVariants.rounded[rounded],

    className,
  );

  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = size.includes('icon') ?
      (size === 'icon-sm' ? 'w-4 h-4' : size === 'icon-lg' ? 'w-6 h-6' : 'w-5 h-5') :
      (size === 'sm' ? 'w-4 h-4' : size === 'lg' || size === 'xl' ? 'w-6 h-6' : 'w-5 h-5');

    return <span className={cn(iconSize, 'flex-shrink-0')}>{icon}</span>;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children && <span>{children}</span>}
        </>
      );
    }

    if (icon && !children) {
      return renderIcon();
    }

    if (icon && children) {
      return (
        <>
          {iconPosition === 'left' && renderIcon()}
          <span>{children}</span>
          {iconPosition === 'right' && renderIcon()}
        </>
      );
    }

    return children;
  };

  return (
    <button
      className={baseClasses}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      ref={ref}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
