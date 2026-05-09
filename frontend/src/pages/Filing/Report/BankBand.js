import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export default function BankBand({ bankAccount }) {
  const [editing, setEditing] = useState(false);
  const bank = bankAccount || {};

  return (
    <div className="fr-band" id="bank">
      <div className="fr-band__header">
        <span className="fr-band__title">Bank Account (for Refund)</span>
        {!editing && (
          <button className="fr-add-link" onClick={() => setEditing(true)}>Change</button>
        )}
      </div>
      {!editing ? (
        <div className="fr-item">
          <div className="fr-item__left">
            <div className="fr-item__icon fr-item__icon--income"><Building2 size={12} /></div>
            <div>
              <div className="fr-item__name">{bank.bankName || 'No bank added'}</div>
              <div className="fr-item__detail" style={{ fontFamily: "'DM Mono', monospace" }}>
                {bank.accountNumber ? `A/C •••• ${bank.accountNumber.slice(-4)}` : '—'}
                {bank.ifsc && <span style={{ marginLeft: 12 }}>IFSC: {bank.ifsc}</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fr-editor">
          <div className="fr-editor__grid">
            <div className="fr-editor__field">
              <label>Bank Name</label>
              <input defaultValue={bank.bankName || ''} />
            </div>
            <div className="fr-editor__field">
              <label>Account Number</label>
              <input defaultValue={bank.accountNumber || ''} />
            </div>
            <div className="fr-editor__field">
              <label>IFSC Code</label>
              <input defaultValue={bank.ifsc || ''} />
            </div>
            <div className="fr-editor__field">
              <label>Account Type</label>
              <select defaultValue={bank.accountType || 'savings'}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
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
