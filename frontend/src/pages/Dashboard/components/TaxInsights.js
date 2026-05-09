import React from 'react';
import { Card, Badge } from '../../../design-system';
import { Scale, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function formatL(v) {
  if (!v) return '0';
  return `${(v / 100000).toFixed(2)} L`;
}

export default function TaxInsights({ data }) {
  const old = data?.oldRegime || {};
  const nw = data?.newRegime || {};
  const savings = (nw.total || 0) - (old.total || 0);
  const recommended = savings > 0 ? 'old' : 'new';
  const insights = data?.insights || [];

  return (
    <Card className="dash-v2__chart-card">
      <div className="dash-v2__chart-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Scale size={14} color="var(--bb-fg-muted)" />
          <span style={{ fontSize: 'var(--bb-fs-sm)', fontWeight: 500 }}>Regime Comparison</span>
        </span>
        <Badge variant={recommended === 'old' ? 'success' : 'info'}>
          <Sparkles size={10} style={{ marginRight: 4 }} />{recommended === 'old' ? 'Old' : 'New'} Regime Recommended
        </Badge>
      </div>
      <div className="dash-v2__regime-grid">
        <div className={`dash-v2__regime-box ${recommended === 'old' ? 'dash-v2__regime-box--recommended' : ''}`}>
          <div style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Old Regime</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--bb-fs-sm)', marginBottom: 4 }}>
            <span style={{ color: 'var(--bb-fg-muted)' }}>Taxable</span><span>₹{formatL(old.taxable)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--bb-fs-sm)' }}>
            <span style={{ color: 'var(--bb-fg-muted)' }}>Tax + Cess</span><span>₹{formatL(old.total)}</span>
          </div>
          {recommended === 'old' && <div style={{ marginTop: 8, padding: '6px', borderRadius: 4, background: 'rgba(22,163,74,0.1)', textAlign: 'center', fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-status-success)' }}>You save ₹{formatL(Math.abs(savings))}</div>}
        </div>
        <div className={`dash-v2__regime-box ${recommended === 'new' ? 'dash-v2__regime-box--recommended' : ''}`}>
          <div style={{ fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-fg-muted)', textTransform: 'uppercase', marginBottom: 8 }}>New Regime</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--bb-fs-sm)', marginBottom: 4 }}>
            <span style={{ color: 'var(--bb-fg-muted)' }}>Taxable</span><span>₹{formatL(nw.taxable)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--bb-fs-sm)' }}>
            <span style={{ color: 'var(--bb-fg-muted)' }}>Tax + Cess</span><span>₹{formatL(nw.total)}</span>
          </div>
          {recommended === 'new' && <div style={{ marginTop: 8, padding: '6px', borderRadius: 4, background: 'rgba(22,163,74,0.1)', textAlign: 'center', fontSize: 'var(--bb-fs-xs)', color: 'var(--bb-status-success)' }}>You save ₹{formatL(Math.abs(savings))}</div>}
        </div>
      </div>
      {insights.length > 0 && (
        <div style={{ marginTop: 'var(--bb-space-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.slice(0, 3).map((tip, i) => (
            <div key={i} className="dash-v2__insight" style={{ marginTop: 0 }}>
              {tip.type === 'success' ? <CheckCircle2 size={12} color="var(--bb-status-success)" style={{ marginRight: 6, display: 'inline' }} /> : <AlertCircle size={12} color="var(--bb-status-warning)" style={{ marginRight: 6, display: 'inline' }} />}
              <span style={{ fontWeight: 500, color: 'var(--bb-fg-primary)' }}>{tip.title}</span> — {tip.description}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
