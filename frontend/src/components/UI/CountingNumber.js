// =====================================================
// COUNTING NUMBER — Animated numeric display with Indian locale formatting
// Uses requestAnimationFrame with ease-out cubic interpolation.
// =====================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Formats a number with Indian locale grouping and a prefix.
 * Exported for property-based testing.
 *
 * @param {number} value - The numeric value to format
 * @param {string} prefix - Prefix string (e.g., "₹")
 * @returns {string} Formatted string like "₹1,25,000"
 */
export function formatIndian(value, prefix = '₹') {
  const safeValue = Number(value) || 0;
  return `${prefix}${Math.round(safeValue).toLocaleString('en-IN')}`;
}

/**
 * CountingNumber — Animated number display with Indian locale formatting.
 *
 * Props:
 *   value: number        — target value to animate to
 *   duration?: number    — animation duration in ms (default: 600)
 *   prefix?: string      — prefix string (default: "₹")
 *   className?: string   — additional CSS classes
 *   zeroDisplay?: string — what to show when value is 0 and was 0 (default: "—")
 */
export default function CountingNumber({
  value,
  duration = 600,
  prefix = '₹',
  className = '',
  zeroDisplay = '—',
}) {
  const safeValue = Number(value) || 0;
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Track the current displayed value (for interrupting animations)
  const currentRef = useRef(0);
  // Track the RAF ID for cleanup
  const rafRef = useRef(null);
  // Track whether this is the first render
  const mountedRef = useRef(false);
  // Track previous target to detect 0→0
  const prevTargetRef = useRef(0);

  const [displayValue, setDisplayValue] = useState(reducedMotion ? safeValue : 0);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Reduced motion: render immediately, no animation
    if (reducedMotion) {
      cancelAnimation();
      currentRef.current = safeValue;
      setDisplayValue(safeValue);
      prevTargetRef.current = safeValue;
      mountedRef.current = true;
      return;
    }

    const startValue = currentRef.current;
    const diff = safeValue - startValue;

    // No change needed
    if (diff === 0 && mountedRef.current) {
      prevTargetRef.current = safeValue;
      return;
    }

    mountedRef.current = true;
    cancelAnimation();

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * eased;

      currentRef.current = current;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        currentRef.current = safeValue;
        setDisplayValue(safeValue);
        prevTargetRef.current = safeValue;
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return cancelAnimation;
  }, [safeValue, duration, reducedMotion, cancelAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);

  // Zero-to-zero: show zeroDisplay
  if (safeValue === 0 && prevTargetRef.current === 0 && mountedRef.current) {
    return (
      <span className={`font-mono ${className}`} style={{ fontFamily: 'var(--font-mono)' }}>
        {zeroDisplay}
      </span>
    );
  }

  return (
    <span className={`font-mono ${className}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {formatIndian(displayValue, prefix)}
    </span>
  );
}
