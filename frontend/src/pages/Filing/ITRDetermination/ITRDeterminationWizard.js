/**
 * ITR Determination — Single Page
 * PAN + Income Sources + Profile → ITR Recommendation → Create Filing
 * No multi-step wizard. Everything on one page with sections.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { Briefcase, Home, TrendingUp, DollarSign, Globe, ArrowRight, ArrowLeft, CheckCircle, Loader2, Shield } from 'lucide-react';
import api from '../../../services/api';
import newFilingService from '../../../services/newFilingService';
import { getFileableAYs } from '../../../utils/assessmentYear';
import toast from 'react-hot-toast';
import '../filing-flow.css';

const INCOME_SOURCES = [
  { id: 'salary', icon: Briefcase, label: 'Salary / Pension', desc: 'Income from employment' },
  { id: 'house_property', icon: Home, label: 'House Property', desc: 'Rental income or own house' },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', desc: 'Sold shares, MF, property' },
  { id: 'business', icon: Briefcase, label: 'Business / Profession', desc: 'Self-employed, freelancer' },
  { id: 'other', icon: DollarSign, label: 'Other Income', desc: 'Interest, dividends, gifts' },
];

const ITRDeterminationWizard = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const fileableAYs = getFileableAYs();

  // Pre-fill from user profile (backend returns 'pan' from GET profile, 'panNumber' from PUT profile)
  const panFromProfile = user?.panNumber || user?.pan || profile?.pan || '';
  const panIsVerified = !!(user?.panVerified || profile?.panVerified);

  const [pan, setPan] = useState(panFromProfile);
  const [assessmentYear, setAssessmentYear] = useState(fileableAYs[0].value);
  const [sources, setSources] = useState(['salary']);
  const [isDirector, setIsDirector] = useState(false);
  const [hasForeignAssets, setHasForeignAssets] = useState(false);
  const [houseCount, setHouseCount] = useState(1);
  const [businessTurnover, setBusinessTurnover] = useState('');
  const [wantsPresumptive, setWantsPresumptive] = useState(false);
  const [panError, setPanError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if a filing already exists for this AY — if so, go straight to it
  React.useEffect(() => {
    if (!panFromProfile) { setCheckingExisting(false); return; }
    const checkExisting = async () => {
      try {
        const res = await api.get('/filings');
        const filings = res.data?.data || res.data?.filings || [];
        const currentAY = fileableAYs[0].value;
        const existing = filings.find(f => f.assessmentYear === currentAY && f.lifecycleState === 'draft');
        if (existing) {
          const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[existing.itrType] || 'itr1';
          toast.success('Resuming your existing filing');
          navigate(`/filing/${existing.id}/${route}`, { replace: true });
          return;
        }
      } catch { /* ignore — show the wizard */ }
      setCheckingExisting(false);
    };
    checkExisting();
  }, []); // eslint-disable-line

  const toggleSource = (id) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // Determine ITR type locally (instant, no API call needed)
  const getRecommendedITR = () => {
    if (sources.includes('business')) {
      const turnover = Number(businessTurnover) || 0;
      if (wantsPresumptive && turnover <= 20000000) return 'ITR-4';
      return 'ITR-3';
    }
    if (sources.includes('capital_gains') || hasForeignAssets || isDirector || houseCount > 1) return 'ITR-2';
    return 'ITR-1';
  };

  const recommendedITR = getRecommendedITR();
  const routeMap = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };

  // Create filing + save PAN to profile if needed
  const createMutation = useMutation({
    mutationFn: async () => {
      const panUpper = pan.toUpperCase();

      // Save PAN to user profile if not already saved
      if (!panFromProfile || panFromProfile !== panUpper) {
        try {
          await api.patch('/auth/pan', { panNumber: panUpper });
          refreshProfile?.();
        } catch { /* non-blocking — filing creation is more important */ }
      }

      const res = await newFilingService.createFiling({ assessmentYear, taxpayerPan: panUpper, itrType: recommendedITR });
      return res.data;
    },
    onSuccess: (response) => {
      const filingId = response?.data?.id || response?.data?.filingId || response?.id || response?.filingId;
      if (filingId) {
        toast.success(`${recommendedITR} filing created`);
        navigate(`/filing/${filingId}/${routeMap[recommendedITR]}`);
      }
    },
    onError: (error) => {
      // Filing already exists — resume with correct ITR type
      const existing = error.response?.data?.data;
      const id = existing?.id || existing?.filingId;
      if (id) {
        const existingType = existing?.itrType || recommendedITR;
        const route = routeMap[existingType] || routeMap[recommendedITR];
        toast.success('Resuming existing filing');
        navigate(`/filing/${id}/${route}`);
        return;
      }
      const msg = error.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : msg?.message || 'Failed to create filing');
    },
  });

  const handleStart = () => {
    setPanError('');
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      setPanError('Enter a valid PAN (e.g., ABCDE1234F)');
      return;
    }
    if (sources.length === 0) {
      toast.error('Select at least one income source');
      return;
    }
    createMutation.mutate();
  };

  const ITR_INFO = {
    'ITR-1': { name: 'Sahaj', desc: 'Simplest form for salaried individuals', time: '15 min' },
    'ITR-2': { name: 'Capital Gains', desc: 'For capital gains, multiple properties, foreign income', time: '30 min' },
    'ITR-3': { name: 'Business', desc: 'Business/profession with regular books', time: '45 min' },
    'ITR-4': { name: 'Sugam', desc: 'Presumptive taxation — no books needed', time: '20 min' },
  };

  return (
    <div className="ff-page">
      {checkingExisting ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#6b7280' }} />
        </div>
      ) : (
      <div className="ff-content" style={{ maxWidth: 640 }}>
        <h1 className="step-title" style={{ fontSize: 26, marginBottom: 8 }}>File Your ITR</h1>
        <p className="step-desc">Tell us about your income and we'll pick the right form</p>
        <button className="ff-btn ff-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, padding: '4px 0' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* Section 1: PAN + AY */}
        <div className="step-card">
          <div className="ff-section-title"><Shield size={16} style={{ display: 'inline', marginRight: 6 }} />Identity & Year</div>
          <div className="ff-grid-2">
            <div className="ff-field">
              <label className="ff-label">PAN Number *</label>
              <div style={{ position: 'relative' }}>
                <input className={`ff-input ${panError ? 'error' : ''}`} value={pan} onChange={e => { setPan(e.target.value.toUpperCase()); setPanError(''); }} placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase', paddingRight: panIsVerified && pan === panFromProfile ? '90px' : '12px' }} disabled={panIsVerified && pan === panFromProfile} />
                {panIsVerified && pan === panFromProfile && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 12 }}>
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
              </div>
              {panError && <div className="ff-hint" style={{ color: '#ef4444' }}>{panError}</div>}
              {panIsVerified && pan === panFromProfile && <div className="ff-hint">PAN verified from your profile. <button onClick={() => setPan('')} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Change</button></div>}
            </div>
            <div className="ff-field">
              <label className="ff-label">Assessment Year</label>
              <select className="ff-select" value={assessmentYear} onChange={e => setAssessmentYear(e.target.value)}>
                {fileableAYs.map(ay => <option key={ay.value} value={ay.value}>{ay.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Income Sources */}
        <div className="step-card">
          <div className="ff-section-title">What income do you have?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INCOME_SOURCES.map(src => {
              const selected = sources.includes(src.id);
              const Icon = src.icon;
              return (
                <div key={src.id} className={`ff-option ${selected ? 'selected' : ''}`}
                  onClick={() => toggleSource(src.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '12px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: selected ? '#D4AF37' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={selected ? '#0F0F0F' : '#6b7280'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{src.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{src.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? '#D4AF37' : '#d1d5db'}`, background: selected ? '#D4AF37' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <CheckCircle size={14} color="#0F0F0F" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Conditional follow-ups */}
        {(sources.includes('house_property') || sources.includes('business') || sources.includes('capital_gains')) && (
          <div className="step-card">
            <div className="ff-section-title">A few more details</div>

            {sources.includes('house_property') && (
              <div className="ff-field">
                <label className="ff-label">How many properties?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, '3+'].map(c => {
                    const val = typeof c === 'number' ? c : 3;
                    return <div key={c} className={`ff-option ${houseCount === val ? 'selected' : ''}`} onClick={() => setHouseCount(val)} style={{ padding: '8px 16px' }}>{c}</div>;
                  })}
                </div>
              </div>
            )}

            {sources.includes('business') && (
              <>
                <div className="ff-field">
                  <label className="ff-label">Annual turnover (approx ₹)</label>
                  <input className="ff-input" type="number" value={businessTurnover} onChange={e => setBusinessTurnover(e.target.value)} placeholder="e.g., 1500000" />
                </div>
                {(Number(businessTurnover) || 0) <= 20000000 && (
                  <label className="ff-check">
                    <input type="checkbox" checked={wantsPresumptive} onChange={e => setWantsPresumptive(e.target.checked)} />
                    Use presumptive taxation (simpler, no books needed)
                  </label>
                )}
              </>
            )}
          </div>
        )}

        {/* Section 4: Quick profile flags */}
        <div className="step-card">
          <div className="ff-section-title">About you</div>
          <label className="ff-check"><input type="checkbox" checked={isDirector} onChange={e => setIsDirector(e.target.checked)} />I am a director in a company</label>
          <label className="ff-check"><input type="checkbox" checked={hasForeignAssets} onChange={e => setHasForeignAssets(e.target.checked)} />I have foreign income or assets</label>
        </div>

        {/* Section 5: ITR Recommendation (live) */}
        <div className="step-card success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>
              {recommendedITR} — {ITR_INFO[recommendedITR].name}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {ITR_INFO[recommendedITR].desc} · ~{ITR_INFO[recommendedITR].time}
            </div>
          </div>
          <CheckCircle size={24} color="#16a34a" />
        </div>

        {/* Start Button */}
        <button className="ff-btn ff-btn-primary" onClick={handleStart} disabled={createMutation.isPending}
          style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 16, marginTop: 8 }}>
          {createMutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Creating filing...</> : <>Start {recommendedITR} Filing <ArrowRight size={18} /></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
          You can change income sources later. Data is saved as you go.
        </p>
      </div>
      )}
    </div>
  );
};

export default ITRDeterminationWizard;
