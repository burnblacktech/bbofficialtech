/**
 * AdminHealth — Platform health monitoring
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Server, Wifi, Users, Clock } from 'lucide-react';
import { Card, Badge } from '../../components/ds';
import P from '../../styles/palette';
import api from '../../services/api';

export default function AdminHealth() {
  const { data } = useQuery({ queryKey: ['admin-health'], queryFn: async () => (await api.get('/admin/health')).data.data, refetchInterval: 15000 });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Platform Health</h1>

      {/* Service status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <ServiceCard icon={<Database size={18} />} label="Database" connected={data?.database?.connected} ms={data?.database?.responseTimeMs} />
        <ServiceCard icon={<Server size={18} />} label="Redis" connected={data?.redis?.connected} ms={data?.redis?.responseTimeMs} />
        <ServiceCard icon={<Wifi size={18} />} label="ERI API" connected={data?.eriApi?.status === 'operational'} status={data?.eriApi?.status} />
      </div>

      {/* Active users + uptime */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color={P.brand} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Active Users</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <ActiveCount label="24 hours" value={data?.activeUsers?.last24h} />
            <ActiveCount label="7 days" value={data?.activeUsers?.last7d} />
            <ActiveCount label="30 days" value={data?.activeUsers?.last30d} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={16} color={P.brand} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Server Info</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: P.textMuted }}>Uptime</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{data?.uptime ? formatUptime(data.uptime) : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: P.textMuted }}>Node.js</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{typeof process !== 'undefined' ? process.version : '—'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ServiceCard({ icon, label, connected, ms, status }) {
  const color = connected ? P.success : connected === false ? P.error : P.textMuted;
  const statusText = status || (connected ? 'Connected' : connected === false ? 'Disconnected' : 'Unknown');

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
      </div>
      <Badge tone={connected ? 'success' : connected === false ? 'error' : 'default'}>{statusText}</Badge>
      {ms != null && <span style={{ fontSize: 11, color: P.textLight, marginLeft: 6 }}>{ms}ms</span>}
    </Card>
  );
}

function ActiveCount({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: P.textPrimary }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: P.textMuted }}>{label}</div>
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
