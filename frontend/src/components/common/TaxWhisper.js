/**
 * TaxWhisper — Renders contextual tax advice cards.
 * Compact, non-intrusive, color-coded by type.
 */

import { Lightbulb, AlertTriangle, TrendingDown, Info } from 'lucide-react';

const STYLES = {
  tip:     { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', Icon: Lightbulb },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', Icon: AlertTriangle },
  saving:  { bg: '#faf5ff', border: '#e9d5ff', color: '#6b21a8', Icon: TrendingDown },
  info:    { bg: '#f0fdfa', border: '#99f6e4', color: '#115e59', Icon: Info },
};

export default function TaxWhisper({ whispers }) {
  if (!whispers || whispers.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, marginBottom: 6 }}>
      {whispers.map(w => {
        const s = STYLES[w.type] || STYLES.info;
        const Icon = s.Icon;
        return (
          <div key={w.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 12px', background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 8, fontSize: 12, lineHeight: 1.5, color: s.color,
          }}>
            <Icon size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{w.message}</span>
          </div>
        );
      })}
    </div>
  );
}
