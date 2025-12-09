// =====================================================
// VALIDATION RUNNER COMPONENT
// Pre-submission validation runner with section-wise checks
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Loader,
  ChevronRight,
} from 'lucide-react';
import { usePreSubmissionValidation } from '../hooks/use-pre-submission-validation';
import Button from '../../../components/common/Button';

const ValidationRunner = ({ filingId, formData, onValidationComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(new Set());

  const { runValidation, isPending } = usePreSubmissionValidation(filingId);

  const handleRunValidation = async () => {
    setIsRunning(true);
    try {
      const results = await runValidation(formData);
      setValidationResults(results);
      if (onValidationComplete) {
        onValidationComplete(results);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAcknowledgeWarning = (warningId) => {
    setAcknowledgedWarnings(new Set([...acknowledgedWarnings, warningId]));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-info-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-error-50 border-error-200 text-error-900';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-900';
      case 'info':
        return 'bg-info-50 border-info-200 text-info-900';
      default:
        return 'bg-success-50 border-success-200 text-success-900';
    }
  };

  const canProceed = () => {
    if (!validationResults) return false;
    const hasErrors = validationResults.errors.length > 0;
    const hasUnacknowledgedWarnings =
      validationResults.warnings.filter((w) => !acknowledgedWarnings.has(w.id))
        .length > 0;
    return !hasErrors && !hasUnacknowledgedWarnings;
  };

  if (!validationResults && !isRunning) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-md text-gray-800 mb-1">
              Pre-Submission Validation
            </h3>
            <p className="text-body-md text-gray-600">
              Run validation checks before submitting your ITR
            </p>
          </div>
          <Button onClick={handleRunValidation} loading={isPending}>
            Run Validation
          </Button>
        </div>
      </div>
    );
  }

  if (isRunning || isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-gold-500 mr-3" />
          <span className="text-body-md text-gray-600">Running validation checks...</span>
        </div>
      </div>
    );
  }

  const { errors, warnings, info, sections } = validationResults;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800 mb-1">
            Validation Results
          </h3>
          <p className="text-body-md text-gray-600">
            {errors.length === 0 && warnings.length === 0
              ? 'All validations passed!'
              : `${errors.length} error(s), ${warnings.length} warning(s)`}
          </p>
        </div>
        <Button variant="ghost" onClick={handleRunValidation} disabled={isPending}>
          Re-run Validation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-gray-600">Errors</p>
              <p className="text-heading-lg text-error-600">{errors.length}</p>
            </div>
            <XCircle className="h-8 w-8 text-error-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-gray-600">Warnings</p>
              <p className="text-heading-lg text-warning-600">{warnings.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-gray-600">Info</p>
              <p className="text-heading-lg text-info-600">{info.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-info-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-gray-600">Sections</p>
              <p className="text-heading-lg text-success-600">
                {sections.filter((s) => s.status === 'complete').length}/{sections.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-500" />
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-body-md font-semibold text-error-900 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            Critical Errors ({errors.length})
          </h4>
          <div className="space-y-2">
            {errors.map((error) => (
              <div
                key={error.id}
                className="rounded-xl bg-error-50 border border-error-200 p-4"
              >
                <div className="flex items-start">
                  {getSeverityIcon('error')}
                  <div className="ml-3 flex-1">
                    <p className="text-body-md font-medium text-error-900">
                      {error.section && (
                        <span className="text-body-sm text-error-700 mr-2">
                          [{error.section}]
                        </span>
                      )}
                      {error.message}
                    </p>
                    {error.field && (
                      <p className="text-body-sm text-error-700 mt-1">
                        Field: {error.field}
                      </p>
                    )}
                    {error.suggestion && (
                      <p className="text-body-sm text-error-600 mt-2">
                        Suggestion: {error.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-body-md font-semibold text-warning-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Warnings ({warnings.length})
          </h4>
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div
                key={warning.id}
                className={`rounded-xl border p-4 ${
                  acknowledgedWarnings.has(warning.id)
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-warning-50 border-warning-200'
                }`}
              >
                <div className="flex items-start">
                  {getSeverityIcon('warning')}
                  <div className="ml-3 flex-1">
                    <p className="text-body-md font-medium text-warning-900">
                      {warning.section && (
                        <span className="text-body-sm text-warning-700 mr-2">
                          [{warning.section}]
                        </span>
                      )}
                      {warning.message}
                    </p>
                    {warning.field && (
                      <p className="text-body-sm text-warning-700 mt-1">
                        Field: {warning.field}
                      </p>
                    )}
                    {warning.suggestion && (
                      <p className="text-body-sm text-warning-600 mt-2">
                        Suggestion: {warning.suggestion}
                      </p>
                    )}
                    {!acknowledgedWarnings.has(warning.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledgeWarning(warning.id)}
                        className="mt-3"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Messages */}
      {info.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-body-md font-semibold text-info-900 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Information ({info.length})
          </h4>
          <div className="space-y-2">
            {info.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-info-50 border border-info-200 p-4"
              >
                <div className="flex items-start">
                  {getSeverityIcon('info')}
                  <div className="ml-3 flex-1">
                    <p className="text-body-md text-info-900">{item.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Status */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-body-md font-semibold text-gray-800">
            Section Completion Status
          </h4>
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200"
              >
                <div className="flex items-center">
                  {section.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5 text-success-500 mr-3" />
                  ) : section.status === 'partial' ? (
                    <AlertTriangle className="h-5 w-5 text-warning-500 mr-3" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error-500 mr-3" />
                  )}
                  <div>
                    <p className="text-body-md font-medium text-gray-800">
                      {section.name}
                    </p>
                    <p className="text-body-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`text-body-sm font-medium ${
                      section.status === 'complete'
                        ? 'text-success-600'
                        : section.status === 'partial'
                        ? 'text-warning-600'
                        : 'text-error-600'
                    }`}
                  >
                    {section.status === 'complete'
                      ? 'Complete'
                      : section.status === 'partial'
                      ? 'Partial'
                      : 'Incomplete'}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {canProceed() && (
          <Button onClick={() => onValidationComplete && onValidationComplete(validationResults)}>
            Proceed to Submission
          </Button>
        )}
      </div>
    </div>
  );
};

export default ValidationRunner;

