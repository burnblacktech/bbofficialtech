import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * useUnsavedWarning — Warns user about unsaved changes on:
 *   1. Browser tab close / refresh (beforeunload)
 *   2. In-app navigation via react-router (useBlocker)
 *
 * Returns setDirty(bool) to control when warnings are active.
 */
export default function useUnsavedWarning(shouldWarn = false) {
  // Browser beforeunload — covers tab close, refresh, external navigation
  useEffect(() => {
    if (!shouldWarn) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldWarn]);

  // React Router in-app navigation blocker
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        shouldWarn && currentLocation.pathname !== nextLocation.pathname,
      [shouldWarn],
    ),
  );

  return blocker;
}
