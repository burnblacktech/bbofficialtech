import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Lock, Shield, AlertTriangle, Save, User, MapPin, FileText, Info, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { INDIAN_STATES, isMetroCity } from '../../../../constants/indianStates';
import { validatePersonalInfo } from '../../../../utils/itrValidation';
import { formatDateDDMMYYYY } from '../../../../utils/dateFormat';
import useAutoSave from '../../../../hooks/useAutoSave';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import P from '../../../../styles/palette';
import { Field, Select, Grid, Card, Section, Button } from '../../../../components/ds';

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

const REQUIRED_FIELDS = ['firstName', 'lastName', 'pan', 'dob', 'gender', 'email', 'phone', 'residentialStatus', 'employerCategory', 'filingStatus'];
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
  { value: 'RES', label: 'Resident' },
  { value: 'NRI', label: 'Non-Resident (NRI)' },
  { value: 'RNOR', label: 'RNOR' },
];

const EMPLOYER_CAT_OPTIONS = [
  { value: 'GOV', label: 'Government' },
  { value: 'PSU', label: 'PSU' },
  { value: 'PE', label: 'Pensioner' },
  { value: 'OTH', label: 'Private Sector' },
  { value: 'NA', label: 'Not Applicable' },
];

const FILING_STATUS_OPTIONS = [
  { value: 'O', label: 'Original' },
  { value: 'R', label: 'Revised' },
  { value: 'B', label: 'Belated' },
  { value: 'U', label: 'Updated' },
];

export default function PersonalInfoEditor({ payload, onSave, isSaving, filing, computation, itrType, user, userProfile }) {
  const savedPI = payload?.personalInfo || {};
  const [form, setForm] = useState(() => buildInitialState(user, userProfile, savedPI, payload));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);

  const panVerified = !!user?.panVerified;
  // DOB from PAN verification (authoritative source from ITD)
  const panVerifiedDob = user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '';

  // Sync DOB + name from user when PAN verification completes (profile refresh)
  useEffect(() => {
    if (!user) return;
    setForm(prev => {
      const updates = {};
      if (user.dateOfBirth && !prev.dob) {
        updates.dob = String(user.dateOfBirth).slice(0, 10);
      }
      if (user.fullName && !prev.firstName) {
        const parts = (user.fullName || '').trim().split(/\s+/);
        if (parts.length >= 2) {
          updates.firstName = parts[0];
          updates.lastName = parts[parts.length - 1];
          if (parts.length > 2) updates.middleName = parts.slice(1, -1).join(' ');
        } else if (parts.length === 1) {
          updates.firstName = parts[0];
        }
      }
      if (user.panNumber && !prev.pan) {
        updates.pan = user.panNumber;
      }
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [user?.dateOfBirth, user?.fullName, user?.panNumber]); // eslint-disable-line

  // Fallback: if PAN is verified but DOB is still missing, re-fetch profile
  const dobFetchAttempted = useRef(false);
  useEffect(() => {
    if (panVerified && !panVerifiedDob && !dobFetchAttempted.current) {
      dobFetchAttempted.current = true;
      api.get('/auth/profile').then((res) => {
        const profile = res.data?.user || res.data;
        if (profile?.dateOfBirth) {
          setForm(prev => prev.dob ? prev : { ...prev, dob: String(profile.dateOfBirth).slice(0, 10) });
        }
      }).catch(() => {});
    }
  }, [panVerified, panVerifiedDob]); // eslint-disable-line

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
  // DOB: only lock if it matches the PAN-verified DOB (prevents locking wrong user-entered DOB)
  const isLocked = (field) => {
    if (!panVerified) return false;
    if (!['firstName', 'middleName', 'lastName', 'dob', 'pan'].includes(field)) return false;
    const val = form[field];
    if (val === undefined || val === null || val === '') return false;
    if (field === 'dob') {
      return panVerifiedDob && val === panVerifiedDob;
    }
    return true;
  };
  const aadhaarLocked = !!form.aadhaarLocked;
  const isAddressLocked = (field) => {
    if (!aadhaarLocked) return false;
    return ['flatDoorBuilding', 'city', 'stateCode', 'pincode'].includes(field) && !!form.address?.[field];
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
          <Card muted>
            <div className="ds-kv__header">
              <Lock size={13} /> Identity
              <span className="ds-verified"><Shield size={11} /> PAN Verified</span>
            </div>
            <Grid cols={3}>
              <div className="ds-kv__row">
                <span className="ds-kv__label">Name</span>
                <span className="ds-kv__value">{[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')}</span>
              </div>
              <div className="ds-kv__row">
                <span className="ds-kv__label">PAN</span>
                <span className="ds-kv__value mono">{form.pan ? form.pan.replace(/^.{5}/, 'XXXXX') : ''}</span>
              </div>
              <div className="ds-kv__row">
                <span className="ds-kv__label">Date of Birth</span>
                <span className="ds-kv__value">{formatDateDDMMYYYY(form.dob)}</span>
              </div>
            </Grid>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div className="ds-source" style={{ margin: 0 }}><Shield size={11} /> From PAN verification</div>
              <Select value={form.gender} onChange={v => updateField('gender', v)} options={GENDER_OPTIONS} style={{ width: 'auto', minWidth: 80 }} />
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Editable form — PAN not verified or fields incomplete */}
          {panVerified && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: P.successBg, border: `1px solid ${P.successBorder}`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: P.success, marginBottom: 12 }}>
              <Shield size={13} /> PAN Verified — Name, DOB, and PAN are locked
            </div>
          )}
          <Card active>
            <Section icon={User} title="Identity" />
            <Grid cols={3}>
              <Field label="First Name *" value={form.firstName} onChange={v => updateField('firstName', v)} onBlur={() => handleBlur('firstName')} error={errors.firstName} locked={isLocked('firstName')} hint="As per PAN card" />
              <Field label="Middle Name" value={form.middleName} onChange={v => updateField('middleName', v)} locked={isLocked('middleName')} hint="Optional" />
              <Field label="Last Name *" value={form.lastName} onChange={v => updateField('lastName', v)} onBlur={() => handleBlur('lastName')} error={errors.lastName} locked={isLocked('lastName')} hint="Surname as per PAN card" />
            </Grid>
            <Grid cols={3}>
              <Field label="PAN *" value={form.pan} onChange={v => updateField('pan', v.toUpperCase())} onBlur={() => handleBlur('pan')} error={errors.pan} locked={isLocked('pan')} hint="e.g., ABCDE1234F" />
              <Field label="Date of Birth *" value={form.dob} onChange={v => updateField('dob', v)} onBlur={() => handleBlur('dob')} error={errors.dob} locked={isLocked('dob')} type="date"
                hint={panVerified && panVerifiedDob && form.dob && form.dob !== panVerifiedDob
                  ? `⚠️ PAN records show ${formatDateDDMMYYYY(panVerifiedDob)}`
                  : panVerified && panVerifiedDob && form.dob === panVerifiedDob
                    ? '✓ Matches PAN records'
                    : 'DD/MM/YYYY · As per PAN card'} />
              <Select label="Gender *" value={form.gender} onChange={v => updateField('gender', v)} onBlur={() => handleBlur('gender')} error={errors.gender} options={GENDER_OPTIONS} placeholder="Select gender" />
            </Grid>
          </Card>
        </>
      )}

      {/* ── Section 2: Contact & Address (bordered sub-sections) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 8 }}>
        {/* Contact sub-section */}
        <div className="bordered-subsection">
          <div className="bordered-subsection__header">Contact</div>
          <div className="bordered-subsection__body">
            <Field label="Email *" value={form.email} onChange={v => updateField('email', v)} onBlur={() => handleBlur('email')} error={errors.email} type="text" />
            <Field label="Phone *" value={form.phone} onChange={v => updateField('phone', v)} onBlur={() => handleBlur('phone')} error={errors.phone} type="text" />
            <Field label="Aadhaar" value={form.aadhaar} onChange={v => updateField('aadhaar', v.replace(/[^\d]/g, '').slice(0, 12))} onBlur={() => handleBlur('aadhaar')} error={errors.aadhaar} type="text" />
          </div>
        </div>
        {/* Address sub-section */}
        <div className="bordered-subsection">
          <div className="bordered-subsection__header">Address {aadhaarLocked && <span style={{ fontSize: 10, color: 'var(--color-success)', marginLeft: 6 }}>✓ Aadhaar verified</span>}</div>
          <div className="bordered-subsection__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            <Field label="Flat/Door/Building *" value={form.address.flatDoorBuilding} onChange={v => updateAddress('flatDoorBuilding', v)} onBlur={() => handleBlur('address.flatDoorBuilding')} error={errors['address.flatDoorBuilding']} locked={isAddressLocked('flatDoorBuilding')} />
            <Field label="City *" value={form.address.city} onChange={v => updateAddress('city', v)} onBlur={() => handleBlur('address.city')} error={errors['address.city']} locked={isAddressLocked('city')} />
            <Field label="Road/Street" value={form.address.roadStreet} onChange={v => updateAddress('roadStreet', v)} />
            <Select label="State *" value={form.address.stateCode} onChange={v => updateAddress('stateCode', v)} options={INDIAN_STATES.map(s => ({ value: s.code, label: s.name }))} placeholder="Select" disabled={isAddressLocked('stateCode')} />
            <Field label="Area/Locality" value={form.address.areaLocality} onChange={v => updateAddress('areaLocality', v)} />
            <Field label="Pincode *" value={form.address.pincode} onChange={v => updateAddress('pincode', v)} onBlur={() => handleBlur('address.pincode')} error={errors['address.pincode']} locked={isAddressLocked('pincode')} />
          </div>
        </div>
      </div>
        <AadhaarUploadButton aadhaarValue={form.aadhaar} onVerified={(data) => {
              if (data.aadhaarNumber) updateField('aadhaar', data.aadhaarNumber.replace(/\s/g, ''));
              if (data.name && !form.firstName) {
                const parsed = parseFullName(data.name);
                updateField('firstName', parsed.firstName);
                updateField('middleName', parsed.middleName);
                updateField('lastName', parsed.lastName);
              }
              if (data.dob && !form.dob) updateField('dob', data.dob);
              if (data.gender && !form.gender) updateField('gender', data.gender === 'M' ? 'MALE' : data.gender === 'F' ? 'FEMALE' : 'OTHER');
              if (data.address) {
                const addr = form.address || {};
                let parsed = {};
                if (typeof data.address === 'object') {
                  // Backend returns structured address — use directly
                  parsed = {
                    flatDoorBuilding: data.address.flatDoorBuilding || '',
                    premisesName: data.address.premisesName || '',
                    areaLocality: data.address.areaLocality || '',
                    city: data.address.city || '',
                    stateCode: data.address.stateCode || '',
                    pincode: data.address.pincode || '',
                  };
                  // Map state name to code if stateCode is empty but we have fullAddress
                  if (!parsed.stateCode && data.address.fullAddress) {
                    const st = INDIAN_STATES.find(s => data.address.fullAddress.toLowerCase().includes(s.name.toLowerCase()));
                    if (st) parsed.stateCode = st.code;
                  }
                } else {
                  // Fallback: parse address string
                  const raw = String(data.address);
                  const pincodeMatch = raw.match(/\b(\d{6})\b/);
                  if (pincodeMatch) parsed.pincode = pincodeMatch[1];
                  const st = INDIAN_STATES.find(s => raw.toLowerCase().includes(s.name.toLowerCase()));
                  if (st) parsed.stateCode = st.code;
                  const roadPattern = /(.+?)\b(road|street|marg|lane|nagar|colony|sector)\b/i;
                  const roadMatch = raw.match(roadPattern);
                  if (roadMatch) {
                    parsed.flatDoorBuilding = roadMatch[1].replace(/,\s*$/, '').trim();
                    // Extract road/street portion up to next comma
                    const afterFlat = raw.slice(roadMatch[1].length);
                    const roadEnd = afterFlat.indexOf(',');
                    parsed.roadStreet = (roadEnd >= 0 ? afterFlat.slice(0, roadEnd) : afterFlat.split(/\s*[-–]\s*/)[0]).trim();
                  }
                  // City: segment before state or after last comma
                  const segments = raw.replace(/\b\d{6}\b/, '').split(/[,\-–]/).map(s => s.trim()).filter(Boolean);
                  if (st) {
                    const stIdx = segments.findIndex(s => s.toLowerCase().includes(st.name.toLowerCase()));
                    if (stIdx > 0) parsed.city = segments[stIdx - 1];
                  } else if (segments.length > 1) {
                    parsed.city = segments[segments.length - 1];
                  }
                  if (!parsed.flatDoorBuilding && segments.length) parsed.flatDoorBuilding = segments[0];
                  if (!parsed.roadStreet && segments.length > 2) parsed.areaLocality = segments[1];
                }
                // Only fill empty fields
                const merged = { ...addr };
                for (const [key, val] of Object.entries(parsed)) {
                  if (val && !addr[key]) merged[key] = val;
                }
                if (JSON.stringify(merged) !== JSON.stringify(addr)) {
                  updateField('address', merged);
                  toast.success('Address auto-filled from Aadhaar');
                }
              }
              // Lock fields after Aadhaar verification
              updateField('aadhaarVerifiedAt', new Date().toISOString());
              updateField('aadhaarLocked', true);
            }} />

      {/* ── Section 4: Filing Metadata ── */}
      <Card active>
        <Section icon={FileText} title="Filing Details" />
        <p className="ds-hint" style={{ marginTop: -8, marginBottom: 8 }}>Most salaried individuals can use the defaults below.</p>

        <div className="unit-grid">
        {/* Residential Status */}
        <Select label="Residential Status *" value={form.residentialStatus} onChange={v => updateField('residentialStatus', v)} options={RES_STATUS_OPTIONS} hint="Lived in India 182+ days? → Resident" />

        {/* Employer Category */}
        <Select label="Employer Category *" value={form.employerCategory} onChange={v => updateField('employerCategory', v)} options={EMPLOYER_CAT_OPTIONS} disabled={noSalaryLock} hint={noSalaryLock ? 'No salary added' : 'Most: Private Sector'} />

        {/* Filing Status */}
        <Select label="Filing Status *" value={form.filingStatus} onChange={v => updateField('filingStatus', v)} options={FILING_STATUS_OPTIONS} disabled={isRevisedFiling} hint={isRevisedFiling ? 'Set to Revised' : 'First filing? → Original'} />
        </div>

        {(form.residentialStatus === 'NRI' || form.residentialStatus === 'RNOR') && isITR1 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.warningBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.warning }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>ITR-1 is only available for Resident individuals. Your ITR type may change. Consider ITR-2.</span>
          </div>
        )}

        {/* Conditional: Revised return fields */}
        {form.filingStatus === 'R' && (
          <Grid cols={2}>
            <Field label="Original Ack Number *" value={form.originalAckNumber} onChange={v => updateField('originalAckNumber', v)} onBlur={() => handleBlur('originalAckNumber')} error={errors.originalAckNumber} hint="Acknowledgment number of the original filing" />
            <Field label="Original Filing Date" value={form.originalFilingDate} onChange={v => updateField('originalFilingDate', v)} type="date" hint="Date the original return was filed" />
          </Grid>
        )}

        {/* Conditional: Updated return reason */}
        {form.filingStatus === 'U' && (
          <Select label="Reason for Updated Return *" value={form.updatedReturnReason} onChange={v => updateField('updatedReturnReason', v)} onBlur={() => handleBlur('updatedReturnReason')} error={errors.updatedReturnReason} placeholder="Select reason" options={[
            { value: 'INCOME_NOT_REPORTED', label: 'Income not reported earlier' },
            { value: 'WRONG_HEAD', label: 'Income reported under wrong head' },
            { value: 'DEDUCTION_OVERCLAIMED', label: 'Deduction/exemption over-claimed' },
            { value: 'OTHER', label: 'Other' },
          ]} />
        )}

        {/* Belated return warning */}
        {form.filingStatus === 'B' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.warningBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.warning }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Belated returns filed after the due date may attract interest under Section 234A.</span>
          </div>
        )}
      </Card>

      {/* ── Section 5: LTCG Mini-Section (ITR-1 only) ── */}
      {isITR1 && (
        <Card active>
          <label className="ds-check" style={{ marginBottom: form.ltcg112A.amount || form.ltcg112A.noLossToCarryForward ? 12 : 0 }}>
            <input type="checkbox" checked={!!(form.ltcg112A.amount || form.ltcg112A.noLossToCarryForward)} onChange={e => { if (!e.target.checked) { updateLtcg('amount', ''); updateLtcg('noLossToCarryForward', false); } else { updateLtcg('noLossToCarryForward', true); } }} />
            <span>I sold listed shares or equity mutual funds this year <span style={{ fontSize: 11, color: P.textLight }}>(LTCG u/s 112A)</span></span>
          </label>
          {(form.ltcg112A.amount || form.ltcg112A.noLossToCarryForward) && (
            <>
              <div className="ds-hint" style={{ marginBottom: 12 }}>
                ITR-1 allows LTCG up to ₹1.25 lakh from listed equity/MF. No losses to carry forward.
              </div>
              <Field label="LTCG Amount (₹)" value={form.ltcg112A.amount} onChange={v => updateLtcg('amount', v)} type="number" hint="Total LTCG from listed equity shares or equity mutual funds" />
              {Number(form.ltcg112A.amount) > 125000 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: P.errorBg, borderRadius: 6, marginBottom: 12, fontSize: 12, color: P.error }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>LTCG exceeds ₹1.25L limit for ITR-1. Use ITR-2 for higher capital gains.</span>
                </div>
              )}
              <label className="ds-check">
                <input type="checkbox" checked={!!form.ltcg112A.noLossToCarryForward} onChange={e => updateLtcg('noLossToCarryForward', e.target.checked)} />
                I confirm there are no capital gains losses to carry forward
              </label>
            </>
          )}
        </Card>
      )}

      {/* ── Save Button ── */}
      <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ marginTop: 4 }}>
        {isSaving ? <><span className="ds-spinner" /> Saving...</> : <><Save size={14} /> Save Personal Info</>}
      </Button>
      {completion.complete && !dirty && (
        <p style={{ fontSize: 12, color: P.success, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} /> Personal info complete. Close this panel to continue with your income details.
        </p>
      )}
    </div>
  );
}

/* ── DateInput Component ── */
/**
 * DateInput — DD/MM/YYYY text input with auto-formatting.
 * Stores value as YYYY-MM-DD internally but displays as DD/MM/YYYY.
 * Auto-inserts slashes as user types. Validates on blur.
 */
function DateInput({ value, onChange, onBlur, locked, error }) {
  // Convert YYYY-MM-DD → DD/MM/YYYY for display
  const toDisplay = (iso) => {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };
  // Convert DD/MM/YYYY → YYYY-MM-DD for storage
  const toISO = (display) => {
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  };

  const [text, setText] = useState(toDisplay(value));

  // Sync when external value changes (e.g., PAN verification populates DOB)
  useEffect(() => {
    const d = toDisplay(value);
    if (d !== text && value) setText(d);
  }, [value]); // eslint-disable-line

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d/]/g, '');
    // Auto-insert slashes: after DD and MM
    if (raw.length === 2 && !raw.includes('/')) raw += '/';
    else if (raw.length === 5 && raw.charAt(2) === '/' && raw.split('/').length === 2) raw += '/';
    // Cap at 10 chars (DD/MM/YYYY)
    if (raw.length > 10) raw = raw.slice(0, 10);
    setText(raw);
    // If complete, convert and propagate
    if (raw.length === 10) {
      const iso = toISO(raw);
      if (iso) onChange(iso);
    }
  };

  const handleBlur = () => {
    if (text.length === 10) {
      const iso = toISO(text);
      if (iso) {
        // Validate the date is real
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
          onChange(iso);
        }
      }
    }
    onBlur?.();
  };

  return (
    <input
      className={`ds-input ${error ? 'error' : ''}`}
      type="text"
      inputMode="numeric"
      value={locked ? toDisplay(value) : text}
      onChange={locked ? undefined : handleChange}
      onBlur={locked ? undefined : handleBlur}
      readOnly={locked}
      disabled={locked}
      placeholder="DD/MM/YYYY"
      maxLength={10}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
    />
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

/**
 * AadhaarUploadButton — OTP-based Aadhaar verification (primary) + PDF upload (fallback).
 * Step 1: Enter Aadhaar → Send OTP to linked mobile
 * Step 2: Enter OTP → Get verified profile data → auto-fill fields
 * Fallback: Upload eAadhaar PDF if OTP not available
 */
function AadhaarUploadButton({ onVerified, aadhaarValue }) {
  const fileRef = useRef(null);
  const [mode, setMode] = useState('idle'); // idle | otp-sent | uploading | pdf-password
  const [otpInput, setOtpInput] = useState('');
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  // Step 1: Send OTP using parent's aadhaar value
  const handleSendOTP = async () => {
    const cleaned = (aadhaarValue || '').replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleaned)) { toast.error('Enter a valid 12-digit Aadhaar number in the field above'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/aadhaar/generate-otp', { aadhaarNumber: cleaned });
      setClientId(res.data.data.clientId);
      setMode('otp-sent');
      toast.success('OTP sent to your Aadhaar-linked mobile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!/^\d{6}$/.test(otpInput)) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/aadhaar/submit-otp', { clientId, otp: otpInput });
      const data = res.data?.data || {};
      toast.success('Aadhaar verified — details auto-filled');
      setMode('idle');
      setOtpInput('');
      setClientId(null);
      onVerified({
        aadhaarNumber: data.aadhaarNumber,
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  // PDF fallback
  const handleFile = async (file, pwd) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const body = { fileContent: base64 };
      if (pwd) body.password = pwd;
      const res = await api.post('/auth/verify-aadhaar', body);
      toast.success('Aadhaar verified — details auto-filled');
      setMode('idle');
      setPendingFile(null);
      setPassword('');
      onVerified(res.data?.data || {});
    } catch (err) {
      const msg = err.response?.data?.error || 'Aadhaar verification failed';
      if (msg.toLowerCase().includes('password')) {
        setMode('pdf-password');
        setPendingFile(file);
        toast.error('PDF is password-protected');
      } else { toast.error(msg); }
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (mode === 'idle') {
    const hasAadhaar = (aadhaarValue || '').replace(/\s/g, '').length === 12;
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <Button
          variant="primary"
          onClick={handleSendOTP}
          disabled={loading || !hasAadhaar}
          style={{ padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
        >
          {loading ? <><Loader2 size={12} className="animate-spin" /> Sending...</> : <><Shield size={12} /> Verify via OTP</>}
        </Button>
        <span style={{ fontSize: 11, color: 'var(--text-light)' }}>or</span>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, minHeight: 'auto' }}
        >
          Upload eAadhaar PDF
        </button>
        <input ref={fileRef} type="file" accept=".pdf" hidden onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
      </div>
    );
  }

  if (mode === 'otp-sent') {
    return (
      <div style={{ padding: 10, background: 'var(--bg-muted)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
          OTP sent to your Aadhaar-linked mobile. Enter it below:
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="ds-input"
            type="text"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit OTP"
            maxLength={6}
            style={{ flex: 1, fontSize: 14, letterSpacing: '0.15em', textAlign: 'center' }}
            autoFocus
          />
          <Button
            variant="primary"
            onClick={handleVerifyOTP}
            disabled={loading || otpInput.length !== 6}
            style={{ padding: '8px 14px', fontSize: 12 }}
          >
            {loading ? <><Loader2 size={12} className="animate-spin" /> Verifying...</> : 'Verify'}
          </Button>
        </div>
        <button onClick={() => { setMode('idle'); setOtpInput(''); }} style={{ marginTop: 6, background: 'none', border: 'none', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
          ← Back
        </button>
      </div>
    );
  }

  if (mode === 'pdf-password') {
    return (
      <div style={{ padding: 10, background: 'var(--bg-muted)', borderRadius: 6, border: '1px solid var(--border-light)' }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PDF Password</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="ds-input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Aadhaar number or share code" style={{ flex: 1, fontSize: 12 }} />
          <Button variant="primary" onClick={() => { if (pendingFile && password) handleFile(pendingFile, password); }} disabled={!password || loading} style={{ padding: '6px 12px', fontSize: 11 }}>Unlock</Button>
        </div>
        <button onClick={() => { setMode('idle'); setPassword(''); setPendingFile(null); }} style={{ marginTop: 6, background: 'none', border: 'none', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>← Back</button>
      </div>
    );
  }

  return null;
}
