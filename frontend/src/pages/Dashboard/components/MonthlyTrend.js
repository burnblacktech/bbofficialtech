import React from 'react';
import { Card } from '../../../design-system';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

function formatK(v) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v;
}

export default function MonthlyTrend({ data = [] }) {
  return (
    <Card className="dash-v2__chart-card">
      <div className="dash-v2__chart-header">
        <span className="dash-v2__chart-title">Monthly Cash Flow</span>
        <div className="dash-v2__legend">
          <span><span className="dash-v2__legend-dot" style={{ background: 'var(--bb-status-success)' }} />Income</span>
          <span><span className="dash-v2__legend-dot" style={{ background: 'var(--bb-status-error)' }} />Expenses</span>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bb-status-success)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--bb-status-success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bb-status-error)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--bb-status-error)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bb-border)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--bb-fg-muted)', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--bb-fg-muted)', fontSize: 10 }} tickFormatter={formatK} />
            <Tooltip contentStyle={{ background: 'var(--bb-bg-elevated)', border: '1px solid var(--bb-border)', borderRadius: 6, color: 'var(--bb-fg-primary)' }} formatter={(v) => `₹${formatK(v)}`} />
            <Area type="monotone" dataKey="income" stroke="var(--bb-status-success)" strokeWidth={2} fill="url(#incGrad)" />
            <Area type="monotone" dataKey="expense" stroke="var(--bb-status-error)" strokeWidth={2} fill="url(#expGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
