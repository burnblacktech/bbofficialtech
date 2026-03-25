/**
 * Foreign Income Step — ITR-2
 * Income from outside India with DTAA support
 */

import { useState } from 'react';
import { Globe, Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../filing-flow.css';

const INCOME_TYPES = ['Salary', 'Interest', 'Dividend', 'Capital Gains', 'Rental', 'Business', 'Other'];

const EMPTY_INCOME = { country: '', incomeType: 'Salary', amountINR: '', taxPaidAbroad: '', dtaaApplicable: false };

const F = ({ l, v, c, h, p, t = 'number' }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={p || '0'} />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const ForeignIncomeStep = ({ payload, onSave, onBack, isSaving }) => {
  const existing = payload?.income?.foreignIncome?.incomes || [];
  const [incomes, setIncomes] = useState(existing);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [noForeign, setNoForeign] = useState(existing.length === 0);

  const n = (v) => Number(v) || 0;

  const startAdd = () => { setForm({ ...EMPTY_INCOME }); setEditing(incomes.length); setNoForeign(false); };
  const startEdit = (i) => { setForm({ ...incomes[i] }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveIncome = () => {
    if (!form.country || !form.amountINR) return;
    const updated = [...incomes];
    updated[editing] = { ...form, amountINR: n(form.amountINR), taxPaidAbroad: n(form.taxPaidAbroad) };
    setIncomes(updated);
    setForm(null); setEditing(null);
  };

  const removeIncome = (i) => setIncomes(incomes.filter((_, idx) => idx !== i));

  const total = incomes.reduce((s, i) => s + n(i.amountINR), 0);
  const totalTaxPaid = incomes.filter(i => i.dtaaApplicable).reduce((s, i) => s + n(i.taxPaidAbroad), 0);

  const handleNext = () => {
    onSave({ income: { foreignIncome: noForeign ? { incomes: [] } : { incomes } } });
  };

  return (
    <div>
      <h2 className="step-title">Foreign Income</h2>
      <p className="step-desc">Income earned outside India. Tax paid abroad may be eligible for DTAA credit.</p>

      {noForeign && incomes.length === 0 && (
        <div className="step-card" style={{ textAlign: 'center', padding: '32px' }}>
          <Globe size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>No foreign income? Skip this step.</p>
          <button onClick={startAdd} className="ff-btn ff-btn-outline"><Plus size={16} /> Add Foreign Income</button>
        </div>
      )}

      {incomes.map((inc, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">{inc.country} — {inc.incomeType}</p>
              <p className="ff-item-detail">₹{n(inc.amountINR).toLocaleString('en-IN')} {inc.dtaaApplicable ? `· DTAA credit: ₹${n(inc.taxPaidAbroad).toLocaleString('en-IN')}` : ''}</p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeIncome(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <F l="Country *" v={form.country} c={v => setForm({ ...form, country: v })} t="text" p="e.g., USA" />
            <div className="ff-field">
              <label className="ff-label">Income Type *</label>
              <select value={form.incomeType} onChange={e => setForm({ ...form, incomeType: e.target.value })} className="ff-select">
                {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="ff-grid-2">
            <F l="Amount in INR (₹) *" v={form.amountINR} c={v => setForm({ ...form, amountINR: v })} />
            <F l="Tax Paid Abroad (₹)" v={form.taxPaidAbroad} c={v => setForm({ ...form, taxPaidAbroad: v })} />
          </div>
          <label className="ff-check" style={{ marginTop: '8px' }}>
            <input type="checkbox" checked={form.dtaaApplicable} onChange={e => setForm({ ...form, dtaaApplicable: e.target.checked })} />
            DTAA applicable — claim foreign tax credit
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveIncome} className="ff-btn ff-btn-primary">Save</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {!form && !noForeign && <button onClick={startAdd} className="ff-btn ff-btn-add"><Plus size={18} /> Add Foreign Income</button>}

      {incomes.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Total Foreign Income</span>
            <span className="ff-row-value bold">₹{total.toLocaleString('en-IN')}</span>
          </div>
          {totalTaxPaid > 0 && (
            <div className="ff-row">
              <span className="ff-row-label">DTAA Tax Credit</span>
              <span className="ff-row-value green">₹{totalTaxPaid.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      )}

      <div className="ff-nav">
        <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>
        <div className="spacer" />
        <button onClick={handleNext} disabled={isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next: Deductions'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default ForeignIncomeStep;
