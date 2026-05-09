import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../design-system';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#D4AF37', '#16A34A', '#3B82F6', '#DC2626', '#8B5CF6'];

function formatINR(v) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  return v?.toLocaleString('en-IN') ?? '0';
}

export default function IncomeBreakdown({ data = [] }) {
  const navigate = useNavigate();
  const total = data.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <Card className="dash-v2__chart-card">
      <div className="dash-v2__chart-header">
        <span className="dash-v2__chart-title">Income Sources</span>
        <button onClick={() => navigate('/finance/income')} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--bb-brand)', cursor: 'pointer' }}>View all →</button>
      </div>
      <div className="dash-v2__donut-wrapper">
        <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₹${formatINR(v)}`} contentStyle={{ background: 'var(--bb-bg-elevated)', border: '1px solid var(--bb-border)', borderRadius: 6, color: 'var(--bb-fg-primary)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)' }}>Total</span>
            <span style={{ fontSize: 'var(--bb-fs-lg)', fontWeight: 600 }}>₹{formatINR(total)}</span>
          </div>
        </div>
        <div className="dash-v2__donut-legend">
          {data.map((item, i) => (
            <div key={item.name} className="dash-v2__donut-legend-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="dash-v2__legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--bb-fg-muted)' }}>{item.name}</span>
              </span>
              <span style={{ fontWeight: 500 }}>₹{formatINR(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
