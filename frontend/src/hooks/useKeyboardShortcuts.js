/**
 * useKeyboardShortcuts — Global keyboard shortcut handler.
 * Skips shortcuts when user is typing in input/textarea/contenteditable
 * (except modifier-based shortcuts like Cmd+K).
 */

import { useEffect, useCallback } from 'react';

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

/**
 * @param {Array<{ key: string, meta?: boolean, ctrl?: boolean, shift?: boolean, handler: Function }>} shortcuts
 */
export default function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback(
    (e) => {
      for (const shortcut of shortcuts) {
        const hasModifier = shortcut.meta || shortcut.ctrl || shortcut.shift;

        // Skip non-modifier shortcuts when typing in inputs
        if (!hasModifier && isInputFocused()) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : true;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
