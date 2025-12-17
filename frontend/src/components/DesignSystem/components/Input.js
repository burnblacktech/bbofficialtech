// =====================================================
// INPUT COMPONENT
// Reusable input component with design system integration
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  success = false,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  animated = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  // Support error as boolean or string
  const errorMessage = typeof error === 'boolean' ? (error ? 'Invalid input' : null) : error;
  const hasError = !!error;
  const hasSuccess = !!success;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-xl transition-all duration-300
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}
    ${LeftIcon ? 'pl-10' : ''}
    ${RightIcon ? 'pr-10' : ''}
  `;

  const stateClasses = hasError
    ? 'border-error-300 focus-visible:border-error-500 focus-visible:ring-error-500 text-error-900 placeholder-error-300'
    : hasSuccess
    ? 'border-success-300 focus-visible:border-success-500 focus-visible:ring-success-500 text-slate-900 placeholder-slate-400'
    : 'border-slate-300 focus-visible:border-gold-500 focus-visible:ring-gold-500 text-slate-900 placeholder-slate-400';

  const classes = `${baseInputClasses} ${stateClasses} ${className}`;

  const inputElement = (
    <>
      {LeftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          <LeftIcon className="h-4 w-4" />
        </div>
      )}

      <input
        ref={ref}
        className={classes}
        disabled={disabled}
        required={required}
        {...props}
      />

      {RightIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          <RightIcon className="h-4 w-4" />
        </div>
      )}
    </>
  );

  const container = (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${
          hasError ? 'text-error-700' : hasSuccess ? 'text-success-700' : 'text-slate-700'
        }`}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {animated && !disabled ? (
          <motion.div
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {inputElement}
          </motion.div>
        ) : (
          inputElement
        )}
      </div>

      {(errorMessage || helperText) && (
        <p className={`mt-1 text-sm ${
          hasError ? 'text-error-600' : hasSuccess ? 'text-success-600' : 'text-slate-500'
        }`}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  );

  return container;
});

Input.displayName = 'Input';

export default Input;
