import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { validateForeignIncomeStep } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const EMPTY = { country: '', incomeType: 'salary', amountINR: '', taxPaidAbroad: '', dtaa: false };

export default function ForeignIncomeEditor({ payload, onSave, isSaving }) {
  const existing = payload?.income?.foreignIncome?.incomes || [];
  const [incomes, setIncomes] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});

  const save = () => {
    if (!form?.country || !form?.amountINR) { setErrors({ _form: 'Country and amount are required' }); return; }
    const updated = [...incomes];
    updated[editing] = { ...form, amountINR: n(form.amountINR), taxPaidAbroad: n(form.taxPaidAbroad) };
    const v = validateForeignIncomeStep(updated);
    setErrors(v.valid ? {} : v.errors);
    setIncomes(updated); setForm(null); setEditing(null);
    onSave({ income: { foreignIncome: { incomes: updated } } });
  };

  const remove = (i) => {
    const updated = incomes.filter((_, idx) => idx !== i);
    setIncomes(updated);
    onSave({ income: { foreignIncome: { incomes: updated } } });
  };

  const total = incomes.reduce((s, inc) => s + n(inc.amountINR), 0);
  const dtaaCredit = incomes.filter(i => i.dtaa).reduce((s, inc) => s + n(inc.taxPaidAbroad), 0);

  return (
    <div>
      <h2 className="step-title">Income Earned Outside India</h2>
      <p className="step-desc">Income earned abroad and DTAA relief</p>

      {incomes.map((inc, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{inc.country} — {inc.incomeType}</div>
              <div className="ff-item-detail">₹{n(inc.amountINR).toLocaleString('en-IN')}{inc.dtaa ? ' · DTAA' : ''}</div>
            </div>
            <div className="ff-item-actions">
              <button className="ff-btn-ghost" onClick={() => { setForm({ ...inc }); setEditing(i); }}><Edit2 size={15} /></button>
              <button className="ff-btn-danger" onClick={() => remove(i)}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          <div className="ff-grid-3">
            <F l="Country *" v={form.country} c={v => setForm({ ...form, country: v })} t="text" />
            <div className="ff-field">
              <label className="ff-label">Income Type</label>
              <select className="ff-select" value={form.incomeType} onChange={e => setForm({ ...form, incomeType: e.target.value })}>
                {['salary', 'interest', 'dividend', 'capitalGains', 'rental', 'other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <F l="Amount in INR (₹) *" v={form.amountINR} c={v => setForm({ ...form, amountINR: v })} />
          </div>
          <div className="ff-grid-3">
            <F l="Tax Paid Abroad (₹)" v={form.taxPaidAbroad} c={v => setForm({ ...form, taxPaidAbroad: v })} />
          </div>
          <label className="ff-check"><input type="checkbox" checked={form.dtaa} onChange={e => setForm({ ...form, dtaa: e.target.checked })} /> Claim DTAA relief</label>
          <div className="ff-hint" style={{ marginTop: 4 }}>If you earned abroad and paid tax there, you may claim DTAA relief to avoid double taxation</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {!form && <button className="ff-btn ff-btn-add" onClick={() => { setForm({ ...EMPTY }); setEditing(incomes.length); setErrors({}); }}><Plus size={15} /> Add Foreign Income</button>}

      {Object.keys(errors).length > 0 && (
        <div className="ff-errors">
          <div className="ff-errors-title"><AlertCircle size={14} /> Validation</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {incomes.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row"><span className="ff-row-label">Total Foreign Income</span><span className="ff-row-value bold">₹{total.toLocaleString('en-IN')}</span></div>
          {dtaaCredit > 0 && <div className="ff-row"><span className="ff-row-label">DTAA Credit</span><span className="ff-row-value green">₹{dtaaCredit.toLocaleString('en-IN')}</span></div>}
        </div>
      )}
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
