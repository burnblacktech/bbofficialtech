/**
 * useStreakTracking — Computes streak from entry dates client-side.
 * Persists in localStorage under 'bb-streak-data'.
 */

import { useMemo } from 'react';

const STORAGE_KEY = 'bb-streak-data';

/**
 * Compute consecutive months with at least one entry.
 * @param {string[]} dates - Array of ISO date strings
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function computeStreak(dates) {
  if (!dates || dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Get unique months (YYYY-MM)
  const months = [...new Set(dates.map((d) => d.slice(0, 7)))].sort().reverse();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let streak = 0;
  let checkMonth = currentMonth;

  for (const month of months) {
    if (month === checkMonth) {
      streak++;
      // Move to previous month
      const [y, m] = checkMonth.split('-').map(Number);
      const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
      checkMonth = prev;
    } else if (month < checkMonth) {
      break;
    }
  }

  return { currentStreak: streak, longestStreak: Math.max(streak, 0) };
}

export default function useStreakTracking(entryDates) {
  return useMemo(() => computeStreak(entryDates), [entryDates]);
}
