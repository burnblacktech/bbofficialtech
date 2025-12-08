// =====================================================
// TOAST NOTIFICATION COMPONENT
// Ultra-Grade Modern UI Design System - newUI.md aligned
// Implements Toast notifications with enter/exit animations
// =====================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Toast variants configuration
const TOAST_VARIANTS = {
  success: {
    icon: CheckCircle,
    bg: 'bg-success-light',
    border: 'border-success-base',
    text: 'text-success-dark',
    iconColor: '#10B981', // Success-Base
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-error-light',
    border: 'border-error-base',
    text: 'text-error-dark',
    iconColor: '#EF4444', // Error-Base
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-light',
    border: 'border-warning-base',
    text: 'text-warning-dark',
    iconColor: '#D4AF37', // Gold-500 (Warning uses Gold per newUI.md)
  },
  info: {
    icon: Info,
    bg: 'bg-info-light',
    border: 'border-info-base',
    text: 'text-info-dark',
    iconColor: '#3B82F6', // Info-Base
  },
};

/**
 * Toast Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether toast is visible
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {string} props.variant - 'success' | 'error' | 'warning' | 'info'
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {number} props.duration - Auto-close duration in ms (default: 5000)
 * @param {boolean} props.closable - Whether to show close button
 * @param {string} props.position - 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 */
export const Toast = ({
  isOpen,
  onClose,
  variant = 'info',
  title,
  message,
  duration = 5000,
  closable = true,
  position = 'bottom-right',
  className = '',
}) => {
  const toastConfig = TOAST_VARIANTS[variant] || TOAST_VARIANTS.info;
  const IconComponent = toastConfig.icon;

  // Auto-close after duration
  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Enter animation - newUI.md Section 9.3.8 (200ms ease-smooth)
  const toastEnter = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1], // ease-smooth
      },
    },
  };

  // Exit animation - newUI.md Section 9.3.8 (200ms ease-in)
  const toastExit = {
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1], // ease-in
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            'fixed z-50',
            positionClasses[position],
            className
          )}
          {...toastEnter}
          {...toastExit}
        >
          <div
            className={cn(
              'min-w-[320px] max-w-[420px] p-4 rounded-xl border-2 shadow-elevation-3',
              'flex items-start gap-3',
              toastConfig.bg,
              toastConfig.border,
              'backdrop-blur-sm'
            )}
          >
            {/* Icon */}
            <IconComponent
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: toastConfig.iconColor }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={cn('text-body-regular font-semibold mb-1', toastConfig.text)}>
                  {title}
                </h4>
              )}
              {message && (
                <p className={cn('text-body-small', toastConfig.text)}>
                  {message}
                </p>
              )}
            </div>

            {/* Close Button */}
            {closable && (
              <button
                onClick={onClose}
                className={cn(
                  'p-1 rounded-lg hover:bg-black/5 transition-colors duration-150 flex-shrink-0',
                  toastConfig.text
                )}
                aria-label="Close toast"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Toast Container Component
 * Manages multiple toasts in a stack
 */
export const ToastContainer = ({ toasts = [], onClose, position = 'bottom-right' }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className={cn(
        'absolute flex flex-col gap-3',
        position.includes('right') ? 'right-4' : 'left-4',
        position.includes('top') ? 'top-4' : 'bottom-4',
      )}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            isOpen={true}
            onClose={() => onClose?.(toast.id)}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            closable={toast.closable}
            position={position}
          />
        ))}
      </div>
    </div>
  );
};

export default Toast;
