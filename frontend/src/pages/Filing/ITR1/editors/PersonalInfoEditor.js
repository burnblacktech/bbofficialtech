import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Lock, Shield, AlertTriangle, Save, User, MapPin, FileText, Info, CheckCircle } from 'lucide-react';
import { INDIAN_STATES, isMetroCity } from '../../../../constants/indianStates';
import { validatePersonalInfo } from '../../../../utils/itrValidation';
import { formatDateDDMMYYYY } from '../../../../utils/dateFormat';
import useAutoSave from '../../../../hooks/useAutoSave';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

/**
 * Parse fullName into firstName / middleName / lastName
 * "Rahul" → { firstName: "Rahul", middleName: "", lastName: "" }
 * "Rahul Sharma" → { firstName: "Rahul", middleName: "", lastName: "Sharma" }
 * "Rahul Kumar Sharma" → { firstName: "Rahul", middleName: "Kumar", lastName: "Sharma" }
 * "Rahul Kumar Singh Sharma" → { firstName: "Rahul", middleName: "Kumar Singh", lastName: "Sharma" }
 */
export function parseFullName(fullName) {
  if (!fullName || !fullName.trim()) return { firstName: '', middleName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
}

/**
 * Build initial form state from User, UserProfile, and saved personalInfo.
 * Saved jsonPayload.personalInfo values take precedence over User/UserProfile.
 */
export function buildInitialState(user, userProfile, savedPI, payload) {
  const parsed = parseFullName(user?.fullName);
  const hasSalary = (payload?.income?.salary?.employers || []).length > 0;

  // Defaults from User + UserProfile
  // Normalize gender: backend stores MALE/FEMALE/OTHER, we use Male/Female/Other
  const normalizeGender = (g) => {
    if (!g) return '';
    const upper = g.toUpperCase();
    if (upper === 'MALE') return 'Male';
    if (upper === 'FEMALE') return 'Female';
    if (upper === 'OTHER') return 'Other';
    return g; // already in correct format
  };

  const defaults = {
    firstName: parsed.firstName || '',
    middleName: parsed.middleName || '',
    lastName: parsed.lastName || '',
    pan: user?.panNumber || user?.pan || '',
    dob: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
    gender: normalizeGender(user?.gender),
    aadhaar: userProfile?.aadhaarNumber || '',
    email: user?.email || '',
    phone: user?.phone || '',
    residentialStatus: 'RES',
    employerCategory: hasSalary ? 'OTH' : 'NA',
    filingStatus: 'O',
    originalAckNumber: '',
    originalFilingDate: '',
    updatedReturnReason: '',
    address: {
      flatDoorBuilding: userProfile?.addressLine1 || '',
      premisesName: userProfile?.addressLine2 || '',
      roadStreet: '',
      areaLocality: '',
      city: userProfile?.city || '',
      stateCode: userProfile?.state || '',
      pincode: userProfile?.pincode || '',
    },
    ltcg112A: { amount: '', noLossToCarryForward: false },
  };

  if (!savedPI || Object.keys(savedPI).length === 0) return defaults;

  // Merge: saved values override defaults for non-empty fields
  const merged = { ...defaults };
  const simpleFields = ['firstName', 'middleName', 'lastName', 'pan', 'dob', 'gender', 'aadhaar', 'email', 'phone', 'residentialStatus', 'employerCategory', 'filingStatus', 'originalAckNumber', 'originalFilingDate', 'updatedReturnReason'];
  simpleFields.forEach(f => {
    if (savedPI[f] !== undefined && savedPI[f] !== null && savedPI[f] !== '') merged[f] = savedPI[f];
  });

  if (savedPI.address) {
    const addrFields = ['flatDoorBuilding', 'premisesName', 'roadStreet', 'areaLocality', 'city', 'stateCode', 'pincode'];
    addrFields.forEach(f => {
      if (savedPI.address[f] !== undefined && savedPI.address[f] !== null && savedPI.address[f] !== '') {
        merged.address[f] = savedPI.address[f];
      }
    });
  }

  if (savedPI.ltcg112A) {
    if (savedPI.ltcg112A.amount !== undefined && savedPI.ltcg112A.amount !== null && savedPI.ltcg112A.amount !== '') {
      merged.ltcg112A.amount = savedPI.ltcg112A.amount;
    }
    if (savedPI.ltcg112A.noLossToCarryForward !== undefined) {
      merged.ltcg112A.noLossToCarryForward = savedPI.ltcg112A.noLossToCarryForward;
    }
  }

  return merged;
}

const REQUIRED_FIELDS = ['firstName', 'lastName', 'pan', 'dob', 'gender', 'aadhaar', 'email', 'phone', 'residentialStatus', 'employerCategory', 'filingStatus'];
const REQUIRED_ADDR = ['flatDoorBuilding', 'city', 'stateCode', 'pincode'];

export function getCompletionInfo(form) {
  const total = REQUIRED_FIELDS.length + REQUIRED_ADDR.length;
  let filled = 0;
  REQUIRED_FIELDS.forEach(f => { if (form[f]?.toString().trim()) filled++; });
  REQUIRED_ADDR.forEach(f => { if (form.address?.[f]?.toString().trim()) filled++; });
  if (form.filingStatus === 'R' && !form.originalAckNumber?.trim()) filled = Math.max(0, filled);
  if (form.filingStatus === 'U' && !form.updatedReturnReason?.trim()) filled = Math.max(0, filled);
  return { filled, total, complete: filled === total };
}

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const RES_STATUS_OPTIONS = [
  { value: 'RES', label: 'Resident (RES)' },
  { value: 'NRI', label: 'Non-Resident (NRI)' },
  { value: 'RNOR', label: 'Resident but Not Ordinarily Resident (RNOR)' },
];

const EMPLOYER_CAT_OPTIONS = [
  { value: 'GOV', label: 'Government (GOV)' },
  { value: 'PSU', label: 'Public Sector Undertaking (PSU)' },
  { value: 'PE', label: 'Pensioner (PE)' },
  { value: 'OTH', label: 'Private Sector (OTH)' },
  { value: 'NA', label: 'Not Applicable (NA)' },
];

const FILING_STATUS_OPTIONS = [
  { value: 'O', label: 'Original (O)' },
  { value: 'R', label: 'Revised (R)' },
  { value: 'B', label: 'Belated (B)' },
  { value: 'U', label: 'Updated (U)' },
];

export default function PersonalInfoEditor({ payload, onSave, isSaving, filing, computation, itrType, user, userProfile }) {
  const savedPI = payload?.personalInfo || {};
  const [form, setForm] = useState(() => buildInitialState(user, userProfile, savedPI, payload));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);

  const panVerified = !!user?.panVerified;
  const hasSalary = (payload?.income?.salary?.employers || []).length > 0;
  const isRevisedFiling = filing?.filingType === 'revised';
  const isITR1 = itrType === 'ITR-1';

  const buildPayload = useCallback(() => {
    const metro = isMetroCity(form.address.city);
    const piData = { ...form, isMetroCity: metro, ltcg112A: isITR1 ? form.ltcg112A : undefined };
    if (isITR1 && !piData.ltcg112A?.amount && !piData.ltcg112A?.noLossToCarryForward) {
      delete piData.ltcg112A;
    }
    return { personalInfo: piData };
  }, [form, isITR1]);

  const { markDirty } = useAutoSave(onSave, buildPayload);

  // Re-init when payload changes externally (e.g. after save round-trip)
  useEffect(() => {
    if (!dirty) {
      setForm(buildInitialState(user, userProfile, payload?.personalInfo || {}, payload));
    }
  }, [payload?.personalInfo]); // eslint-disable-line

  const completion = useMemo(() => getCompletionInfo(form), [form]);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    markDirty();
  }, [markDirty]);

  const updateAddress = useCallback((field, value) => {
    setForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    setDirty(true);
    markDirty();
  }, [markDirty]);

  const updateLtcg = useCallback((field, value) => {
    setForm(prev => ({ ...prev, ltcg112A: { ...prev.ltcg112A, [field]: value } }));
    setDirty(true);
    markDirty();
  }, [markDirty]);

  // Validate single field on blur
  const handleBlur = useCallback((field) => {
    const result = validatePersonalInfo(form);
    if (result.errors[field]) {
      setErrors(prev => ({ ...prev, [field]: result.errors[field] }));
    } else {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }, [form]);

  const handleSave = useCallback(() => {
    const metro = isMetroCity(form.address.city);
    const piData = {
      ...form,
      isMetroCity: metro,
      ltcg112A: isITR1 ? form.ltcg112A : undefined,
    };
    // Clean up empty ltcg
    if (isITR1 && !piData.ltcg112A?.amount && !piData.ltcg112A?.noLossToCarryForward) {
      delete piData.ltcg112A;
    }
    onSave({ personalInfo: piData });
    setDirty(false);

    // Optional: sync address/Aadhaar back to UserProfile (non-blocking)
    try {
      const profileChanged =
        form.address.flatDoorBuilding !== (userProfile?.addressLine1 || '') ||
        form.address.premisesName !== (userProfile?.addressLine2 || '') ||
        form.address.city !== (userProfile?.city || '') ||
        form.address.stateCode !== (userProfile?.state || '') ||
        form.address.pincode !== (userProfile?.pincode || '') ||
        form.aadhaar !== (userProfile?.aadhaarNumber || '');
      if (profileChanged) {
        import('../../../../services/api').then(({ default: api }) => {
          api.put('/auth/profile', {
            addressLine1: form.address.flatDoorBuilding,
            addressLine2: form.address.premisesName,
            city: form.address.city,
            state: form.address.stateCode,
            pincode: form.address.pincode,
            aadhaarNumber: form.aadhaar,
          }).catch(err => console.warn('UserProfile sync failed (non-blocking):', err.message));
        });
      }
    } catch (err) {
      console.warn('UserProfile sync failed (non-blocking):', err.message);
    }
  }, [form, isITR1, onSave, userProfile]);

  // Locked field helper — only lock if PAN verified AND the field has a value
  const isLocked = (field) => {
    if (!panVerified) return false;
    if (!['firstName', 'middleName', 'lastName', 'dob', 'pan'].includes(field)) return false;
    // Don't lock empty fields — user needs to fill them even if PAN is verified
    const val = form[field];
    return val !== undefined && val !== null && val !== '';
  };
  const noSalaryLock = !hasSalary;

  return (
    <div>
      {/* Header with completion indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 className="step-title" style={{ margin: 0 }}>Personal Information</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: completion.complete ? P.success : P.warning }}>
            {completion.filled}/{completion.total}
          </span>
          {completion.complete
            ? <CheckCircle size={16} color={P.success} />
            : <AlertTriangle size={16} color={P.warning} />}
        </div>
      </div>
      <p className="step-desc">Your identity details as required by the Income Tax Department. Fields marked * are mandatory for filing.</p>

      {/* ── Section 1: Identity ── */}
      {panVerified && isLocked('firstName') && isLocked('lastName') && isLocked('pan') && isLocked('dob') ? (
        <>
          {/* Locked Data Card — PAN-verified fields as compact read-only display */}
          <div className="ff-locked-card">
            <div className="ff-locked-card-header">
              <Lock size={13} /> Identity
              <span className="ff-verified-dot"><Shield size={11} /> PAN Verified</span>
            </div>
            <div className="ff-kv-grid">
              <div className="ff-kv-row">
                <span className="ff-kv-label">Name</span>
                <span className="ff-kv-value">{[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')}</span>
              </div>
              <div className="ff-kv-row">
                <span className="ff-kv-label">PAN</span>
                <span className="ff-kv-value mono">{form.pan}</span>
              </div>
              <div className="ff-kv-row">
                <span className="ff-kv-label">Date of Birth</span>
                <span className="ff-kv-value">{formatDateDDMMYYYY(form.dob)}</span>
              </div>
            </div>
            <div className="ff-source-badge"><Shield size={11} /> From PAN verification</div>
          </div>
          {/* Gender still editable — not from PAN */}
          <div className="step-card editing">
            <div className="ff-field">
              <label className="ff-label">Gender *</label>
              <select className={`ff-select ${errors.gender ? 'error' : ''}`} value={form.gender} onChange={e => { updateField('gender', e.target.value); }} onBlur={() => handleBlur('gender')}>
                {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.gender && <div className="ff-hint" style={{ color: P.error }}>{errors.gender}</div>}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Editable form — PAN not verified or fields incomplete */}
          {panVerified && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: P.successBg, border: `1px solid ${P.successBorder}`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: P.success, marginBottom: 12 }}>
              <Shield size={13} /> PAN Verified — Name, DOB, and PAN are locked
            </div>
          )}
          <div className="step-card editing">
            <div className="ff-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Identity
            </div>
            <div className="ff-grid-2">
              <Field label="First Name *" value={form.firstName} onChange={v => updateField('firstName', v)} onBlur={() => handleBlur('firstName')} error={errors.firstName} locked={isLocked('firstName')} hint="As per PAN card" />
              <Field label="Middle Name" value={form.middleName} onChange={v => updateField('middleName', v)} locked={isLocked('middleName')} hint="Optional" />
            </div>
            <div className="ff-grid-2">
              <Field label="Last Name *" value={form.lastName} onChange={v => updateField('lastName', v)} onBlur={() => handleBlur('lastName')} error={errors.lastName} locked={isLocked('lastName')} hint="Surname as per PAN card" />
              <Field label="PAN *" value={form.pan} onChange={v => updateField('pan', v.toUpperCase())} onBlur={() => handleBlur('pan')} error={errors.pan} locked={isLocked('pan')} hint="5 letters, 4 digits, 1 letter · e.g., ABCDE1234F" />
            </div>
            <div className="ff-grid-2">
              <Field label="Date of Birth *" value={form.dob} onChange={v => updateField('dob', v)} onBlur={() => handleBlur('dob')} error={errors.dob} locked={isLocked('dob')} type="date" />
              <div className="ff-field">
                <label className="ff-label">Gender *</label>
                <select className={`ff-select ${errors.gender ? 'error' : ''}`} value={form.gender} onChange={e => { updateField('gender', e.target.value); }} onBlur={() => handleBlur('gender')}>
                  {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.gender && <div className="ff-hint" style={{ color: P.error }}>{errors.gender}</div>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Section 2: Contact ── */}
      <div className="step-card editing">
        <div className="ff-section-title">Contact</div>
        <div className="ff-grid-2">
          <Field label="Email *" value={form.email} onChange={v => updateField('email', v)} onBlur={() => handleBlur('email')} error={errors.email} type="text" hint="ITD sends notices here · Use your primary email" />
          <Field label="Phone *" value={form.phone} onChange={v => updateField('phone', v)} onBlur={() => handleBlur('phone')} error={errors.phone} type="text" hint="10-digit mobile · Starting with 6, 7, 8, or 9" />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Field label="Aadhaar Number *" value={form.aadhaar} onChange={v => updateField('aadhaar', v)} onBlur={() => handleBlur('aadhaar')} error={errors.aadhaar} type="text" hint="12-digit Aadhaar · Required for e-verification" />
          </div>
          <AadhaarUploadButton onExtracted={(data) => {
            if (data.aadhaarMasked) updateField('aadhaar', data.aadhaarMasked.replace(/\s/g, '').replace(/X/g, ''));
            if (data.gender) updateField('gender', data.gender);
            if (data.dob && !isLocked('dob')) updateField('dob', data.dob);
            if (data.address?.flatDoorBuilding) updateAddress('flatDoorBuilding', data.address.flatDoorBuilding);
            if (data.address?.premisesName) updateAddress('premisesName', data.address.premisesName);
            if (data.address?.areaLocality) updateAddress('areaLocality', data.address.areaLocality);
            if (data.address?.city) updateAddress('city', data.address.city);
            if (data.address?.pincode) updateAddress('pincode', data.address.pincode);
          }} />
        </div>
      </div>

      {/* ── Section 3: Address ── */}
      <div className="step-card editing">
        <div className="ff-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={14} /> Address
        </div>
        <div className="ff-grid-2">
          <Field label="Flat/Door/Building *" value={form.address.flatDoorBuilding} onChange={v => updateAddress('flatDoorBuilding', v)} onBlur={() => handleBlur('address.flatDoorBuilding')} error={errors['address.flatDoorBuilding']} hint="House/flat number · ITD: Residence No" />
          <Field label="Premises Name" value={form.address.premisesName} onChange={v => updateAddress('premisesName', v)} hint="Building or apartment name · Optional" />
        </div>
        <div className="ff-grid-2">
          <Field label="Road/Street" value={form.address.roadStreet} onChange={v => updateAddress('roadStreet', v)} />
          <Field label="Area/Locality" value={form.address.areaLocality} onChange={v => updateAddress('areaLocality', v)} />
        </div>
        <div className="ff-grid-2">
          <Field label="City *" value={form.address.city} onChange={v => updateAddress('city', v)} onBlur={() => handleBlur('address.city')} error={errors['address.city']} hint={isMetroCity(form.address.city) ? '🏙️ Metro city (50% HRA rate)' : undefined} />
          <div className="ff-field">
            <label className="ff-label">State *</label>
            <select className={`ff-select ${errors['address.stateCode'] ? 'error' : ''}`} value={form.address.stateCode} onChange={e => updateAddress('stateCode', e.target.value)} onBlur={() => handleBlur('address.stateCode')}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            {errors['address.stateCode'] && <div className="ff-hint" style={{ color: P.error }}>{errors['address.stateCode']}</div>}
          </div>
        </div>
        <div className="ff-grid-2">
          <Field label="Pincode *" value={form.address.pincode} onChange={v => updateAddress('pincode', v)} onBlur={() => handleBlur('address.pincode')} error={errors['address.pincode']} hint="6-digit postal code · Of your current residence" />
          <div />
        </div>
      </div>

      {/* ── Section 4: Filing Metadata ── */}
      <div className="step-card editing">
        <div className="ff-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} /> Filing Metadata
        </div>

        {/* Residential Status */}
        <div className="ff-field">
          <label className="ff-label">Residential Status *</label>
          <select className="ff-select" value={form.residentialStatus} onChange={e => updateField('residentialStatus', e.target.value)}>
            {RES_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {(form.residentialStatus === 'NRI' || form.residentialStatus === 'RNOR') && isITR1 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.warningBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.warning }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>ITR-1 is only available for Resident individuals. Your ITR type may change. Consider ITR-2.</span>
          </div>
        )}

        {/* Employer Category */}
        <div className="ff-field">
          <label className="ff-label">Employer Category *</label>
          <select className="ff-select" value={form.employerCategory} onChange={e => updateField('employerCategory', e.target.value)} disabled={noSalaryLock}>
            {EMPLOYER_CAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {noSalaryLock && <div className="ff-hint">Applicable only for salaried taxpayers.</div>}
        </div>

        {/* Filing Status */}
        <div className="ff-field">
          <label className="ff-label">Filing Status *</label>
          <select className="ff-select" value={form.filingStatus} onChange={e => updateField('filingStatus', e.target.value)} disabled={isRevisedFiling}>
            {FILING_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {isRevisedFiling && <div className="ff-hint">Filing type is set to Revised from the filing record.</div>}
        </div>

        {/* Conditional: Revised return fields */}
        {form.filingStatus === 'R' && (
          <div className="ff-grid-2">
            <Field label="Original Ack Number *" value={form.originalAckNumber} onChange={v => updateField('originalAckNumber', v)} onBlur={() => handleBlur('originalAckNumber')} error={errors.originalAckNumber} hint="Acknowledgment number of the original filing" />
            <Field label="Original Filing Date" value={form.originalFilingDate} onChange={v => updateField('originalFilingDate', v)} type="date" hint="Date the original return was filed" />
          </div>
        )}

        {/* Conditional: Updated return reason */}
        {form.filingStatus === 'U' && (
          <div className="ff-field">
            <label className="ff-label">Reason for Updated Return *</label>
            <select className={`ff-select ${errors.updatedReturnReason ? 'error' : ''}`} value={form.updatedReturnReason} onChange={e => updateField('updatedReturnReason', e.target.value)} onBlur={() => handleBlur('updatedReturnReason')}>
              <option value="">Select reason</option>
              <option value="INCOME_NOT_REPORTED">Income not reported earlier</option>
              <option value="WRONG_HEAD">Income reported under wrong head</option>
              <option value="DEDUCTION_OVERCLAIMED">Deduction/exemption over-claimed</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.updatedReturnReason && <div className="ff-hint" style={{ color: P.error }}>{errors.updatedReturnReason}</div>}
          </div>
        )}

        {/* Belated return warning */}
        {form.filingStatus === 'B' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.warningBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.warning }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Belated returns filed after the due date may attract interest under Section 234A.</span>
          </div>
        )}
      </div>

      {/* ── Section 5: LTCG Mini-Section (ITR-1 only) ── */}
      {isITR1 && (
        <div className="step-card editing">
          <div className="ff-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUpIcon size={14} /> LTCG under Section 112A (ITR-1)
          </div>
          <div className="ff-hint" style={{ marginBottom: 12, marginTop: -8 }}>
            From AY 2025-26, ITR-1 allows LTCG up to ₹1.25 lakh from listed equity/MF under Section 112A, provided there are no losses to carry forward.
          </div>
          <Field label="LTCG Amount (₹)" value={form.ltcg112A.amount} onChange={v => updateLtcg('amount', v)} type="number" hint="Total LTCG from listed equity shares or equity mutual funds" />
          {Number(form.ltcg112A.amount) > 125000 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.errorBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.error }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>LTCG exceeds ₹1.25L limit for ITR-1. Use ITR-2 for higher capital gains.</span>
            </div>
          )}
          <label className="ff-check">
            <input type="checkbox" checked={!!form.ltcg112A.noLossToCarryForward} onChange={e => updateLtcg('noLossToCarryForward', e.target.checked)} />
            I confirm there are no capital gains losses to carry forward
          </label>
        </div>
      )}

      {/* ── Save Button ── */}
      <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={isSaving} style={{ marginTop: 4 }}>
        {isSaving ? <><span className="ff-spinner" /> Saving...</> : <><Save size={14} /> Save Personal Info</>}
      </button>
    </div>
  );
}

/* ── Reusable Field Component ── */
function Field({ label, value, onChange, onBlur, error, locked, type = 'text', hint }) {
  return (
    <div className="ff-field">
      <label className="ff-label">{label} {locked && <Lock size={11} style={{ verticalAlign: -1, color: P.textLight }} />}</label>
      <input
        className={`ff-input ${error ? 'error' : ''}`}
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={locked}
        disabled={locked}
        placeholder={type === 'number' ? '0' : ''}
      />
      {error ? <div className="ff-hint" style={{ color: P.error }}>{error}</div> : hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/* Inline TrendingUp icon alias to avoid importing from lucide at top level collision */
function TrendingUpIcon({ size, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/* ── eAadhaar Upload Button ── */
function AadhaarUploadButton({ onExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (file, pwd) => {
    setError('');
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { default: api } = await import('../../../../services/api');
      const body = { fileContent: base64 };
      if (pwd) body.password = pwd;
      const res = await api.post('/auth/verify-aadhaar', body);

      if (res.data?.success && res.data?.data) {
        onExtracted(res.data.data);
        setNeedsPassword(false);
        setPendingFile(null);
        setPassword('');
      }
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || 'Upload failed';
      if (code === 'AADHAAR_PASSWORD_INCORRECT') {
        setNeedsPassword(true);
        setPendingFile(file);
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <button
        className="ff-btn ff-btn-outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{ fontSize: 12, padding: '8px 12px', whiteSpace: 'nowrap' }}
      >
        {uploading ? 'Reading...' : '📄 Upload eAadhaar'}
      </button>
      {error && <div className="ff-hint" style={{ color: P.error, marginTop: 4 }}>{error}</div>}
      {needsPassword && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input className="ff-input" type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Aadhaar number or share code" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} />
          <button className="ff-btn ff-btn-primary" onClick={() => { if (pendingFile && password) handleFile(pendingFile, password); }} disabled={!password || uploading} style={{ fontSize: 12, padding: '6px 12px' }}>
            Unlock
          </button>
        </div>
      )}
    </div>
  );
}
