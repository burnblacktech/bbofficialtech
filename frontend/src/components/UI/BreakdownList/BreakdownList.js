// =====================================================
// BREAKDOWN LIST COMPONENT
// Income/deduction breakdown with expandable items
// Fully compliant with UI.md specifications
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, AlertTriangle, Loader } from 'lucide-react';
import { formatIndianCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import SourceChip from '../SourceChip/SourceChip';
import EmptyState from '../../DesignSystem/EmptyState';
import { FileText } from 'lucide-react';

const BreakdownList = ({
  items = [],
  onResolveWarning,
  onItemClick,
  showTotal = true,
  className = '',
  isLoading = false,
  emptyStateTitle = 'No items to display',
  emptyStateDescription = 'There are no items in this breakdown.',
  emptyStateAction,
  emptyStateActionLabel,
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleKeyDown = (e, itemId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(itemId);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-6 h-6 text-gold-500 animate-spin" />
          <p className="text-body-md text-slate-600">Loading breakdown...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyStateTitle}
        description={emptyStateDescription}
        action={emptyStateAction}
        actionLabel={emptyStateActionLabel}
        className={className}
      />
    );
  }

  return (
    <div className={cn('divide-y divide-gray-200', className)} role="list" aria-label="Breakdown list">
      {items.map((item) => (
        <BreakdownCategory
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggle={() => toggleExpand(item.id)}
          onKeyDown={(e) => handleKeyDown(e, item.id)}
          onResolveWarning={onResolveWarning}
          onItemClick={onItemClick}
        />
      ))}
      {showTotal && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between p-4 bg-slate-50 border-t-2 border-slate-300"
          role="row"
        >
          <span className="text-heading-sm font-semibold text-gray-800" style={{ fontSize: '16px', fontWeight: 600 }}>Total</span>
          <span className="text-number-md font-semibold text-slate-900" style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatIndianCurrency(total)}
          </span>
        </motion.div>
      )}
    </div>
  );
};

const BreakdownCategory = ({
  item,
  isExpanded,
  onToggle,
  onKeyDown,
  onResolveWarning,
  onItemClick,
}) => {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div role="listitem">
      {/* Category Header */}
      <button
        onClick={() => hasChildren ? onToggle() : onItemClick?.(item.id)}
        onKeyDown={(e) => {
          if (hasChildren) {
            onKeyDown?.(e);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
          item.hasWarning && 'bg-warning-50',
        )}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-controls={hasChildren ? `breakdown-children-${item.id}` : undefined}
        role={hasChildren ? 'button' : undefined}
      >
        <div className="flex items-center gap-3">
          {hasChildren && (
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </motion.div>
          )}
          <span className="text-heading-sm text-gray-800" style={{ fontSize: '16px', fontWeight: 600 }}>{item.label}</span>
          {item.source && <SourceChip source={item.source} size="sm" />}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            'text-number-md',
            item.amount < 0 ? 'text-slate-500' : 'text-gray-800',
          )}
          style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {item.amount < 0
              ? `(${formatIndianCurrency(Math.abs(item.amount))})`
              : formatIndianCurrency(item.amount)
            }
          </span>
          {item.hasWarning && (
            <AlertTriangle className="w-4 h-4 text-warning-500" aria-label="Warning" />
          )}
        </div>
      </button>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            id={`breakdown-children-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
            role="list"
          >
            {item.children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
                className={cn(
                  'relative pl-10 pr-4 py-3',
                  child.hasWarning && 'bg-warning-50 border-l-3 border-warning-500',
                )}
                role="listitem"
              >
                {/* Tree Lines */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
                <div className="absolute left-6 top-1/2 w-3 h-px bg-slate-200" />
                {index === item.children.length - 1 && (
                  <div className="absolute left-6 top-1/2 bottom-0 w-px bg-white" />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-body-md text-slate-600" style={{ fontSize: '14px', lineHeight: '22px' }}>{child.label}</span>
                  <span className={cn(
                    'text-number-sm',
                    child.amount < 0 ? 'text-slate-500' : 'text-slate-600',
                    child.hasWarning && 'text-warning-600',
                  )}
                  style={{ fontSize: '14px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {child.amount < 0
                      ? `(${formatIndianCurrency(Math.abs(child.amount))})`
                      : formatIndianCurrency(child.amount)
                    }
                    {child.hasWarning && ' ⚠'}
                  </span>
                </div>

                {/* Warning Message */}
                {child.hasWarning && child.warningMessage && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-body-sm text-warning-600" style={{ fontSize: '13px', lineHeight: '20px' }}>
                      ⚠ {child.warningMessage}
                    </span>
                    {onResolveWarning && (
                      <button
                        onClick={() => onResolveWarning(child.id)}
                        className="text-body-sm text-gold-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-1"
                        style={{ fontSize: '13px', lineHeight: '20px' }}
                        aria-label={`Resolve warning for ${child.label}`}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BreakdownList;

