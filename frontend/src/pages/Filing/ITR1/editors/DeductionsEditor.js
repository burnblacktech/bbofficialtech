import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Plus, Trash2, Database } from 'lucide-react';
import { validateDonation80G } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { getExpensesSummary } from '../../../../services/financeService';
import { formatCurrency } from '../../../../utils/formatCurrency';
import api from '../../../../services/api';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

const DONATION_CATEGORY_OPTIONS = [
  { value: '100_no_limit', label: '100% without limit' },
  { value: '100_with_limit', label: '100% with 10% limit' },
  { value: '50_no_limit', label: '50% without limit' },
  { value: '50_with_limit', label: '50% with 10% limit' },
];

const DONEE_PRESETS = [
  { doneeName: 'PM National Relief Fund', category: '100_no_limit' },
  { doneeName: 'PM CARES Fund', category: '100_no_limit' },
  { doneeName: 'National Defence Fund', category: '100_no_limit' },
];

const EMPTY_DONATION = { doneeName: '', doneePan: '', amount: '', category: '' };

const n = (v) => Number(v) || 0;
const rs = (v) => `\u20B9${n(v).toLocaleString('en-IN')}`;

// Source labels for display
const SOURCE_LABELS = {
  '26as': '26AS', ais: 'AIS', form16: 'Form 16', form16a: 'Form 16A',
  form16b: 'Form 16B', form16c: 'Form 16C', manual: 'Manual',
};

export default function DeductionsEditor({ payload, onSave, selectedRegime: regimeProp, filing }) {
  const d = payload?.deductions || {};
  const fieldSources = payload?._importMeta?.fieldSources || {};
  const [regime, setRegime] = useState(regimeProp || payload?.selectedRegime || 'new');
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Tracked deductions data query
  const filingFY = filing?.financialYear || filing?.assessmentYear;
  const { data: trackedExpenses } = useQuery({
    queryKey: ['tracked-deductions', filingFY],
    queryFn: () => getExpensesSummary(filingFY),
    staleTime: 60000,
    enabled: !!filingFY,
  });

  const trackedDeductionTotal = trackedExpenses?.entries
    ?.filter(e => e.deductionSection)
    ?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0;

  // Helper to get field source for a deduction field path
  const getFieldSource = (fieldName) => {
    const path = `deductions.${fieldName}`;
    return fieldSources[path] || null;
  };

  // Handle manual override of a warn-locked field
  const handleManualOverride = (fieldPath, previousValue, newValue, previousSource) => {
    api.post('/audit/events', {
      action: 'FIELD_MANUAL_OVERRIDE',
      metadata: { fieldPath, previousValue, newValue, previousSource, newSource: 'manual' },
    }).catch(() => { /* best-effort */ });
  };
  const [form, setForm] = useState({
    // 80C components
    ppf: d.ppf || '', elss: d.elss || '', lic: d.lic || '',
    tuitionFees: d.tuitionFees || '', homeLoanPrincipal: d.homeLoanPrincipal || '',
    sukanyaSamriddhi: d.sukanyaSamriddhi || '', fiveYearFD: d.fiveYearFD || '',
    nsc: d.nsc || '', otherC: d.otherC || '',
    // Other deductions
    nps: d.nps || '',
    healthSelf: d.healthSelf || '', healthParents: d.healthParents || '',
    eduLoan: d.eduLoan || '',
    savingsInt: d.savingsInt || '',
    rentPaid: d.rentPaid || '',       // 80GG
    disability: d.disability || '',   // 80U
  });

  // 80G donations — categorized array
  const initDonations80G = () => {
    if (d.donations80G?.length) return d.donations80G;
    // Backward compat: migrate old single donations value
    if (n(d.donations) > 0) {
      return [{ doneeName: '', doneePan: '', amount: d.donations, category: '50_with_limit' }];
    }
    return [];
  };
  const [donations80G, setDonations80G] = useState(initDonations80G);
  const [donationErrors, setDonationErrors] = useState({});

  const buildPayload = useCallback(() => {
    return { deductions: { ...form, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) }, selectedRegime: regime };
  }, [form, donations80G, regime]);

  const { markDirty } = useAutoSave(onSave, buildPayload);

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    markDirty();
  };

  // 80G donation helpers
  const updateDonation = (idx, field, val) => {
    setDonations80G(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
    markDirty();
  };

  const validateDonationOnBlur = (idx) => {
    const entry = donations80G[idx];
    if (!entry) return;
    const result = validateDonation80G(entry);
    setDonationErrors(prev => {
      const next = { ...prev };
      if (result.valid) { delete next[idx]; } else { next[idx] = result.errors; }
      return next;
    });
  };

  const addDonation = () => {
    setDonations80G(prev => [...prev, { ...EMPTY_DONATION }]);
  };

  const addPresetDonation = (preset) => {
    setDonations80G(prev => [...prev, { ...EMPTY_DONATION, doneeName: preset.doneeName, category: preset.category }]);
  };

  const removeDonation = (idx) => {
    setDonations80G(prev => prev.filter((_, i) => i !== idx));
    setDonationErrors(prev => { const next = { ...prev }; delete next[idx]; return next; });
  };

  const changeRegime = (r) => {
    setRegime(r);
    // Regime change saves immediately (it's a toggle, not text input)
    onSave({ deductions: { ...form, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) }, selectedRegime: r });
  };

  const handleSave = () => {
    onSave({ deductions: { ...form, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) }, selectedRegime: regime });
  };

  // 80C total
  const raw80C = n(form.ppf) + n(form.elss) + n(form.lic) + n(form.tuitionFees) + n(form.homeLoanPrincipal) + n(form.sukanyaSamriddhi) + n(form.fiveYearFD) + n(form.nsc) + n(form.otherC);
  const cap80C = Math.min(raw80C, 150000);
  const capNps = Math.min(n(form.nps), 50000);
  const capTta = Math.min(n(form.savingsInt), 10000);
  const capRent = Math.min(n(form.rentPaid), 60000); // 80GG max ₹5000/month
  const total80G = donations80G.reduce((s, e) => s + n(e.amount), 0);
  const total = cap80C + capNps + n(form.healthSelf) + n(form.healthParents) + n(form.eduLoan) + capTta + total80G + capRent + n(form.disability);

  const handleUseTrackedDeductions = () => {
    const hasExisting = n(form.ppf) + n(form.elss) + n(form.lic) + n(form.nps) + n(form.healthSelf) > 0;
    if (hasExisting) { setShowReplaceConfirm(true); return; }
    applyTrackedDeductions();
  };

  const applyTrackedDeductions = () => {
    // Map tracked expenses into deduction fields by section
    const entries = trackedExpenses?.entries?.filter(e => e.deductionSection) || [];
    const updates = {};
    for (const e of entries) {
      if (e.deductionSection === '80D') updates.healthSelf = (updates.healthSelf || 0) + parseFloat(e.amount || 0);
    }
    const next = { ...form, ...updates };
    setForm(next);
    setShowReplaceConfirm(false);
    markDirty();
  };

  return (
    <div>
      <h2 className="step-title">Tax Savings & Deductions</h2>
      <p className="step-desc">Choose your tax regime and claim deductions to reduce your taxable income</p>

      {/* Tracked deductions banner */}
      {trackedDeductionTotal > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Database size={14} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">
              Tracked deductions: <strong>{formatCurrency(trackedDeductionTotal)}</strong>
            </span>
          </div>
          <button
            onClick={handleUseTrackedDeductions}
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
            <button onClick={applyTrackedDeductions} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>Replace</button>
            <button onClick={() => setShowReplaceConfirm(false)} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-light)] text-[var(--text-secondary)]">Cancel</button>
          </div>
        </div>
      )}

      {/* Regime Toggle — prominent */}
      <div className="step-card" style={{ marginBottom: 16 }}>
        <div className="ff-section-title">Tax Regime</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['old', 'Old Regime', 'All deductions + exemptions'], ['new', 'New Regime', 'Lower slabs, std deduction only']].map(([k, label, desc]) => (
            <div key={k} className={`ff-option${regime === k ? ' selected' : ''}`} onClick={() => changeRegime(k)} style={{ flex: 1 }}>
              <div className="ff-option-label">{label}</div>
              <div className="ff-option-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {regime === 'new' ? (
        <div className="step-card info">
          <p style={{ margin: 0, fontSize: 14, color: P.secondary || '#0D9488' }}>
            Under the new regime, only standard deduction of {rs(75000)} is available. No Chapter VI-A deductions apply.
            The new regime has lower tax slabs which may benefit you if your deductions are less than ~{rs(375000)}.
          </p>
        </div>
      ) : (
        <>
          {/* 80C */}
          <div className="step-card editing">
            <div className="ff-section-title">80C — Tax Saving Investments <span className="ff-section-cap">(max {rs(150000)})</span></div>
            <div className="ff-grid-2">
              <F l="PPF" v={form.ppf} c={v => update('ppf', v)} fieldSource={getFieldSource('ppf')} />
              <F l="ELSS Mutual Funds" v={form.elss} c={v => update('elss', v)} fieldSource={getFieldSource('elss')} />
              <F l="LIC Premium" v={form.lic} c={v => update('lic', v)} fieldSource={getFieldSource('lic')} />
              <F l="Tuition Fees" v={form.tuitionFees} c={v => update('tuitionFees', v)} h="School/college fees · Max 2 children" fieldSource={getFieldSource('tuitionFees')} />
              <F l="Home Loan Principal" v={form.homeLoanPrincipal} c={v => update('homeLoanPrincipal', v)} fieldSource={getFieldSource('homeLoanPrincipal')} />
              <F l="Sukanya Samriddhi" v={form.sukanyaSamriddhi} c={v => update('sukanyaSamriddhi', v)} fieldSource={getFieldSource('sukanyaSamriddhi')} />
              <F l="5-Year Tax Saver FD" v={form.fiveYearFD} c={v => update('fiveYearFD', v)} fieldSource={getFieldSource('fiveYearFD')} />
              <F l="NSC" v={form.nsc} c={v => update('nsc', v)} fieldSource={getFieldSource('nsc')} />
            </div>
            <F l="Other 80C" v={form.otherC} c={v => update('otherC', v)} h="SCSS, stamp duty, post office deposits, etc." fieldSource={getFieldSource('otherC')} />
            {raw80C > 150000 && <div className="ff-hint" style={{ color: P.warning, marginTop: 4 }}>Total {rs(raw80C)} — capped at {rs(150000)}</div>}
            {raw80C > 0 && raw80C <= 150000 && <div className="ff-hint" style={{ color: '#16a34a', marginTop: 4 }}>Used {rs(raw80C)} of {rs(150000)} limit</div>}
          </div>

          {/* Health & Insurance */}
          <div className="step-card editing">
            <div className="ff-section-title">Health & Insurance</div>
            <div className="ff-grid-2">
              <F l="80CCD(1B) — NPS" v={form.nps} c={v => update('nps', v)} h={`Additional NPS investment · Max ${rs(50000)} beyond 80C`} fieldSource={getFieldSource('nps')} />
              <F l="80D — Health (Self/Family)" v={form.healthSelf} c={v => update('healthSelf', v)} h={`Health insurance premium · ${rs(25000)} (${rs(50000)} if senior)`} fieldSource={getFieldSource('healthSelf')} />
              <F l="80D — Health (Parents)" v={form.healthParents} c={v => update('healthParents', v)} h={`Parents' health insurance · ${rs(25000)} (${rs(50000)} if senior)`} fieldSource={getFieldSource('healthParents')} />
              <F l="80U — Disability" v={form.disability} c={v => update('disability', v)} h={`Self disability deduction · ${rs(75000)} or ${rs(125000)} (severe)`} fieldSource={getFieldSource('disability')} />
            </div>
          </div>

          {/* Other Deductions */}
          <div className="step-card editing">
            <div className="ff-section-title">Other Deductions</div>
            <div className="ff-grid-2">
              <F l="80E — Education Loan Interest" v={form.eduLoan} c={v => update('eduLoan', v)} h="Interest on education loan · No upper limit, 8 years" fieldSource={getFieldSource('eduLoan')} />
              <F l="80TTA — Savings Interest" v={form.savingsInt} c={v => update('savingsInt', v)} h={`Savings interest deduction · Max ${rs(10000)}`} fieldSource={getFieldSource('savingsInt')} />
              <F l="80GG — Rent Paid" v={form.rentPaid} c={v => update('rentPaid', v)} h={`Rent deduction (no HRA) · Max ${rs(5000)}/month`} fieldSource={getFieldSource('rentPaid')} />
            </div>
          </div>

          {/* 80G — Categorized Donations */}
          <div className="step-card editing">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div className="ff-section-title" style={{ margin: 0 }}>80G — Charitable Donations</div>
              <button className="ff-btn ff-btn-outline" style={{ padding: '3px 10px', fontSize: 12 }} onClick={addDonation}>
                <Plus size={12} /> Add Donation
              </button>
            </div>
            <div className="ff-hint" style={{ marginBottom: 10 }}>Each donation must be categorized by its deduction type. PAN of donee is required for donations exceeding ₹2,000.</div>

            {/* Preset quick-add buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {DONEE_PRESETS.map((preset) => (
                <button key={preset.doneeName} className="ff-btn ff-btn-outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => addPresetDonation(preset)}>
                  + {preset.doneeName}
                </button>
              ))}
            </div>

            {donations80G.map((entry, i) => {
              const errs = donationErrors[i] || {};
              return (
                <div key={i} style={{ padding: 12, background: P.bgMuted, borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: P.textSecondary }}>Donation {i + 1}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, padding: 4, minHeight: 'auto', minWidth: 'auto' }} onClick={() => removeDonation(i)} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="ff-grid-2">
                    <div className="ff-field">
                      <label className="ff-label" style={{ fontSize: 11 }}>Donee Name *</label>
                      <input className={`ff-input ${errs.doneeName ? 'error' : ''}`} type="text" value={entry.doneeName} onChange={e => updateDonation(i, 'doneeName', e.target.value)} onBlur={() => validateDonationOnBlur(i)} placeholder="e.g., PM National Relief Fund" />
                      {errs.doneeName && <div className="ff-hint" style={{ color: P.error }}>{errs.doneeName}</div>}
                    </div>
                    <div className="ff-field">
                      <label className="ff-label" style={{ fontSize: 11 }}>Donee PAN</label>
                      <input className={`ff-input ${errs.doneePan ? 'error' : ''}`} type="text" value={entry.doneePan} onChange={e => updateDonation(i, 'doneePan', e.target.value.toUpperCase())} onBlur={() => validateDonationOnBlur(i)} placeholder="e.g., AAATC1234D" maxLength={10} />
                      {errs.doneePan ? <div className="ff-hint" style={{ color: P.error }}>{errs.doneePan}</div> : <div className="ff-hint">Required for donations &gt; ₹2,000</div>}
                    </div>
                  </div>
                  <div className="ff-grid-2" style={{ marginTop: 6 }}>
                    <div className="ff-field">
                      <label className="ff-label" style={{ fontSize: 11 }}>Amount (₹) *</label>
                      <input className={`ff-input ${errs.amount ? 'error' : ''}`} type="number" min="0" value={entry.amount || ''} onChange={e => updateDonation(i, 'amount', e.target.value)} onBlur={() => validateDonationOnBlur(i)} placeholder="0" />
                      {errs.amount && <div className="ff-hint" style={{ color: P.error }}>{errs.amount}</div>}
                    </div>
                    <div className="ff-field">
                      <label className="ff-label" style={{ fontSize: 11 }}>Deduction Category *</label>
                      <select className={`ff-select ${errs.category ? 'error' : ''}`} value={entry.category} onChange={e => updateDonation(i, 'category', e.target.value)} onBlur={() => validateDonationOnBlur(i)}>
                        <option value="">Select category...</option>
                        {DONATION_CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      {errs.category && <div className="ff-hint" style={{ color: P.error }}>{errs.category}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {total80G > 0 && (
              <div className="ff-row" style={{ marginTop: 4 }}>
                <span className="ff-row-label" style={{ fontWeight: 600 }}>Total 80G Donations</span>
                <span className="ff-row-value bold">{rs(total80G)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {regime === 'old' && (
        <button className="ff-btn ff-btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          <Save size={14} /> Save Deductions
        </button>
      )}

      {/* Summary */}
      <div className="step-card summary">
        <div className="ff-row"><span className="ff-row-label">Regime</span><span className="ff-row-value bold">{regime === 'old' ? 'Old Regime' : 'New Regime'}</span></div>
        {regime === 'old' && (
          <>
            <div className="ff-row"><span className="ff-row-label">80C</span><span className="ff-row-value">{rs(cap80C)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80CCD(1B) NPS</span><span className="ff-row-value">{rs(capNps)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80D Health</span><span className="ff-row-value">{rs(n(form.healthSelf) + n(form.healthParents))}</span></div>
            {n(form.disability) > 0 && <div className="ff-row"><span className="ff-row-label">80U Disability</span><span className="ff-row-value">{rs(form.disability)}</span></div>}
            {n(form.eduLoan) > 0 && <div className="ff-row"><span className="ff-row-label">80E Edu Loan</span><span className="ff-row-value">{rs(form.eduLoan)}</span></div>}
            {capTta > 0 && <div className="ff-row"><span className="ff-row-label">80TTA</span><span className="ff-row-value">{rs(capTta)}</span></div>}
            {total80G > 0 && <div className="ff-row"><span className="ff-row-label">80G Donations</span><span className="ff-row-value">{rs(total80G)}</span></div>}
            {capRent > 0 && <div className="ff-row"><span className="ff-row-label">80GG Rent</span><span className="ff-row-value">{rs(capRent)}</span></div>}
            <div className="ff-divider" />
            <div className="ff-row"><span className="ff-row-label">Total Deductions</span><span className="ff-row-value bold green">{rs(total)}</span></div>
          </>
        )}
        {regime === 'new' && (
          <div className="ff-row"><span className="ff-row-label">Standard Deduction</span><span className="ff-row-value">{rs(75000)}</span></div>
        )}
      </div>
    </div>
  );
}

const F = ({ l, v, c, h, fieldSource }) => {
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
        type="number"
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
