import React, { useState } from 'react';
import { Check, Pencil } from 'lucide-react';

export default function IdentityBand({ data }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.name || '');

  return (
    <div className="fr-band" id="identity">
      <div className="fr-band__header">
        <span className="fr-band__title">Taxpayer Identity</span>
      </div>
      {!editing ? (
        <div className="fr-item" onClick={() => setEditing(true)}>
          <div className="fr-item__left">
            <div>
              <div className="fr-item__name">{data.name || 'Name not set'}</div>
              <div className="fr-item__detail" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{data.pan || '—'}</span>
                {data.panVerified && <Check size={12} style={{ color: 'var(--fr-success)' }} />}
                <span style={{ marginLeft: 8 }}>AY {data.assessmentYear || '2025-26'}</span>
              </div>
            </div>
          </div>
          <Pencil size={14} style={{ color: 'var(--fr-muted)' }} />
        </div>
      ) : (
        <div className="fr-editor">
          <div className="fr-editor__grid">
            <div className="fr-editor__field">
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="fr-editor__field">
              <label>PAN</label>
              <input value={data.pan || ''} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="fr-editor__save" onClick={() => setEditing(false)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
