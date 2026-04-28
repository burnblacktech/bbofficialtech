/**
 * FilingDeleteButton — Reusable delete button for user-facing filing pages.
 * Only renders when lifecycleState is draft or eri_failed.
 * Requirements: 4.1, 4.2
 */

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Card, Button } from '../ds';
import newFilingService from '../../services/newFilingService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

const DELETABLE_STATES = ['draft', 'eri_failed'];

export default function FilingDeleteButton({ filingId, lifecycleState, onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () => newFilingService.deleteFiling(filingId),
    onSuccess: () => {
      toast.success('Filing deleted');
      setShowConfirm(false);
      onDeleted?.();
    },
    onError: (e) => {
      const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to delete filing';
      toast.error(msg);
      setShowConfirm(false);
    },
  });

  if (!DELETABLE_STATES.includes(lifecycleState)) return null;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} title="Delete filing">
        <Trash2 size={14} color={P.error} />
      </Button>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <Card style={{ width: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Filing</div>
            <p style={{ fontSize: 13, color: P.textSecondary, marginBottom: 16 }}>
              Are you sure you want to delete this filing? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
                style={{ background: P.error, borderColor: P.error }}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
