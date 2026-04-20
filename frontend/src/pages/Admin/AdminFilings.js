/**
 * AdminFilings — Filing statistics with charts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, TrendingUp, Clock } from 'lucide-react';
import { Card, Badge } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

/* eslint-disable camelcase */
const STATE_COLORS = {
  draft: P.textMuted, submitted_to_eri: P.brand, eri_success: P.success, eri_failed: P.error,
};
/* eslint-enable camelcase */

export default function AdminFilings() {
  const [period, setPeriod] = useState('daily');

  const { data: stats } = useQuery({ queryKey: ['admin-filing-stats'], queryFn: async () => (await api.get('/admin/stats/filings')).data.data });
  const { data: trends } = useQuery({ queryKey: ['admin-filing-trends', period], queryFn: async () => (await api.get('/admin/stats/filings/trends', { params: { period } })).data.data });

  const totalFilings = stats?.byState?.reduce((s, r) => s + parseInt(r.count), 0) || 0;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>Filing Statistics</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={<FileText size={16} />} label="Total Filings" value={totalFilings} />
        <StatCard icon={<TrendingUp size={16} />} label="Accepted" value={stats?.byState?.find(s => s.lifecycleState === 'eri_success')?.count || 0} color={P.success} />
        <StatCard icon={<Clock size={16} />} label="Avg Completion" value={stats?.avgCompletionTimeHours ? `${Math.round(stats.avgCompletionTimeHours)}h` : '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By Status */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By Status</div>
          {(stats?.byState || []).map(s => (
            <div key={s.lifecycleState} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATE_COLORS[s.lifecycleState] || P.textMuted }} />
                <span style={{ fontSize: 13 }}>{s.lifecycleState}</span>
              </div>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.count}</span>
            </div>
          ))}
        </Card>

        {/* By ITR Type */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By ITR Type</div>
          {(stats?.byType || []).map(t => (
            <div key={t.itrType} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <span style={{ fontSize: 13 }}>{t.itrType}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{t.count}</span>
            </div>
          ))}
        </Card>

        {/* By Assessment Year */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>By Assessment Year</div>
          {(stats?.byAssessmentYear || []).map(a => (
            <div key={a.assessmentYear} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${P.borderLight}` }}>
              <span style={{ fontSize: 13 }}>AY {a.assessmentYear}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{a.count}</span>
            </div>
          ))}
        </Card>

        {/* Trends */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Filing Trends</div>
            <select className="ds-select" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 100, padding: '4px 8px', fontSize: 11 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {(trends || []).slice(-10).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: P.textMuted }}>{new Date(t.period).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: Math.max(4, parseInt(t.count) * 3), height: 12, background: P.brand, borderRadius: 2 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: 30, textAlign: 'right' }}>{t.count}</span>
              </div>
            </div>
          ))}
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
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || P.textPrimary }}>{value}</div>
    </Card>
  );
}
