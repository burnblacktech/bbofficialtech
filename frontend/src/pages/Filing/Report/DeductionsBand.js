import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MONO = { fontFamily: "'DM Mono', monospace" };
const LIMITS = { '80C': 150000, '80D': 75000, '80CCD1B': 50000, '80TTA': 10000 };

export default function DeductionsBand({ deductions, regime, onSave }) {
  const [expanded, setExpanded] = useState(null);
  const amountRef = useRef(null);
  const total = deductions.reduce((s, d) => s + (d.amount || 0), 0);

  const handleSave = (idx) => {
    const val = parseFloat(amountRef.current?.value) || 0;
    const updated = deductions.map((d, i) => i === idx ? { ...d, amount: val } : d);
    onSave({ items: updated });
    setExpanded(null);
  };

  return (
    <div className="fr-band" id="deductions">
      <div className="fr-band__header">
        <span className="fr-band__title">Deductions</span>
        <span className="fr-band__total" style={MONO}>₹{total.toLocaleString('en-IN')}</span>
      </div>
      {regime === 'new' && (
        <div style={{ fontSize: 12, color: 'var(--fr-warning)', marginBottom: 12, padding: '6px 10px', background: 'rgba(212,175,55,0.08)', borderRadius: 6 }}>
          Not applicable in New Regime
        </div>
      )}
      {deductions.map((item, idx) => {
        const limit = LIMITS[item.section] || 150000;
        const pct = Math.min((item.amount / limit) * 100, 100);
        const isOpen = expanded === idx;
        return (
          <div key={idx} style={{ opacity: regime === 'new' ? 0.4 : 1 }}>
            <div className="fr-item" onClick={() => setExpanded(isOpen ? null : idx)}>
              <div className="fr-item__left">
                <div className="fr-item__icon fr-item__icon--deduction" style={{ fontSize: 10, fontWeight: 600 }}>{item.section}</div>
                <span className="fr-item__name">{item.label || `Section ${item.section}`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="fr-item__fraction" style={MONO}>
                  ₹{(item.amount || 0).toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}
                </span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
            <div style={{ marginLeft: 36, marginRight: 8 }}>
              <div className="fr-progress">
                <div
                  className={`fr-progress__fill ${pct >= 100 ? 'fr-progress__fill--full' : pct > 0 ? 'fr-progress__fill--partial' : 'fr-progress__fill--empty'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            {isOpen && (
              <div className="fr-editor">
                <div className="fr-editor__grid">
                  <div className="fr-editor__field">
                    <label>Amount Claimed</label>
                    <input ref={amountRef} defaultValue={item.amount || 0} />
                  </div>
                  <div className="fr-editor__field">
                    <label>Maximum Limit</label>
                    <input value={limit.toLocaleString('en-IN')} disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="fr-editor__save" onClick={() => handleSave(idx)}>Save</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {deductions.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--fr-muted)', padding: '8px 0' }}>No deductions claimed</div>
      )}
    </div>
  );
}
