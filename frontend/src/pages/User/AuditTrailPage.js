/**
 * AuditTrailPage — Activity log with type filtering and pagination
 * Events in reverse chronological order, color-coded type badges,
 * filter by type category, 20 items per page with prev/next controls
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Page, Card, Badge } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'auth', label: 'Auth' },
  { value: 'filing', label: 'Filing' },
  { value: 'documents', label: 'Documents' },
  { value: 'account', label: 'Account' },
];

const TYPE_TO_CATEGORY = {
  AUTH_LOGIN_SUCCESS: 'auth',
  AUTH_LOGIN_FAILED: 'auth',
  AUTH_REGISTER: 'auth',
  AUTH_LOGOUT: 'auth',
  AUTH_PASSWORD_CHANGED: 'auth',
  FILING_CREATED: 'filing',
  FILING_SUBMITTED: 'filing',
  FILING_DELETED: 'filing',
  FILING_UPDATED: 'filing',
  DOCUMENT_IMPORTED: 'documents',
  DOCUMENT_UPLOADED: 'documents',
  DOCUMENT_DELETED: 'documents',
  PAN_VERIFIED: 'auth',
  DATA_EXPORT_REQUESTED: 'account',
  ACCOUNT_DELETION_REQUESTED: 'account',
  ACCOUNT_DELETION_CANCELLED: 'account',
  PROFILE_UPDATED: 'account',
  SESSION_REVOKED: 'auth',
};

const TONE_MAP = {
  AUTH_LOGIN_SUCCESS: 'info',
  AUTH_REGISTER: 'success',
  FILING_CREATED: 'brand',
  FILING_SUBMITTED: 'success',
  FILING_DELETED: 'error',
  DOCUMENT_IMPORTED: 'info',
  DOCUMENT_UPLOADED: 'info',
  PAN_VERIFIED: 'success',
  DATA_EXPORT_REQUESTED: 'warning',
  ACCOUNT_DELETION_REQUESTED: 'error',
  ACCOUNT_DELETION_CANCELLED: 'success',
};

function formatTypeBadge(type) {
  if (!type) return 'Event';
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 20);
}

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-trail', page],
    queryFn: async () => (await api.get(`/account/audit-trail?page=${page}&limit=20`)).data.data,
    keepPreviousData: true,
  });

  // Client-side filter by type category
  const filteredEvents = (data?.events || []).filter(event => {
    if (!typeFilter) return true;
    const category = TYPE_TO_CATEGORY[event.type] || 'account';
    return category === typeFilter;
  });

  return (
    <Page title="Activity Log" subtitle="All actions on your account" maxWidth={640}>
      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color={P.textLight} />
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setTypeFilter(f.value); }}
            style={{
              padding: '4px 12px', fontSize: 12, fontWeight: typeFilter === f.value ? 600 : 500,
              color: typeFilter === f.value ? P.brand : P.textMuted,
              background: typeFilter === f.value ? P.brandLight : P.bgMuted,
              border: `1px solid ${typeFilter === f.value ? P.brand : P.borderLight}`,
              borderRadius: 16, cursor: 'pointer', transition: 'all 150ms', minHeight: 'auto',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Loader2 size={24} className="animate-spin" color={P.textMuted} />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card variant="muted" style={{ textAlign: 'center', padding: 16 }}>
          <Clock size={32} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: P.textMuted }}>No activity yet</div>
          <div style={{ fontSize: 12, color: P.textLight, marginTop: 4 }}>
            {typeFilter ? 'No events match this filter.' : 'Your account activity will appear here.'}
          </div>
        </Card>
      ) : (
        <>
          {filteredEvents.map(event => (
            <Card key={event.id} style={{ padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary }}>{event.description}</div>
                  <div style={{ fontSize: 11, color: P.textLight, marginTop: 2 }}>
                    {new Date(event.timestamp).toLocaleString('en-IN')}
                    {event.device && ` · ${event.device}`}
                  </div>
                </div>
                <Badge tone={TONE_MAP[event.type] || 'default'}>
                  {formatTypeBadge(event.type)}
                </Badge>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: `1px solid ${P.borderMedium}`, borderRadius: 6,
                  padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1, fontSize: 12, color: P.textMuted, minHeight: 'auto',
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 13, color: P.textMuted }}>
                Page {page} of {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                disabled={page >= data.pagination.pages}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: `1px solid ${P.borderMedium}`, borderRadius: 6,
                  padding: '6px 12px', cursor: page >= data.pagination.pages ? 'not-allowed' : 'pointer',
                  opacity: page >= data.pagination.pages ? 0.4 : 1, fontSize: 12, color: P.textMuted, minHeight: 'auto',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
