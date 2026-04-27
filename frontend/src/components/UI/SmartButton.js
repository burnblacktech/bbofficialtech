// =====================================================
// SMART BUTTON — Completeness-gated submit/download button
// Disabled with tooltip when filing is incomplete.
// Enabled with gold/outline style when complete.
// =====================================================

import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import '../../pages/Filing/filing-flow.css';

/**
 * SmartButton — Submit or download button gated by filing completeness.
 *
 * Props:
 *   label: string                — button text
 *   icon?: LucideIcon            — optional Lucide icon component
 *   onClick: () => void          — action when enabled and clicked
 *   completeness: { complete: boolean, missing: Array<{section, field, message}> }
 *   variant: 'submit' | 'download'
 *   isLoading?: boolean
 */
export default function SmartButton({
  label,
  icon: Icon,
  onClick,
  completeness,
  variant = 'submit',
  isLoading = false,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isComplete = completeness?.complete === true;
  const missingItems = completeness?.missing || [];

  const handleClick = useCallback(() => {
    if (isLoading) return;

    if (!isComplete) {
      const sections = [...new Set(missingItems.map((m) => m.section))];
      toast.error(
        `Complete all required sections before submitting: ${sections.slice(0, 3).join(', ')}${sections.length > 3 ? ` +${sections.length - 3} more` : ''}`,
        { duration: 4000 },
      );
      return;
    }

    onClick?.();
  }, [isComplete, isLoading, missingItems, onClick]);

  // Build tooltip text from first 3 missing items
  const tooltipText = missingItems.length > 0
    ? missingItems
        .slice(0, 3)
        .map((m) => `• ${m.message}`)
        .join('\n') +
      (missingItems.length > 3 ? `\n+${missingItems.length - 3} more items` : '')
    : '';

  const isSubmit = variant === 'submit';

  const buttonStyle = {
    opacity: isComplete ? 1 : 0.5,
    cursor: isComplete ? 'pointer' : 'not-allowed',
    background: isComplete && isSubmit ? 'var(--brand-primary)' : undefined,
    color: isComplete && isSubmit ? 'var(--brand-black, #0F0F0F)' : undefined,
    transition: 'opacity 200ms ease-in-out, background-color 200ms ease-in-out',
    position: 'relative',
  };

  const buttonClass = [
    'ff-btn',
    isSubmit ? 'ff-btn-primary' : 'ff-btn-outline',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => !isComplete && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        className={buttonClass}
        style={buttonStyle}
        onClick={handleClick}
        aria-disabled={!isComplete}
        aria-describedby={!isComplete ? 'smart-btn-tooltip' : undefined}
      >
        {isLoading ? (
          <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} />
        ) : Icon ? (
          <Icon size={16} />
        ) : null}
        {label}
      </button>

      {/* CSS tooltip — no library */}
      {showTooltip && !isComplete && tooltipText && (
        <div
          id="smart-btn-tooltip"
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-line',
            maxWidth: '280px',
            wordWrap: 'break-word',
            zIndex: 'var(--z-dropdown)',
            pointerEvents: 'none',
            lineHeight: 1.4,
          }}
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
}
