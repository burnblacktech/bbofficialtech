import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TaxWhisper — Collapsible contextual tax guidance card.
 *
 * @param {string} tipId - Unique tip identifier
 * @param {import('lucide-react').LucideIcon} [icon] - Tip icon (default Lightbulb)
 * @param {string} title - Tip title
 * @param {string} message - Brief guidance (max 120 chars)
 * @param {{ title: string, body: string, section: string }} learnMore - Modal content
 * @param {(tipId: string) => void} onDismiss - Dismiss callback
 */
export default function TaxWhisper({ tipId, icon: Icon = Lightbulb, title, message, learnMore, onDismiss }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4">
              <Icon size={18} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
                {learnMore && (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="mt-2 text-xs font-medium text-[var(--brand-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  >
                    Learn More
                  </button>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  aria-label="Collapse tip"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(tipId)}
                  className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  aria-label="Dismiss tip"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state — small expand button */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs font-medium text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
        >
          <Icon size={14} />
          <span>Tax Tip</span>
          <ChevronDown size={12} />
        </button>
      )}

      {/* Learn More Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowModal(false)}
            />
            {/* Modal */}
            <motion.div
              className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
              role="dialog"
              aria-modal="true"
              aria-label={learnMore?.title}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">{learnMore?.title}</h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {learnMore?.body}
              </div>
              {learnMore?.section && (
                <div className="mt-3 inline-block rounded-[var(--radius-sm)] bg-[var(--bg-muted)] px-2 py-1 text-xs font-medium text-[var(--text-muted)]">
                  {learnMore.section}
                </div>
              )}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
