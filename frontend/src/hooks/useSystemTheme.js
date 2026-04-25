/**
 * useSystemTheme — Detects system color scheme preference and syncs
 * the data-theme attribute on <html>. Handles preload → actual theme
 * transition to prevent FOUC.
 */

import { useEffect } from 'react';
import useThemeStore from '../store/useThemeStore';

export default function useSystemTheme() {
  const { theme, applyTheme, setTheme } = useThemeStore();

  // Apply theme on mount with FOUC prevention
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'preload');
    applyTheme();
    // Remove preload after first paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const resolved = useThemeStore.getState().resolvedTheme;
        document.documentElement.setAttribute('data-theme', resolved);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // Re-apply to pick up system change
      setTheme('system');
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, setTheme]);
}
