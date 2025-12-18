// =====================================================
// INLINE VALIDATION COMPONENT
// Real-time validation feedback for form fields
// Per UI.md specifications (Section 4.4, lines 7433-7473)
// =====================================================

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils';
import { useDebounce } from '../../../hooks/useDebounce';

/**
 * InlineValidation Component
 * Provides real-time validation feedback with format hints and error messages
 */
export const InlineValidation = ({
  value,
  error,
  formatHint,
  isValidating = false,
  validationState = null, // 'valid' | 'error' | 'warning' | null
  className = '',
  ...props
}) => {
  const [showHint, setShowHint] = useState(false);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    // Show hint while typing if formatHint is provided
    if (formatHint && value && value.length > 0 && !error) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [value, formatHint, error]);

  return (
    <AnimatePresence>
      {(showHint || error || validationState === 'valid' || isValidating) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn('mt-1', className)}
          {...props}
        >
          {/* Format Hint (while typing) */}
          {showHint && formatHint && !error && (
            <div className="flex items-center gap-1 text-body-sm text-slate-500">
              <Info className="w-3 h-3" />
              <span style={{ fontSize: '13px', lineHeight: '20px' }}>{formatHint}</span>
            </div>
          )}

          {/* Validating State */}
          {isValidating && (
            <div className="flex items-center gap-1 text-body-sm text-slate-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Info className="w-3 h-3" />
              </motion.div>
              <span style={{ fontSize: '13px', lineHeight: '20px' }}>Validating...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1 text-body-sm text-error-600">
              <AlertCircle className="w-3 h-3" />
              <span style={{ fontSize: '13px', lineHeight: '20px' }}>{error}</span>
            </div>
          )}

          {/* Success State */}
          {validationState === 'valid' && !error && (
            <div className="flex items-center gap-1 text-body-sm text-success-600">
              <CheckCircle className="w-3 h-3" />
              <span style={{ fontSize: '13px', lineHeight: '20px' }}>Valid</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * ValidationSummary Component
 * Form-level validation error summary
 */
export const ValidationSummary = ({
  errors = [],
  onFieldClick,
  className = '',
  ...props
}) => {
  if (!errors || errors.length === 0) return null;

  // Group errors by section
  const errorsBySection = errors.reduce((acc, error) => {
    const section = error.section || 'Other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(error);
    return acc;
  }, {});

  return (
    <div
      className={cn(
        'bg-error-50 border border-error-200 rounded-xl p-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-error-600" />
        <h3
          className="text-heading-sm font-semibold text-error-700"
          style={{ fontSize: '16px', fontWeight: 600 }}
        >
          Please fix the following errors before submitting:
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(errorsBySection).map(([section, sectionErrors]) => (
          <div key={section}>
            <h4
              className="text-body-md font-semibold text-gray-800 mb-2"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {section}
            </h4>
            <ul className="space-y-1">
              {sectionErrors.map((error, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-body-sm text-slate-700"
                  style={{ fontSize: '13px', lineHeight: '20px' }}
                >
                  <span>• {error.message}</span>
                  {onFieldClick && (
                    <button
                      onClick={() => onFieldClick(error.fieldId)}
                      className="text-gold-500 hover:text-gold-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-1 rounded"
                      style={{ fontSize: '13px' }}
                    >
                      Go to field →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-error-200">
        <p
          className="text-body-sm text-slate-600"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {errors.length} error{errors.length !== 1 ? 's' : ''} found • Scroll up to see highlighted fields
        </p>
      </div>
    </div>
  );
};

export default InlineValidation;

