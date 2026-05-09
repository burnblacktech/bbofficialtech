import React from 'react';
import { Card, Progress } from '../../../design-system';
import { Zap } from 'lucide-react';

function formatK(v) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v;
}

const EMPTY_DEDUCTIONS = [
  { section: '80C', label: 'Investments & Insurance', claimed: 0, limit: 150000 },
  { section: '80D', label: 'Health Insurance', claimed: 0, limit: 50000 },
  { section: '80CCD(1B)', label: 'NPS Contribution', claimed: 0, limit: 50000 },
  { section: '24(b)', label: 'Home Loan Interest', claimed: 0, limit: 200000 },
];

export default function DeductionOptimizer({ data }) {
  const deductions = data?.length ? data : EMPTY_DEDUCTIONS;
  const totalClaimed = deductions.reduce((s, d) => s + d.claimed, 0);
  const totalLimit = deductions.reduce((s, d) => s + d.limit, 0);
  const potential = totalLimit - totalClaimed;

  return (
    <Card className="dash-v2__chart-card">
      <div className="dash-v2__chart-header">
        <span className="dash-v2__chart-title">Deduction Optimizer</span>
        <span style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)' }}>
          <Zap size={12} color="var(--bb-brand)" style={{ display: 'inline', marginRight: 4 }} />
          <span style={{ color: 'var(--bb-brand)', fontWeight: 500 }}>₹{formatK(potential)}</span> potential savings
        </span>
      </div>
      <div style={{ marginBottom: 'var(--bb-space-4)', padding: 'var(--bb-space-3)', borderRadius: 'var(--bb-radius-md)', background: 'var(--bb-bg-elevated)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)', marginBottom: 6 }}>
          <span>Total Utilized</span>
          <span>₹{formatK(totalClaimed)} / ₹{formatK(totalLimit)}</span>
        </div>
        <Progress value={totalClaimed} max={totalLimit} />
      </div>
      {deductions.map((d) => {
        const pct = d.limit > 0 ? (d.claimed / d.limit) * 100 : 0;
        const color = pct >= 100 ? 'var(--bb-status-success)' : pct === 0 ? undefined : 'var(--bb-status-warning)';
        return (
          <div key={d.section} className="dash-v2__deduction-item">
            <div className="dash-v2__deduction-header">
              <div>
                <span style={{ fontSize: 'var(--bb-fs-xs)', fontFamily: 'var(--bb-font-mono)', color: 'var(--bb-fg-muted)', marginRight: 8 }}>{d.section}</span>
                <span style={{ fontSize: 'var(--bb-fs-sm)', fontWeight: 500 }}>{d.label}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 'var(--bb-fs-sm)' }}>
                <div style={{ fontWeight: 500 }}>₹{formatK(d.claimed)}</div>
                <div style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)' }}>of ₹{formatK(d.limit)}</div>
              </div>
            </div>
            <Progress value={d.claimed} max={d.limit} color={color} />
          </div>
        );
      })}
    </Card>
  );
}
