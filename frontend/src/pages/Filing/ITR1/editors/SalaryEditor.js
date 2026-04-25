import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, AlertCircle, Info, Database } from 'lucide-react';
import { validateSalaryStep } from '../../../../utils/itrValidation';
import { isMetroCity } from '../../../../constants/indianStates';
import TaxWhisper from '../../../../components/common/TaxWhisper';
import { getIncomeSummary } from '../../../../services/financeService';
import { formatCurrency } from '../../../../utils/formatCurrency';
import api from '../../../../services/api';
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

// Source labels for warn dialog
const SOURCE_LABELS = {
  '26as': '26AS', ais: 'AIS', form16: 'Form 16', form16a: 'Form 16A',
  form16b: 'Form 16B', form16c: 'Form 16C', manual: 'Manual',
};

export default function SalaryEditor({ payload, onSave, isSaving, whispers, filing }) {
  const existing = payload?.income?.salary?.employers || [];
  const employerCategory = payload?.personalInfo?.employerCategory || 'OTH';
  const fieldSources = payload?._importMeta?.fieldSources || {};
  const [employers, setEmployers] = useState(existing.length ? existing : []);
  const [editing, setEditing] = useState(existing.length === 0 ? 0 : null);
  const [form, setForm] = useState(existing.length === 0 ? { ...EMPTY } : null);
  const [errors, setErrors] = useState({});
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Tracked salary data query
  const filingFY = filing?.financialYear || filing?.assessmentYear;
  const { data: trackedIncome } = useQuery({
    queryKey: ['tracked-salary', filingFY],
    queryFn: () => getIncomeSummary(filingFY),
    staleTime: 60000,
    enabled: !!filingFY,
  });

  const trackedSalaryTotal = trackedIncome?.entries
    ?.filter(e => e.sourceType === 'salary')
    ?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0;

  const handleUseTrackedData = () => {
    if (employers.length > 0 && employers.some(e => e.name || e.grossSalary)) {
      setShowReplaceConfirm(true);
      return;
    }
    applyTrackedData();
  };

  const applyTrackedData = () => {
    const trackedEmployers = [{
      ...EMPTY,
      name: 'From Tracked Data',
      grossSalary: trackedSalaryTotal,
      tdsDeducted: 0,
      _source: 'tracked',
    }];
    setEmployers(trackedEmployers);
    setEditing(null);
    setForm(null);
    setShowReplaceConfirm(false);
    onSave({ income: { salary: { employers: trackedEmployers } } });
  };

  // Helper to get field source for a salary field path
  const getFieldSource = (fieldName, empIndex) => {
    const path = `income.salary.employers[${empIndex}].${fieldName}`;
    return fieldSources[path] || null;
  };

  // Handle manual override of a warn-locked field
  const handleManualOverride = (fieldPath, previousValue, newValue, previousSource) => {
    // Best-effort audit log
    api.post('/audit/events', {
      action: 'FIELD_MANUAL_OVERRIDE',
      metadata: { fieldPath, previousValue, newValue, previousSource, newSource: 'manual' },
    }).catch(() => { /* best-effort */ });
  };

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

      {/* Tracked data banner */}
      {trackedSalaryTotal > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Database size={14} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">
              Tracked salary: <strong>{formatCurrency(trackedSalaryTotal)}</strong>
            </span>
          </div>
          <button
            onClick={handleUseTrackedData}
            className="text-xs font-semibold px-3 py-1.5 rounded-md"
            style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
          >
            Use Tracked Data
          </button>
        </div>
      )}

      {/* Replace confirmation dialog */}
      {showReplaceConfirm && (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-4 mb-4 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)] mb-3">This will replace your current entries with tracked data. Continue?</p>
          <div className="flex gap-2">
            <button onClick={applyTrackedData} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>Replace</button>
            <button onClick={() => setShowReplaceConfirm(false)} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-light)] text-[var(--text-secondary)]">Cancel</button>
          </div>
        </div>
      )}

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
            <F l="Employer Name *" v={form.name} c={v => setForm({ ...form, name: v })} t="text" h="Company that pays your salary · Form 16 header" fieldSource={getFieldSource('name', editing)} />
            <F l="Employer TAN" v={form.tan} c={v => setForm({ ...form, tan: v.toUpperCase() })} t="text" h="10-character Tax Deduction Number · Form 16 Part A" fieldSource={getFieldSource('tan', editing)} />
          </div>
          <div className="ff-grid-2">
            <F l="Total Salary (₹) *" v={form.grossSalary} c={v => setForm({ ...form, grossSalary: v })} h="Total CTC for the year · Form 16 Part B, Sr. No. 1" fieldSource={getFieldSource('grossSalary', editing)} />
            <F l="Tax Deducted by Employer (₹)" v={form.tdsDeducted} c={v => setForm({ ...form, tdsDeducted: v })} h="Tax deducted by employer · Form 16 Part A, last row" fieldSource={getFieldSource('tdsDeducted', editing)} />
          </div>
          <div className="ff-grid-3">
            <F l="HRA Received" v={form.allowances?.hra?.received} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, received: v } } })} h="House Rent Allowance · From salary slip" fieldSource={getFieldSource('allowances.hra.received', editing)} />
            <F l="HRA Exempt" v={form.allowances?.hra?.exempt} c={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: v } } })} h="Tax-free HRA portion · Form 16 Part B" fieldSource={getFieldSource('allowances.hra.exempt', editing)} />
            <F l="Professional Tax" v={form.deductions?.professionalTax} c={v => setForm({ ...form, deductions: { ...form.deductions, professionalTax: v } })} h="State tax on salary · Usually ₹200/month" fieldSource={getFieldSource('deductions.professionalTax', editing)} />
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
                <F l="Gratuity Received (₹)" v={form.gratuityReceived} c={v => setForm({ ...form, gratuityReceived: v })} h="Lump sum on retirement · Exempt limits vary by employer type" fieldSource={getFieldSource('gratuityReceived', editing)} />
                <F l="Leave Encashment Received (₹)" v={form.leaveEncashmentReceived} c={v => setForm({ ...form, leaveEncashmentReceived: v })} h="Unused leave payout · Exempt limits vary by employer type" fieldSource={getFieldSource('leaveEncashmentReceived', editing)} />
              </div>

              {(employerCategory === 'PE' || employerCategory === 'GOV' || employerCategory === 'OTH' || employerCategory === 'PSU') && (
                <div className="ff-grid-2">
                  <F l="Commuted Pension Received (₹)" v={form.commutedPensionReceived} c={v => setForm({ ...form, commutedPensionReceived: v })} h="One-time pension payout · Partial exemption applies" fieldSource={getFieldSource('commutedPensionReceived', editing)} />
                  {employerCategory === 'GOV' && (
                    <F l="Entertainment Allowance (₹)" v={form.entertainmentAllowance} c={v => setForm({ ...form, entertainmentAllowance: v })} h="Govt employees only · Max ₹5,000 deduction" fieldSource={getFieldSource('entertainmentAllowance', editing)} />
                  )}
                </div>
              )}

              <div className="ff-grid-3">
                <F l="Basic + DA (₹)" v={form.basicPlusDA} c={v => setForm({ ...form, basicPlusDA: v })} h="Basic salary + DA · For HRA calculation" fieldSource={getFieldSource('basicPlusDA', editing)} />
                <F l="City of Employment" v={form.cityOfEmployment} c={v => setForm({ ...form, cityOfEmployment: v })} t="text" h="Office location · Metro cities get 50% HRA rate" fieldSource={getFieldSource('cityOfEmployment', editing)} />
                <F l="Rent Paid (₹)" v={form.rentPaid} c={v => setForm({ ...form, rentPaid: v })} h="Annual rent paid · For HRA exemption calculation" fieldSource={getFieldSource('rentPaid', editing)} />
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

const F = ({ l, v, c, t = 'number', h, fieldSource }) => {
  const editLock = fieldSource?.editLock || 'free';
  const isLocked = editLock === 'locked';
  return (
    <div className="ff-field">
      <label className="ff-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {l}
        {isLocked && <span title="Value from 26AS/AIS — edit by re-importing" style={{ color: P.textLight, fontSize: 11 }}>🔒</span>}
      </label>
      <input
        className="ff-input"
        type={t}
        value={v || ''}
        onChange={e => c(e.target.value)}
        placeholder="0"
        disabled={isLocked}
        readOnly={isLocked}
        style={isLocked ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
      />
      {h && <div className="ff-hint">{h}</div>}
      {fieldSource?.source && fieldSource.source !== 'manual' && (
        <div className="ff-hint" style={{ fontSize: 10, color: P.textLight }}>
          From {SOURCE_LABELS[fieldSource.source] || fieldSource.source}
        </div>
      )}
    </div>
  );
};
