// =====================================================
// AUDIT TRAIL COMPONENT
// Field-level change history tracking
// Per UI.md specifications (Section 4.2, lines 7284-7301)
// =====================================================

import React, { useState } from 'react';
import { Clock, FileText, User, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { formatIndianDateTime } from '../../../lib/format';
import SourceChip from '../SourceChip/SourceChip';

/**
 * AuditTrail Component
 * Displays field-level change history with timestamps and reasons
 */
export const AuditTrail = ({
  fieldLabel,
  history = [],
  valueFormatter = (val) => val,
  className = '',
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!history || history.length === 0) return null;

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200', className)} {...props}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-inset rounded-xl"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} audit trail for ${fieldLabel}`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3
            className="text-heading-sm font-semibold text-slate-900"
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            Data History - {fieldLabel}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* History List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-200">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    'pt-4',
                    index < history.length - 1 && 'border-b border-gray-100',
                  )}
                >
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span
                      className="text-body-sm text-slate-600"
                      style={{ fontSize: '13px', lineHeight: '20px' }}
                    >
                      {formatIndianDateTime(entry.timestamp)}
                    </span>
                  </div>

                  {/* Change Details */}
                  {entry.type === 'changed' && (
                    <div className="space-y-2">
                      <p
                        className="text-body-sm text-slate-700"
                        style={{ fontSize: '13px', lineHeight: '20px' }}
                      >
                        Changed from{' '}
                        <span className="font-medium">{valueFormatter(entry.fromValue)}</span> to{' '}
                        <span className="font-medium">{valueFormatter(entry.toValue)}</span>
                      </p>
                      {entry.by && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <span
                            className="text-body-sm text-slate-600"
                            style={{ fontSize: '13px', lineHeight: '20px' }}
                          >
                            By: {entry.by}
                          </span>
                        </div>
                      )}
                      {entry.reason && (
                        <p
                          className="text-body-sm text-slate-600 italic"
                          style={{ fontSize: '13px', lineHeight: '20px' }}
                        >
                          Reason: {entry.reason}
                        </p>
                      )}
                    </div>
                  )}

                  {entry.type === 'auto-filled' && (
                    <div className="space-y-2">
                      <p
                        className="text-body-sm text-slate-700"
                        style={{ fontSize: '13px', lineHeight: '20px' }}
                      >
                        Auto-filled: <span className="font-medium">{valueFormatter(entry.value)}</span>
                      </p>
                      {entry.source && (
                        <div className="flex items-center gap-2">
                          <SourceChip source={entry.source} size="sm" documentName={entry.sourceDocument} />
                          {entry.sourceDocument && (
                            <span
                              className="text-body-sm text-slate-600"
                              style={{ fontSize: '13px', lineHeight: '20px' }}
                            >
                              ({entry.sourceDocument})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditTrail;

