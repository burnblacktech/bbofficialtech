/**
 * useOfflineMutation — Wraps a React Query mutation to queue entries
 * when offline instead of POSTing. Shows toast feedback.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useNetworkStatus from './useNetworkStatus';
import { queueEntry, getQueuedCount } from '../utils/offlineQueue';

/**
 * @param {Object} opts
 * @param {string} opts.type - 'income' | 'expense' | 'investment'
 * @param {Function} opts.mutationFn - The API create function
 * @param {string[]} opts.invalidateKeys - Query keys to invalidate on success
 * @param {Function} [opts.onSuccess] - Callback on success
 */
export default function useOfflineMutation({ type, mutationFn, invalidateKeys = [], onSuccess }) {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!isOnline) {
        queueEntry({ ...data, _type: type });
        return { queued: true };
      }
      return mutationFn(data);
    },
    onSuccess: (result) => {
      if (result?.queued) {
        const count = getQueuedCount();
        toast.success(`Saved offline (${count} pending)`);
      } else {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        onSuccess?.(result);
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to save entry');
    },
  });

  return { ...mutation, isOnline };
}
