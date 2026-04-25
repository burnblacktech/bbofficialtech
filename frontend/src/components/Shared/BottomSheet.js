import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

/**
 * BottomSheet — Mobile bottom sheet / Desktop right slide-over panel.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {string} [title]
 * @param {React.ReactNode} children
 * @param {string} [maxHeight='80vh'] - Max height for mobile sheet
 * @param {boolean} [showHandle=true] - Show drag handle on mobile
 * @param {boolean} [closeOnBackdrop=true]
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '80vh',
  showHandle = true,
  closeOnBackdrop = true,
}) {
  const contentRef = useRef(null);
  const dragControls = useDragControls();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const focusable = contentRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [isOpen]);

  // Escape key dismisses
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleDragEnd = (_, info) => {
    // Dismiss if dragged down more than 30% of viewport height
    if (info.offset.y > window.innerHeight * 0.3) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {isMobile ? (
            /* ── Mobile: Bottom sheet ── */
            <motion.div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              aria-label={title || 'Panel'}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]"
              style={{ maxHeight }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {showHandle && (
                <div className="flex justify-center pt-3 pb-1">
                  <div className="h-1 w-10 rounded-full bg-[var(--border-medium)]" />
                </div>
              )}
              {title && (
                <div className="border-b border-[var(--border-light)] px-4 py-3">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
                </div>
              )}
              <div className="overflow-y-auto p-4" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
                {children}
              </div>
            </motion.div>
          ) : (
            /* ── Desktop: Right slide-over ── */
            <motion.div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              aria-label={title || 'Panel'}
              className="absolute right-0 top-0 bottom-0 w-[400px] border-l border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {title && (
                <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                    aria-label="Close panel"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="overflow-y-auto p-5" style={{ height: title ? 'calc(100% - 57px)' : '100%' }}>
                {children}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
