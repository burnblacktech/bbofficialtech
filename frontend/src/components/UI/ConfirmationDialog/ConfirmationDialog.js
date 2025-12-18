// =====================================================
// CONFIRMATION DIALOG COMPONENT
// Confirmation dialogs for destructive actions
// Per UI.md specifications (Section 4.4, lines 7533-7566)
// =====================================================

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils';

/**
 * ConfirmationDialog Component
 * Generic confirmation dialog for destructive actions
 */
export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive', // 'destructive' | 'warning' | 'info'
  icon: Icon = AlertTriangle,
  className = '',
  ...props
}) => {
  const variantConfig = {
    destructive: {
      iconColor: 'text-error-600',
      iconBg: 'bg-error-100',
      confirmColor: 'bg-error-600 hover:bg-error-700',
      borderColor: 'border-error-200',
    },
    warning: {
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100',
      confirmColor: 'bg-warning-600 hover:bg-warning-700',
      borderColor: 'border-warning-200',
    },
    info: {
      iconColor: 'text-info-600',
      iconBg: 'bg-info-100',
      confirmColor: 'bg-info-600 hover:bg-info-700',
      borderColor: 'border-info-200',
    },
  };

  const config = variantConfig[variant] || variantConfig.destructive;

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
            onClick={onClose}
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
            aria-labelledby="confirmation-title"
            {...props}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-xl', config.iconBg)}>
                  <Icon className={cn('w-5 h-5', config.iconColor)} />
                </div>
                <div>
                  <h3
                    id="confirmation-title"
                    className="text-heading-md font-semibold text-slate-900"
                    style={{ fontSize: '18px', fontWeight: 600 }}
                  >
                    {title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {typeof message === 'string' ? (
                <p
                  className="text-body-md text-slate-700"
                  style={{ fontSize: '14px', lineHeight: '22px' }}
                >
                  {message}
                </p>
              ) : (
                message
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-body-sm font-medium text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-xl"
                style={{ fontSize: '13px' }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  'px-4 py-2 text-white rounded-xl text-body-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl',
                  config.confirmColor,
                )}
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * DeleteConfirmationDialog Component
 * Specialized dialog for delete actions
 */
export const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemDetails,
  className = '',
  ...props
}) => {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Income Source?"
      variant="destructive"
      icon={Trash2}
      confirmLabel="Delete"
      message={
        <div className="space-y-3">
          <p
            className="text-body-md text-slate-700"
            style={{ fontSize: '14px', lineHeight: '22px' }}
          >
            You are about to delete:
          </p>
          <div className="bg-slate-50 rounded-xl p-3">
            <p
              className="text-body-md font-semibold text-slate-900"
              style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px' }}
            >
              {itemName}
            </p>
            {itemDetails && (
              <p
                className="text-body-sm text-slate-600 mt-1"
                style={{ fontSize: '13px', lineHeight: '20px' }}
              >
                {itemDetails}
              </p>
            )}
          </div>
          <p
            className="text-body-sm text-slate-600"
            style={{ fontSize: '13px', lineHeight: '20px' }}
          >
            This will affect your tax calculation. This action cannot be undone.
          </p>
        </div>
      }
      className={className}
      {...props}
    />
  );
};

export default ConfirmationDialog;

