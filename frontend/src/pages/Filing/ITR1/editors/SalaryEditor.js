import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Info } from 'lucide-react';
import { validateSalaryStep } from '../../../../utils/itrValidation';
import { isMetroCity } from '../../../../constants/indianStates';
import TaxWhisper from '../../../../components/common/TaxWhisper';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const EMPTY = {
  name: '', tan: '', grossSalary: '', tdsDeducted: '',
  allowances: { hra: { received: '', exempt: '' }, lta: { exempt: '' } },
  deductions: { professionalTax: '' },
  gratuityReceived: '', leaveEncashmentReceived: '', commutedPensionReceived: '',
  entertainmentAllowance: '', basicPlusDA: '', cityOfEmployment: '', rentPaid: '',
};

export default function SalaryEditor({ payload, onSave, isSaving, whispers }) {
  const existing = payload?.income?.salary?.employers || [];
  const employerCategory = payload?.personalInfo?.employerCategory || 'OTH';
  const [employers, setEmployers] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});

  // HRA auto-calculation hint
  const suggestedHRA = useMemo(() => {
    if (!form) return null;
    const hraReceived = n(form.allowances?.hra?.received);
    const basicDA = n(form.basicPlusDA);
    const rent = n(form.rentPaid);
    if (!hraReceived || !basicDA || !rent) return null;
    const metro = isMetroCity(form.cityOfEmployment);
    const metroRate = metro ? 0.50 : 0.40;
    const val = Math.max(0, Math.min(hraReceived, rent - 0.10 * basicDA, metroRate * basicDA));
    return { amount: Math.round(val), isMetro: metro };
  }, [form]);

  const save = () => {
    if (!form?.name || !form?.grossSalary) {
      setErrors({ _form: 'Employer name and gross salary are required' });
      return;
    }
    const updated = [...employers];
    updated[editing] = {
      ...form,
      grossSalary: n(form.grossSalary),
      tdsDeducted: n(form.tdsDeducted),
      deductions: { professionalTax: n(form.deductions?.professionalTax) },
      gratuityReceived: n(form.gratuityReceived),
      leaveEncashmentReceived: n(form.leaveEncashmentReceived),
      commutedPensionReceived: n(form.commutedPensionReceived),
      entertainmentAllowance: n(form.entertainmentAllowance),
      basicPlusDA: n(form.basicPlusDA),
      cityOfEmployment: form.cityOfEmployment || '',
      rentPaid: n(form.rentPaid),
    };
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
      <p className="step-desc">Enter your employer details from Form 16. If you changed jobs this year, add each employer separately.</p>

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
            <F l="Employer Name *" v={form.name} c={v => setForm({ ...form, name: v })} t="text" h="Company that pays your salary · Form 16 header" />
            <F l="Employer TAN" v={form.tan} c={v => setForm({ ...form, tan: v.toUpperCase() })} t="text" h="10-character Tax Deduction Number · Form 16 Part A" />
          </div>
          <div className="ff-grid-2">
            <F l="Total Salary (₹) *" v={form.grossSalary} c={v => setForm({ ...form, grossSalary: v })} h="Total CTC for the year · Form 16 Part B, Sr. No. 1" />
            <F l="Tax Deducted by Employer (₹)" v={form.tdsDeducted} c={v => setForm({ ...form, tdsDeducted: v })} h="Tax deducted by employer · Form 16 Part A, last row" />
          </div>
          <div className="ff-grid-3">
            <F l="HRA Received" v={form.allowances?.hra?.received} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, received: v } } })} h="House Rent Allowance · From salary slip" />
            <F l="HRA Exempt" v={form.allowances?.hra?.exempt} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: v } } })} h="Tax-free HRA portion · Form 16 Part B" />
            <F l="Professional Tax" v={form.deductions?.professionalTax} c={v => setForm({ ...form, deductions: { ...form.deductions, professionalTax: v } })} h="State tax on salary · Usually ₹200/month" />
          </div>

          {suggestedHRA && (
            <div className="ff-hint" style={{ marginTop: 4, color: P.secondary || '#0D9488' }}>
              <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Suggested HRA exemption: ₹{suggestedHRA.amount.toLocaleString('en-IN')} (based on {suggestedHRA.isMetro ? 'metro' : 'non-metro'} rate)
            </div>
          )}

          {/* Retirement Benefits & Allowances */}
          {employerCategory !== 'NA' && (
            <div style={{ marginTop: 16 }}>
              <h4 className="ff-label" style={{ fontWeight: 600, marginBottom: 8 }}>Retirement Benefits &amp; Allowances</h4>

              {employerCategory === 'GOV' && (
                <div className="ff-hint" style={{ marginBottom: 8, color: '#16a34a' }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Government employees: gratuity and leave encashment are fully exempt
                </div>
              )}
              {(employerCategory === 'OTH' || employerCategory === 'PSU') && (
                <div className="ff-hint" style={{ marginBottom: 8, color: P.warning }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Gratuity exempt up to ₹20L, leave encashment up to ₹25L
                </div>
              )}
              {employerCategory === 'PE' && (
                <div className="ff-hint" style={{ marginBottom: 8, color: P.warning }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Pension income is fully taxable as salary
                </div>
              )}

              <div className="ff-grid-2">
                <F l="Gratuity Received (₹)" v={form.gratuityReceived} c={v => setForm({ ...form, gratuityReceived: v })} h="Lump sum on retirement · Exempt limits vary by employer type" />
                <F l="Leave Encashment Received (₹)" v={form.leaveEncashmentReceived} c={v => setForm({ ...form, leaveEncashmentReceived: v })} h="Unused leave payout · Exempt limits vary by employer type" />
              </div>

              {(employerCategory === 'PE' || employerCategory === 'GOV' || employerCategory === 'OTH' || employerCategory === 'PSU') && (
                <div className="ff-grid-2">
                  <F l="Commuted Pension Received (₹)" v={form.commutedPensionReceived} c={v => setForm({ ...form, commutedPensionReceived: v })} h="One-time pension payout · Partial exemption applies" />
                  {employerCategory === 'GOV' && (
                    <F l="Entertainment Allowance (₹)" v={form.entertainmentAllowance} c={v => setForm({ ...form, entertainmentAllowance: v })} h="Govt employees only · Max ₹5,000 deduction" />
                  )}
                </div>
              )}

              <div className="ff-grid-3">
                <F l="Basic + DA (₹)" v={form.basicPlusDA} c={v => setForm({ ...form, basicPlusDA: v })} h="Basic salary + DA · For HRA calculation" />
                <F l="City of Employment" v={form.cityOfEmployment} c={v => setForm({ ...form, cityOfEmployment: v })} t="text" h="Office location · Metro cities get 50% HRA rate" />
                <F l="Rent Paid (₹)" v={form.rentPaid} c={v => setForm({ ...form, rentPaid: v })} h="Annual rent paid · For HRA exemption calculation" />
              </div>
            </div>
          )}

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

      <TaxWhisper whispers={whispers} />
    </div>
  );
}

const F = ({ l, v, c, t = 'number', h }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
