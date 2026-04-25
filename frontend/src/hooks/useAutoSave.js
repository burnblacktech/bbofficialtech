import { useRef, useCallback, useEffect } from 'react';

/**
 * useAutoSave — Debounced auto-save hook for filing editors.
 *
 * - Call `markDirty()` on every field change (user-initiated only)
 * - Auto-saves after `delay` ms of inactivity
 * - Does NOT save on mount or component init — only after real user interaction
 * - Flushes pending save on unmount (fire-and-forget)
 */
export default function useAutoSave(onSave, buildPayload, delay = 1500) {
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const interactedRef = useRef(false);
  const buildPayloadRef = useRef(buildPayload);
  const onSaveRef = useRef(onSave);

  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const doSave = useCallback(() => {
    // Only save if user has actually interacted AND data is dirty
    if (!dirtyRef.current || savingRef.current || !interactedRef.current) return;
    const payload = buildPayloadRef.current?.();
    if (!payload) return;
    savingRef.current = true;
    dirtyRef.current = false;
    try {
      const result = onSaveRef.current(payload);
      if (result && typeof result.then === 'function') {
        result
          .catch(() => { dirtyRef.current = true; })
          .finally(() => { savingRef.current = false; });
      } else {
        savingRef.current = false;
      }
    } catch {
      dirtyRef.current = true;
      savingRef.current = false;
    }
  }, []);

  const markDirty = useCallback(() => {
    interactedRef.current = true;
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
  }, [doSave, delay]);

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current && interactedRef.current) {
        doSave();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { markDirty, flushNow, isDirtyRef: dirtyRef };
}
