// =====================================================
// READINESS CHECKLIST — Filing readiness with blocker/warning items
// Collapsible, click-to-navigate, status icons
// =====================================================

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ds';

const iconMap = {
  done: { Icon: CheckCircle, color: 'var(--color-success)' },
  blocker: { Icon: AlertCircle, color: 'var(--color-error)' },
  warning: { Icon: AlertTriangle, color: 'var(--color-warning)' },
};

function getItemVisual(item) {
  if (item.status === 'done') return iconMap.done;
  return item.type === 'blocker' ? iconMap.blocker : iconMap.warning;
}

export default function ReadinessChecklist({ items = [], summaryText = '', allBlockersResolved = false, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  const summaryColor = allBlockersResolved ? 'var(--color-success)' : 'var(--text-secondary)';
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <Card style={{ padding: '12px 14px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}
        aria-expanded={expanded}
        aria-label="Toggle readiness checklist"
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: summaryColor }}>{summaryText}</span>
        <ChevronIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item) => {
            const { Icon, color } = getItemVisual(item);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.section, item.field)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px',
                  background: 'none', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                className="readiness-item"
                aria-label={`${item.label} — ${item.status === 'done' ? 'complete' : item.type}`}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <Icon size={14} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
          {items.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>No items to show</span>
          )}
        </div>
      )}
    </Card>
  );
}
