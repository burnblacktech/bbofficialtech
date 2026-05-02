/**
 * AdminUsers — User list with debounced search, role/status filters, and paginated table.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, Badge, Button } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

const ROLE_TONES = { SUPER_ADMIN: 'error', CA: 'warning', PREPARER: 'info', END_USER: 'default' };
const DEBOUNCE_MS = 400;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch users
  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: 20 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (role) params.role = role;
        if (status) params.status = status;
        const res = await adminService.getUsers(params);
        if (!cancelled) setData(res.data || res);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, [debouncedSearch, role, status, page]);

  const retry = () => {
    setError(null);
    setPage(1);
    setDebouncedSearch(search);
  };

  // Error state
  if (error && !data) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Users</h1>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: P.error, marginBottom: 12 }}>{error}</div>
          <Button variant="outline" onClick={retry}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Users</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: P.textLight }} />
          <input
            className="ds-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, PAN, or name..."
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select
          className="ds-select"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          style={{ width: 140 }}
        >
          <option value="">All Roles</option>
          <option value="END_USER">End User</option>
          <option value="CA">CA</option>
          <option value="PREPARER">Preparer</option>
          <option value="SUPER_ADMIN">Admin</option>
        </select>
        <select
          className="ds-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{ width: 130 }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Loader2 size={20} className="animate-spin" color={P.textMuted} />
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                    {['Name', 'Email', 'PAN', 'Role', 'Status', 'Last Active', 'Created'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: P.textMuted,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.users || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, textAlign: 'center', color: P.textMuted }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    (data?.users || []).map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        style={{ borderBottom: `1px solid ${P.borderLight}`, cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = P.bgCardHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.fullName || '—'}</td>
                        <td style={{ padding: '10px 12px', color: P.textMuted }}>{u.email}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {u.panNumber || '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge tone={ROLE_TONES[u.role] || 'default'}>{u.role}</Badge>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge>
                        </td>
                        <td style={{ padding: '10px 12px', color: P.textLight, fontSize: 11, whiteSpace: 'nowrap' }}>
                          {formatLastActive(u.lastActive)}
                        </td>
                        <td style={{ padding: '10px 12px', color: P.textLight, fontSize: 11, whiteSpace: 'nowrap' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data?.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderTop: `1px solid ${P.borderLight}`,
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={pgBtn}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12, color: P.textMuted }}>
                  Page {page} of {data.totalPages} ({data.total} users)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  style={pgBtn}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ── Helpers ──

function formatLastActive(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN');
}

const pgBtn = {
  background: 'none',
  border: `1px solid ${P.borderMedium}`,
  borderRadius: 6,
  padding: '4px 8px',
  cursor: 'pointer',
  minHeight: 'auto',
  minWidth: 'auto',
};
