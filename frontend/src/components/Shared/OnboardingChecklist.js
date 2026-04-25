import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, X, Sparkles } from 'lucide-react';
import useOnboardingStore from '../../store/useOnboardingStore';

const STEPS = [
  {
    key: 'pan_verified',
    label: 'Verify your PAN',
    description: 'Link and verify your PAN to unlock filing',
    actionLabel: 'Verify PAN',
    actionPath: '/itr/pan-verification',
  },
  {
    key: 'income_logged',
    label: 'Log your first income',
    description: 'Add a salary credit or freelance payment',
    actionLabel: 'Log Income',
    actionPath: '/finance/income',
  },
  {
    key: 'document_uploaded',
    label: 'Upload a document',
    description: 'Add Form 16, rent receipts, or investment proofs',
    actionLabel: 'Upload Document',
    actionPath: '/vault',
  },
  {
    key: 'filing_started',
    label: 'Start a filing',
    description: 'Begin your first ITR filing',
    actionLabel: 'Start Filing',
    actionPath: '/filing/start',
  },
];

/**
 * OnboardingChecklist — 4-step progressive onboarding overlay.
 *
 * Reads step completion from useOnboardingStore.
 * Persists state via backend user profile metadata.onboarding.
 *
 * @param {() => void} onDismiss - Dismiss callback (stores timestamp)
 * @param {(path: string) => void} onStepClick - Navigate to step's action path
 */
export default function OnboardingChecklist({ onDismiss, onStepClick }) {
  const { steps } = useOnboardingStore();

  const completedCount = STEPS.filter((s) => steps[s.key]).length;
  const allComplete = completedCount === STEPS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--brand-primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Get Started</h3>
          <span className="text-xs text-[var(--text-muted)]">
            {completedCount}/{STEPS.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
          aria-label="Dismiss checklist"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <motion.div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* All complete message */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] p-3 text-center text-sm font-medium text-[var(--color-success)]"
          >
            You're all set up! BurnBlack is ready to work for you. 🎉
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const isComplete = steps[step.key];
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-[var(--radius-md)] p-3 transition-colors ${
                isComplete ? 'bg-[var(--color-success-bg)]' : 'hover:bg-[var(--bg-muted)]'
              }`}
            >
              {/* Status icon */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isComplete
                    ? 'bg-[var(--color-success)] text-white'
                    : 'border-2 border-[var(--border-medium)]'
                }`}
              >
                {isComplete && <Check size={14} />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium ${
                    isComplete ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{step.description}</div>
              </div>

              {/* Action */}
              {!isComplete && (
                <button
                  type="button"
                  onClick={() => onStepClick(step.actionPath)}
                  className="flex shrink-0 items-center gap-1 rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  {step.actionLabel}
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
