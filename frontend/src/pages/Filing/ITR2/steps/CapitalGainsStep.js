/**
 * Capital Gains Step — ITR-2
 * Add/edit capital gain transactions: equity, MF, property, other
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../filing-flow.css';

const ASSET_TYPES = [
  { value: 'equity', label: 'Listed Equity Shares' },
  { value: 'equity_mf', label: 'Equity Mutual Funds' },
  { value: 'debt_mf', label: 'Debt Mutual Funds' },
  { value: 'property', label: 'Property / Land' },
  { value: 'gold', label: 'Gold / Jewellery' },
  { value: 'other', label: 'Other Assets' },
];

const EMPTY_TXN = {
  assetType: 'equity', gainType: 'short-term',
  saleDate: '', purchaseDate: '', saleValue: '', purchaseValue: '', indexedCost: '', expenses: '', exemption: '',
  description: '',
};

const F = ({ l, v, c, h, p, t = 'number' }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={p || '0'} />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const CapitalGainsStep = ({ payload, onSave, onBack, isSaving }) => {
  const existing = payload?.income?.capitalGains?.transactions || [];
  const [transactions, setTransactions] = useState(existing);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  const n = (v) => Number(v) || 0;

  const startAdd = () => { setForm({ ...EMPTY_TXN }); setEditing(transactions.length); };
  const startEdit = (i) => { setForm({ ...transactions[i] }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveTxn = () => {
    if (!form.saleValue) return;
    const updated = [...transactions];
    updated[editing] = {
      ...form,
      saleValue: n(form.saleValue), purchaseValue: n(form.purchaseValue),
      indexedCost: n(form.indexedCost), expenses: n(form.expenses), exemption: n(form.exemption),
    };
    setTransactions(updated);
    setForm(null); setEditing(null);
  };

  const removeTxn = (i) => setTransactions(transactions.filter((_, idx) => idx !== i));

  const computeGain = (t) => {
    const cost = t.gainType === 'long-term' ? n(t.indexedCost || t.purchaseValue) : n(t.purchaseValue);
    return n(t.saleValue) - cost - n(t.expenses) - n(t.exemption);
  };

  const stcg = transactions.filter(t => t.gainType === 'short-term').reduce((s, t) => s + computeGain(t), 0);
  const ltcg = transactions.filter(t => t.gainType === 'long-term').reduce((s, t) => s + computeGain(t), 0);

  const handleNext = () => {
    onSave({ income: { capitalGains: { transactions } } });
  };

  return (
    <div>
      <h2 className="step-title">Capital Gains</h2>
      <p className="step-desc">Add transactions where you sold shares, mutual funds, property, or other assets</p>

      {/* Transaction List */}
      {transactions.map((t, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">{ASSET_TYPES.find(a => a.value === t.assetType)?.label || t.assetType} — {t.gainType === 'short-term' ? 'STCG' : 'LTCG'}</p>
              <p className="ff-item-detail">
                Sale: ₹{n(t.saleValue).toLocaleString('en-IN')} · Gain: ₹{computeGain(t).toLocaleString('en-IN')}
                {t.description && ` · ${t.description}`}
              </p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeTxn(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {/* Transaction Form */}
      {form && (
        <div className="step-card editing">
          <p className="ff-item-name" style={{ marginBottom: '12px' }}>
            {editing < transactions.length ? 'Edit Transaction' : 'Add Transaction'}
          </p>

          <div className="ff-grid-2">
            <div className="ff-field">
              <label className="ff-label">Asset Type *</label>
              <select value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })} className="ff-select">
                {ASSET_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="ff-field">
              <label className="ff-label">Gain Type *</label>
              <select value={form.gainType} onChange={e => setForm({ ...form, gainType: e.target.value })} className="ff-select">
                <option value="short-term">Short-Term (STCG)</option>
                <option value="long-term">Long-Term (LTCG)</option>
              </select>
            </div>
          </div>

          <F l="Description" v={form.description} c={v => setForm({ ...form, description: v })} p="e.g., Sold 100 shares of Reliance" t="text" />

          <div className="ff-grid-2">
            <F l="Purchase Date" v={form.purchaseDate} c={v => setForm({ ...form, purchaseDate: v })} t="date" />
            <F l="Sale Date" v={form.saleDate} c={v => setForm({ ...form, saleDate: v })} t="date" />
          </div>

          <div className="ff-grid-2">
            <F l="Sale Value (₹) *" v={form.saleValue} c={v => setForm({ ...form, saleValue: v })} />
            <F l="Purchase Value (₹) *" v={form.purchaseValue} c={v => setForm({ ...form, purchaseValue: v })} />
          </div>

          {form.gainType === 'long-term' && (
            <F l="Indexed Cost (₹)" v={form.indexedCost} c={v => setForm({ ...form, indexedCost: v })} h="Cost after indexation. Leave blank to use purchase value." />
          )}

          <div className="ff-grid-2">
            <F l="Expenses (₹)" v={form.expenses} c={v => setForm({ ...form, expenses: v })} h="Brokerage, stamp duty, etc." />
            <F l="Exemption (₹)" v={form.exemption} c={v => setForm({ ...form, exemption: v })} h="Under Section 54, 54EC, 54F" />
          </div>

          {/* Live preview */}
          <div className="step-card summary" style={{ marginTop: '8px' }}>
            <span className="ff-row-label">Taxable Gain: </span>
            <span className={`ff-row-value bold ${computeGain(form) < 0 ? 'green' : ''}`}>
              ₹{computeGain(form).toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveTxn} className="ff-btn ff-btn-primary">Save Transaction</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {!form && <button onClick={startAdd} className="ff-btn ff-btn-add"><Plus size={18} /> Add Transaction</button>}

      {/* Totals */}
      {transactions.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Short-Term Capital Gains</span>
            <span className="ff-row-value">₹{stcg.toLocaleString('en-IN')}</span>
          </div>
          <div className="ff-row">
            <span className="ff-row-label">Long-Term Capital Gains</span>
            <span className="ff-row-value">₹{ltcg.toLocaleString('en-IN')}</span>
          </div>
          <div className="ff-divider" />
          <div className="ff-row">
            <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Capital Gains</span>
            <span className="ff-row-value bold">₹{(stcg + ltcg).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="ff-nav">
        <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>
        <div className="spacer" />
        <button onClick={handleNext} disabled={isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next: Other Income'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default CapitalGainsStep;
