// =====================================================
// INCOME CARD COMPONENT
// Ultra-Grade Modern UI Design System - newUI.md aligned
// Implements Section 10.1: Income Card (Collapsed & Expanded)
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ArrowRight,
  RefreshCw, Plus, FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { springs, variants, transitions } from '../../lib/motion';

// Status configurations - newUI.md Section 10.1.1
const STATUS_CONFIG = {
  complete: {
    label: 'Complete',
    icon: CheckCircle,
    color: 'text-success-base',
    bg: 'bg-success-light',
    iconColor: '#10B981', // Success-Base
  },
  warning: {
    label: 'Review',
    icon: AlertTriangle,
    color: 'text-gold-500',
    bg: 'bg-warning-light',
    iconColor: '#D4AF37', // Gold-500
  },
  incomplete: {
    label: 'Incomplete',
    icon: Info,
    color: 'text-neutral-500',
    bg: 'bg-neutral-100',
    iconColor: '#737373', // Gray-500
    prefix: '○',
  },
  error: {
    label: 'Mismatch found',
    icon: AlertCircle,
    color: 'text-error-base',
    bg: 'bg-error-light',
    iconColor: '#EF4444', // Error-Base
  },
  notApplicable: {
    label: 'N/A',
    icon: CheckCircle,
    color: 'text-neutral-400',
    bg: 'bg-neutral-100',
    iconColor: '#A6A6A6', // Gray-400
  },
};

/**
 * Income Card Component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component (e.g., Briefcase, Home)
 * @param {string} props.title - Card title (e.g., "Salary Income")
 * @param {number|string} props.amount - Amount to display (will be formatted)
 * @param {string} props.meta - Meta text (e.g., "from 2 employers")
 * @param {string} props.secondaryInfo - Secondary info line (e.g., "TDS: ₹2,63,000")
 * @param {string} props.status - Status: 'complete' | 'warning' | 'incomplete' | 'error' | 'notApplicable'
 * @param {number} props.pendingCount - Number of pending items (for incomplete status)
 * @param {string} props.reviewLink - Review CTA link text
 * @param {Function} props.onReview - Callback when review link is clicked
 * @param {boolean} props.defaultExpanded - Whether card starts expanded
 * @param {string} props.dataSource - Data source info (e.g., "Form 16 + AIS")
 * @param {Function} props.onRefresh - Callback for refresh action
 * @param {Array} props.dataRows - Array of data rows for expanded view
 * @param {Object} props.summary - Summary object with totals
 * @param {Function} props.onAdd - Callback for add action
 * @param {string} props.addLabel - Label for add action (e.g., "Add another employer")
 */
export const IncomeCard = ({
  icon: Icon,
  title,
  amount,
  meta,
  secondaryInfo,
  status = 'complete',
  pendingCount,
  reviewLink = 'Review',
  onReview,
  defaultExpanded = false,
  dataSource,
  onRefresh,
  dataRows = [],
  summary = {},
  onAdd,
  addLabel = 'Add another item',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.complete;
  const StatusIcon = statusConfig.icon;

  // Format amount with Indian number formatting
  const formatAmount = (value) => {
    if (!value) return '₹0';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[₹,\s]/g, '')) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      className={cn(
        'bg-white rounded-xl border border-neutral-300 p-6',
        'transition-all duration-300 ease-smooth',
        'hover:border-gold-300 hover:shadow-elevation-2',
        'hover:-translate-y-0.5',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={transitions.cardExpand}
      style={{
        boxShadow: 'var(--shadow-elevation-1)',
      }}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-amber-500 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Title - H3, Inter 600 - newUI.md Section 10.1.1 */}
            <h3 className="text-heading-3 font-semibold text-neutral-900 mb-1">{title}</h3>
            
            {/* Amount - 20px, Inter 600, tabular-nums - newUI.md Section 10.1.1 */}
            <div className="text-amount font-semibold text-neutral-900 tabular-nums mb-1">
              {formatAmount(amount)}
            </div>
            
            {/* Meta text - Body Small, Gray-500 - newUI.md Section 10.1.1 */}
            {meta && (
              <p className="text-body-small text-neutral-500">{meta}</p>
            )}
            
            {/* Secondary info */}
            {secondaryInfo && (
              <p className="text-body-small text-neutral-500 mt-1">{secondaryInfo}</p>
            )}
          </div>
        </div>

        {/* Status Badge & Expand Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status Badge - newUI.md Section 10.1.1 */}
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium',
            statusConfig.bg,
            statusConfig.color
          )}>
            <StatusIcon
              className="w-4 h-4"
              style={{ color: statusConfig.iconColor }}
            />
            <span>
              {status === 'incomplete' && pendingCount ? `${pendingCount} items pending` : statusConfig.label}
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpand}
            className="p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
            aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600" />
            )}
          </button>
        </div>
      </div>

      {/* Review CTA Link - newUI.md Section 10.1.1 */}
      {!isExpanded && onReview && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onReview}
            className="inline-flex items-center gap-1.5 text-body-regular font-medium text-gold-700 hover:text-gold-900 transition-colors"
          >
            {reviewLink}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expanded Content - newUI.md Section 10.1.2 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1], // ease-smooth
              opacity: { delay: 0.1 }, // 100ms delay per newUI.md Section 9.3.1
            }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-neutral-200">
              {/* Data Source Banner - newUI.md Section 10.1.2 */}
              {dataSource && (
                <div className="mb-6 p-3 rounded-xl bg-info-light border border-info-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-info-base" />
                    <span className="text-body-regular text-info-base">
                      Data Source: {dataSource}
                    </span>
                  </div>
                  {onRefresh && (
                    <button
                      onClick={onRefresh}
                      className="inline-flex items-center gap-1.5 text-body-sm font-medium text-info-base hover:text-info-dark transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh from AIS
                    </button>
                  )}
                </div>
              )}

              {/* Data Rows */}
              {dataRows.length > 0 && (
                <div className="space-y-4 mb-6">
                  {dataRows.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      {/* Section Header - H4, Inter 600 - newUI.md Section 10.1.2 */}
                      {section.title && (
                        <h4 className="text-heading-4 font-semibold text-neutral-900 mb-3">
                          {section.title}
                        </h4>
                      )}

                      {/* Data Table - newUI.md Section 10.1.2 */}
                      <div className="bg-neutral-50 rounded-xl overflow-hidden">
                        <div className="divide-y divide-neutral-200">
                          {section.rows.map((row, rowIndex) => (
                            <div
                              key={rowIndex}
                              className={cn(
                                'flex items-center justify-between px-4 py-3',
                                rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'
                              )}
                            >
                              <div className="flex-1">
                                <div className="text-body-regular font-medium text-neutral-900">
                                  {row.label}
                                </div>
                                {row.source && (
                                  <div className="text-body-small text-neutral-500 mt-0.5">
                                    {row.source}
                                  </div>
                                )}
                              </div>
                              <div className="text-body-regular font-semibold text-neutral-900 tabular-nums">
                                {formatAmount(row.value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Action Link - newUI.md Section 10.1.2 */}
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="inline-flex items-center gap-2 text-body-regular font-medium text-gold-700 hover:text-gold-900 transition-colors mb-6"
                >
                  <Plus className="w-4 h-4" />
                  {addLabel}
                </button>
              )}

              {/* Summary Section - newUI.md Section 10.1.2 */}
              {Object.keys(summary).length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <h4 className="text-heading-4 font-semibold text-neutral-900 mb-4">SUMMARY</h4>
                  <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                    {Object.entries(summary).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-body-regular text-neutral-700">{key}</span>
                        <div className="flex items-center gap-2">
                          {value.locked && (
                            <span className="text-body-regular" title="Auto-calculated">🔒</span>
                          )}
                          <span className="text-body-regular font-semibold text-neutral-900 tabular-nums">
                            {formatAmount(value.amount || value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IncomeCard;
