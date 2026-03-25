/**
 * Presumptive Income Step — ITR-4
 * Section 44AD (business), 44ADA (profession), 44AE (goods carriage)
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../filing-flow.css';

const SECTIONS = [
  { value: '44AD', label: '44AD — Business', desc: 'Turnover ≤ ₹2Cr. Income = 8% (cash) or 6% (digital)' },
  { value: '44ADA', label: '44ADA — Profession', desc: 'Receipts ≤ ₹75L. Income = 50% of receipts' },
  { value: '44AE', label: '44AE — Goods Carriage', desc: '₹7,500 per vehicle per month' },
];

const EMPTY_ENTRY = { section: '44AD', businessName: '', grossReceipts: '', declaredIncome: '', digitalReceipts: false, vehicles: '', monthsOwned: '12' };

const F = ({ l, v, c, h, p, t = 'number' }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={p || '0'} />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const PresumptiveIncomeStep = ({ payload, onSave, onBack, isSaving, isFirstStep }) => {
  const existing = payload?.income?.presumptive?.entries || [];
  const [entries, setEntries] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY_ENTRY } : null);

  const n = (v) => Number(v) || 0;

  const computeIncome = (e) => {
    const receipts = n(e.grossReceipts);
    if (e.section === '44AD') return Math.max(n(e.declaredIncome), Math.round(receipts * (e.digitalReceipts ? 6 : 8) / 100));
    if (e.section === '44ADA') return Math.max(n(e.declaredIncome), Math.round(receipts * 50 / 100));
    if (e.section === '44AE') return n(e.vehicles) * 7500 * n(e.monthsOwned || 12);
    return 0;
  };

  const startAdd = () => { setForm({ ...EMPTY_ENTRY }); setEditing(entries.length); };
  const startEdit = (i) => { setForm({ ...entries[i] }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveEntry = () => {
    if (!form.section) return;
    const updated = [...entries];
    updated[editing] = { ...form, grossReceipts: n(form.grossReceipts), declaredIncome: n(form.declaredIncome), vehicles: n(form.vehicles), monthsOwned: n(form.monthsOwned || 12) };
    setEntries(updated);
    setForm(null); setEditing(null);
  };

  const removeEntry = (i) => setEntries(entries.filter((_, idx) => idx !== i));
  const totalIncome = entries.reduce((s, e) => s + computeIncome(e), 0);
  const totalReceipts = entries.reduce((s, e) => s + n(e.grossReceipts), 0);

  const handleNext = () => {
    if (entries.length === 0) return;
    onSave({ income: { presumptive: { entries } } });
  };

  return (
    <div>
      <h2 className="step-title">Presumptive Income</h2>
      <p className="step-desc">Simplified taxation — no detailed books required</p>

      {entries.map((e, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">{e.businessName || SECTIONS.find(s => s.value === e.section)?.label}</p>
              <p className="ff-item-detail">Receipts: ₹{n(e.grossReceipts).toLocaleString('en-IN')} · Income: ₹{computeIncome(e).toLocaleString('en-IN')}</p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeEntry(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          {/* Section selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {SECTIONS.map(s => (
              <div key={s.value} onClick={() => setForm({ ...form, section: s.value })} className={`ff-option ${form.section === s.value ? 'selected' : ''}`}>
                <p className="ff-option-label">{s.value}</p>
                <p className="ff-option-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <F l="Business/Profession Name" v={form.businessName} c={v => setForm({ ...form, businessName: v })} t="text" p="My Business" />

          {form.section !== '44AE' ? (
            <>
              <F l="Gross Receipts / Turnover (₹)" v={form.grossReceipts} c={v => setForm({ ...form, grossReceipts: v })} />
              {form.section === '44AD' && (
                <label className="ff-check">
                  <input type="checkbox" checked={form.digitalReceipts} onChange={e => setForm({ ...form, digitalReceipts: e.target.checked })} />
                  Receipts are through digital/banking channels (6% rate instead of 8%)
                </label>
              )}
              <F l="Declared Income (₹)" v={form.declaredIncome} c={v => setForm({ ...form, declaredIncome: v })} h={`Minimum: ₹${computeIncome(form).toLocaleString('en-IN')} (${form.section === '44AD' ? (form.digitalReceipts ? '6%' : '8%') : '50%'} of receipts)`} />
            </>
          ) : (
            <div className="ff-grid-2">
              <F l="Number of Vehicles" v={form.vehicles} c={v => setForm({ ...form, vehicles: v })} />
              <F l="Months Owned" v={form.monthsOwned} c={v => setForm({ ...form, monthsOwned: v })} />
            </div>
          )}

          <div className="step-card summary" style={{ marginTop: '8px' }}>
            <span className="ff-row-label">Presumptive Income: </span>
            <span className="ff-row-value bold">₹{computeIncome(form).toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveEntry} className="ff-btn ff-btn-primary">Save</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {!form && <button onClick={startAdd} className="ff-btn ff-btn-add"><Plus size={18} /> Add Income Source</button>}

      {entries.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Total Presumptive Income</span>
            <span className="ff-row-value bold">₹{totalIncome.toLocaleString('en-IN')}</span>
          </div>
          {totalReceipts > 20000000 && <p className="ff-hint" style={{ color: '#ef4444', marginTop: '4px' }}>⚠ Total receipts exceed ₹2Cr — you need ITR-3 instead</p>}
        </div>
      )}

      <div className="ff-nav">
        {!isFirstStep && <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>}
        <div className="spacer" />
        <button onClick={handleNext} disabled={entries.length === 0 || isSaving} className="ff-btn ff-btn-primary">{isSaving ? 'Saving...' : 'Next'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

export default PresumptiveIncomeStep;
