/**
 * useChartColors — Reads CSS custom properties for Recharts colors.
 * Recomputes when the resolved theme changes so charts update on toggle.
 */

import { useMemo } from 'react';
import useThemeStore from '../store/useThemeStore';

function getCSSVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export default function useChartColors() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  return useMemo(() => ({
    income: getCSSVar('--chart-income', '#D4AF37'),
    expense: getCSSVar('--chart-expense', '#1A1A1A'),
    unfilled: getCSSVar('--chart-unfilled', '#E8E8E4'),
    grid: getCSSVar('--chart-grid', '#F3F3F0'),
    section80C: getCSSVar('--color-80c', '#D4AF37'),
    section80CCD: getCSSVar('--color-80ccd', '#0D9488'),
    textLight: getCSSVar('--text-light', '#999999'),
    bgCard: getCSSVar('--bg-card', '#ffffff'),
    borderLight: getCSSVar('--border-light', '#E8E8E4'),
    textPrimary: getCSSVar('--text-primary', '#111111'),
    textMuted: getCSSVar('--text-muted', '#666666'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [resolvedTheme]);
}
