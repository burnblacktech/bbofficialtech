import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const EMPTY = { assetType: 'equity', gainType: 'LTCG', saleValue: '', purchaseValue: '', indexedCost: '', expenses: '', exemption: '' };

export default function CapitalGainsEditor({ payload, onSave, isSaving }) {
  const existing = payload?.income?.capitalGains?.transactions || [];
  const [txns, setTxns] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);

  const save = () => {
    if (!form?.saleValue) return;
    const updated = [...txns];
    updated[editing] = { ...form, saleValue: n(form.saleValue), purchaseValue: n(form.purchaseValue), indexedCost: n(form.indexedCost), expenses: n(form.expenses), exemption: n(form.exemption) };
    setTxns(updated); setForm(null); setEditing(null);
    onSave({ income: { capitalGains: { transactions: updated } } });
  };

  const remove = (i) => {
    const updated = txns.filter((_, idx) => idx !== i);
    setTxns(updated);
    onSave({ income: { capitalGains: { transactions: updated } } });
  };

  const gain = (t) => n(t.saleValue) - (n(t.indexedCost) || n(t.purchaseValue)) - n(t.expenses) - n(t.exemption);
  const stcg = txns.filter(t => t.gainType === 'STCG').reduce((s, t) => s + gain(t), 0);
  const ltcg = txns.filter(t => t.gainType === 'LTCG').reduce((s, t) => s + gain(t), 0);

  return (
    <div>
      <h2 className="step-title">Capital Gains</h2>
      <p className="step-desc">Gains from sale of shares, mutual funds, property</p>

      {txns.map((t, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{t.assetType} — {t.gainType}</div>
              <div className="ff-item-detail">Gain: ₹{gain(t).toLocaleString('en-IN')}</div>
            </div>
            <div className="ff-item-actions">
              <button className="ff-btn-ghost" onClick={() => { setForm({ ...t }); setEditing(i); }}><Edit2 size={15} /></button>
              <button className="ff-btn-danger" onClick={() => remove(i)}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <div className="ff-field">
              <label className="ff-label">Asset Type</label>
              <select className="ff-select" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })}>
                {['equity', 'mutualFund', 'property', 'other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="ff-field">
              <label className="ff-label">Gain Type</label>
              <select className="ff-select" value={form.gainType} onChange={e => setForm({ ...form, gainType: e.target.value })}>
                <option value="STCG">Short Term (STCG)</option>
                <option value="LTCG">Long Term (LTCG)</option>
              </select>
            </div>
          </div>
          <div className="ff-grid-2">
            <F l="Sale Value (₹)" v={form.saleValue} c={v => setForm({ ...form, saleValue: v })} />
            <F l="Purchase Value (₹)" v={form.purchaseValue} c={v => setForm({ ...form, purchaseValue: v })} />
          </div>
          <div className="ff-grid-3">
            <F l="Indexed Cost (₹)" v={form.indexedCost} c={v => setForm({ ...form, indexedCost: v })} h="For LTCG" />
            <F l="Expenses (₹)" v={form.expenses} c={v => setForm({ ...form, expenses: v })} />
            <F l="Exemption (₹)" v={form.exemption} c={v => setForm({ ...form, exemption: v })} h="54/54EC/54F" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {!form && <button className="ff-btn ff-btn-add" onClick={() => { setForm({ ...EMPTY }); setEditing(txns.length); }}><Plus size={15} /> Add Transaction</button>}

      {txns.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row"><span className="ff-row-label">STCG Total</span><span className={`ff-row-value bold ${stcg < 0 ? 'red' : ''}`}>₹{stcg.toLocaleString('en-IN')}</span></div>
          <div className="ff-row"><span className="ff-row-label">LTCG Total</span><span className={`ff-row-value bold ${ltcg < 0 ? 'red' : ''}`}>₹{ltcg.toLocaleString('en-IN')}</span></div>
          <div className="ff-divider" />
          <div className="ff-row"><span className="ff-row-label">Net Capital Gains</span><span className="ff-row-value bold">₹{(stcg + ltcg).toLocaleString('en-IN')}</span></div>
        </div>
      )}
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
