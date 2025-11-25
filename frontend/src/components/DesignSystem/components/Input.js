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
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  animated = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${LeftIcon ? 'pl-10' : ''}
    ${RightIcon ? 'pr-10' : ''}
  `;

  const stateClasses = error
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500 text-error-900 placeholder-error-300'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400';

  const classes = `${baseInputClasses} ${stateClasses} ${className}`;

  const inputElement = (
    <>
      {LeftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <RightIcon className="h-4 w-4" />
        </div>
      )}
    </>
  );

  const container = (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${
          error ? 'text-error-700' : 'text-gray-700'
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

      {(error || helperText) && (
        <p className={`mt-1 text-sm ${
          error ? 'text-error-600' : 'text-gray-500'
        }`}>
          {error || helperText}
        </p>
      )}
    </div>
  );

  return container;
});

Input.displayName = 'Input';

export default Input;
