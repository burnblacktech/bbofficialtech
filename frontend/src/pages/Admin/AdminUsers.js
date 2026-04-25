/**
 * AdminUsers — User list with search, filters, and click-through to detail
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge, Input } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

const ROLE_TONES = { SUPER_ADMIN: 'error', CA: 'warning', PREPARER: 'info', END_USER: 'default' };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, status, page],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      return (await api.get('/admin/users', { params })).data.data;
    },
    keepPreviousData: true,
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Users</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: P.textLight }} />
          <input className="ds-input" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email, PAN, or name..." style={{ paddingLeft: 34 }} />
        </div>
        <select className="ds-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All Roles</option>
          <option value="END_USER">End User</option>
          <option value="CA">CA</option>
          <option value="SUPER_ADMIN">Admin</option>
        </select>
        <select className="ds-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" color={P.textMuted} /></div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                  {['Name', 'Email', 'PAN', 'Role', 'Status', 'Created'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: P.textMuted, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.users || []).map(u => (
                  <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}
                    style={{ borderBottom: `1px solid ${P.borderLight}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = P.bgCardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.fullName || '—'}</td>
                    <td style={{ padding: '10px 12px', color: P.textMuted }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.panNumber || '—'}</td>
                    <td style={{ padding: '10px 12px' }}><Badge tone={ROLE_TONES[u.role] || 'default'}>{u.role}</Badge></td>
                    <td style={{ padding: '10px 12px' }}><Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge></td>
                    <td style={{ padding: '10px 12px', color: P.textLight, fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 12, alignItems: 'center', borderTop: `1px solid ${P.borderLight}` }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pgBtn}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: 12, color: P.textMuted }}>Page {page} of {data.totalPages} ({data.total} users)</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} style={pgBtn}><ChevronRight size={14} /></button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

const pgBtn = { background: 'none', border: `1px solid ${P.borderMedium}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', minHeight: 'auto', minWidth: 'auto' };
