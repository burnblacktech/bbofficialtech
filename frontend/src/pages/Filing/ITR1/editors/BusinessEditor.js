import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const P_EMPTY = { section: '44AD', grossReceipts: '', isDigital: true, declaredIncome: '' };
const R_EMPTY = { name: '', turnover: '', grossProfit: '', expenses: { rent: '', salary: '', interest: '', other: '' }, depreciation: '' };

export default function BusinessEditor({ payload, onSave, isSaving }) {
  const [mode, setMode] = useState(payload?.income?.presumptive ? 'presumptive' : payload?.income?.business ? 'regular' : 'presumptive');
  const pEntries = payload?.income?.presumptive?.entries || [];
  const rEntries = payload?.income?.business?.businesses || [];
  const [pList, setPList] = useState(pEntries);
  const [rList, setRList] = useState(rEntries);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  const minRate = (f) => f?.section === '44ADA' ? 50 : f?.isDigital ? 6 : 8;

  const saveP = () => {
    if (!form?.grossReceipts) { setErrors({ _form: 'Gross receipts required' }); return; }
    const minIncome = Math.round(n(form.grossReceipts) * minRate(form) / 100);
    if (n(form.declaredIncome) < minIncome) {
      setErrors({ income: `Declared income must be at least ${minRate(form)}% of receipts (₹${minIncome.toLocaleString('en-IN')})` });
    } else { setErrors({}); }
    const updated = [...pList]; updated[editing] = { ...form, grossReceipts: n(form.grossReceipts), declaredIncome: Math.max(n(form.declaredIncome), minIncome) };
    setPList(updated); setForm(null); setEditing(null);
    onSave({ income: { presumptive: { entries: updated } } });
  };

  const saveR = () => {
    if (!form?.name) { setErrors({ _form: 'Business name required' }); return; }
    setErrors({});
    const updated = [...rList]; updated[editing] = { ...form, turnover: n(form.turnover), grossProfit: n(form.grossProfit), depreciation: n(form.depreciation), expenses: { rent: n(form.expenses?.rent), salary: n(form.expenses?.salary), interest: n(form.expenses?.interest), other: n(form.expenses?.other) } };
    setRList(updated); setForm(null); setEditing(null);
    onSave({ income: { business: { businesses: updated } } });
  };

  const remove = (list, setList, key, i) => {
    const updated = list.filter((_, idx) => idx !== i);
    setList(updated);
    onSave({ income: { [key]: key === 'presumptive' ? { entries: updated } : { businesses: updated } } });
  };

  const items = mode === 'presumptive' ? pList : rList;
  const netExp = (b) => n(b.expenses?.rent) + n(b.expenses?.salary) + n(b.expenses?.interest) + n(b.expenses?.other);

  return (
    <div>
      <h2 className="step-title">Business Income</h2>
      <p className="step-desc">Presumptive or regular business income</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['presumptive', 'Presumptive (44AD/ADA/AE)'], ['regular', 'Regular Books']].map(([k, label]) => (
          <div key={k} className={`ff-option${mode === k ? ' selected' : ''}`} onClick={() => setMode(k)}>
            <div className="ff-option-label">{label}</div>
          </div>
        ))}
      </div>

      {items.map((item, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{mode === 'presumptive' ? `${item.section} — ₹${n(item.grossReceipts).toLocaleString('en-IN')}` : item.name}</div>
              <div className="ff-item-detail">{mode === 'presumptive' ? `Declared: ₹${n(item.declaredIncome).toLocaleString('en-IN')}` : `Turnover: ₹${n(item.turnover).toLocaleString('en-IN')}`}</div>
            </div>
            <div className="ff-item-actions">
              <button className="ff-btn-ghost" onClick={() => { setForm({ ...item }); setEditing(i); }}><Edit2 size={15} /></button>
              <button className="ff-btn-danger" onClick={() => remove(mode === 'presumptive' ? pList : rList, mode === 'presumptive' ? setPList : setRList, mode === 'presumptive' ? 'presumptive' : 'business', i)}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && mode === 'presumptive' && (
        <div className="step-card editing">
          <div className="ff-field">
            <label className="ff-label">Section</label>
            <select className="ff-select" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
              <option value="44AD">44AD — Business</option><option value="44ADA">44ADA — Profession</option><option value="44AE">44AE — Goods Carriage</option>
            </select>
          </div>
          <F l="Gross Receipts (₹)" v={form.grossReceipts} c={v => setForm({ ...form, grossReceipts: v })} />
          <label className="ff-check"><input type="checkbox" checked={form.isDigital} onChange={e => setForm({ ...form, isDigital: e.target.checked })} /> Digital receipts ({'>'} 95%)</label>
          <F l="Declared Income (₹)" v={form.declaredIncome} c={v => setForm({ ...form, declaredIncome: v })} h={`Min ${minRate(form)}% of receipts = ₹${Math.round(n(form.grossReceipts) * minRate(form) / 100).toLocaleString('en-IN')}`} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={saveP} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {form && mode === 'regular' && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <F l="Business Name *" v={form.name} c={v => setForm({ ...form, name: v })} t="text" />
            <F l="Turnover (₹)" v={form.turnover} c={v => setForm({ ...form, turnover: v })} />
          </div>
          <F l="Gross Profit (₹)" v={form.grossProfit} c={v => setForm({ ...form, grossProfit: v })} />
          <div className="ff-section-title">Expenses</div>
          <div className="ff-grid-2">
            <F l="Rent" v={form.expenses?.rent} c={v => setForm({ ...form, expenses: { ...form.expenses, rent: v } })} />
            <F l="Salary" v={form.expenses?.salary} c={v => setForm({ ...form, expenses: { ...form.expenses, salary: v } })} />
            <F l="Interest" v={form.expenses?.interest} c={v => setForm({ ...form, expenses: { ...form.expenses, interest: v } })} />
            <F l="Other" v={form.expenses?.other} c={v => setForm({ ...form, expenses: { ...form.expenses, other: v } })} />
          </div>
          <F l="Depreciation (₹)" v={form.depreciation} c={v => setForm({ ...form, depreciation: v })} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={saveR} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {!form && <button className="ff-btn ff-btn-add" onClick={() => { setForm(mode === 'presumptive' ? { ...P_EMPTY } : { ...R_EMPTY }); setEditing(items.length); setErrors({}); }}><Plus size={15} /> Add {mode === 'presumptive' ? 'Entry' : 'Business'}</button>}

      {Object.keys(errors).length > 0 && (
        <div className="ff-errors">
          <div className="ff-errors-title"><AlertCircle size={14} /> Validation</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row"><span className="ff-row-label">Total Income</span><span className="ff-row-value bold">₹{(mode === 'presumptive' ? pList.reduce((s, e) => s + n(e.declaredIncome), 0) : rList.reduce((s, b) => s + n(b.grossProfit) - netExp(b) - n(b.depreciation), 0)).toLocaleString('en-IN')}</span></div>
        </div>
      )}
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
