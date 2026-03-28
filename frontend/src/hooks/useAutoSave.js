import { useRef, useCallback, useEffect } from 'react';

/**
 * useAutoSave — Debounced auto-save hook for filing editors.
 *
 * Usage in an editor:
 *   const { markDirty, flushNow } = useAutoSave(onSave, buildPayload, delay);
 *
 * - Call `markDirty()` on every field change
 * - `buildPayload` is a function that returns the current save payload (or null to skip)
 * - Auto-saves after `delay` ms of inactivity
 * - `flushNow()` saves immediately (call on unmount or explicit save)
 *
 * The hook also exposes `isDirty` for UI indicators.
 */
export default function useAutoSave(onSave, buildPayload, delay = 1500) {
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const buildPayloadRef = useRef(buildPayload);
  const onSaveRef = useRef(onSave);

  // Keep refs current without re-creating callbacks
  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const doSave = useCallback(() => {
    if (!dirtyRef.current || savingRef.current) return;
    const payload = buildPayloadRef.current?.();
    if (!payload) return;
    savingRef.current = true;
    dirtyRef.current = false;
    try {
      const result = onSaveRef.current(payload);
      // Handle both sync and async onSave
      if (result && typeof result.then === 'function') {
        result
          .catch(() => { dirtyRef.current = true; }) // re-mark dirty on failure
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
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
  }, [doSave, delay]);

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  // Cleanup on unmount — flush pending save
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fire-and-forget save on unmount
      if (dirtyRef.current) {
        doSave();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { markDirty, flushNow, isDirtyRef: dirtyRef };
}
