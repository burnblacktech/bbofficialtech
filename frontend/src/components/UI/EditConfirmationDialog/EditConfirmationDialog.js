// =====================================================
// EDIT CONFIRMATION DIALOG COMPONENT
// Confirmation dialog when editing auto-filled values
// Per UI.md specifications (Section 4.2, lines 7258-7280)
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { formatIndianCurrency } from '../../../lib/format';

/**
 * EditConfirmationDialog Component
 * Shows warning when editing auto-filled values with reason capture
 */
export const EditConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  onRevert,
  originalValue,
  newValue,
  source,
  sourceDocument,
  fieldLabel,
  valueFormatter = (val) => val,
  className = '',
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  const handleRevert = () => {
    if (onRevert) {
      onRevert();
    }
    setReason('');
    onClose();
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-50"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed z-50 bg-white rounded-xl shadow-elevation-4 max-w-md w-full mx-4',
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-confirmation-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-warning-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h3
                    id="edit-confirmation-title"
                    className="text-heading-md font-semibold text-slate-900"
                    style={{ fontSize: '18px', fontWeight: 600 }}
                  >
                    You're editing an auto-filled value
                  </h3>
                  {fieldLabel && (
                    <p
                      className="text-body-sm text-slate-600 mt-1"
                      style={{ fontSize: '13px', lineHeight: '20px' }}
                    >
                      {fieldLabel}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Value Comparison */}
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p
                    className="text-body-sm text-slate-600 mb-1"
                    style={{ fontSize: '13px', lineHeight: '20px' }}
                  >
                    Original ({sourceDocument || source}):
                  </p>
                  <p
                    className="text-body-md font-semibold text-slate-900"
                    style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px' }}
                  >
                    {valueFormatter(originalValue)}
                  </p>
                </div>
                <div className="bg-gold-50 rounded-xl p-3 border border-gold-200">
                  <p
                    className="text-body-sm text-slate-600 mb-1"
                    style={{ fontSize: '13px', lineHeight: '20px' }}
                  >
                    Your value:
                  </p>
                  <p
                    className="text-body-md font-semibold text-gold-700"
                    style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px' }}
                  >
                    {valueFormatter(newValue)}
                  </p>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label
                  htmlFor="edit-reason"
                  className="block text-body-sm font-medium text-slate-700 mb-2"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  Reason for change (recommended):
                </label>
                <textarea
                  id="edit-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Corrected as per actual salary slip"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                  rows={3}
                  style={{ fontSize: '13px', lineHeight: '20px' }}
                />
                <p
                  className="text-body-xs text-slate-500 mt-1"
                  style={{ fontSize: '12px', lineHeight: '18px' }}
                >
                  This helps maintain an audit trail
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-body-sm font-medium text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-xl"
                style={{ fontSize: '13px' }}
              >
                Cancel
              </button>
              {onRevert && (
                <button
                  onClick={handleRevert}
                  className="px-4 py-2 text-body-sm font-medium text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-xl"
                  style={{ fontSize: '13px' }}
                >
                  Revert to Original
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-gold-500 text-white rounded-xl text-body-sm font-semibold hover:bg-gold-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Save My Value
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditConfirmationDialog;

