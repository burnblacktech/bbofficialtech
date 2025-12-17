import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw, ChevronDown } from 'lucide-react';
import { validationEngine } from '../utils/validation';
import { getAriaLabel, getAriaDescribedBy } from '../../utils/accessibility';

const ValidatedSelect = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  context = {},
  showSuggestions = true,
  ...props
}) => {
  const [validationState, setValidationState] = useState({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    isTouched: false,
  });
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (inputValue) => {
    setIsValidating(true);

    setTimeout(async () => {
      try {
        const result = validationEngine.validateField(name, inputValue, context);
        const suggestions = validationEngine.getSuggestions(name, inputValue, context);

        setValidationState({
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
          suggestions: [...result.suggestions, ...suggestions],
          isTouched: true,
        });
      } catch (error) {
        enterpriseLogger.error('Validation error', { error });
      } finally {
        setIsValidating(false);
      }
    }, 300);
  }, [name, context]);

  // Real-time validation
  useEffect(() => {
    if (value && validationState.isTouched) {
      validateField(value);
    }
  }, [value, context, validateField, validationState.isTouched]);

  const handleFocus = (e) => {
    setIsFocused(true);
    setIsOpen(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    // Delay closing dropdown to allow option selection
    setTimeout(() => setIsOpen(false), 200);
    if (!validationState.isTouched) {
      validateField(e.target.value);
    }
    onBlur && onBlur(e);
  };

  const handleChange = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    validateField(selectedValue);
  };

  const getSelectClassName = () => {
    const baseClasses = 'w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors appearance-none cursor-pointer';

    if (disabled) {
      return `${baseClasses} bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed`;
    }

    if (!validationState.isTouched) {
      return `${baseClasses} border-slate-300 focus:ring-gold-500 focus:border-gold-500`;
    }

    if (validationState.errors.length > 0) {
      return `${baseClasses} border-error-300 focus:ring-red-500 focus:border-error-500`;
    }

    if (validationState.warnings.length > 0) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }

    if (validationState.isValid && value) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500`;
    }

    return `${baseClasses} border-slate-300 focus:ring-gold-500 focus:border-gold-500`;
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <RefreshCw className="w-4 h-4 text-gold-500 animate-spin" />;
    }

    if (!validationState.isTouched || !value) {
      return <ChevronDown className="w-4 h-4 text-slate-400" />;
    }

    if (validationState.errors.length > 0) {
      return <AlertCircle className="w-4 h-4 text-error-500" />;
    }

    if (validationState.warnings.length > 0) {
      return <Info className="w-4 h-4 text-yellow-500" />;
    }

    if (validationState.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <ChevronDown className="w-4 h-4 text-slate-400" />;
  };

  const getSelectedOptionLabel = () => {
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const getHelperText = () => {
    if (!validationState.isTouched) return null;

    if (validationState.errors.length > 0) {
      return validationState.errors[0].message;
    }

    if (validationState.warnings.length > 0) {
      return validationState.warnings[0].message;
    }

    if (validationState.isValid && value) {
      return '✓ Valid';
    }

    return null;
  };

  const getHelperTextColor = () => {
    if (!validationState.isTouched) return 'text-slate-500';

    if (validationState.errors.length > 0) return 'text-error-600';
    if (validationState.warnings.length > 0) return 'text-yellow-600';
    if (validationState.isValid && value) return 'text-green-600';

    return 'text-slate-500';
  };

  const fieldId = `select-${name}`;
  const errorId = validationState.errors.length > 0 ? `${fieldId}-error` : undefined;
  const warningId = validationState.warnings.length > 0 ? `${fieldId}-warning` : undefined;
  const describedBy = getAriaDescribedBy(fieldId, undefined, validationState.errors[0]?.message);

  const labelId = label ? `${fieldId}-label` : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label id={labelId} htmlFor={fieldId} className="block text-body-regular font-medium text-slate-700">
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Hidden native select for accessibility */}
        <select
          id={fieldId}
          name={name}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          aria-label={!label ? getAriaLabel(name, required, validationState.errors[0]?.message) : undefined}
          aria-describedby={describedBy}
          aria-invalid={validationState.errors.length > 0}
          aria-required={required}
          className="sr-only"
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown button */}
        <button
          type="button"
          id={`${fieldId}-button`}
          onClick={() => setIsOpen(!isOpen)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${fieldId}-listbox`}
          aria-labelledby={label ? `${fieldId}-label` : undefined}
          className={`${getSelectClassName()} flex items-center justify-between`}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-500'}>
            {getSelectedOptionLabel()}
          </span>
          <div className="flex items-center space-x-2">
            {getValidationIcon()}
          </div>
        </button>

        {/* Custom dropdown menu */}
        {isOpen && !disabled && (
          <div
            id={`${fieldId}-listbox`}
            role="listbox"
            aria-label={label || name}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-elevation-3 max-h-60 overflow-y-auto"
          >
            <div className="py-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-body-regular text-slate-500 text-center">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => handleChange(option.value)}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors ${
                      value === option.value
                        ? 'bg-gold-50 text-gold-700 font-medium'
                        : 'text-slate-900'
                    }`}
                  >
                    {option.label}
                    {option.description && (
                      <span className="block text-body-small text-slate-500 mt-1">
                        {option.description}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {getHelperText() && (
        <p
          id={validationState.errors.length > 0 ? errorId : validationState.warnings.length > 0 ? warningId : undefined}
          role={validationState.errors.length > 0 ? 'alert' : undefined}
          aria-live={validationState.errors.length > 0 ? 'polite' : undefined}
          className={`text-xs ${getHelperTextColor()}`}
        >
          {getHelperText()}
        </p>
      )}

      {/* Suggestions */}
      {showSuggestions && validationState.suggestions.length > 0 && (isFocused || validationState.errors.length > 0) && (
        <div className="mt-2 p-3 bg-info-50 border border-info-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-info-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-body-regular font-medium text-info-900 mb-1">Suggestions:</p>
              <ul className="text-body-small text-info-800 space-y-1">
                {validationState.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validationState.warnings.length > 0 && validationState.isTouched && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-body-regular font-medium text-yellow-900 mb-1">Please Note:</p>
              <ul className="text-body-small text-yellow-800 space-y-1">
                {validationState.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {validationState.errors.length > 0 && validationState.isTouched && (
        <div id={errorId} role="alert" aria-live="polite" className="mt-2 p-3 bg-error-50 border border-red-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-body-regular font-medium text-red-900 mb-1">Please Fix:</p>
              <ul className="text-body-small text-red-800 space-y-1">
                {validationState.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2" aria-hidden="true">•</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatedSelect;
