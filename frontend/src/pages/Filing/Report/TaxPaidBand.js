import React, { useState, useRef } from 'react';
import { Pencil } from 'lucide-react';

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function TaxPaidBand({ tdsEntries, onSave }) {
  const [editing, setEditing] = useState(null);
  const nameRef = useRef(null);
  const tanRef = useRef(null);
  const amountRef = useRef(null);
  const total = tdsEntries.reduce((s, t) => s + (t.amount || 0), 0);

  const handleSave = (idx) => {
    const updated = tdsEntries.map((entry, i) =>
      i === idx
        ? {
            ...entry,
            deductorName: nameRef.current?.value,
            tan: tanRef.current?.value,
            amount: parseFloat(amountRef.current?.value) || 0,
          }
        : entry,
    );
    onSave({ entries: updated });
    setEditing(null);
  };

  return (
    <div className="fr-band" id="tax-paid">
      <div className="fr-band__header">
        <span className="fr-band__title">Tax Paid (TDS / Advance Tax)</span>
        <span className="fr-band__total" style={MONO}>₹{total.toLocaleString('en-IN')}</span>
      </div>
      {tdsEntries.map((entry, idx) => (
        <div key={idx}>
          <div className="fr-item" onClick={() => setEditing(editing === idx ? null : idx)}>
            <div className="fr-item__left">
              <div>
                <div className="fr-item__name">{entry.deductorName || entry.tan || 'TDS Entry'}</div>
                <div className="fr-item__detail">{entry.tan || ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="fr-item__amount" style={MONO}>₹{(entry.amount || 0).toLocaleString('en-IN')}</span>
              <Pencil size={14} style={{ color: 'var(--fr-muted)' }} />
            </div>
          </div>
          {editing === idx && (
            <div className="fr-editor">
              <div className="fr-editor__grid">
                <div className="fr-editor__field">
                  <label>Deductor Name</label>
                  <input ref={nameRef} defaultValue={entry.deductorName || ''} />
                </div>
                <div className="fr-editor__field">
                  <label>TAN</label>
                  <input ref={tanRef} defaultValue={entry.tan || ''} />
                </div>
                <div className="fr-editor__field">
                  <label>Amount</label>
                  <input ref={amountRef} defaultValue={entry.amount || 0} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="fr-editor__save" onClick={() => handleSave(idx)}>Save</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {tdsEntries.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--fr-muted)', padding: '8px 0' }}>No TDS entries</div>
      )}
    </div>
  );
}
