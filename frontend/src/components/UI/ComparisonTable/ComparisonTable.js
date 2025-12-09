// =====================================================
// COMPARISON TABLE COMPONENT
// Side-by-side regime comparison table
// Fully compliant with UI.md specifications
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import EmptyState from '../EmptyState/EmptyState';
import { FileText } from 'lucide-react';

const ComparisonTable = ({
  rows = [],
  oldLabel = 'OLD REGIME',
  newLabel = 'NEW REGIME',
  className = '',
  isLoading = false,
  recommendedRegime,
  savings,
  emptyStateTitle = 'No comparison data',
  emptyStateDescription = 'There is no data to compare.',
}) => {
  const formatValue = (value, isResult = false) => {
    if (value === null) return '—';
    if (isResult) {
      return value >= 0
        ? formatIndianCurrency(value)
        : `(${formatIndianCurrency(Math.abs(value))})`;
    }
    return formatIndianCurrency(value);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-6 h-6 text-gold-500 animate-spin" />
          <p className="text-body-md text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyStateTitle}
        description={emptyStateDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn('border border-gray-200 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
        <div className="p-3 text-label-sm text-gray-500 uppercase" style={{ fontSize: '11px', fontWeight: 500 }}></div>
        <div className="p-3 text-label-sm text-gray-500 uppercase text-right" style={{ fontSize: '11px', fontWeight: 500 }}>
          {oldLabel}
        </div>
        <div className="p-3 text-label-sm text-gray-500 uppercase text-right" style={{ fontSize: '11px', fontWeight: 500 }}>
          {newLabel}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {rows.map((row, index) => {
          const isDifferent = row.oldValue !== row.newValue;
          const oldWinner = row.isFinalResult && recommendedRegime === 'old';
          const newWinner = row.isFinalResult && recommendedRegime === 'new';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className={cn(
                'grid grid-cols-3 transition-colors',
                {
                  'pl-8': row.isSubItem,
                  'bg-gray-50 border-y-2 border-gray-200': row.isSectionTotal,
                  'bg-success-50': oldWinner || newWinner,
                  'hover:bg-gray-50': !row.isSectionTotal && !row.isFinalResult,
                },
              )}
              role="row"
            >
              <div className={cn(
                'p-3',
                row.isSubItem ? 'text-body-sm text-gray-500' : 'text-body-md text-gray-700',
                row.isSectionTotal && 'text-heading-sm text-gray-800',
                row.isFinalResult && 'text-heading-md text-gray-800',
              )}
              style={{
                fontSize: row.isSubItem ? '13px' : row.isSectionTotal || row.isFinalResult ? '16px' : '14px',
                fontWeight: row.isSectionTotal || row.isFinalResult ? 600 : row.isSubItem ? 400 : 400,
                lineHeight: row.isSubItem ? '20px' : '22px',
              }}
              >
                {row.isSubItem && '├─ '}
                {row.label}
              </div>

              <motion.div
                className={cn(
                  'p-3 text-right tabular-nums',
                  row.isSubItem ? 'text-body-sm text-gray-500' : 'text-number-sm',
                  row.isSectionTotal && 'text-number-md font-semibold',
                  row.isFinalResult && 'text-number-lg font-semibold',
                  row.isFinalResult && row.oldValue !== null && row.oldValue >= 0 && 'text-success-600',
                  row.isFinalResult && row.oldValue !== null && row.oldValue < 0 && 'text-error-600',
                  oldWinner && 'bg-success-50',
                  row.oldValue === null && 'text-gray-400',
                )}
                style={{
                  fontSize: row.isSubItem ? '13px' : row.isSectionTotal ? '18px' : row.isFinalResult ? '20px' : '14px',
                  fontWeight: row.isSectionTotal || row.isFinalResult ? 600 : row.isSubItem ? 400 : 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
                initial={false}
                animate={{
                  backgroundColor: oldWinner ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                }}
                transition={{ duration: 0.3 }}
              >
                {oldWinner && <CheckCircle className="inline-block w-4 h-4 mr-1 text-success-500" aria-label="Recommended" />}
                {formatValue(row.oldValue, row.isFinalResult)}
              </motion.div>

              <motion.div
                className={cn(
                  'p-3 text-right tabular-nums',
                  row.isSubItem ? 'text-body-sm text-gray-500' : 'text-number-sm',
                  row.isSectionTotal && 'text-number-md font-semibold',
                  row.isFinalResult && 'text-number-lg font-semibold',
                  row.isFinalResult && row.newValue !== null && row.newValue >= 0 && 'text-success-600',
                  row.isFinalResult && row.newValue !== null && row.newValue < 0 && 'text-error-600',
                  newWinner && 'bg-success-50',
                  row.newValue === null && 'text-gray-400',
                )}
                style={{
                  fontSize: row.isSubItem ? '13px' : row.isSectionTotal ? '18px' : row.isFinalResult ? '20px' : '14px',
                  fontWeight: row.isSectionTotal || row.isFinalResult ? 600 : row.isSubItem ? 400 : 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
                initial={false}
                animate={{
                  backgroundColor: newWinner ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                }}
                transition={{ duration: 0.3 }}
              >
                {newWinner && <CheckCircle className="inline-block w-4 h-4 mr-1 text-success-500" aria-label="Recommended" />}
                {formatValue(row.newValue, row.isFinalResult)}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Recommendation Footer */}
      {recommendedRegime && savings !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: rows.length * 0.03 }}
          className="p-4 bg-gray-50 border-t border-gray-200 text-center"
        >
          <span className="inline-block bg-gradient-to-r from-gold-500 to-gold-600 text-white text-label-md uppercase px-4 py-2 rounded-lg font-semibold" style={{ fontSize: '13px', fontWeight: 500 }}>
            {recommendedRegime.toUpperCase()} REGIME RECOMMENDED • Save {formatIndianCurrency(savings)}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default ComparisonTable;

