// =====================================================
// DOCUMENT VERIFICATION COMPONENT
// Document verification checklist display
// Per UI.md specifications (Section 4.3, lines 7391-7413)
// =====================================================

import React from 'react';
import { CheckCircle, X, FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { VerificationState } from '../VerificationState';
import { formatIndianDateTime } from '../../../lib/format';

/**
 * DocumentVerification Component
 * Shows verification checklist for uploaded documents
 */
export const DocumentVerification = ({
  documentName,
  verificationStatus = 'verified', // 'verified' | 'pending' | 'failed'
  checks = [],
  extractedFieldsCount,
  lastUpdated,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200 p-4', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-500" />
          <h3
            className="text-heading-sm font-semibold text-slate-900"
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            {documentName}
          </h3>
        </div>
        <VerificationState state={verificationStatus} size="md" />
      </div>

      {/* Verification Checklist */}
      {checks.length > 0 && (
        <div className="space-y-2 mb-4">
          {checks.map((check, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2',
                check.passed ? 'text-success-600' : 'text-error-600',
              )}
            >
              {check.passed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span
                className="text-body-sm"
                style={{ fontSize: '13px', lineHeight: '20px' }}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      {(extractedFieldsCount !== undefined || lastUpdated) && (
        <div className="border-t border-slate-200 pt-3 mt-3">
          {extractedFieldsCount !== undefined && (
            <p
              className="text-body-sm text-slate-600"
              style={{ fontSize: '13px', lineHeight: '20px' }}
            >
              {extractedFieldsCount} fields extracted
            </p>
          )}
          {lastUpdated && (
            <p
              className="text-body-sm text-slate-600"
              style={{ fontSize: '13px', lineHeight: '20px' }}
            >
              Last updated {formatIndianDateTime(lastUpdated)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentVerification;

