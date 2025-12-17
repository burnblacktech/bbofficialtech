// =====================================================
// AUTO-FILL INDICATOR COMPONENT
// Field and section-level auto-fill provenance display
// Per UI.md specifications (Section 4.2, lines 7161-7303)
// =====================================================

import React from 'react';
import { Clock, Info } from 'lucide-react';
import SourceChip from '../SourceChip/SourceChip';
import { cn } from '../../../lib/utils';
import { formatIndianDateTime } from '../../../lib/format';

/**
 * Field-level Auto-fill Indicator
 * Shows source chip, upload date, and helper text
 */
export const FieldAutoFillIndicator = ({
  source,
  sourceDocument,
  uploadDate,
  isEdited = false,
  className = '',
  ...props
}) => {
  if (!source) return null;

  return (
    <div className={cn('flex items-center justify-between', className)} {...props}>
      <div className="flex-1">
        {uploadDate && (
          <p
            className="text-body-sm text-slate-500 flex items-center gap-1"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            <Clock className="w-3 h-3" />
            <span>
              Auto-filled from {sourceDocument || source} uploaded on{' '}
              {formatIndianDateTime(uploadDate)}
            </span>
          </p>
        )}
        {!uploadDate && (
          <p
            className="text-body-sm text-slate-500"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            Auto-filled from {sourceDocument || source}
          </p>
        )}
        {isEdited && (
          <p
            className="text-body-sm text-warning-600 mt-1"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            This value has been edited
          </p>
        )}
      </div>
      <SourceChip source={source} size="sm" documentName={sourceDocument} />
    </div>
  );
};

/**
 * Section-level Auto-fill Banner
 * Info banner explaining that section was auto-filled
 */
export const SectionAutoFillBanner = ({
  source,
  sourceDocument,
  uploadDate,
  verifiedCount,
  totalFields,
  className = '',
  ...props
}) => {
  if (!source) return null;

  return (
    <div
      className={cn(
        'bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3',
        className,
      )}
      {...props}
    >
      <Info className="w-5 h-5 text-info-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p
          className="text-body-md font-medium text-gray-800 mb-1"
          style={{ fontSize: '14px', fontWeight: 500, lineHeight: '22px' }}
        >
          This section was auto-filled from your {sourceDocument || source}
        </p>
        {uploadDate && (
          <p
            className="text-body-sm text-slate-600 flex items-center gap-1"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            <Clock className="w-3 h-3" />
            <span>Uploaded on {formatIndianDateTime(uploadDate)}</span>
          </p>
        )}
        {verifiedCount !== undefined && totalFields !== undefined && (
          <p
            className="text-body-sm text-success-600 mt-2 flex items-center gap-1"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            <span>✓</span>
            <span>
              {verifiedCount} of {totalFields} values verified against {sourceDocument || source}
            </span>
          </p>
        )}
      </div>
      <SourceChip source={source} size="md" documentName={sourceDocument} />
    </div>
  );
};

/**
 * Mixed Sources Display
 * Shows multiple source chips when data comes from different sources
 */
export const MixedSourcesDisplay = ({
  sources = [],
  className = '',
  ...props
}) => {
  if (sources.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} {...props}>
      <span
        className="text-body-sm font-medium text-slate-700"
        style={{ fontSize: '13px', fontWeight: 500 }}
      >
        Sources:
      </span>
      {sources.map((source, index) => (
        <SourceChip
          key={index}
          source={source.type}
          size="sm"
          documentName={source.documentName}
        />
      ))}
    </div>
  );
};

export default FieldAutoFillIndicator;

