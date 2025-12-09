// =====================================================
// CONTEXTUAL HELP PANEL COMPONENT
// Slide-out panel for detailed help
// Per UI.md specifications (lines 7950-7984)
// =====================================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * ContextualHelpPanel Component
 * Slide-out panel for detailed help content
 */
export const ContextualHelpPanel = ({
  isOpen,
  onClose,
  title,
  content,
  downloadLink,
  children,
  className = '',
}) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: isMobile ? 0 : 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? 0 : 320, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'fixed z-50 bg-white shadow-xl',
              isMobile
                ? 'bottom-0 left-0 right-0 top-0 rounded-t-2xl'
                : 'top-0 right-0 bottom-0 w-80',
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-panel-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2
                id="help-panel-title"
                className="text-heading-md font-semibold text-gray-900"
                style={{ fontSize: '18px', fontWeight: 600 }}
              >
                {title || 'Help'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Close help panel"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {content && (
                <div
                  className="text-body-md text-gray-700 space-y-4"
                  style={{ fontSize: '14px', lineHeight: '22px' }}
                >
                  {typeof content === 'string' ? (
                    <p>{content}</p>
                  ) : (
                    content
                  )}
                </div>
              )}

              {children}

              {/* Download Link */}
              {downloadLink && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <a
                    href={downloadLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-body-sm font-medium text-gold-500 hover:text-gold-600 transition-colors"
                    style={{ fontSize: '13px' }}
                  >
                    <span>📄</span>
                    <span>{downloadLink.label || 'Download Guide'}</span>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * HelpLink Component
 * Link that opens the contextual help panel
 * Usage: <HelpLink onClick={() => setHelpOpen(true)}>[? Help]</HelpLink>
 */
export const HelpLink = ({
  onClick,
  children = '[? Help]',
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-body-sm text-gray-500 hover:text-gray-700 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-1 rounded',
        className,
      )}
      style={{ fontSize: '13px' }}
      {...props}
    >
      {children}
    </button>
  );
};

export default ContextualHelpPanel;

