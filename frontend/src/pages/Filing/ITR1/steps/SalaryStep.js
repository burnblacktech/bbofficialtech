/**
 * Salary Income Step — ITR-1
 * Add/edit employers with salary details
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { validateSalaryStep } from '../../../../utils/itrValidation';
import ValidationErrors from '../../../../components/ValidationErrors';
import '../../filing-flow.css';

const EMPTY_EMPLOYER = {
  name: '', tan: '', employerType: 'PRIVATE',
  periodFrom: '', periodTo: '',
  grossSalary: '', allowances: { hra: { received: '', exempt: '' }, lta: { exempt: '' } },
  deductions: { professionalTax: '' },
  tdsDeducted: '',
};

const num = (v) => Number(v) || 0;

const F = ({ l, v, c, h, p, t = 'text', maxLength }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder={p || ''} maxLength={maxLength} />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);

const SalaryStep = ({ payload, onSave, onBack, isSaving, isFirstStep }) => {
  const existing = payload?.income?.salary?.employers || [];
  const [employers, setEmployers] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY_EMPLOYER } : null);

  const startAdd = () => { setForm({ ...EMPTY_EMPLOYER }); setEditing(employers.length); };
  const startEdit = (i) => { setForm({ ...employers[i] }); setEditing(i); };
  const cancelEdit = () => { setForm(null); setEditing(null); };

  const saveEmployer = () => {
    if (!form.name || !form.grossSalary) return;
    const updated = [...employers];
    const emp = {
      ...form,
      grossSalary: num(form.grossSalary),
      allowances: {
        hra: { received: num(form.allowances?.hra?.received), exempt: num(form.allowances?.hra?.exempt) },
        lta: { exempt: num(form.allowances?.lta?.exempt) },
      },
      deductions: { professionalTax: num(form.deductions?.professionalTax) },
      tdsDeducted: num(form.tdsDeducted),
    };
    updated[editing] = emp;
    setEmployers(updated);
    setForm(null);
    setEditing(null);
  };

  const removeEmployer = (i) => { setEmployers(employers.filter((_, idx) => idx !== i)); };

  const [validationErrors, setValidationErrors] = useState({});

  const handleNext = () => {
    const { valid, errors } = validateSalaryStep(employers);
    setValidationErrors(errors);
    if (!valid) return;
    onSave({ income: { salary: { employers } } });
  };

  const totalGross = employers.reduce((s, e) => s + num(e.grossSalary), 0);
  const totalTDS = employers.reduce((s, e) => s + num(e.tdsDeducted), 0);

  return (
    <div>
      <h2 className="step-title">Salary Income</h2>
      <p className="step-desc">Add your employer(s) and salary details from Form 16</p>

      {/* Employer List */}
      {employers.map((emp, i) => editing === i ? null : (
        <div key={i} className="step-card">
          <div className="ff-item">
            <div>
              <p className="ff-item-name">{emp.name || 'Employer'}</p>
              <p className="ff-item-detail">Gross: ₹{num(emp.grossSalary).toLocaleString('en-IN')} · TDS: ₹{num(emp.tdsDeducted).toLocaleString('en-IN')}</p>
            </div>
            <div className="ff-item-actions">
              <button onClick={() => startEdit(i)} className="ff-btn ff-btn-ghost"><Edit2 size={16} /></button>
              <button onClick={() => removeEmployer(i)} className="ff-btn ff-btn-danger"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {/* Employer Form */}
      {form && (
        <div className="step-card editing">
          <p className="ff-item-name" style={{ marginBottom: '12px' }}>{editing < employers.length ? 'Edit Employer' : 'Add Employer'}</p>

          <div className="ff-grid-2">
            <F l="Employer Name *" v={form.name} c={v => setForm({ ...form, name: v })} p="Company name" />
            <F l="TAN" v={form.tan} c={v => setForm({ ...form, tan: v.toUpperCase() })} p="DELA12345B" maxLength={10} />
          </div>

          <div className="ff-grid-2">
            <F l="Gross Salary (₹) *" v={form.grossSalary} c={v => setForm({ ...form, grossSalary: v })} t="number" p="1200000" />
            <F l="TDS Deducted (₹)" v={form.tdsDeducted} c={v => setForm({ ...form, tdsDeducted: v })} t="number" p="95000" />
          </div>

          <p className="ff-section-title" style={{ marginTop: '12px' }}>Allowances & Exemptions</p>
          <div className="ff-grid-3">
            <F l="HRA Received (₹)" v={form.allowances?.hra?.received} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, received: v } } })} t="number" />
            <F l="HRA Exempt (₹)" v={form.allowances?.hra?.exempt} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: v } } })} t="number" />
            <F l="LTA Exempt (₹)" v={form.allowances?.lta?.exempt} c={v => setForm({ ...form, allowances: { ...form.allowances, lta: { ...form.allowances?.lta, exempt: v } } })} t="number" />
          </div>

          <div className="ff-grid-2">
            <F l="Professional Tax (₹)" v={form.deductions?.professionalTax} c={v => setForm({ ...form, deductions: { ...form.deductions, professionalTax: v } })} t="number" p="2400" />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={saveEmployer} className="ff-btn ff-btn-primary">Save Employer</button>
            <button onClick={cancelEdit} className="ff-btn ff-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!form && (
        <button onClick={startAdd} className="ff-btn ff-btn-add">
          <Plus size={18} /> Add Employer
        </button>
      )}

      {/* Totals */}
      {employers.length > 0 && (
        <div className="step-card summary">
          <div className="ff-row">
            <span className="ff-row-label">Total Gross Salary</span>
            <span className="ff-row-value bold">₹{totalGross.toLocaleString('en-IN')}</span>
          </div>
          <div className="ff-row">
            <span className="ff-row-label">Standard Deduction</span>
            <span className="ff-row-value">- ₹75,000</span>
          </div>
          <div className="ff-row">
            <span className="ff-row-label">Total TDS</span>
            <span className="ff-row-value green">₹{totalTDS.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Validation */}
      <ValidationErrors errors={validationErrors} />

      {/* Navigation */}
      <div className="ff-nav">
        {!isFirstStep && <button onClick={onBack} className="ff-btn ff-btn-outline"><ArrowLeft size={16} /> Back</button>}
        <div className="spacer" />
        <button onClick={handleNext} disabled={employers.length === 0 || isSaving} className="ff-btn ff-btn-primary">
          {isSaving ? 'Saving...' : 'Next: House Property'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SalaryStep;
