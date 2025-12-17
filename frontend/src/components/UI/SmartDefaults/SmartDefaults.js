// =====================================================
// SMART DEFAULTS COMPONENT
// Intelligent field suggestions and auto-complete
// Per UI.md specifications (Section 4.4, lines 7477-7498)
// =====================================================

import React, { useState, useEffect } from 'react';
import { Lightbulb, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

/**
 * SmartDefaultSuggestion Component
 * Shows intelligent default value suggestion
 */
export const SmartDefaultSuggestion = ({
  suggestion,
  reason,
  onAccept,
  onDismiss,
  className = '',
  ...props
}) => {
  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'bg-gold-50 border border-gold-200 rounded-xl p-3 flex items-start gap-3',
        className,
      )}
      {...props}
    >
      <Lightbulb className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p
          className="text-body-sm text-slate-700 mb-1"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {reason}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onAccept}
            className="px-3 py-1.5 bg-gold-500 text-white rounded-xl text-body-sm font-semibold hover:bg-gold-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 flex items-center gap-1"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            <Check className="w-3 h-3" />
            <span>Use {suggestion}</span>
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-body-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-xl"
              style={{ fontSize: '13px' }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * CorrectionSuggestion Component
 * Suggests corrections for invalid values
 */
export const CorrectionSuggestion = ({
  currentValue,
  suggestedValue,
  reason,
  onAccept,
  onDismiss,
  className = '',
  ...props
}) => {
  if (!suggestedValue) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'bg-warning-50 border border-warning-200 rounded-xl p-3',
        className,
      )}
      {...props}
    >
      <p
        className="text-body-sm text-warning-700 mb-2 flex items-center gap-1"
        style={{ fontSize: '13px', lineHeight: '20px' }}
      >
        <span>⚠</span>
        <span>{reason}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="px-3 py-1.5 bg-warning-500 text-white rounded-xl text-body-sm font-semibold hover:bg-warning-600 transition-colors focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          Yes, use {suggestedValue}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-body-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 rounded-xl"
            style={{ fontSize: '13px' }}
          >
            Keep my value
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * SmartDefaultHint Component
 * Shows hint about why a default was selected
 */
export const SmartDefaultHint = ({
  reason,
  className = '',
  ...props
}) => {
  if (!reason) return null;

  return (
    <p
      className={cn('text-body-sm text-slate-500 flex items-center gap-1', className)}
      style={{ fontSize: '13px', lineHeight: '20px' }}
      {...props}
    >
      <Lightbulb className="w-3 h-3" />
      <span>{reason}</span>
    </p>
  );
};

export default SmartDefaultSuggestion;

