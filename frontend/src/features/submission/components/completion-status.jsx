// =====================================================
// COMPLETION STATUS COMPONENT
// Section-wise completion status view
// =====================================================

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, ChevronRight } from 'lucide-react';

const CompletionStatus = ({ sections, onSectionClick }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-warning-500" />;
      default:
        return <XCircle className="h-5 w-5 text-error-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'partial':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      default:
        return 'text-error-600 bg-error-50 border-error-200';
    }
  };

  const completionPercentage = sections.length > 0
    ? Math.round(
        (sections.filter((s) => s.status === 'complete').length / sections.length) * 100,
      )
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-gray-800 mb-1">Completion Status</h3>
          <p className="text-body-md text-slate-600">
            {completionPercentage}% complete ({sections.filter((s) => s.status === 'complete').length}/{sections.length} sections)
          </p>
        </div>
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center">
            <span className="text-heading-md font-semibold text-gray-800">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            completionPercentage === 100
              ? 'bg-success-500'
              : completionPercentage >= 50
              ? 'bg-warning-500'
              : 'bg-error-500'
          }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Sections List */}
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick && onSectionClick(section.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              section.status === 'complete'
                ? 'bg-success-50 border-success-200 hover:border-success-300'
                : section.status === 'partial'
                ? 'bg-warning-50 border-warning-200 hover:border-warning-300'
                : 'bg-error-50 border-error-200 hover:border-error-300'
            }`}
          >
            <div className="flex items-center flex-1">
              {getStatusIcon(section.status)}
              <div className="ml-3 text-left">
                <p className="text-body-md font-medium text-gray-800">{section.name}</p>
                <p className="text-body-sm text-slate-600">{section.description}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`text-body-sm font-medium px-3 py-1 rounded-full ${
                  section.status === 'complete'
                    ? 'text-success-700 bg-success-100'
                    : section.status === 'partial'
                    ? 'text-warning-700 bg-warning-100'
                    : 'text-error-700 bg-error-100'
                }`}
              >
                {section.status === 'complete'
                  ? 'Complete'
                  : section.status === 'partial'
                  ? 'Partial'
                  : 'Incomplete'}
              </span>
              {onSectionClick && (
                <ChevronRight className="h-5 w-5 text-slate-400 ml-2" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CompletionStatus;

