// =====================================================
// VALIDATION SUMMARY COMPONENT
// Shows all validation errors/warnings grouped by section
// Allows navigation to problematic fields
// =====================================================

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const ValidationSummary = ({
  validationResult,
  onNavigateToField,
  className = '',
}) => {
  if (!validationResult) {
    return null;
  }

  const { errors = {}, warnings = [], isValid = true } = validationResult;

  // Calculate validation score
  const totalFields = Object.keys(errors).length;
  const errorCount = Object.values(errors).reduce((sum, err) => {
    if (Array.isArray(err)) return sum + err.length;
    if (typeof err === 'object') return sum + Object.keys(err).length;
    return sum + 1;
  }, 0);

  const warningCount = warnings.length;
  const validationScore = totalFields === 0 ? 100 : Math.max(0, 100 - (errorCount * 10));

  // Group errors by section
  const errorsBySection = {};
  Object.keys(errors).forEach(section => {
    errorsBySection[section] = errors[section];
  });

  const handleNavigate = (section, fieldId = null) => {
    if (onNavigateToField) {
      onNavigateToField(section, fieldId);
    }
  };

  if (isValid && warningCount === 0) {
    return (
      <div className={cn('rounded-xl bg-success-50 border border-success-200 p-4', className)}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
          <p className="text-body-md font-medium text-success-900">
            All validations passed! Form is ready for submission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border p-4', isValid ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 text-error-500" aria-hidden="true" />
          )}
          <h3 className="text-heading-sm text-slate-900">Validation Summary</h3>
        </div>
        <div className="text-body-md text-slate-600">
          Score: <span className={cn('font-semibold tabular-nums', validationScore >= 80 ? 'text-success-600' : validationScore >= 50 ? 'text-warning-600' : 'text-error-600')}>
            {validationScore}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              validationScore >= 80 ? 'bg-success-500' : validationScore >= 50 ? 'bg-warning-500' : 'bg-error-500',
            )}
            style={{ width: `${validationScore}%` }}
            role="progressbar"
            aria-valuenow={validationScore}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      {/* Errors by Section */}
      {Object.keys(errorsBySection).length > 0 && (
        <div className="mb-4">
          <h4 className="text-label-md font-semibold text-slate-900 mb-2">
            Errors ({errorCount})
          </h4>
          <div className="space-y-2">
            {Object.entries(errorsBySection).map(([section, sectionErrors]) => {
              const errorList = Array.isArray(sectionErrors)
                ? sectionErrors
                : typeof sectionErrors === 'object'
                  ? Object.entries(sectionErrors).map(([field, err]) => ({
                      field,
                      message: Array.isArray(err) ? err.join(', ') : err,
                    }))
                  : [{ message: sectionErrors }];

              return (
                <div
                  key={section}
                  className="rounded-xl bg-error-50 border border-error-200 p-3 cursor-pointer hover:bg-error-100 transition-colors"
                  onClick={() => handleNavigate(section)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavigate(section);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-error-500" aria-hidden="true" />
                        <span className="text-label-md font-medium text-error-900 capitalize">
                          {section.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {errorList.map((error, index) => (
                          <li
                            key={index}
                            className="text-body-md text-error-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (error.field) {
                                handleNavigate(section, error.field);
                              }
                            }}
                          >
                            {error.field ? `${error.field}: ` : ''}{error.message || error}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ChevronRight className="h-4 w-4 text-error-500" aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warningCount > 0 && (
        <div>
          <h4 className="text-label-md font-semibold text-slate-900 mb-2">
            Warnings ({warningCount})
          </h4>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="rounded-xl bg-warning-50 border border-warning-200 p-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5" aria-hidden="true" />
                  <p className="text-body-md text-warning-800">{warning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationSummary;

