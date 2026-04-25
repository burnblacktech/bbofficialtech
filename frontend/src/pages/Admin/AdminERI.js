/**
 * AdminERI — ERI submission monitoring
 */

import { useQuery } from '@tanstack/react-query';
import { Wifi, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Card, Badge, Row, Divider } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

export default function AdminERI() {
  const { data } = useQuery({ queryKey: ['admin-eri'], queryFn: async () => (await api.get('/admin/eri')).data.data, refetchInterval: 30000 });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>ERI Monitor</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Success Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (data?.successRate || 0) >= 90 ? P.success : P.error }}>
            {data?.successRate ?? '—'}%
          </div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Pending Queue</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (data?.pendingCount || 0) > 10 ? P.warning : P.textPrimary }}>
            {data?.pendingCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Recent Failures</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (data?.recentFailures?.length || 0) > 0 ? P.error : P.success }}>
            {data?.recentFailures?.length ?? 0}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Error Code Frequency */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Error Code Frequency (30 days)</div>
          {(data?.errorCodeFrequency || []).length === 0 ? (
            <div style={{ fontSize: 13, color: P.textMuted, padding: '12px 0' }}>No errors in the last 30 days</div>
          ) : (data?.errorCodeFrequency || []).map((ec, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: P.error }}>{ec.error_code || 'UNKNOWN'}</span>
              <Badge tone="error">{ec.count}</Badge>
            </div>
          ))}
        </Card>

        {/* Recent Failures */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Failures</div>
          {(data?.recentFailures || []).length === 0 ? (
            <div style={{ fontSize: 13, color: P.success, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> No recent failures
            </div>
          ) : (data?.recentFailures || []).slice(0, 10).map(f => (
            <div key={f.id} style={{ padding: '8px 0', borderBottom: `1px solid ${P.borderLight}`, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: P.textMuted }}>{f.filingId?.slice(0, 8)}...</span>
                <Badge tone={f.status === 'terminal_failure' ? 'error' : 'warning'}>{f.status}</Badge>
              </div>
              <div style={{ color: P.textLight, marginTop: 2 }}>
                {f.errorCode || 'No code'} · Attempt {f.attemptNumber} · {f.lastAttemptAt ? new Date(f.lastAttemptAt).toLocaleString('en-IN') : '—'}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
