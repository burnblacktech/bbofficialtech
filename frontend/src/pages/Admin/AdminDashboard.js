/**
 * AdminDashboard — Overview page with key metric summary cards.
 *
 * Cards: total users, active filings, today's revenue, ERI success rate, platform health badge.
 * Fetches from multiple admin endpoints on mount via adminService.
 * Shows loading skeletons while data loads and error state with retry on failure.
 *
 * Requirements: 8.1, 9.1, 10.1, 12.1
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, FileText, DollarSign, Wifi, Activity, RefreshCw } from 'lucide-react';
import { Card, Badge, Button } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

// ── Helpers ──

function formatRupees(val) {
  if (val == null) return '₹0';
  return `₹${Number(val).toLocaleString('en-IN')}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function healthBadge(health) {
  if (!health) return { tone: 'default', label: 'Unknown' };
  const dbOk = health.database?.connected;
  const redisOk = health.redis?.connected;
  const eriOk = health.eriApi?.status === 'operational';
  if (dbOk && redisOk && eriOk) return { tone: 'success', label: 'Healthy' };
  if (dbOk && redisOk) return { tone: 'warning', label: 'Degraded' };
  return { tone: 'error', label: 'Unhealthy' };
}

// ── Main Component ──

export default function AdminDashboard() {
  const [data, setData] = useState({ users: null, filings: null, revenue: null, eri: null, health: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, filingsRes, revenueRes, eriRes, healthRes] = await Promise.all([
        adminService.getUsers({ limit: 1 }),
        adminService.getFilingStats(),
        adminService.getRevenue(),
        adminService.getERIData(),
        adminService.getHealth(),
      ]);
      setData({
        users: usersRes.data || usersRes,
        filings: filingsRes.data || filingsRes,
        revenue: revenueRes.data || revenueRes,
        eri: eriRes.data || eriRes,
        health: healthRes.data || healthRes,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Error state ──
  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: P.textPrimary, margin: '0 0 20px' }}>
          Admin Dashboard
        </h1>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: P.error, marginBottom: 12 }}>{error}</div>
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  const { users, filings, revenue, eri, health } = data;
  const totalUsers = users?.total ?? null;
  const activeFilings = filings?.byState
    ?.filter((s) => !['eri_success', 'eri_failed'].includes(s.lifecycleState))
    .reduce((sum, s) => sum + parseInt(s.count, 10), 0) ?? null;
  const todayRevenue = revenue?.summary?.today ?? null;
  const successRate = eri?.successRate ?? null;
  const hb = healthBadge(health);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: P.textPrimary, margin: 0 }}>
          Admin Dashboard
        </h1>
        {health && (
          <Badge tone={hb.tone} icon={<Activity size={12} style={{ marginRight: 4 }} />}>
            {hb.label}
          </Badge>
        )}
      </div>

      {/* Primary metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              icon={<Users size={18} />}
              label="Total Users"
              value={totalUsers != null ? totalUsers.toLocaleString('en-IN') : '—'}
              color={P.brand}
            />
            <MetricCard
              icon={<FileText size={18} />}
              label="Active Filings"
              value={activeFilings != null ? activeFilings.toLocaleString('en-IN') : '—'}
              color="#059669"
            />
            <MetricCard
              icon={<DollarSign size={18} />}
              label="Today's Revenue"
              value={formatRupees(todayRevenue)}
              color="#7c3aed"
            />
            <MetricCard
              icon={<Wifi size={18} />}
              label="ERI Success Rate"
              value={successRate != null ? `${successRate}%` : '—'}
              color={successRate != null && successRate >= 90 ? P.success : P.error}
            />
            <MetricCard
              icon={<Activity size={18} />}
              label="Platform Health"
              value={hb.label}
              color={hb.tone === 'success' ? P.success : hb.tone === 'warning' ? P.warning : P.error}
            />
          </>
        )}
      </div>

      {/* Secondary details */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Platform Health detail */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Platform Health</div>
            <StatusRow label="Database" status={health?.database?.connected} ms={health?.database?.responseTimeMs} />
            <StatusRow label="Redis" status={health?.redis?.connected} ms={health?.redis?.responseTimeMs} />
            <StatusRow label="ERI API" status={health?.eriApi?.status === 'operational'} text={health?.eriApi?.status} />
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>
              Uptime: {health?.uptime ? formatUptime(health.uptime) : '—'}
            </div>
          </Card>

          {/* Filings by Status */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Filings by Status</div>
            {(filings?.byState || []).map((s) => (
              <div
                key={s.lifecycleState}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}
              >
                <span style={{ color: P.textMuted }}>{s.lifecycleState}</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.count}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function MetricCard({ icon, label, value, color }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, color: P.textMuted }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: P.textPrimary, fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card style={{ padding: 16, opacity: 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: P.bgMuted }} />
        <div style={{ width: 80, height: 12, borderRadius: 4, background: P.bgMuted }} />
      </div>
      <div style={{ width: '60%', height: 24, borderRadius: 4, background: P.bgMuted }} />
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
