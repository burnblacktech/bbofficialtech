import { useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * useAutoSave — Debounced auto-save hook for filing editors.
 *
 * Features (Task 10.1):
 * - 1-second idle debounce before triggering save
 * - Retry on network error: up to 2 retries with exponential backoff (1s, 3s)
 * - Persistent toast on final failure
 * - Queue changes while save is in-flight, merge into single update on completion
 * - Manual save (flushNow) cancels pending auto-save and sends latest accumulated changes
 * - Does NOT save on mount or component init — only after real user interaction
 * - Flushes pending save on unmount (fire-and-forget)
 */
export default function useAutoSave(onSave, buildPayload, delay = 1000) {
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const interactedRef = useRef(false);
  const buildPayloadRef = useRef(buildPayload);
  const onSaveRef = useRef(onSave);
  const queuedRef = useRef(null); // queued payload while save is in-flight
  const retryCountRef = useRef(0);

  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  /**
   * Deep merge two plain objects (for queuing).
   * Arrays: source replaces target. Primitives: source wins.
   */
  const mergePayloads = useCallback((target, source) => {
    if (!target) return source;
    if (!source) return target;
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
      ) {
        result[key] = mergePayloads(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }, []);

  /**
   * Check if an error is a network error (retry-eligible).
   */
  const isNetworkError = useCallback((err) => {
    if (!err) return false;
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
    if (err.message && /network|timeout|abort/i.test(err.message)) return true;
    // Don't retry on HTTP errors (4xx, 5xx) — only on actual network failures
    if (err.response) return false;
    return !err.response;
  }, []);

  /**
   * Execute save with retry logic.
   */
  const executeSave = useCallback(async (payload) => {
    const RETRY_DELAYS = [1000, 3000]; // exponential backoff: 1s, 3s
    let lastError = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const result = onSaveRef.current(payload);
        if (result && typeof result.then === 'function') {
          await result;
        }
        retryCountRef.current = 0;
        return true; // success
      } catch (err) {
        lastError = err;
        if (attempt < 2 && isNetworkError(err)) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }
        break; // non-retryable error or exhausted retries
      }
    }

    // All retries exhausted or non-retryable error
    retryCountRef.current = 0;
    if (isNetworkError(lastError)) {
      toast.error('Unsaved changes — check your connection', { duration: Infinity, id: 'autosave-fail' });
    }
    return false; // failure
  }, [isNetworkError]);

  const doSave = useCallback(async () => {
    // Only save if user has actually interacted AND data is dirty
    if (!dirtyRef.current || savingRef.current || !interactedRef.current) return;
    const payload = buildPayloadRef.current?.();
    if (!payload) return;

    savingRef.current = true;
    dirtyRef.current = false;

    // Merge any queued changes into the payload
    const finalPayload = queuedRef.current ? mergePayloads(payload, queuedRef.current) : payload;
    queuedRef.current = null;

    const success = await executeSave(finalPayload);

    if (!success) {
      // Re-mark dirty so next interaction triggers another attempt
      dirtyRef.current = true;
    }

    savingRef.current = false;

    // If changes were queued while we were saving, trigger another save
    if (queuedRef.current) {
      dirtyRef.current = true;
      // Schedule the queued save
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doSave, delay);
    }
  }, [executeSave, mergePayloads, delay]);

  const markDirty = useCallback(() => {
    interactedRef.current = true;

    if (savingRef.current) {
      // Save is in-flight — queue the current payload for later
      const payload = buildPayloadRef.current?.();
      if (payload) {
        queuedRef.current = queuedRef.current ? mergePayloads(queuedRef.current, payload) : payload;
      }
      return;
    }

    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
  }, [doSave, delay, mergePayloads]);

  const flushNow = useCallback(() => {
    // Manual save: cancel pending auto-save timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // If a save is in-flight, queue the latest and let it resolve
    if (savingRef.current) {
      const payload = buildPayloadRef.current?.();
      if (payload) {
        queuedRef.current = queuedRef.current ? mergePayloads(queuedRef.current, payload) : payload;
      }
      dirtyRef.current = true;
      return;
    }

    // Force dirty + immediate save with latest accumulated changes
    interactedRef.current = true;
    dirtyRef.current = true;
    doSave();
  }, [doSave, mergePayloads]);

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
