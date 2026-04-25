/**
 * useSequentialShortcut — G-then-X navigation shortcuts.
 * 1-second window for the second key press.
 * Routes: G→D (dashboard), G→I (income), G→E (expenses), G→V (vault), G→S (settings)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SEQUENCE_MAP = {
  d: '/dashboard',
  i: '/finance/income',
  e: '/finance/expenses',
  v: '/vault',
  s: '/settings',
};

const TIMEOUT_MS = 1000;

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

export default function useSequentialShortcut() {
  const navigate = useNavigate();
  const waitingForSecond = useRef(false);
  const timerRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();

      if (waitingForSecond.current) {
        clearTimeout(timerRef.current);
        waitingForSecond.current = false;

        const route = SEQUENCE_MAP[key];
        if (route) {
          e.preventDefault();
          navigate(route);
        }
        return;
      }

      if (key === 'g') {
        waitingForSecond.current = true;
        timerRef.current = setTimeout(() => {
          waitingForSecond.current = false;
        }, TIMEOUT_MS);
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [handleKeyDown]);
}
