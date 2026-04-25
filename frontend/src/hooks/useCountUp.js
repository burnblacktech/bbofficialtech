import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp — Animated count-up hook using requestAnimationFrame.
 *
 * Animates from 0 (or previous value) to targetValue over `duration` ms
 * with ease-out interpolation. Formats output with Indian number system.
 *
 * @param {number} targetValue - The target number to count up to
 * @param {number} [duration=600] - Animation duration in milliseconds
 * @returns {{ value: number, formatted: string }}
 */
export default function useCountUp(targetValue, duration = 600) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const diff = targetValue - startValue;

    if (diff === 0) return;

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * eased;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = targetValue;
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);

  const formatted = new Intl.NumberFormat('en-IN').format(displayValue);

  return { value: displayValue, formatted };
}
