// =====================================================
// CARD COMPONENT
// Reusable card component for content containers
// =====================================================

import React from 'react';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({
  className,
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  rounded = 'lg',
  hover = false,
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const baseClasses = cn(
    'bg-white',
    border && 'border border-gray-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    hover && 'hover:shadow-md transition-shadow duration-200',
    className
  );

  return (
    <div
      className={baseClasses}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;