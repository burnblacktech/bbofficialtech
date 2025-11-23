// =====================================================
// BUTTON COMPONENT
// Reusable button component with multiple variants
// =====================================================

import React from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = {
  variant: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    link: 'text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline p-0 h-auto',
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
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }
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
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

    // Variant styles
    buttonVariants.variant[variant],

    // Size styles
    buttonVariants.size[size],

    // Width styles
    buttonVariants.fullWidth[fullWidth],

    // Border radius styles
    buttonVariants.rounded[rounded],

    className
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