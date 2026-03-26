import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { validateSalaryStep } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const EMPTY = { name: '', tan: '', grossSalary: '', tdsDeducted: '', allowances: { hra: { received: '', exempt: '' }, lta: { exempt: '' } }, deductions: { professionalTax: '' } };

export default function SalaryEditor({ payload, onSave, isSaving }) {
  const existing = payload?.income?.salary?.employers || [];
  const [employers, setEmployers] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});

  const save = () => {
    if (!form?.name || !form?.grossSalary) {
      setErrors({ _form: 'Employer name and gross salary are required' });
      return;
    }
    const updated = [...employers];
    updated[editing] = { ...form, grossSalary: n(form.grossSalary), tdsDeducted: n(form.tdsDeducted), deductions: { professionalTax: n(form.deductions?.professionalTax) } };
    // Validate
    const v = validateSalaryStep(updated);
    if (!v.valid) { setErrors(v.errors); }
    else { setErrors({}); }
    // Save even with warnings (caps are enforced in computation)
    setEmployers(updated);
    setForm(null); setEditing(null);
    onSave({ income: { salary: { employers: updated } } });
  };

  const remove = (i) => {
    const updated = employers.filter((_, idx) => idx !== i);
    setEmployers(updated);
    onSave({ income: { salary: { employers: updated } } });
  };

  return (
    <div>
      <h2 className="step-title">Salary Income</h2>
      <p className="step-desc">Add employer details from Form 16</p>

      {employers.map((emp, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <div className="ff-item-name">{emp.name}</div>
              <div className="ff-item-detail">Gross: ₹{n(emp.grossSalary).toLocaleString('en-IN')} · TDS: ₹{n(emp.tdsDeducted).toLocaleString('en-IN')}</div>
            </div>
            <div className="ff-item-actions">
              <button className="ff-btn-ghost" onClick={() => { setForm({ ...emp }); setEditing(i); }}><Edit2 size={15} /></button>
              <button className="ff-btn-danger" onClick={() => remove(i)}><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      {form && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <F l="Employer Name *" v={form.name} c={v => setForm({ ...form, name: v })} t="text" />
            <F l="TAN" v={form.tan} c={v => setForm({ ...form, tan: v.toUpperCase() })} t="text" />
          </div>
          <div className="ff-grid-2">
            <F l="Gross Salary (₹) *" v={form.grossSalary} c={v => setForm({ ...form, grossSalary: v })} />
            <F l="TDS Deducted (₹)" v={form.tdsDeducted} c={v => setForm({ ...form, tdsDeducted: v })} />
          </div>
          <div className="ff-grid-3">
            <F l="HRA Received" v={form.allowances?.hra?.received} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, received: v } } })} />
            <F l="HRA Exempt" v={form.allowances?.hra?.exempt} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: v } } })} />
            <F l="Professional Tax" v={form.deductions?.professionalTax} c={v => setForm({ ...form, deductions: { ...form.deductions, professionalTax: v } })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ff-btn ff-btn-primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setForm(null); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {!form && <button className="ff-btn ff-btn-add" onClick={() => { setForm({ ...EMPTY }); setEditing(employers.length); setErrors({}); }}><Plus size={15} /> Add Employer</button>}

      {Object.keys(errors).length > 0 && (
        <div className="ff-errors">
          <div className="ff-errors-title"><AlertCircle size={14} /> Validation</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {employers.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row"><span className="ff-row-label">Total Gross</span><span className="ff-row-value bold">₹{employers.reduce((s, e) => s + n(e.grossSalary), 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-row"><span className="ff-row-label">Std Deduction</span><span className="ff-row-value">- ₹75,000</span></div>
          <div className="ff-row"><span className="ff-row-label">Total TDS</span><span className="ff-row-value green">₹{employers.reduce((s, e) => s + n(e.tdsDeducted), 0).toLocaleString('en-IN')}</span></div>
        </div>
      )}
    </div>
  );
}

const F = ({ l, v, c, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" /></div>);
