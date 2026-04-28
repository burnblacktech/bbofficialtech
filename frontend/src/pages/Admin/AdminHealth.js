/**
 * AdminHealth — Platform health monitoring
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Server, Wifi, Users, Clock, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

const REFRESH_OPTIONS = [
  { label: '5s', value: 5000 },
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
  { label: 'Off', value: 0 },
];

export default function AdminHealth() {
  const [refreshInterval, setRefreshInterval] = useState(15000);

  const { data } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => adminService.getHealth().then((r) => r.data),
    refetchInterval: refreshInterval || false,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Platform Health</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: P.textMuted }}>Auto-refresh:</span>
          {REFRESH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRefreshInterval(opt.value)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${refreshInterval === opt.value ? P.brand : P.borderMedium}`,
                background: refreshInterval === opt.value ? P.brandLight : 'transparent',
                color: refreshInterval === opt.value ? P.brandDark : P.textMuted,
                minHeight: 'auto',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service status cards — green/yellow/red indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <ServiceCard
          icon={<Database size={18} />}
          label="Database"
          connected={data?.database?.connected}
          ms={data?.database?.responseTimeMs}
        />
        <ServiceCard
          icon={<Server size={18} />}
          label="Redis"
          connected={data?.redis?.connected}
          ms={data?.redis?.responseTimeMs}
        />
        <ServiceCard
          icon={<Wifi size={18} />}
          label="ERI API"
          connected={data?.eriApi?.status === 'operational'}
          status={data?.eriApi?.status}
        />
      </div>

      {/* Active users + server info + error rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Active user counts */}
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

        {/* Server info + error rate */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={16} color={P.brand} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Server Info</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <span style={{ color: P.textMuted }}>Uptime</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {data?.uptime ? formatUptime(data.uptime) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} color={P.warning} />
                <span style={{ color: P.textMuted }}>API Error Rate</span>
              </div>
              <span
                style={{
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: (data?.errorRate || 0) > 5 ? P.error : (data?.errorRate || 0) > 1 ? P.warning : P.success,
                }}
              >
                {data?.errorRate != null ? `${data.errorRate}%` : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ServiceCard({ icon, label, connected, ms, status }) {
  // green = connected, yellow = degraded/unknown, red = disconnected
  const color = status === 'degraded'
    ? P.warning
    : status === 'unknown'
      ? P.textMuted
      : connected
        ? P.success
        : connected === false
          ? P.error
          : P.textMuted;

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
      <Badge tone={connected ? 'success' : connected === false ? 'error' : 'default'}>
        {statusText}
      </Badge>
      {ms != null && (
        <span style={{ fontSize: 11, color: P.textLight, marginLeft: 6 }}>{ms}ms</span>
      )}
    </Card>
  );
}

function ActiveCount({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: P.textPrimary }}>
        {value ?? '—'}
      </div>
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
