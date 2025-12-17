// =====================================================
// ENHANCED INPUT COMPONENT - DESIGN SYSTEM INTEGRATION
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';

const Input = React.forwardRef(({
  className = '',
  type = 'text',
  error = false,
  success = false,
  disabled = false,
  ...props
}, ref) => {
  const baseClasses = 'flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

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

export default Input;
