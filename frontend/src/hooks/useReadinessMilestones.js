/**
 * useReadinessMilestones — Tracks readiness score milestones (25/50/75/100%)
 * and fires celebrations once per FY.
 *
 * 25%: toast notification
 * 50%/75%: sparkle animation on ProgressRing (via callback)
 * 100%: confetti burst
 */

import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const MILESTONES = [25, 50, 75, 100];
const STORAGE_KEY = 'bb-milestones-fired';

function getFiredMilestones(fy) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data[fy] || [];
  } catch {
    return [];
  }
}

function setFiredMilestone(fy, milestone) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[fy]) data[fy] = [];
    if (!data[fy].includes(milestone)) data[fy].push(milestone);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

async function fireConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#0D9488', '#7C3AED', '#F59E0B'],
    });
  } catch {
    // canvas-confetti not available, skip
  }
}

export default function useReadinessMilestones(percentage, fy, onSparkle) {
  const prevPercentage = useRef(null);

  const checkMilestones = useCallback(() => {
    if (percentage == null || !fy) return;
    if (prevPercentage.current === percentage) return;
    prevPercentage.current = percentage;

    const fired = getFiredMilestones(fy);

    for (const milestone of MILESTONES) {
      if (percentage >= milestone && !fired.includes(milestone)) {
        setFiredMilestone(fy, milestone);

        if (milestone === 25) {
          toast.success('25% ready! Great start on your financial data.', { icon: '🎯' });
        } else if (milestone === 50) {
          toast.success('Halfway there! 50% filing readiness.', { icon: '✨' });
          onSparkle?.();
        } else if (milestone === 75) {
          toast.success('75% ready! Almost there.', { icon: '✨' });
          onSparkle?.();
        } else if (milestone === 100) {
          toast.success("You're all set! Filing should take just minutes.", { icon: '🎉' });
          fireConfetti();
        }
      }
    }
  }, [percentage, fy, onSparkle]);

  useEffect(() => {
    checkMilestones();
  }, [checkMilestones]);
}
