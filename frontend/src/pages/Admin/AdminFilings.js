/**
 * AdminFilings — Filing statistics with charts
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge } from '../../components/ds';
import adminService from '../../services/adminService';
import P from '../../styles/palette';

/* eslint-disable camelcase */
const STATE_COLORS = {
  draft: P.textMuted,
  review_pending: P.warning,
  reviewed: P.info,
  approved_by_ca: P.secondary,
  submitted_to_eri: P.brand,
  eri_in_progress: P.brandDark,
  eri_success: P.success,
  eri_failed: P.error,
};
/* eslint-enable camelcase */

export default function AdminFilings() {
  const [period, setPeriod] = useState('daily');

  const { data: stats } = useQuery({
    queryKey: ['admin-filing-stats'],
    queryFn: () => adminService.getFilingStats().then((r) => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['admin-filing-trends', period],
    queryFn: () => adminService.getFilingTrends(period).then((r) => r.data),
  });

  const totalFilings = stats?.byState?.reduce((s, r) => s + parseInt(r.count), 0) || 0;

  const chartData = (trends || []).map((t) => ({
    label: new Date(t.period).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    count: parseInt(t.count),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Filing Statistics</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={<FileText size={16} />} label="Total Filings" value={totalFilings} />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Accepted"
          value={stats?.byState?.find((s) => s.lifecycleState === 'eri_success')?.count || 0}
          color={P.success}
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Avg Completion"
          value={
            stats?.avgCompletionTimeHours
              ? `${Math.round(stats.avgCompletionTimeHours)}h`
              : '—'
          }
        />
      </div>

      {/* Stats breakdown cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* By Status */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By Status</div>
          {(stats?.byState || []).map((s) => (
            <div
              key={s.lifecycleState}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: `1px solid ${P.borderLight}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATE_COLORS[s.lifecycleState] || P.textMuted,
                  }}
                />
                <span style={{ fontSize: 13 }}>{s.lifecycleState}</span>
              </div>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.count}</span>
            </div>
          ))}
        </Card>

        {/* By ITR Type */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By ITR Type</div>
          {(stats?.byType || []).map((t) => (
            <div
              key={t.itrType}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: `1px solid ${P.borderLight}`,
              }}
            >
              <span style={{ fontSize: 13 }}>{t.itrType}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{t.count}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By Assessment Year */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By Assessment Year</div>
          {(stats?.byAssessmentYear || []).map((a) => (
            <div
              key={a.assessmentYear}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: `1px solid ${P.borderLight}`,
              }}
            >
              <span style={{ fontSize: 13 }}>AY {a.assessmentYear}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{a.count}</span>
            </div>
          ))}
        </Card>

        {/* Trend chart with Recharts LineChart */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>Filing Trends</div>
            <select
              className="ds-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ width: 110, padding: '4px 8px', fontSize: 11 }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.borderLight} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: P.textMuted }}
                  tickLine={false}
                  axisLine={{ stroke: P.borderLight }}
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={P.brand}
                  strokeWidth={2}
                  dot={{ r: 3, fill: P.brand }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 13, color: P.textMuted, padding: '40px 0', textAlign: 'center' }}>
              No trend data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: color || P.textMuted }}>{icon}</span>
        <span style={{ fontSize: 11, color: P.textMuted }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: color || P.textPrimary,
        }}
      >
        {value}
      </div>
    </Card>
  );
}
