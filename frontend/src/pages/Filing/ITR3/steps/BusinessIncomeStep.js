/**
 * Business Income Step — ITR-3
 * Add businesses with P&L details
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../filing-flow.css';

const EMPTY_BIZ = {
  name: '', natureOfBusiness: '', turnover: '', grossProfit: '',
  expenses: { rent: '', salary: '', interest: '', repairs: '', insurance: '', utilities: '', travel: '', professional: '', office: '', other: '' },
  depreciation: '',
};

const F = ({ l, v, c, h, p, t = 'number' }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={p || '0'} />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const BusinessIncomeStep = ({ payload, onSave, onBack, isSaving, isFirstStep }) => {
  const existing = payload?.income?.business?.businesses || [];
  const [businesses, setBusinesses] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY_BIZ, expenses: { ...EMPTY_BIZ.expenses } } : null);

  const n = (v) => Number(v) || 0;
  const sumExp = (e) => Object.values(e || {}).reduce((s, v) => s + n(v), 0);

  const startAdd = () => { setForm({ ...EMPTY_BIZ, expenses: { ...EMPTY_BIZ.expenses } }); setEditing(businesses.length); };
  const startEdit = (i) => { setForm({ ...businesses[i], expenses: { ...EMPTY_BIZ.expenses, ...businesses[i].expenses } }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveBiz = () => {
    if (!form.name) return;
    const updated = [...businesses];
    const exp = {};
    for (const [k, v] of Object.entries(form.expenses)) exp[k] = n(v);
    updated[editing] = { ...form, turnover: n(form.turnover), grossProfit: n(form.grossProfit), expenses: exp, depreciation: n(form.depreciation) };
    setBusinesses(updated);
    setForm(null); setEditing(null);
  };

  const removeBiz = (i) => setBusinesses(businesses.filter((_, idx) => idx !== i));

  const totalNet = businesses.reduce((s, b) => s + (n(b.grossProfit) - sumExp(b.expenses) - n(b.depreciation)), 0);

  const handleNext = () => {
    if (businesses.length === 0) return;
    onSave({ income: { business: { businesses } } });
  };

  return (
    <div>
      <h2 className="step-title">Business / Profession Income</h2>
      <p className="step-desc">Add your business details with profit & loss information</p>

      {businesses.map((b, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">{b.name}</p>
              <p className="ff-item-detail">Turnover: ₹{n(b.turnover).toLocaleString('en-IN')} · Net Profit: ₹{(n(b.grossProfit) - sumExp(b.expenses) - n(b.depreciation)).toLocaleString('en-IN')}</p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeBiz(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <F l="Business Name *" v={form.name} c={v => setForm({ ...form, name: v })} t="text" p="My Business" />
            <F l="Nature of Business" v={form.natureOfBusiness} c={v => setForm({ ...form, natureOfBusiness: v })} t="text" p="e.g., Retail, Consulting" />
          </div>
          <div className="ff-grid-2">
            <F l="Turnover / Gross Receipts (₹)" v={form.turnover} c={v => setForm({ ...form, turnover: v })} />
            <F l="Gross Profit (₹)" v={form.grossProfit} c={v => setForm({ ...form, grossProfit: v })} />
          </div>

          <p className="ff-section-title" style={{ marginTop: '12px' }}>Expenses</p>
          <div className="ff-grid-3">
            {Object.entries(EMPTY_BIZ.expenses).map(([key]) => (
              <F key={key} l={key.charAt(0).toUpperCase() + key.slice(1)} v={form.expenses[key]} c={v => setForm({ ...form, expenses: { ...form.expenses, [key]: v } })} />
            ))}
          </div>
          <p className="ff-hint" style={{ marginBottom: '8px' }}>Total Expenses: ₹{sumExp(form.expenses).toLocaleString('en-IN')}</p>

          <F l="Depreciation (₹)" v={form.depreciation} c={v => setForm({ ...form, depreciation: v })} />

          <div className="step-card summary" style={{ marginTop: '8px' }}>
            <span className="ff-row-label">Net Profit: </span>
            <span className="ff-row-value bold">₹{(n(form.grossProfit) - sumExp(form.expenses) - n(form.depreciation)).toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveBiz} className="ff-btn ff-btn-primary">Save Business</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {!form && <button onClick={startAdd} className="ff-btn ff-btn-add"><Plus size={18} /> Add Business</button>}

      {businesses.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Total Net Business Profit</span>
            <span className={`ff-row-value bold ${totalNet < 0 ? 'red' : ''}`}>₹{totalNet.toLocaleString('en-IN')}</span>
          </div>
          {businesses.some(b => n(b.turnover) > 10000000) && <p className="ff-hint" style={{ color: '#d97706', marginTop: '4px' }}>⚠ Turnover exceeds ₹1Cr — tax audit may be required (Section 44AB)</p>}
        </div>
      )}

      <div className="ff-nav">
        {!isFirstStep && <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>}
        <div className="spacer" />
        <button onClick={handleNext} disabled={businesses.length === 0 || isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default BusinessIncomeStep;
