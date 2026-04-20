/**
 * AuditTrailPage — Shows all account activity
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Page, Card, Row, Badge } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

const TONE_MAP = {
  AUTH_LOGIN_SUCCESS: 'info',
  AUTH_REGISTER: 'success',
  FILING_CREATED: 'brand',
  FILING_SUBMITTED: 'success',
  FILING_DELETED: 'error',
  DOCUMENT_IMPORTED: 'info',
  PAN_VERIFIED: 'success',
  DATA_EXPORT_REQUESTED: 'warning',
  ACCOUNT_DELETION_REQUESTED: 'error',
  ACCOUNT_DELETION_CANCELLED: 'success',
};

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-trail', page],
    queryFn: async () => (await api.get(`/account/audit-trail?page=${page}&limit=20`)).data.data,
    keepPreviousData: true,
  });

  return (
    <Page title="Activity Log" subtitle="All actions on your account" maxWidth={640}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" color={P.textMuted} />
        </div>
      ) : (
        <>
          {(data?.events || []).map(event => (
            <Card key={event.id} style={{ padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={14} style={{ color: P.textLight }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary }}>{event.description}</div>
                    <div style={{ fontSize: 11, color: P.textLight, marginTop: 2 }}>
                      {new Date(event.timestamp).toLocaleString('en-IN')}
                      {event.device && ` · ${event.device}`}
                    </div>
                  </div>
                </div>
                <Badge tone={TONE_MAP[event.type] || 'default'}>
                  {event.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 20)}
                </Badge>
              </div>
            </Card>
          ))}

          {data?.pagination && data.pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ background: 'none', border: `1px solid ${P.borderMedium}`, borderRadius: 6, padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, minHeight: 'auto' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, color: P.textMuted }}>Page {page} of {data.pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages}
                style={{ background: 'none', border: `1px solid ${P.borderMedium}`, borderRadius: 6, padding: '6px 12px', cursor: page >= data.pagination.pages ? 'not-allowed' : 'pointer', opacity: page >= data.pagination.pages ? 0.4 : 1, minHeight: 'auto' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {(!data?.events || data.events.length === 0) && (
            <Card variant="muted" style={{ textAlign: 'center', padding: 32 }}>
              <Clock size={32} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, color: P.textMuted }}>No activity yet</div>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
