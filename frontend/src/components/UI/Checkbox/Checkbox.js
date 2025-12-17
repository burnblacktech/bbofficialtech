// =====================================================
// CHECKBOX COMPONENT - ENHANCED
// Custom checkbox matching design system
// =====================================================

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  error,
  helperText,
  indeterminate = false,
  labelPosition = 'right',
  className = '',
  id,
  required = false,
  ...props
}) => {
  const inputId = id || `checkbox-${label?.toLowerCase().replace(/\s/g, '-') || 'checkbox'}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  const checkbox = (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        aria-required={required}
        ref={(el) => {
          if (el) {
            el.indeterminate = indeterminate;
          }
        }}
        {...props}
      />
      <div
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer',
          {
            'bg-gold-500 border-gold-500': checked && !indeterminate && !disabled,
            'bg-white border-slate-300': !checked && !indeterminate && !disabled,
            'bg-slate-100 border-slate-300 cursor-not-allowed': disabled,
            'bg-gold-500 border-gold-500': indeterminate && !disabled,
            'border-error-500': error && !disabled,
          },
        )}
        onClick={() => !disabled && onChange && onChange(!checked)}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            onChange && onChange(!checked);
          }
        }}
      >
        {checked && !indeterminate && (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}
        {indeterminate && (
          <div className="w-2.5 h-0.5 bg-white" />
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start space-x-3">
        {labelPosition === 'left' && checkbox}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-label-lg text-slate-700 cursor-pointer',
              {
                'cursor-not-allowed text-slate-400': disabled,
              },
            )}
            style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        {labelPosition === 'right' && checkbox}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-body-sm text-error-600"
          style={{ fontSize: '13px', lineHeight: '20px' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1.5 text-body-sm text-slate-500"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Checkbox;

