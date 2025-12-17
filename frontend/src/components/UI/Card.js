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
    xl: 'p-10',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-elevation-1',
    md: 'shadow-elevation-2',
    lg: 'shadow-elevation-3',
    xl: 'shadow-elevation-4',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-xl',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const baseClasses = cn(
    'bg-white',
    border && 'border border-slate-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    hover && 'hover:shadow-elevation-2 transition-shadow duration-200',
    className,
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
