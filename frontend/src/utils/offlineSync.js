/**
 * offlineSync — Syncs queued entries when back online.
 * POSTs each queued entry, removes on success, retries up to 3 times.
 */

import { getQueue, removeFromQueue } from './offlineQueue';
import { createIncome } from '../services/financeService';
import { createExpense } from '../services/financeService';
import { createInvestment } from '../services/financeService';

const TYPE_TO_CREATE = {
  income: createIncome,
  expense: createExpense,
  investment: createInvestment,
};

const MAX_RETRIES = 3;

export async function syncQueuedEntries(queryClient) {
  const queue = getQueue();
  if (!queue.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    const createFn = TYPE_TO_CREATE[entry._type];
    if (!createFn) {
      removeFromQueue(entry._id);
      failed++;
      continue;
    }

    let success = false;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const { _queuedAt, _id, _type, ...data } = entry;
        await createFn(data);
        success = true;
        break;
      } catch {
        // Retry
      }
    }

    if (success) {
      removeFromQueue(entry._id);
      synced++;
    } else {
      failed++;
    }
  }

  // Invalidate caches after sync
  if (queryClient && synced > 0) {
    queryClient.invalidateQueries({ queryKey: ['income'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }

  return { synced, failed };
}
