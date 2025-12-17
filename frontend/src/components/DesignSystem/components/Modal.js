// =====================================================
// MODAL COMPONENT
// Reusable modal component with design system integration
// =====================================================

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { trapFocus, getFocusableElements } from '../../../utils/accessibility';

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  preventClose = false,
  className = '',
  ariaLabel,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement;
      // Focus the modal when it opens
      const timer = setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          const focusableElements = getFocusableElements(modal);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            modal.focus();
          }
        }
      }, 100);

      // Trap focus within modal
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !preventClose) {
          onClose();
        } else if (e.key === 'Tab') {
          const modal = modalRef.current;
          if (modal) {
            const focusableElements = getFocusableElements(modal);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              // Shift + Tab
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              // Tab
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus to previously focused element
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose, preventClose]);

  const handleClose = () => {
    if (!preventClose) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !preventClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" // Dark overlay with blur - newUI.md
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                duration: 0.3,
                ease: [0.175, 0.885, 0.32, 1.275], // ease-spring - newUI.md Section 9.2
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-label={ariaLabel || (title ? undefined : 'Modal dialog')}
              tabIndex={-1}
              className={`
                relative w-full ${sizeClasses[size]} bg-white rounded-xl shadow-elevation-4
                ${className}
              `}
              {...props}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  {title && (
                    <h2 id={titleId} className="text-heading-2 font-semibold text-slate-900">{title}</h2>
                  )}
                  {showCloseButton && !preventClose && (
                    <button
                      onClick={handleClose}
                      aria-label="Close modal"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors duration-150 ease-smooth focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
