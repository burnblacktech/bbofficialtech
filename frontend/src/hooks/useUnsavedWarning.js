import { useEffect } from 'react';

/**
 * useUnsavedWarning — Warns user about unsaved changes on browser tab close / refresh.
 *
 * Note: In-app navigation blocking (useBlocker) requires createBrowserRouter (data router).
 * Since we use <BrowserRouter>, we only handle beforeunload for now.
 * Auto-save on editor unmount handles the section-switching case.
 *
 * @param {boolean} shouldWarn - Whether there are unsaved changes
 */
export default function useUnsavedWarning(shouldWarn = false) {
  useEffect(() => {
    if (!shouldWarn) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldWarn]);
}
