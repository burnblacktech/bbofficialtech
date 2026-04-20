/**
 * AdminDashboard — Overview with key metrics
 */

import { useQuery } from '@tanstack/react-query';
import { Users, FileText, DollarSign, Wifi, Activity, Loader2 } from 'lucide-react';
import { Card, Badge } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

export default function AdminDashboard() {
  const { data: health } = useQuery({ queryKey: ['admin-health'], queryFn: async () => (await api.get('/admin/health')).data.data, refetchInterval: 30000 });
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get('/admin/stats/filings')).data.data });
  const { data: revenue } = useQuery({ queryKey: ['admin-revenue'], queryFn: async () => (await api.get('/admin/revenue')).data.data });
  const { data: eri } = useQuery({ queryKey: ['admin-eri'], queryFn: async () => (await api.get('/admin/eri')).data.data });

  const totalFilings = stats?.byState?.reduce((s, r) => s + parseInt(r.count), 0) || 0;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: P.textPrimary, margin: '0 0 20px' }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard icon={<Users size={18} />} label="Active Users (24h)" value={health?.activeUsers?.last24h ?? '—'} color={P.brand} />
        <MetricCard icon={<FileText size={18} />} label="Total Filings" value={totalFilings} color="#059669" />
        <MetricCard icon={<DollarSign size={18} />} label="Revenue (Today)" value={revenue?.summary?.today ? `₹${revenue.summary.today.toLocaleString('en-IN')}` : '₹0'} color="#7c3aed" />
        <MetricCard icon={<Wifi size={18} />} label="ERI Success Rate" value={eri?.successRate != null ? `${eri.successRate}%` : '—'} color={eri?.successRate >= 90 ? P.success : P.error} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Platform Health */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Platform Health</div>
          <StatusRow label="Database" status={health?.database?.connected} ms={health?.database?.responseTimeMs} />
          <StatusRow label="Redis" status={health?.redis?.connected} ms={health?.redis?.responseTimeMs} />
          <StatusRow label="ERI API" status={health?.eriApi?.status === 'operational'} text={health?.eriApi?.status} />
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>Uptime: {health?.uptime ? formatUptime(health.uptime) : '—'}</div>
        </Card>

        {/* Filing Breakdown */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Filings by Status</div>
          {(stats?.byState || []).map(s => (
            <div key={s.lifecycleState} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
              <span style={{ color: P.textMuted }}>{s.lifecycleState}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, color: P.textMuted }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: P.textPrimary, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </Card>
  );
}

function StatusRow({ label, status, ms, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status ? P.success : P.error }} />
        <span style={{ fontSize: 13 }}>{label}</span>
      </div>
      <span style={{ fontSize: 11, color: P.textMuted }}>{text || (ms != null ? `${ms}ms` : '')}</span>
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}
