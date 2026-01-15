import React from 'react';
import PropTypes from 'prop-types';

/**
 * ValidatedNumberInput Component
 * A reusable number input with built-in validation and formatting
 *
 * Features:
 * - No spinner arrows (handled by global CSS)
 * - Blank default instead of 0
 * - Positive number validation
 * - Max value validation
 * - Indian currency formatting on blur
 * - Prevents negative numbers
 */
const ValidatedNumberInput = ({
    value,
    onChange,
    name,
    label,
    placeholder = '',
    min = 0,
    max,
    required = false,
    disabled = false,
    className = '',
    helpText,
    error,
    showCurrency = true,
}) => {
    const handleChange = (e) => {
        const inputValue = e.target.value;

        // Allow empty string
        if (inputValue === '') {
            onChange(name, '');
            return;
        }

        // Remove non-numeric characters except decimal point
        const cleaned = inputValue.replace(/[^\d.]/g, '');

        // Prevent multiple decimal points
        const parts = cleaned.split('.');
        const formatted = parts.length > 2
            ? `${parts[0]}.${parts.slice(1).join('')}`
            : cleaned;

        // Validate against min/max
        const numValue = parseFloat(formatted);

        if (!isNaN(numValue)) {
            if (min !== undefined && numValue < min) {
                return; // Don't update if below min
            }
            if (max !== undefined && numValue > max) {
                return; // Don't update if above max
            }
        }

        onChange(name, formatted);
    };

    const handleBlur = () => {
        // Format to 2 decimal places if value exists
        if (value && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                onChange(name, numValue.toFixed(2));
            }
        }
    };

    const handleKeyDown = (e) => {
        // Prevent minus sign
        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
        }
    };

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label className="block text-xs font-medium text-slate-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {showCurrency && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        ₹
                    </span>
                )}

                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    max={max}
                    step="0.01"
                    className={`
                        w-full px-3 py-2 text-sm border rounded-lg
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        disabled:bg-slate-100 disabled:cursor-not-allowed
                        ${showCurrency ? 'pl-7' : ''}
                        ${error ? 'border-red-500' : 'border-slate-300'}
                    `}
                />
            </div>

            {helpText && !error && (
                <p className="text-xs text-slate-500 mt-1">{helpText}</p>
            )}

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}

            {max && (
                <p className="text-xs text-slate-400 mt-1">
                    Max: ₹{max.toLocaleString('en-IN')}
                </p>
            )}
        </div>
    );
};

ValidatedNumberInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    helpText: PropTypes.string,
    error: PropTypes.string,
    showCurrency: PropTypes.bool,
};

export default ValidatedNumberInput;
