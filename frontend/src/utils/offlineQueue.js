/**
 * offlineQueue — Queue tracker entries locally when offline.
 * Uses localStorage key 'bb-offline-queue'.
 */

const STORAGE_KEY = 'bb-offline-queue';

export function getQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueEntry(entry) {
  const queue = getQueue();
  queue.push({
    ...entry,
    _queuedAt: new Date().toISOString(),
    _id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return queue;
}

export function removeFromQueue(queueId) {
  const queue = getQueue().filter((e) => e._id !== queueId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return queue;
}

export function getQueuedCount() {
  return getQueue().length;
}

export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}
