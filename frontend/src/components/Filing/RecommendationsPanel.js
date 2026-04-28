// =====================================================
// RECOMMENDATIONS PANEL — Tax-saving recommendations
// Top 5 sorted by savingsAmount, with navigate links
// =====================================================

import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

const fmt = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;

export default function RecommendationsPanel({ recommendations = [], onNavigate }) {
  if (!recommendations.length) {
    return (
      <div className="step-card" style={{ padding: '16px 14px', textAlign: 'center' }}>
        <Lightbulb size={20} style={{ color: 'var(--text-light)', marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          No recommendations right now. Add income data to get tax-saving tips.
        </p>
      </div>
    );
  }

  const top5 = [...recommendations]
    .sort((a, b) => (b.savingsAmount || 0) - (a.savingsAmount || 0))
    .slice(0, 5);

  return (
    <div className="step-card" style={{ padding: '14px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lightbulb size={14} style={{ color: 'var(--color-warning)' }} />
        Tax-Saving Tips
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top5.map((rec) => (
          <div key={rec.id} style={{
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-muted)', border: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rec.title}</span>
              {rec.savingsAmount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--color-success)',
                  background: 'var(--color-success-bg)', padding: '2px 6px',
                  borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-mono)',
                }}>
                  {fmt(rec.savingsAmount)}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
              {rec.description}
            </p>
            {rec.section && onNavigate && (
              <button onClick={() => onNavigate(rec.section)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, fontSize: 12,
                  fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'inherit',
                }}>
                Go <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
