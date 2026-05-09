import React from 'react';
import { Card } from '../../../design-system';
import { Wallet, PiggyBank, TrendingUp, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const METRICS = [
  { key: 'grossIncome', label: 'Gross Income', icon: Wallet, color: 'var(--bb-status-success)' },
  { key: 'deductions', label: 'Deductions', icon: PiggyBank, color: 'var(--bb-status-info)' },
  { key: 'taxableIncome', label: 'Taxable Income', icon: TrendingUp, color: 'var(--bb-status-warning)' },
  { key: 'taxLiability', label: 'Tax Liability', icon: Receipt, color: 'var(--bb-brand)' },
];

function formatINR(v) {
  if (!v) return '0';
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)} L`;
  return v.toLocaleString('en-IN');
}

export default function FinancialOverview({ data }) {
  return (
    <div className="dash-v2__grid-4">
      {METRICS.map(({ key, label, icon: Icon, color }) => {
        const val = data?.[key] ?? 0;
        const change = data?.[`${key}Change`] ?? 0;
        const up = change >= 0;
        return (
          <Card key={key}>
            <div className="dash-v2__stat-card">
              <div>
                <div style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</div>
                <div className="dash-v2__stat-value">₹{formatINR(val)}</div>
              </div>
              <div className="dash-v2__stat-icon" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="dash-v2__stat-trend">
              {up ? <ArrowUpRight size={12} color="var(--bb-status-success)" /> : <ArrowDownRight size={12} color="var(--bb-status-error)" />}
              <span style={{ color: up ? 'var(--bb-status-success)' : 'var(--bb-status-error)', fontWeight: 500 }}>{change > 0 ? '+' : ''}{change}%</span>
              <span style={{ color: 'var(--bb-fg-muted)' }}>vs last year</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
