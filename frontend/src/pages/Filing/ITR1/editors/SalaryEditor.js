import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, AlertCircle, Info, Database } from 'lucide-react';
import { validateSalaryStep } from '../../../../utils/itrValidation';
import { isMetroCity } from '../../../../constants/indianStates';
import { computeHRA, detectHRADiscrepancy } from '../../../../utils/hraCalculator';
import { detectEmployerCategory } from '../../../../utils/smartDefaults';
import TaxWhisper from '../../../../components/common/TaxWhisper';
import { getIncomeSummary } from '../../../../services/financeService';
import { formatCurrency } from '../../../../utils/formatCurrency';
import api from '../../../../services/api';
import P from '../../../../styles/palette';
import { Field, Select, Grid, Card, Button } from '../../../../components/ds';

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

  // Task 10.4: Full HRA calculator integration
  const hraResult = useMemo(() => {
    if (!form) return null;
    const hraReceived = n(form.allowances?.hra?.received);
    const basicDA = n(form.basicPlusDA);
    const rent = n(form.rentPaid);
    const city = form.cityOfEmployment || '';
    const metro = city === 'metro' || isMetroCity(city);
    return computeHRA(basicDA, hraReceived, rent, metro);
  }, [form]);

  // Task 10.4: HRA whisper — rent missing but HRA received entered
  const hraWhisper = useMemo(() => {
    if (!form) return null;
    const hraReceived = n(form.allowances?.hra?.received);
    const rent = n(form.rentPaid);
    if (hraReceived > 0 && rent <= 0) {
      return 'Enter rent paid to claim HRA exemption. Without rent, HRA exemption is ₹0.';
    }
    return null;
  }, [form]);

  // Task 10.4: HRA discrepancy detection
  const hraDiscrepancy = useMemo(() => {
    if (!form || !hraResult) return false;
    const manualExempt = n(form.allowances?.hra?.exempt);
    if (manualExempt <= 0) return false;
    return detectHRADiscrepancy(hraResult.exemption, manualExempt);
  }, [form, hraResult]);

  // Task 10.7: Auto-detect employer category from TAN
  const detectedCategory = useMemo(() => {
    if (!form?.tan) return null;
    const cat = detectEmployerCategory(form.tan);
    return cat !== 'OTH' ? cat : null;
  }, [form?.tan]);

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
        <Card key={i}>
          <div className="ds-item">
            <div>
              <div className="ds-item__name">{emp.name}</div>
              <div className="ds-item__detail">Gross: ₹{n(emp.grossSalary).toLocaleString('en-IN')} · TDS: ₹{n(emp.tdsDeducted).toLocaleString('en-IN')}</div>
            </div>
            <div className="ds-item__actions">
              <Button variant="ghost" size="sm" onClick={() => { setForm({ ...emp }); setEditing(i); }}><Edit2 size={15} /></Button>
              <Button variant="danger" size="sm" onClick={() => remove(i)}><Trash2 size={15} /></Button>
            </div>
          </div>
        </Card>
      ))}

      {form && (
        <Card active>
          <Grid cols={3}>
            <Field label="Employer Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} type="text" hint="Company that pays your salary · Form 16 header" disabled={getFieldSource('name', editing)?.editLock === 'locked'} />
            <Field label="Employer TAN" value={form.tan} onChange={v => setForm({ ...form, tan: v.toUpperCase() })} type="text" hint="10-character Tax Deduction Number · Form 16 Part A" disabled={getFieldSource('tan', editing)?.editLock === 'locked'} />
            <Field label="Total Salary (₹) *" value={form.grossSalary} onChange={v => setForm({ ...form, grossSalary: v })} type="number" hint="Total CTC for the year · Form 16 Part B, Sr. No. 1" disabled={getFieldSource('grossSalary', editing)?.editLock === 'locked'} />
          </Grid>
          <Grid cols={3}>
            <Field label="Tax Deducted by Employer (₹)" value={form.tdsDeducted} onChange={v => setForm({ ...form, tdsDeducted: v })} type="number" hint="Tax deducted by employer · Form 16 Part A, last row" disabled={getFieldSource('tdsDeducted', editing)?.editLock === 'locked'} />
          </Grid>
          <Grid cols={3}>
            <Field label="HRA Received" value={form.allowances?.hra?.received} onChange={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, received: v } } })} type="number" hint="House Rent Allowance · From salary slip" disabled={getFieldSource('allowances.hra.received', editing)?.editLock === 'locked'} />
            <Field label="HRA Exempt" value={form.allowances?.hra?.exempt} onChange={v => setForm({ ...form, allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: v } } })} type="number" hint="Tax-free HRA portion · Form 16 Part B" disabled={getFieldSource('allowances.hra.exempt', editing)?.editLock === 'locked'} />
            <Field label="Professional Tax" value={form.deductions?.professionalTax} onChange={v => setForm({ ...form, deductions: { ...form.deductions, professionalTax: v } })} type="number" hint="State tax on salary · Usually ₹200/month" disabled={getFieldSource('deductions.professionalTax', editing)?.editLock === 'locked'} />
          </Grid>

          {/* Task 10.4: HRA Calculator Breakdown */}
          {hraResult && hraResult.exemption > 0 && (
            <div style={{
              marginTop: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)', marginBottom: 6 }}>
                HRA Exemption: ₹{hraResult.exemption.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div>Actual HRA: ₹{hraResult.components.actualHRA.toLocaleString('en-IN')}{hraResult.limitingFactor === 'actualHRA' ? ' ← limiting' : ''}</div>
                <div>{form.cityOfEmployment === 'metro' || isMetroCity(form.cityOfEmployment) ? '50%' : '40%'} of Basic: ₹{hraResult.components.percentOfBasic.toLocaleString('en-IN')}{hraResult.limitingFactor === 'percentOfBasic' ? ' ← limiting' : ''}</div>
                <div>Rent − 10% Basic: ₹{hraResult.components.rentMinusTenPercent.toLocaleString('en-IN')}{hraResult.limitingFactor === 'rentMinusTenPercent' ? ' ← limiting' : ''}</div>
              </div>
            </div>
          )}

          {/* Task 10.4: HRA whisper — rent missing */}
          {hraWhisper && (
            <div className="ds-hint" style={{ marginTop: 4, color: 'var(--color-warning)' }}>
              <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {hraWhisper}
            </div>
          )}

          {/* Task 10.4: HRA discrepancy warning */}
          {hraDiscrepancy && hraResult && (
            <div style={{
              marginTop: 6, padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)',
              fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <span>
                Manual HRA exempt (₹{n(form.allowances?.hra?.exempt).toLocaleString('en-IN')}) differs from computed (₹{hraResult.exemption.toLocaleString('en-IN')}) by more than ₹100.{' '}
                <button
                  onClick={() => setForm({
                    ...form,
                    allowances: { ...form.allowances, hra: { ...form.allowances?.hra, exempt: String(hraResult.exemption) } },
                  })}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'var(--brand-primary)', fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                  }}
                >
                  Use computed value
                </button>
              </span>
            </div>
          )}

          {/* Task 10.7: Auto-detected employer category */}
          {detectedCategory && (
            <div className="ds-hint" style={{ marginTop: 4, color: '#16a34a' }}>
              <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              TAN detected as {detectedCategory === 'GOV' ? 'Government' : detectedCategory} employer
            </div>
          )}

          {/* Retirement Benefits & Allowances */}
          {employerCategory !== 'NA' && (
            <div style={{ marginTop: 16 }}>
              <h4 className="ds-label" style={{ fontWeight: 600, marginBottom: 8 }}>Retirement Benefits &amp; Allowances</h4>

              {employerCategory === 'GOV' && (
                <div className="ds-hint" style={{ marginBottom: 8, color: '#16a34a' }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Government employees: gratuity and leave encashment are fully exempt
                </div>
              )}
              {(employerCategory === 'OTH' || employerCategory === 'PSU') && (
                <div className="ds-hint" style={{ marginBottom: 8, color: P.warning }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Gratuity exempt up to ₹20L, leave encashment up to ₹25L
                </div>
              )}
              {employerCategory === 'PE' && (
                <div className="ds-hint" style={{ marginBottom: 8, color: P.warning }}>
                  <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Pension income is fully taxable as salary
                </div>
              )}

              <Grid cols={3}>
                <Field label="Gratuity Received (₹)" value={form.gratuityReceived} onChange={v => setForm({ ...form, gratuityReceived: v })} type="number" hint="Lump sum on retirement · Exempt limits vary by employer type" disabled={getFieldSource('gratuityReceived', editing)?.editLock === 'locked'} />
                <Field label="Leave Encashment Received (₹)" value={form.leaveEncashmentReceived} onChange={v => setForm({ ...form, leaveEncashmentReceived: v })} type="number" hint="Unused leave payout · Exempt limits vary by employer type" disabled={getFieldSource('leaveEncashmentReceived', editing)?.editLock === 'locked'} />
                {(employerCategory === 'PE' || employerCategory === 'GOV' || employerCategory === 'OTH' || employerCategory === 'PSU') && (
                  <Field label="Commuted Pension Received (₹)" value={form.commutedPensionReceived} onChange={v => setForm({ ...form, commutedPensionReceived: v })} type="number" hint="One-time pension payout · Partial exemption applies" disabled={getFieldSource('commutedPensionReceived', editing)?.editLock === 'locked'} />
                )}
              </Grid>

              {employerCategory === 'GOV' && (
                <Grid cols={3}>
                  <Field label="Entertainment Allowance (₹)" value={form.entertainmentAllowance} onChange={v => setForm({ ...form, entertainmentAllowance: v })} type="number" hint="Govt employees only · Max ₹5,000 deduction" disabled={getFieldSource('entertainmentAllowance', editing)?.editLock === 'locked'} />
                  <div /><div />
                </Grid>
              )}

              <Grid cols={3}>
                <Field label="Basic + DA (₹)" value={form.basicPlusDA} onChange={v => setForm({ ...form, basicPlusDA: v })} type="number" hint="Basic salary + DA · For HRA calculation" disabled={getFieldSource('basicPlusDA', editing)?.editLock === 'locked'} />
                <Select label="City of Employment" value={form.cityOfEmployment || ''} onChange={v => setForm({ ...form, cityOfEmployment: v })} options={[{ value: 'metro', label: 'Metro (Mumbai, Delhi, Kolkata, Chennai)' }, { value: 'non-metro', label: 'Non-Metro' }]} placeholder="Select..." hint="Metro cities get 50% HRA rate, non-metro 40%" />
                <Field label="Rent Paid (₹)" value={form.rentPaid} onChange={v => setForm({ ...form, rentPaid: v })} type="number" hint="Annual rent paid · For HRA exemption calculation" disabled={getFieldSource('rentPaid', editing)?.editLock === 'locked'} />
              </Grid>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="primary" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditing(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {!form && <Button variant="secondary" onClick={() => { setForm({ ...EMPTY }); setEditing(employers.length); setErrors({}); }}><Plus size={15} /> Add Employer</Button>}

      {Object.keys(errors).length > 0 && (
        <div className="ds-errors">
          <div className="ds-errors__title"><AlertCircle size={14} /> Validation</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {employers.length > 0 && (
        <Card>
          <div className="ds-summary"><span className="ds-summary__label">Total Gross</span><span className="ds-summary__value ds-summary__value--bold">₹{employers.reduce((s, e) => s + n(e.grossSalary), 0).toLocaleString('en-IN')}</span></div>
          <div className="ds-summary"><span className="ds-summary__label">Std Deduction</span><span className="ds-summary__value">- ₹75,000</span></div>
          <div className="ds-summary"><span className="ds-summary__label">Total TDS</span><span className="ds-summary__value ds-summary__value--green">₹{employers.reduce((s, e) => s + n(e.tdsDeducted), 0).toLocaleString('en-IN')}</span></div>
        </Card>
      )}

      <TaxWhisper whispers={whispers} />
    </div>
  );
}
