import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw, IndianRupee } from 'lucide-react';
import { validationEngine } from '../utils/validation';

const ValidatedNumberInput = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  context = {},
  showSuggestions = true,
  showCurrencyIcon = true,
  min,
  max,
  step = 1,
  allowNegative = false,
  formatAsCurrency = true,
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
  const [isValidating, setIsValidating] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Format number as currency for display
  const formatCurrency = (num) => {
    if (!num || isNaN(num)) return '';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Parse display value back to number
  const parseCurrency = (str) => {
    if (!str) return '';
    // Remove commas and parse
    return str.replace(/,/g, '');
  };

  // Initialize display value
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatAsCurrency ? formatCurrency(value) : value.toString());
    } else {
      setDisplayValue('');
    }
  }, [value, formatAsCurrency]);

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
        console.error('Validation error:', error);
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
    // Show raw number when focused for easier editing
    if (formatAsCurrency && value) {
      setDisplayValue(value.toString());
    }
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    // Format as currency when blurred
    if (formatAsCurrency && displayValue) {
      const numValue = parseFloat(parseCurrency(displayValue));
      if (!isNaN(numValue)) {
        setDisplayValue(formatCurrency(numValue));
        onChange(numValue);
      }
    }
    if (!validationState.isTouched) {
      validateField(parseFloat(parseCurrency(displayValue)) || 0);
    }
    onBlur && onBlur(e);
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;

    // Remove any non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const decimalCount = (inputValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      inputValue = inputValue.slice(0, -1);
    }

    // Limit decimal places to 2
    if (inputValue.includes('.')) {
      const parts = inputValue.split('.');
      if (parts[1].length > 2) {
        inputValue = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
    }

    setDisplayValue(inputValue);

    // Convert to number for validation and onChange
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
  };

  const getInputClassName = () => {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors';

    if (disabled) {
      return `${baseClasses} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (!validationState.isTouched) {
      return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
    }

    if (validationState.errors.length > 0) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }

    if (validationState.warnings.length > 0) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }

    if (validationState.isValid && value) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500`;
    }

    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (!validationState.isTouched || !value) {
      return showCurrencyIcon ? <IndianRupee className="w-4 h-4 text-gray-400" /> : null;
    }

    if (validationState.errors.length > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    if (validationState.warnings.length > 0) {
      return <Info className="w-4 h-4 text-yellow-500" />;
    }

    if (validationState.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return showCurrencyIcon ? <IndianRupee className="w-4 h-4 text-gray-400" /> : null;
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
      return `✓ ₹${formatCurrency(value)}`;
    }

    return null;
  };

  const getHelperTextColor = () => {
    if (!validationState.isTouched) return 'text-gray-500';

    if (validationState.errors.length > 0) return 'text-red-600';
    if (validationState.warnings.length > 0) return 'text-yellow-600';
    if (validationState.isValid && value) return 'text-green-600';

    return 'text-gray-500';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${getInputClassName()} ${showCurrencyIcon ? 'pl-10' : ''}`}
          {...props}
        />

        {/* Currency Icon */}
        {showCurrencyIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Validation Icon */}
        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${showCurrencyIcon ? '' : ''}`}>
          {getValidationIcon()}
        </div>
      </div>

      {/* Helper Text */}
      {getHelperText() && (
        <p className={`text-xs ${getHelperTextColor()}`}>
          {getHelperText()}
        </p>
      )}

      {/* Suggestions */}
      {showSuggestions && validationState.suggestions.length > 0 && (isFocused || validationState.errors.length > 0) && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Suggestions:</p>
              <ul className="text-xs text-blue-800 space-y-1">
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
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">Please Note:</p>
              <ul className="text-xs text-yellow-800 space-y-1">
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
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">Please Fix:</p>
              <ul className="text-xs text-red-800 space-y-1">
                {validationState.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
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

export default ValidatedNumberInput;
