// =====================================================
// AI SUGGESTION CARD COMPONENT
// AI-powered inline suggestions
// Per UI.md specifications (lines 7987-8027)
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * AISuggestionCard Component
 * Displays AI-powered tax optimization suggestions
 */
export const AISuggestionCard = ({
  title = 'Tip from BurnBlack',
  message,
  valueProposition,
  explanation,
  factors = [],
  actionLabel,
  onAction,
  onDismiss,
  isRecommended = false,
  currentSelection,
  comparisonLink,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card p-4',
        'space-y-3',
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
          <h3
            className={cn('text-heading-sm font-semibold', {
              'text-gold-600': !isRecommended,
              'text-slate-900': isRecommended,
            })}
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            {isRecommended ? '✨ BurnBlack Recommendation' : title}
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Dismiss suggestion"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Value Proposition */}
      {valueProposition && (
        <p
          className="text-body-md font-semibold text-slate-900"
          style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px' }}
        >
          {valueProposition}
        </p>
      )}

      {/* Message */}
      {message && (
        <p
          className="text-body-md text-slate-600"
          style={{ fontSize: '14px', lineHeight: '22px' }}
        >
          {message}
        </p>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="space-y-2">
          <p
            className="text-body-sm font-medium text-slate-700"
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            Why?
          </p>
          <p
            className="text-body-sm text-slate-600"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            {explanation}
          </p>
        </div>
      )}

      {/* Factors List */}
      {factors.length > 0 && (
        <ul className="space-y-1">
          {factors.map((factor, index) => (
            <li
              key={index}
              className="text-body-sm text-slate-600 flex items-start gap-2"
              style={{ fontSize: '13px', lineHeight: '20px' }}
            >
              <span className="text-slate-400 mt-1">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Current Selection Confirmation */}
      {isRecommended && currentSelection && (
        <div className="flex items-center gap-2 text-body-sm text-success-600">
          <CheckCircle className="w-4 h-4" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{currentSelection}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-gold-500 text-white rounded-xl font-semibold hover:bg-gold-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            {actionLabel}
          </button>
        )}
        {comparisonLink && (
          <button
            onClick={comparisonLink.onClick}
            className="px-4 py-2 text-body-sm font-medium text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-xl"
            style={{ fontSize: '13px' }}
          >
            {comparisonLink.label || 'See Comparison'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AISuggestionCard;

