/**
 * FilingBrowser — Paginated, filterable table of ALL filings on the platform.
 * Supports search (PAN/email), dropdown filters, include-deleted toggle,
 * CSV export, and row click → detail navigation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

const AY_OPTIONS = ['', '2024-25', '2025-26', '2026-27'];
const ITR_OPTIONS = ['', 'ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
const STATE_OPTIONS = [
  '', 'draft', 'review_pending', 'reviewed', 'approved_by_ca',
  'submitted_to_eri', 'eri_in_progress', 'eri_success', 'eri_failed',
];
const PAYMENT_OPTIONS = ['', 'paid', 'unpaid', 'free'];

/* eslint-disable camelcase */
const STATE_TONES = {
  draft: 'default', review_pending: 'warning', reviewed: 'info',
  approved_by_ca: 'info', submitted_to_eri: 'info', eri_in_progress: 'warning',
  eri_success: 'success', eri_failed: 'error',
};
/* eslint-enable camelcase */

const PAYMENT_TONES = { paid: 'success', unpaid: 'warning', free: 'default' };

export default function FilingBrowser() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    assessmentYear: '',
    itrType: '',
    lifecycleState: '',
    paymentStatus: '',
    includeDeleted: false,
  });
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters.search]);

  const queryParams = {
    page,
    limit: 25,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.assessmentYear && { assessmentYear: filters.assessmentYear }),
    ...(filters.itrType && { itrType: filters.itrType }),
    ...(filters.lifecycleState && { lifecycleState: filters.lifecycleState }),
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
    ...(filters.includeDeleted && { includeDeleted: true }),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-filing-browser', queryParams],
    queryFn: () => adminService.getFilingBrowser(queryParams).then((r) => r.data || r),
  });

  const filings = data?.filings || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const updateFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    if (key !== 'search') setPage(1);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportParams = { ...queryParams };
      delete exportParams.page;
      delete exportParams.limit;
      const res = await adminService.exportFilingBrowser(exportParams);
      const rows = res.data || res;
      if (!rows || rows.length === 0) {
        toast.error('No records to export');
        return;
      }
      const headers = [
        'Filing ID', 'User Name', 'User Email', 'Taxpayer PAN', 'Assessment Year',
        'ITR Type', 'Lifecycle State', 'Payment Status', 'Amount Paid (₹)', 'Created Date', 'Updated Date',
      ];
      const csvRows = rows.map((r) => [
        r.filingId, r.userName, r.userEmail, r.taxpayerPan, r.assessmentYear,
        r.itrType, r.lifecycleState, r.paymentStatus, r.amountPaid,
        r.createdDate ? new Date(r.createdDate).toLocaleDateString('en-IN') : '',
        r.updatedDate ? new Date(r.updatedDate).toLocaleDateString('en-IN') : '',
      ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filings-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} records`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const selectStyle = {
    padding: '6px 8px', borderRadius: 6, border: `1px solid ${P.borderMedium}`,
    fontSize: 12, background: P.bgCard, color: P.textPrimary, minHeight: 'auto',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Browse All Filings</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: 9, color: P.textMuted }} />
            <input
              style={{ ...selectStyle, paddingLeft: 24, width: 200 }}
              placeholder="Search PAN or email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <select style={selectStyle} value={filters.assessmentYear} onChange={(e) => updateFilter('assessmentYear', e.target.value)}>
            <option value="">All AY</option>
            {AY_OPTIONS.filter(Boolean).map((ay) => <option key={ay} value={ay}>AY {ay}</option>)}
          </select>
          <select style={selectStyle} value={filters.itrType} onChange={(e) => updateFilter('itrType', e.target.value)}>
            <option value="">All ITR Types</option>
            {ITR_OPTIONS.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={selectStyle} value={filters.lifecycleState} onChange={(e) => updateFilter('lifecycleState', e.target.value)}>
            <option value="">All States</option>
            {STATE_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={selectStyle} value={filters.paymentStatus} onChange={(e) => updateFilter('paymentStatus', e.target.value)}>
            <option value="">All Payment</option>
            {PAYMENT_OPTIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: P.textMuted, cursor: 'pointer' }}>
            <input type="checkbox" checked={filters.includeDeleted} onChange={(e) => updateFilter('includeDeleted', e.target.checked)} />
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
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Loader2 size={20} className="animate-spin" color={P.textMuted} />
          </div>
        ) : isError ? (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ color: P.error, fontSize: 13, marginBottom: 8 }}>Failed to load filings</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filings.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: P.textMuted, fontSize: 13 }}>
            No filings found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                  {['Filing ID', 'User Name', 'PAN', 'AY', 'ITR', 'State', 'Payment', 'Created'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: P.textMuted, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filings.map((f) => {
                  const isDeleted = !!f.deletedAt;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/admin/filing-browser/${f.id}`)}
                      style={{
                        borderBottom: `1px solid ${P.borderLight}`,
                        cursor: 'pointer',
                        opacity: isDeleted ? 0.5 : 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = P.bgMuted; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {f.id?.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '8px 12px', maxWidth: 160 }}>
                        {f.creator?.fullName || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {f.taxpayerPan || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>{f.assessmentYear}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>{f.itrType}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge tone={STATE_TONES[f.lifecycleState] || 'default'}>
                          {isDeleted ? `${f.lifecycleState} (deleted)` : f.lifecycleState}
                        </Badge>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge tone={PAYMENT_TONES[f.paymentStatus] || 'default'}>
                          {f.paymentStatus}
                          {f.paymentStatus === 'paid' && f.paymentAmount && (
                            <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)' }}>
                              ₹{(f.paymentAmount / 100).toLocaleString('en-IN')}
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: P.textMuted, whiteSpace: 'nowrap' }}>
                        {new Date(f.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
