// =====================================================
// ANALYTICS EVENTS (Funnel / UX)
// Lightweight event emitter to backend /api/analytics/events
// =====================================================

import apiClient from '../services/core/APIClient';

const SESSION_ID_KEY = 'bb_session_id_v1';
const JOURNEY_ID_KEY = 'itr_journey_id_v1';
const JOURNEY_START_KEY = 'itr_journey_started_at_v1';

function uuidLike() {
  // Not cryptographic; sufficient for correlation in logs.
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = uuidLike();
    localStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return uuidLike();
  }
}

export function getJourneyId() {
  try {
    const existing = sessionStorage.getItem(JOURNEY_ID_KEY);
    if (existing) return existing;
    const id = uuidLike();
    sessionStorage.setItem(JOURNEY_ID_KEY, id);
    return id;
  } catch {
    return uuidLike();
  }
}

export function resetJourney() {
  try {
    sessionStorage.removeItem(JOURNEY_ID_KEY);
    sessionStorage.removeItem(JOURNEY_START_KEY);
  } catch {
    // ignore
  }
}

export function ensureJourneyStart() {
  try {
    const existing = sessionStorage.getItem(JOURNEY_START_KEY);
    if (existing) return parseInt(existing, 10);
    const now = Date.now();
    sessionStorage.setItem(JOURNEY_START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export function msSinceJourneyStart() {
  const start = ensureJourneyStart();
  return Math.max(0, Date.now() - start);
}

export async function trackEvent(name, properties = {}) {
  try {
    const payload = {
      name,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      journeyId: getJourneyId(),
      properties: {
        msSinceJourneyStart: msSinceJourneyStart(),
        page: window.location.pathname,
        ...properties,
      },
    };

    // Fire-and-forget; do not block UI flows
    // Silently ignore if analytics endpoint doesn't exist
    await apiClient.post('/analytics/events', payload, { timeout: 3000 }).catch(() => {
      // Analytics endpoint not implemented yet - silently ignore
    });
  } catch {
    // never throw from analytics
  }
}
