// =====================================================
// PROGRESS RING — SVG circular progress indicator
// 40px diameter, color-coded, tooltip on hover, click-to-navigate
// =====================================================

import React, { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const SIZE = 40;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing({ percentage = 0, color = 'var(--text-muted)', sections = [], onClickNext }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const pct = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const strokeColor =
    color === 'red' ? 'var(--color-error)' :
    color === 'amber' ? 'var(--color-warning)' :
    color === 'green' ? 'var(--color-success)' : color;

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', cursor: onClickNext ? 'pointer' : 'default' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClickNext}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClickNext) onClickNext(); }}
      aria-label={`Filing ${pct}% complete`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
          stroke="var(--readiness-track)" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
          stroke={strokeColor} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-primary)' }}>
          {pct}%
        </text>
      </svg>

      {showTooltip && sections.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)', padding: '8px 10px', zIndex: 'var(--z-dropdown)',
          minWidth: 160, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {sections.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: 12 }}>
              {s.status === 'complete'
                ? <CheckCircle size={12} style={{ color: 'var(--color-success)' }} />
                : <Circle size={12} style={{ color: s.status === 'partial' ? 'var(--color-warning)' : 'var(--text-light)' }} />}
              <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
