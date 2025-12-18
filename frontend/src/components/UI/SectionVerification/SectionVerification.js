// =====================================================
// SECTION VERIFICATION COMPONENT
// Section-level verification progress tracking
// Per UI.md specifications (Section 4.3, lines 7373-7388)
// =====================================================

import React from 'react';
import { VerificationState } from '../VerificationState';
import { cn } from '../../../utils';

/**
 * SectionVerification Component
 * Shows verification progress for multiple fields in a section
 */
export const SectionVerification = ({
  fields = [],
  className = '',
  ...props
}) => {
  const verifiedCount = fields.filter((f) => f.state === 'verified').length;
  const totalCount = fields.length;
  const progress = totalCount > 0 ? (verifiedCount / totalCount) * 100 : 0;

  if (totalCount === 0) return null;

  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* Field Status Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {fields.map((field, index) => (
          <VerificationState
            key={index}
            state={field.state}
            size="sm"
            showLabel={true}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span
            className="text-body-sm text-slate-700"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            Verification: {verifiedCount}/{totalCount} complete
          </span>
          <span
            className="text-body-sm text-slate-600"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full" style={{ height: '8px' }}>
          <div
            className="bg-success-500 rounded-full transition-all duration-300"
            style={{
              height: '100%',
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionVerification;

