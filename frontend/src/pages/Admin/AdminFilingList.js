/**
 * AdminFilingList — Paginated table of admin-created filings with filters
 * Requirements: 7.1, 7.2, 7.3, 7.4, 5.1
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';
import { useNavigate } from 'react-router-dom';

const AY_OPTIONS = ['', '2024-25', '2025-26', '2026-27'];
const ITR_OPTIONS = ['', 'ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
const STATE_OPTIONS = [
  '',
  'draft',
  'review_pending',
  'reviewed',
  'approved_by_ca',
  'submitted_to_eri',
  'eri_in_progress',
  'eri_success',
  'eri_failed',
];
const DELETABLE_STATES = ['draft', 'eri_failed'];

/* eslint-disable camelcase */
const STATE_TONES = {
  draft: 'default',
  review_pending: 'warning',
  reviewed: 'info',
  approved_by_ca: 'info',
  submitted_to_eri: 'info',
  eri_in_progress: 'warning',
  eri_success: 'success',
  eri_failed: 'error',
};
/* eslint-enable camelcase */

export default function AdminFilingList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    assessmentYear: '',
    itrType: '',
    lifecycleState: '',
    pan: '',
    includeDeleted: false,
  });
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const limit = 20;

  const queryParams = {
    page,
    limit,
    ...(filters.assessmentYear && { assessmentYear: filters.assessmentYear }),
    ...(filters.itrType && { itrType: filters.itrType }),
    ...(filters.lifecycleState && { lifecycleState: filters.lifecycleState }),
    ...(filters.pan && { pan: filters.pan.toUpperCase() }),
    ...(filters.includeDeleted && { includeDeleted: true }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-filing-mgmt', queryParams],
    queryFn: () => adminService.getAdminFilings(queryParams).then((r) => r.data || r),
  });

  const filings = data?.filings || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const deleteMut = useMutation({
    mutationFn: (filingId) => adminService.deleteAdminFiling(filingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-filing-mgmt'] });
      toast.success('Filing deleted');
      setConfirmDelete(null);
    },
    onError: (e) => {
      toast.error(e.response?.data?.error || 'Failed to delete');
      setConfirmDelete(null);
    },
  });

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const selectStyle = {
    padding: '6px 8px',
    borderRadius: 6,
    border: `1px solid ${P.borderMedium}`,
    fontSize: 12,
    background: P.bgCard,
    color: P.textPrimary,
    minHeight: 'auto',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Filing Management</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/admin/filing-mgmt/create')}>
          <Plus size={13} /> Create Filing
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select
            style={selectStyle}
            value={filters.assessmentYear}
            onChange={(e) => updateFilter('assessmentYear', e.target.value)}
          >
            <option value="">All AY</option>
            {AY_OPTIONS.filter(Boolean).map((ay) => (
              <option key={ay} value={ay}>AY {ay}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.itrType}
            onChange={(e) => updateFilter('itrType', e.target.value)}
          >
            <option value="">All ITR Types</option>
            {ITR_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.lifecycleState}
            onChange={(e) => updateFilter('lifecycleState', e.target.value)}
          >
            <option value="">All States</option>
            {STATE_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: 9, color: P.textMuted }} />
            <input
              style={{ ...selectStyle, paddingLeft: 24, width: 130 }}
              placeholder="PAN search"
              value={filters.pan}
              onChange={(e) => updateFilter('pan', e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: P.textMuted,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={filters.includeDeleted}
              onChange={(e) => updateFilter('includeDeleted', e.target.checked)}
            />
            Include deleted
          </label>

          <span style={{ fontSize: 11, color: P.textLight, marginLeft: 'auto' }}>
            {total} filing{total !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={20} className="animate-spin" color={P.textMuted} />
          </div>
        ) : filings.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: P.textMuted }}>
            No filings found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                {['User', 'PAN', 'AY', 'ITR', 'State', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: P.textMuted,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filings.map((f) => {
                const isDeleted = !!f.deletedAt;
                const canDelete = DELETABLE_STATES.includes(f.lifecycleState) && !isDeleted;
                const userName = f.User?.fullName || f.targetUserName || '—';
                const userPan = f.taxpayerPan || f.User?.panNumber || '—';
                return (
                  <tr
                    key={f.id}
                    style={{
                      borderBottom: `1px solid ${P.borderLight}`,
                      opacity: isDeleted ? 0.5 : 1,
                    }}
                  >
                    <td style={{ padding: '8px 12px', maxWidth: 160 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{userName}</div>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {userPan}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>{f.assessmentYear}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>{f.itrType}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge tone={STATE_TONES[f.lifecycleState] || 'default'}>
                        {isDeleted ? `${f.lifecycleState} (deleted)` : f.lifecycleState}
                      </Badge>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: P.textMuted }}>
                      {new Date(f.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(f)}
                          title="Delete filing"
                        >
                          <Trash2 size={13} color={P.error} />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span style={{ fontSize: 12, color: P.textMuted, lineHeight: '32px' }}>
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
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
          onClick={() => setConfirmDelete(null)}
        >
          <Card style={{ width: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Filing</div>
            <p style={{ fontSize: 13, color: P.textSecondary, marginBottom: 16 }}>
              Are you sure you want to delete this filing for{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {confirmDelete.taxpayerPan}
              </span>
              ? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                style={{ background: P.error, borderColor: P.error }}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
