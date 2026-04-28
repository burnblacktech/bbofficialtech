/**
 * AdminERI — ERI submission monitoring
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

export default function AdminERI() {
  const { data } = useQuery({
    queryKey: ['admin-eri'],
    queryFn: () => adminService.getERIData().then((r) => r.data),
    refetchInterval: 30000,
  });

  const errorChartData = (data?.errorCodeFrequency || []).map((ec) => ({
    code: ec.error_code || ec.errorCode || 'UNKNOWN',
    count: parseInt(ec.count),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>ERI Monitor</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Success Rate</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: (data?.successRate || 0) >= 90 ? P.success : P.error,
            }}
          >
            {data?.successRate ?? '—'}%
          </div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Pending Queue</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: (data?.pendingCount || 0) > 10 ? P.warning : P.textPrimary,
            }}
          >
            {data?.pendingCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>Recent Failures</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: (data?.recentFailures?.length || 0) > 0 ? P.error : P.success,
            }}
          >
            {data?.recentFailures?.length ?? 0}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Error Code Frequency — Recharts BarChart */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Error Code Frequency (30 days)
          </div>
          {errorChartData.length === 0 ? (
            <div style={{ fontSize: 13, color: P.textMuted, padding: '40px 0', textAlign: 'center' }}>
              No errors in the last 30 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={errorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.borderLight} />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 10, fill: P.textMuted }}
                  tickLine={false}
                  axisLine={{ stroke: P.borderLight }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: P.textMuted }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${P.borderLight}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" fill={P.error} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent Failures table — 20 rows */}
        <Card style={{ maxHeight: 400, overflow: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Failures</div>
          {(data?.recentFailures || []).length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: P.success,
                padding: '40px 0',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CheckCircle size={14} /> No recent failures
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                  {['Filing', 'Error', 'Status', 'Attempt', 'Last Attempt'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 4px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: 10,
                        color: P.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.recentFailures || []).slice(0, 20).map((f) => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                    <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', color: P.textMuted }}>
                      {f.filingId?.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '6px 4px', fontFamily: 'var(--font-mono)', color: P.error }}>
                      {f.errorCode || '—'}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <Badge tone={f.status === 'terminal_failure' ? 'error' : 'warning'}>
                        {f.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{f.attemptNumber}</td>
                    <td style={{ padding: '6px 4px', color: P.textLight }}>
                      {f.lastAttemptAt
                        ? new Date(f.lastAttemptAt).toLocaleString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
