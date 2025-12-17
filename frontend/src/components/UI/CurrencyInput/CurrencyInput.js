// =====================================================
// CURRENCY INPUT COMPONENT
// Indian currency input with real-time formatting
// =====================================================

import React, { useState, useCallback, useEffect, forwardRef } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber, parseIndianNumber } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { COLORS } from '../../../constants/designTokens';

const CurrencyInput = forwardRef(({
  label,
  value = 0,
  onChange,
  error,
  helperText,
  disabled = false,
  source,
  sourceLabel,
  min,
  max,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState(formatIndianNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatIndianNumber(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number on focus for easier editing
    setDisplayValue(value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    const num = parseIndianNumber(displayValue);
    setDisplayValue(formatIndianNumber(num));
    onChange(num);
  };

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setDisplayValue(raw);
    onChange(num);
  }, [onChange]);

  const inputId = id || `currency-${label.toLowerCase().replace(/\s/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasSource = source && source !== 'manual';

  const sourceConfig = {
    form16: { bg: COLORS.source.form16, label: 'Form 16' },
    ais: { bg: COLORS.source.ais, label: 'AIS' },
    '26as': { bg: COLORS.source['26as'], label: '26AS' },
    broker: { bg: COLORS.source.broker, label: 'Broker' },
    manual: { bg: COLORS.source.manual, label: 'Manual' },
    ai: { bg: 'linear-gradient(135deg, #D4AF37 0%, #FFE4A0 100%)', label: 'AI' },
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label Row */}
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={inputId}
          className="text-label-lg text-slate-700"
          style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>

        {hasSource && (
          <span
            className="text-label-sm text-white px-2 py-0.5 rounded"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: typeof sourceConfig[source]?.bg === 'string' && !sourceConfig[source].bg.includes('gradient')
                ? sourceConfig[source].bg
                : undefined,
              background: sourceConfig[source]?.bg?.includes('gradient') ? sourceConfig[source].bg : undefined,
            }}
          >
            {sourceLabel || sourceConfig[source]?.label}
          </span>
        )}
      </div>

      {/* Input Container */}
      <div className="relative">
        {/* Source Icon (if auto-filled) */}
        {hasSource && (
          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-info-500 z-10" />
        )}

        <div
          className={cn(
            'flex rounded-[10px] border overflow-hidden transition-all',
            {
              'border-slate-300': !error && !isFocused && !hasSource,
              'border-gold-500 shadow-[0_0_0_3px_rgba(212,175,55,0.1)]': isFocused && !error,
              'border-2 border-error-500 bg-error-50': error,
              'border-slate-200 bg-slate-100': disabled,
              'border-info-200 bg-info-50': hasSource && !error && !isFocused,
            },
          )}
        >
          {/* Currency Prefix */}
          <div
            className={cn(
              'flex items-center justify-center w-12 border-r text-body-lg font-medium',
              {
                'bg-slate-100 border-slate-300 text-slate-600': !error,
                'bg-error-100 border-error-300 text-error-600': error,
              },
            )}
            style={{ fontSize: '16px', lineHeight: '24px' }}
          >
            ₹
          </div>

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            min={min}
            max={max}
            className={cn(
              'flex-1 h-12 px-4 text-body-lg text-right font-mono',
              'bg-transparent focus:outline-none',
              {
                'text-gray-800': !disabled,
                'text-slate-500 cursor-not-allowed': disabled,
                'pl-10': hasSource,
              },
            )}
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              fontVariantNumeric: 'tabular-nums',
            }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-required={required}
            {...props}
          />

          {/* Error Icon */}
          {error && (
            <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-error-500" />
          )}
        </div>
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
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;

