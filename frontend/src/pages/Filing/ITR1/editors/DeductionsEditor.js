import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Save, Plus, Trash2, Database, TrendingUp, X, Upload,
  HelpCircle, ChevronDown, ChevronUp,
  PiggyBank, HeartPulse, Home, GraduationCap, Heart,
} from 'lucide-react';
import { validateDonation80G } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { getExpensesSummary } from '../../../../services/financeService';
import api from '../../../../services/api';
import '../../filing-flow.css';

/* ─── helpers ─── */
const n = (v) => Number(v) || 0;
const rs = (v) => `\u20B9${n(v).toLocaleString('en-IN')}`;
const fmt = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

const SOURCE_LABELS = {
  '26as': '26AS', ais: 'AIS', form16: 'Form 16', form16a: 'Form 16A',
  form16b: 'Form 16B', form16c: 'Form 16C', manual: 'Manual',
};

/* ─── FIELD_META — 21 deduction fields ─── */
const FIELD_META = {
  ppf:                    { key: 'ppf',                    label: 'Public Provident Fund',          hint: 'Government savings scheme with guaranteed returns and tax-free interest',                section: '80C',        limit: 150000, category: 'invest' },
  elss:                   { key: 'elss',                   label: 'ELSS Mutual Funds',              hint: 'Tax-saving mutual funds with a 3-year lock-in period',                                   section: '80C',        limit: 150000, category: 'invest' },
  lic:                    { key: 'lic',                    label: 'LIC Premium',                    hint: 'Life insurance premium payments',                                                        section: '80C',        limit: 150000, category: 'invest' },
  sukanyaSamriddhi:       { key: 'sukanyaSamriddhi',       label: 'Sukanya Samriddhi',              hint: 'Girl child savings scheme with high interest rate',                                      section: '80C',        limit: 150000, category: 'invest' },
  fiveYearFD:             { key: 'fiveYearFD',             label: '5-Year Tax Saver FD',            hint: 'Fixed deposit with 5-year lock-in at any bank',                                          section: '80C',        limit: 150000, category: 'invest' },
  nsc:                    { key: 'nsc',                    label: 'National Savings Certificate',   hint: 'Post office savings certificate with fixed returns',                                     section: '80C',        limit: 150000, category: 'invest' },
  tuitionFees:            { key: 'tuitionFees',            label: 'Tuition Fees',                   hint: 'School or college fees for up to 2 children',                                            section: '80C',        limit: 150000, category: 'invest' },
  homeLoanPrincipal:      { key: 'homeLoanPrincipal',      label: 'Home Loan Principal',            hint: 'Principal repayment on your home loan',                                                  section: '80C',        limit: 150000, category: 'invest' },
  otherC:                 { key: 'otherC',                 label: 'Other 80C Investments',          hint: 'SCSS, stamp duty, post office deposits, etc.',                                           section: '80C',        limit: 150000, category: 'invest' },
  nps:                    { key: 'nps',                    label: 'NPS (Self Contribution)',         hint: 'Additional NPS investment beyond 80C — up to \u20B950,000',                              section: '80CCD(1B)',  limit: 50000,  category: 'invest' },
  employerNps:            { key: 'employerNps',            label: 'NPS (Employer Contribution)',     hint: 'Your employer\'s contribution to your NPS account',                                      section: '80CCD(2)',   limit: null,   category: 'invest' },
  healthSelf:             { key: 'healthSelf',             label: 'Health Insurance (Self/Family)',  hint: 'Health insurance premium for you and your family',                                       section: '80D',        limit: 25000,  seniorLimit: 50000, seniorToggleKey: 'selfSenior', category: 'health' },
  healthParents:          { key: 'healthParents',          label: 'Health Insurance (Parents)',      hint: 'Health insurance premium for your parents',                                              section: '80D',        limit: 25000,  seniorLimit: 50000, seniorToggleKey: 'parentSenior', category: 'health' },
  disability:             { key: 'disability',             label: 'Disability (Self)',               hint: 'Deduction for self disability — \u20B975,000 or \u20B91,25,000 (severe)',                 section: '80U',        limit: 125000, category: 'health' },
  dependentDisability:    { key: 'dependentDisability',    label: 'Dependent with Disability',      hint: 'Maintaining a disabled dependent — \u20B975,000 or \u20B91,25,000 (severe)',              section: '80DD',       limit: 125000, category: 'health' },
  medicalTreatment:       { key: 'medicalTreatment',       label: 'Medical Treatment',              hint: 'Expenses for specified diseases like cancer, neurological conditions',                    section: '80DDB',      limit: 100000, category: 'health' },
  firstHomeBuyerInterest: { key: 'firstHomeBuyerInterest', label: 'First-Time Home Buyer Interest', hint: 'Extra interest deduction on your first home loan',                                       section: '80EE/80EEA', limit: 150000, category: 'home' },
  rentPaid:               { key: 'rentPaid',               label: 'Rent Paid (no HRA)',             hint: 'Rent deduction if you don\'t receive HRA — max \u20B95,000/month',                       section: '80GG',       limit: 60000,  category: 'home' },
  eduLoan:                { key: 'eduLoan',                label: 'Education Loan Interest',        hint: 'Interest on education loan — no upper limit, up to 8 years',                             section: '80E',        limit: null,   category: 'education' },
  savingsInt:             { key: 'savingsInt',             label: 'Savings Account Interest',       hint: 'Interest earned on savings accounts — up to \u20B910,000',                               section: '80TTA',      limit: 10000,  category: 'invest' },
  seniorSavingsInt:       { key: 'seniorSavingsInt',       label: 'Senior Citizen Savings Interest', hint: 'Higher deduction on interest income for seniors (60+) — up to \u20B950,000',             section: '80TTB',      limit: 50000,  category: 'invest' },
};

/* ─── CATEGORIES — 5 life categories ─── */
const CATEGORIES = [
  {
    id: 'invest', title: 'Investments & Savings', icon: PiggyBank,
    sectionBadge: '§80C + §80CCD', docType: 'invest_proofs', uploadLabel: 'Upload investment proofs',
    fields: ['ppf','elss','lic','sukanyaSamriddhi','fiveYearFD','nsc','tuitionFees','homeLoanPrincipal','otherC','nps','employerNps'],
    hasProgressBar: true,
  },
  {
    id: 'health', title: 'Health & Insurance', icon: HeartPulse,
    sectionBadge: '§80D + §80U + §80DD + §80DDB', docType: 'health_receipt', uploadLabel: 'Upload health receipts',
    fields: ['healthSelf','healthParents','disability','dependentDisability','medicalTreatment'],
  },
  {
    id: 'home', title: 'Home & Rent', icon: Home,
    sectionBadge: '§80EE/80EEA + §80GG', docType: 'loan_cert', uploadLabel: 'Upload loan certificate',
    fields: ['firstHomeBuyerInterest','rentPaid'],
  },
  {
    id: 'education', title: 'Education', icon: GraduationCap,
    sectionBadge: '§80E', docType: 'edu_docs', uploadLabel: 'Upload education documents',
    fields: ['eduLoan'],
  },
  {
    id: 'giving', title: 'Giving Back', icon: Heart,
    sectionBadge: '§80G', docType: 'donation_receipt', uploadLabel: 'Upload donation receipts',
    fields: [], hasDonations: true,
  },
];

/* ─── Donation constants ─── */
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

/* ─── 80C field keys (for progress bar) ─── */
const FIELDS_80C = ['ppf','elss','lic','tuitionFees','homeLoanPrincipal','sukanyaSamriddhi','fiveYearFD','nsc','otherC'];

/* ═══════════════════════════════════════════════════════
   DeductionsEditor — Complete rewrite
   Life-category cards, tooltips, 80C progress, smart tips
   ═══════════════════════════════════════════════════════ */
export default function DeductionsEditor({
  payload, onSave, selectedRegime: regimeProp, filing,
  computation, onUploadProof,
}) {
  const d = payload?.deductions || {};
  const fieldSources = payload?._importMeta?.fieldSources || {};
  const [regime, setRegime] = useState(regimeProp || payload?.selectedRegime || 'new');
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [dismissedTips, setDismissedTips] = useState(new Set());
  const [expanded, setExpanded] = useState({ invest: true, health: false, home: false, education: false, giving: false });

  /* ── Active fields (activate/deactivate pattern) ── */
  const [activeFields, setActiveFields] = useState(() => {
    const initial = new Set();
    Object.keys(FIELD_META).forEach(key => {
      if (n(d[key]) > 0) initial.add(key);
    });
    return initial;
  });

  /* ── Senior citizen toggles for 80D ── */
  const [seniorToggles, setSeniorToggles] = useState({
    selfSenior: d.selfSenior || false,
    parentSenior: d.parentSenior || false,
  });

  const activateField = (key) => {
    setActiveFields(prev => new Set([...prev, key]));
  };

  const deactivateField = (key) => {
    setActiveFields(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    update(key, '');
  };

  /* ── Tracked deductions query ── */
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

  const getFieldSource = (fieldName) => fieldSources[`deductions.${fieldName}`] || null;

  const handleManualOverride = (fieldPath, previousValue, newValue, previousSource) => {
    api.post('/audit/events', {
      action: 'FIELD_MANUAL_OVERRIDE',
      metadata: { fieldPath, previousValue, newValue, previousSource, newSource: 'manual' },
    }).catch(() => {});
  };

  /* ── Form state (16 existing + 5 new) ── */
  const [form, setForm] = useState({
    ppf: d.ppf || '', elss: d.elss || '', lic: d.lic || '',
    tuitionFees: d.tuitionFees || '', homeLoanPrincipal: d.homeLoanPrincipal || '',
    sukanyaSamriddhi: d.sukanyaSamriddhi || '', fiveYearFD: d.fiveYearFD || '',
    nsc: d.nsc || '', otherC: d.otherC || '',
    nps: d.nps || '', healthSelf: d.healthSelf || '', healthParents: d.healthParents || '',
    eduLoan: d.eduLoan || '', savingsInt: d.savingsInt || '',
    rentPaid: d.rentPaid || '', disability: d.disability || '',
    // New fields
    employerNps: d.employerNps || '',
    dependentDisability: d.dependentDisability || '',
    medicalTreatment: d.medicalTreatment || '',
    firstHomeBuyerInterest: d.firstHomeBuyerInterest || '',
    seniorSavingsInt: d.seniorSavingsInt || '',
  });

  /* ── Donations 80G ── */
  const initDonations80G = () => {
    if (d.donations80G?.length) return d.donations80G;
    if (n(d.donations) > 0) return [{ doneeName: '', doneePan: '', amount: d.donations, category: '50_with_limit' }];
    return [];
  };
  const [donations80G, setDonations80G] = useState(initDonations80G);
  const [donationErrors, setDonationErrors] = useState({});

  /* ── Auto-save ── */
  const buildPayload = useCallback(() => ({
    deductions: { ...form, ...seniorToggles, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) },
    selectedRegime: regime,
  }), [form, seniorToggles, donations80G, regime]);

  const { markDirty } = useAutoSave(onSave, buildPayload);

  const update = (key, val) => { setForm(prev => ({ ...prev, [key]: val })); markDirty(); };

  /* ── Donation helpers ── */
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
      if (result.valid) delete next[idx]; else next[idx] = result.errors;
      return next;
    });
  };
  const addDonation = () => setDonations80G(prev => [...prev, { ...EMPTY_DONATION }]);
  const addPresetDonation = (preset) => setDonations80G(prev => [...prev, { ...EMPTY_DONATION, doneeName: preset.doneeName, category: preset.category }]);
  const removeDonation = (idx) => {
    setDonations80G(prev => prev.filter((_, i) => i !== idx));
    setDonationErrors(prev => { const next = { ...prev }; delete next[idx]; return next; });
  };

  /* ── Regime change ── */
  const changeRegime = (r) => {
    setRegime(r);
    onSave({ deductions: { ...form, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) }, selectedRegime: r });
  };

  const handleSave = () => {
    onSave({ deductions: { ...form, donations80G: donations80G.filter(e => e.doneeName || n(e.amount) > 0) }, selectedRegime: regime });
  };

  /* ── Computed totals ── */
  const raw80C = FIELDS_80C.reduce((s, k) => s + n(form[k]), 0);
  const cap80C = Math.min(raw80C, 150000);
  const capNps = Math.min(n(form.nps), 50000);
  const capTta = Math.min(n(form.savingsInt), 10000);
  const capRent = Math.min(n(form.rentPaid), 60000);
  const total80G = donations80G.reduce((s, e) => s + n(e.amount), 0);
  const total = cap80C + capNps + n(form.employerNps) + n(form.healthSelf) + n(form.healthParents)
    + n(form.disability) + n(form.dependentDisability) + n(form.medicalTreatment)
    + n(form.eduLoan) + capTta + n(form.seniorSavingsInt) + total80G + capRent
    + n(form.firstHomeBuyerInterest);

  /* ── 80C progress bar ── */
  const progressPct = Math.min(100, raw80C / 150000 * 100);
  const barColor = raw80C > 150000 ? '#dc2626' : progressPct > 75 ? '#ca8a04' : '#16a34a';

  /* ── Category total helper ── */
  const categoryTotal = (cat) => {
    if (cat.hasDonations) return total80G;
    return cat.fields.reduce((s, k) => s + n(form[k]), 0);
  };

  /* ── Smart tips ── */
  const computeTips = () => {
    if (regime !== 'old') return [];
    const tips = [];
    const remaining80C = 150000 - raw80C;
    if (remaining80C > 0) tips.push({ id: '80c', icon: TrendingUp, msg: `You can save up to ${rs(remaining80C)} more by investing in PPF, ELSS, or tax-saver FDs`, section: '80C' });
    if (!n(form.nps) && !n(form.employerNps)) tips.push({ id: 'nps', icon: PiggyBank, msg: 'Invest in NPS for an additional \u20B950,000 deduction under 80CCD(1B)', section: '80CCD' });
    if (!n(form.healthSelf)) tips.push({ id: 'health', icon: HeartPulse, msg: 'Get health insurance to claim up to \u20B925,000 under Section 80D', section: '80D' });
    return tips.filter(t => !dismissedTips.has(t.id)).slice(0, 3);
  };
  const tips = computeTips();

  /* ── Regime comparison ── */
  const oldTax = n(computation?.oldRegime?.totalTax);
  const newTax = n(computation?.newRegime?.totalTax);
  const savings = Math.abs(oldTax - newTax);
  const betterRegime = oldTax <= newTax ? 'Old regime' : 'New regime';

  /* ── Tracked deductions ── */
  const handleUseTrackedDeductions = () => {
    const hasExisting = n(form.ppf) + n(form.elss) + n(form.lic) + n(form.nps) + n(form.healthSelf) > 0;
    if (hasExisting) { setShowReplaceConfirm(true); return; }
    applyTrackedDeductions();
  };
  const applyTrackedDeductions = () => {
    const entries = trackedExpenses?.entries?.filter(e => e.deductionSection) || [];
    const updates = {};
    for (const e of entries) {
      if (e.deductionSection === '80D') updates.healthSelf = (updates.healthSelf || 0) + parseFloat(e.amount || 0);
    }
    setForm(prev => ({ ...prev, ...updates }));
    setShowReplaceConfirm(false);
    markDirty();
  };

  /* ── Toggle expand/collapse ── */
  const toggleCard = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const handleCardKeyDown = (e, id) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(id); } };

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="ff-page">
      <div className="ff-content">
        <h2 className="step-title">Deductions</h2>
        <p className="step-desc">Claim deductions to reduce your taxable income</p>

        {/* ── 1. Regime Comparison Banner ── */}
        <div className="step-card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: computation ? 10 : 0 }}>
            {['old', 'new'].map(r => (
              <button
                key={r}
                className={`ff-btn ${regime === r ? 'ff-btn-primary' : 'ff-btn-outline'}`}
                style={{ borderRadius: r === 'old' ? '6px 0 0 6px' : '0 6px 6px 0', flex: 1 }}
                onClick={() => changeRegime(r)}
              >
                {r === 'old' ? 'Old Regime' : 'New Regime'}
              </button>
            ))}
          </div>
          {computation && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Old: {fmt(oldTax)} · New: {fmt(newTax)} · {betterRegime} saves {fmt(savings)}
            </div>
          )}
        </div>

        {/* ── 2. Tracked Deductions Banner ── */}
        {trackedDeductionTotal > 0 && regime === 'old' && (
          <div className="step-card info" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <Database size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
                Tracked deductions: {rs(trackedDeductionTotal)}
              </span>
              <button className="ff-btn ff-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleUseTrackedDeductions}>
                Use Tracked Data
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Replace Confirmation Dialog ── */}
        {showReplaceConfirm && (
          <div className="step-card error" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
              You already have deduction values entered. Replace them with tracked data?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ff-btn ff-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={applyTrackedDeductions}>Replace</button>
              <button className="ff-btn ff-btn-outline" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowReplaceConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── 4. New Regime: standard deduction only ── */}
        {regime === 'new' ? (
          <div className="step-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Under the new regime, only the standard deduction of <strong>₹75,000</strong> applies.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Switch to old regime to claim additional deductions.
            </div>
          </div>
        ) : (
          <>
            {/* ── 5. Old Regime: Category Cards ── */}
            {CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              const catTotal = categoryTotal(cat);
              const isExpanded = expanded[cat.id];

              return (
                <div key={cat.id} className="dd-card">
                  {/* Card Header */}
                  <button
                    className="dd-card-header"
                    onClick={() => toggleCard(cat.id)}
                    onKeyDown={(e) => handleCardKeyDown(e, cat.id)}
                    aria-expanded={isExpanded}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dd-card-icon" style={{ background: cat.id === 'invest' ? '#f0fdf4' : cat.id === 'health' ? '#fef2f2' : cat.id === 'home' ? '#f5f3ff' : cat.id === 'education' ? '#eff6ff' : '#fdf2f8' }}>
                      <CatIcon size={14} style={{ color: cat.id === 'invest' ? '#059669' : cat.id === 'health' ? '#dc2626' : cat.id === 'home' ? '#7c3aed' : cat.id === 'education' ? '#2563eb' : '#db2777' }} />
                    </div>
                    <span className="dd-card-title">{cat.title}</span>
                    <span className="dd-card-badge">{cat.sectionBadge}</span>
                    <span className="dd-card-total">{catTotal > 0 ? rs(catTotal) : ''}</span>
                    <span className="dd-card-chevron">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {/* Card Body */}
                  {isExpanded && (
                    <div className="dd-card-body">
                      {/* Upload Proof Button */}
                      {onUploadProof && (
                        <div className="dd-card-upload">
                          <button
                            className="ff-btn ff-btn-outline"
                            style={{ fontSize: 12, padding: '6px 12px' }}
                            onClick={() => onUploadProof(cat.docType)}
                            aria-label={cat.uploadLabel}
                          >
                            <Upload size={12} /> {cat.uploadLabel}
                          </button>
                        </div>
                      )}

                      {/* 80C Progress Bar (Investments only) */}
                      {cat.hasProgressBar && (
                        <>
                          <div className="dd-progress">
                            <div className="dd-progress-bar" style={{ width: `${progressPct}%`, background: barColor }} />
                          </div>
                          <div className="dd-progress-text">
                            {raw80C > 150000
                              ? <span style={{ color: '#dc2626' }}>{rs(raw80C)} — exceeds limit by {rs(raw80C - 150000)}</span>
                              : <span>{rs(raw80C)} used · {rs(150000 - raw80C)} remaining</span>
                            }
                          </div>
                        </>
                      )}

                      {/* Deduction Fields — Activate/Deactivate Pattern */}
                      {cat.fields.length > 0 && (
                        <div>
                          {cat.fields.map(fieldKey => {
                            const meta = FIELD_META[fieldKey];
                            const val = n(form[fieldKey]);
                            const isActive = val > 0 || activeFields.has(fieldKey);
                            const source = getFieldSource(fieldKey);

                            if (!isActive) {
                              return (
                                <button key={fieldKey} className="dd-item dd-item--inactive" onClick={() => activateField(fieldKey)}>
                                  <Plus size={12} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="dd-item-label">{meta.label}</span>
                                    <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, lineHeight: 1.3 }}>
                                      {meta.hint}{meta.limit ? ` · Max ${rs(meta.limit)}` : ''}
                                    </div>
                                  </div>
                                  <span className="dd-item-badge">§{meta.section}</span>
                                </button>
                              );
                            }

                            return (
                              <div key={fieldKey} className="dd-item dd-item--active">
                                <div className="dd-item-header">
                                  <span className="dd-item-label">{meta.label}</span>
                                  <span className="dd-item-badge">§{meta.section}</span>
                                  {val > 0 && <span className="dd-item-amount">{rs(val)}</span>}
                                  <button className="dd-item-remove" onClick={() => deactivateField(fieldKey)} title="Remove">
                                    <X size={10} />
                                  </button>
                                </div>
                                <div className="dd-item-body">
                                  {/* Senior citizen toggle for 80D fields */}
                                  {meta.seniorToggleKey && (
                                    <label className="ff-check" style={{ marginBottom: 10 }}>
                                      <input
                                        type="checkbox"
                                        checked={!!seniorToggles[meta.seniorToggleKey]}
                                        onChange={(e) => {
                                          setSeniorToggles(prev => ({ ...prev, [meta.seniorToggleKey]: e.target.checked }));
                                          markDirty();
                                        }}
                                      />
                                      {meta.seniorToggleKey === 'selfSenior' ? 'I am 60 years or older (senior citizen)' : 'Parent is 60 years or older (senior citizen)'}
                                    </label>
                                  )}
                                  <div className="ff-field">
                                    <label className="ff-label" htmlFor={`ded-${fieldKey}`}>{meta.label}</label>
                                    <input
                                      id={`ded-${fieldKey}`}
                                      className="ff-input"
                                      type="number"
                                      value={form[fieldKey]}
                                      onChange={e => {
                                        if (source && source !== 'manual') {
                                          handleManualOverride(`deductions.${fieldKey}`, form[fieldKey], e.target.value, source);
                                        }
                                        update(fieldKey, e.target.value);
                                      }}
                                      placeholder="0"
                                    />
                                    <div className="ff-hint">
                                      {meta.hint}
                                      {meta.seniorLimit
                                        ? ` · Limit: ${rs(seniorToggles[meta.seniorToggleKey] ? meta.seniorLimit : meta.limit)}${seniorToggles[meta.seniorToggleKey] ? ' (senior)' : ''}`
                                        : meta.limit ? ` · Limit: ${rs(meta.limit)}` : ''
                                      }
                                      {source && source !== 'manual' && <span> · Source: {SOURCE_LABELS[source] || source}</span>}
                                    </div>
                                    {meta.seniorLimit && val > (seniorToggles[meta.seniorToggleKey] ? meta.seniorLimit : meta.limit) && (
                                      <div className="ff-hint" style={{ color: 'var(--color-warning)', marginTop: 4 }}>
                                        ⚠ Amount exceeds the {rs(seniorToggles[meta.seniorToggleKey] ? meta.seniorLimit : meta.limit)} limit — ITD may disallow the excess
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Donations 80G (Giving Back only) */}
                      {cat.hasDonations && (
                        <div>
                          {donations80G.length === 0 && (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                              No donations added yet. Add a donation or use a preset below.
                            </p>
                          )}

                          {donations80G.map((entry, idx) => (
                            <div key={idx} className="step-card editing" style={{ padding: 14, marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Donation {idx + 1}</span>
                                <button className="ff-btn ff-btn-danger" onClick={() => removeDonation(idx)} aria-label={`Remove donation ${idx + 1}`}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <div className="ff-grid-2">
                                <div className="ff-field">
                                  <label className="ff-label">Donee Name</label>
                                  <input className={`ff-input ${donationErrors[idx]?.doneeName ? 'error' : ''}`} value={entry.doneeName} onChange={(e) => updateDonation(idx, 'doneeName', e.target.value)} onBlur={() => validateDonationOnBlur(idx)} placeholder="Organisation name" />
                                  {donationErrors[idx]?.doneeName && <div className="ff-hint" style={{ color: 'var(--color-error)' }}>{donationErrors[idx].doneeName}</div>}
                                </div>
                                <div className="ff-field">
                                  <label className="ff-label">Donee PAN</label>
                                  <input className={`ff-input ${donationErrors[idx]?.doneePan ? 'error' : ''}`} value={entry.doneePan} onChange={(e) => updateDonation(idx, 'doneePan', e.target.value.toUpperCase())} onBlur={() => validateDonationOnBlur(idx)} placeholder="AAAAA0000A" maxLength={10} style={{ textTransform: 'uppercase' }} />
                                  {donationErrors[idx]?.doneePan && <div className="ff-hint" style={{ color: 'var(--color-error)' }}>{donationErrors[idx].doneePan}</div>}
                                </div>
                                <div className="ff-field">
                                  <label className="ff-label">Amount</label>
                                  <input className={`ff-input ${donationErrors[idx]?.amount ? 'error' : ''}`} type="number" value={entry.amount} onChange={(e) => updateDonation(idx, 'amount', e.target.value)} onBlur={() => validateDonationOnBlur(idx)} placeholder="0" />
                                  {donationErrors[idx]?.amount && <div className="ff-hint" style={{ color: 'var(--color-error)' }}>{donationErrors[idx].amount}</div>}
                                </div>
                                <div className="ff-field">
                                  <label className="ff-label">Deduction Category</label>
                                  <select className="ff-select" value={entry.category} onChange={(e) => updateDonation(idx, 'category', e.target.value)}>
                                    <option value="">Select category</option>
                                    {DONATION_CATEGORY_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button className="ff-btn ff-btn-add" onClick={addDonation}>
                            <Plus size={13} /> Add Donation
                          </button>

                          {/* Preset buttons */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {DONEE_PRESETS.map(preset => (
                              <button key={preset.doneeName} className="ff-btn ff-btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => addPresetDonation(preset)}>
                                + {preset.doneeName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── 6. Smart Tips ── */}
            {tips.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                {tips.map(tip => {
                  const TipIcon = tip.icon;
                  return (
                    <div key={tip.id} className="dd-tip">
                      <TipIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{tip.msg}</span>
                      <button className="dd-tip-dismiss" onClick={() => setDismissedTips(prev => new Set([...prev, tip.id]))} aria-label="Dismiss tip">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 7. Summary Card ── */}
            <div className="step-card summary">
              <div className="ff-section-title">Deduction Summary</div>
              <div className="ff-row">
                <span className="ff-row-label">Regime</span>
                <span className="ff-row-value">{regime === 'old' ? 'Old Regime' : 'New Regime'}</span>
              </div>
              <div className="ff-divider" />
              {CATEGORIES.map(cat => {
                const ct = categoryTotal(cat);
                if (ct <= 0) return null;
                return (
                  <div key={cat.id} className="ff-row">
                    <span className="ff-row-label">{cat.title}</span>
                    <span className="ff-row-value">{rs(ct)}</span>
                  </div>
                );
              })}
              <div className="ff-divider" />
              <div className="ff-row">
                <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Deductions</span>
                <span className="ff-row-value bold green">{rs(total)}</span>
              </div>
            </div>

            {/* ── 8. Save Button ── */}
            <div style={{ marginTop: 14 }}>
              <button className="ff-btn ff-btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>
                <Save size={14} /> Save Deductions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DeductionField — Reusable field with tooltip
   ═══════════════════════════════════════════════════════ */
function DeductionField({ fieldKey, value, onChange, source }) {
  const meta = FIELD_META[fieldKey];
  if (!meta) return null;

  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={`ded-${fieldKey}`}>
        {meta.label}
        <span style={{ fontSize: 10, color: 'var(--text-light)', marginLeft: 6 }}>§{meta.section}</span>
        <span className="dd-tooltip-wrap" style={{ marginLeft: 4 }}>
          <HelpCircle size={12} className="dd-tooltip-icon" tabIndex={0} aria-label="What's this?" />
          <span className="dd-tooltip" role="tooltip" id={`tip-${fieldKey}`}>
            {meta.hint}
            {meta.limit && <span style={{ display: 'block', marginTop: 4, fontWeight: 500 }}>Limit: {rs(meta.limit)}</span>}
          </span>
        </span>
      </label>
      <input
        id={`ded-${fieldKey}`}
        className="ff-input"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-describedby={`tip-${fieldKey}`}
      />
      {source && source !== 'manual' && (
        <div className="ff-hint">
          Source: {SOURCE_LABELS[source] || source}
        </div>
      )}
    </div>
  );
}
