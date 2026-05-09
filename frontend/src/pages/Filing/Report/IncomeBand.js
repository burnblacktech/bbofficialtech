import React, { useState } from 'react';
import { Briefcase, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function IncomeBand({ incomes }) {
  const [expanded, setExpanded] = useState(null);
  const total = incomes.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="fr-band" id="income">
      <div className="fr-band__header">
        <span className="fr-band__title">Income</span>
        <span className="fr-band__total" style={MONO}>₹{total.toLocaleString('en-IN')}</span>
      </div>
      {incomes.map((item, idx) => {
        const isOpen = expanded === idx;
        return (
          <div key={idx}>
            <div className="fr-item" onClick={() => setExpanded(isOpen ? null : idx)}>
              <div className="fr-item__left">
                <div className="fr-item__icon fr-item__icon--income"><Briefcase size={12} /></div>
                <span className="fr-item__name">{item.label || item.type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="fr-item__amount" style={MONO}>₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
            {isOpen && (
              <div className="fr-editor">
                <div className="fr-editor__grid">
                  <div className="fr-editor__field">
                    <label>Gross Amount</label>
                    <input defaultValue={item.amount || 0} />
                  </div>
                  {item.type === 'salary' && (
                    <div className="fr-editor__field">
                      <label>Standard Deduction</label>
                      <input defaultValue={item.standardDeduction || 75000} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="fr-editor__save">Save</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {incomes.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--fr-muted)', padding: '8px 0' }}>No income sources added</div>
      )}
      <button className="fr-add-link"><Plus size={12} /> Add income source</button>
    </div>
  );
}
