// =====================================================
// CARD COMPONENT
// Reusable card component with design system integration
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  hover = false,
  animated = true,
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'bg-white border border-slate-200',
    elevated: 'bg-white shadow-elevation-3 border-0',
    outlined: 'bg-white border-2 border-slate-300',
    filled: 'bg-slate-50 border-0',
    ghost: 'bg-transparent border-0',
  };

  const paddingClasses = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-elevation-1',
    md: 'shadow-elevation-2',
    lg: 'shadow-elevation-3',
    xl: 'shadow-elevation-4',
  };

  const hoverClasses = hover ? 'hover:shadow-elevation-3 hover:scale-102 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `;

  const cardContent = (
    <div ref={ref} className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );

  if (animated && (hover || onClick)) {
    return (
      <motion.div
        whileHover={hover ? { scale: 1.02, y: -2 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
});

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 pt-6 pb-4 border-b border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-t border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
