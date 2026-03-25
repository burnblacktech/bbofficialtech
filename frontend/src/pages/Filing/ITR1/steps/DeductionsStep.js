/**
 * Deductions Step — ITR-1 (Clean UI)
 */
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { validateDeductionsStep } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;

const DeductionsStep = ({ payload, onSave, onBack, isSaving }) => {
  const ded = payload?.deductions || {};
  const [regime, setRegime] = useState(payload?.selectedRegime || 'old');
  const [d, setD] = useState({
    ppf: ded.section80C?.ppf || '', elss: ded.section80C?.elss || '', lifeInsurance: ded.section80C?.lifeInsurance || '',
    nsc: ded.section80C?.nsc || '', tuitionFees: ded.section80C?.tuitionFees || '', homeLoanPrincipal: ded.section80C?.homeLoanPrincipal || '',
    sukanyaSamriddhi: ded.section80C?.sukanyaSamriddhi || '', fiveYearFD: ded.section80C?.fiveYearFD || '',
    nps: ded.section80CCD1B?.nps || '',
    selfPremium: ded.section80D?.selfPremium || '', selfPreventive: ded.section80D?.selfPreventive || '',
    parentsPremium: ded.section80D?.parentsPremium || '', parentsPreventive: ded.section80D?.parentsPreventive || '', parentsSenior: ded.section80D?.parentsSenior || false,
    educationLoan: ded.section80E?.educationLoanInterest || '',
    donations: ded.section80G?.total || '',
    savingsInterest80TTA: ded.section80TTA?.savingsInterest || payload?.income?.otherSources?.savingsInterest || '',
  });
  const [errors, setErrors] = useState({});

  const raw80C = n(d.ppf) + n(d.elss) + n(d.lifeInsurance) + n(d.nsc) + n(d.tuitionFees) + n(d.homeLoanPrincipal) + n(d.sukanyaSamriddhi) + n(d.fiveYearFD);
  const a80C = Math.min(raw80C, 150000);
  const a80CCD = Math.min(n(d.nps), 50000);
  const pLim = d.parentsSenior ? 50000 : 25000;
  const a80D = Math.min(n(d.selfPremium) + Math.min(n(d.selfPreventive), 5000), 25000) + Math.min(n(d.parentsPremium) + Math.min(n(d.parentsPreventive), 5000), pLim);
  const a80TTA = Math.min(n(d.savingsInterest80TTA), 10000);
  const total = regime === 'new' ? 0 : (a80C + a80CCD + a80D + n(d.educationLoan) + n(d.donations) + a80TTA);

  const handleNext = () => {
    const v = validateDeductionsStep(d, regime); setErrors(v.errors);
    const deductions = regime === 'new' ? {} : {
      section80C: { ppf: n(d.ppf), elss: n(d.elss), lifeInsurance: n(d.lifeInsurance), nsc: n(d.nsc), tuitionFees: n(d.tuitionFees), homeLoanPrincipal: n(d.homeLoanPrincipal), sukanyaSamriddhi: n(d.sukanyaSamriddhi), fiveYearFD: n(d.fiveYearFD), total: raw80C },
      section80CCD1B: { nps: n(d.nps) }, section80D: { selfPremium: n(d.selfPremium), selfPreventive: n(d.selfPreventive), parentsPremium: n(d.parentsPremium), parentsPreventive: n(d.parentsPreventive), parentsSenior: d.parentsSenior },
      section80E: { educationLoanInterest: n(d.educationLoan) }, section80G: { total: n(d.donations) }, section80TTA: { savingsInterest: n(d.savingsInterest80TTA) },
    };
    onSave({ deductions, selectedRegime: regime });
  };

  return (
    <div>
      <h2 className="step-title">Deductions</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {['old', 'new'].map(r => (
          <div key={r} className={`ff-option ${regime === r ? 'selected' : ''}`} onClick={() => setRegime(r)}>
            <div className="ff-option-label">{r === 'old' ? 'Old Regime' : 'New Regime'}</div>
            <div className="ff-option-desc">{r === 'old' ? 'All deductions' : 'Lower rates, no deductions'}</div>
          </div>
        ))}
      </div>

      {regime === 'new' ? (
        <div className="step-card info"><Info size={16} style={{ display: 'inline', marginRight: 6 }} />New regime: only ₹75K standard deduction. No Chapter VI-A. Comparison on next screen.</div>
      ) : (
        <>
          <div className="step-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span className="ff-section-title">80C</span><span className="ff-section-cap">₹{a80C.toLocaleString('en-IN')} / 1,50,000</span></div>
            <div className="ff-grid-2"><F l="PPF" v={d.ppf} c={v=>setD({...d,ppf:v})} /><F l="ELSS" v={d.elss} c={v=>setD({...d,elss:v})} /><F l="Life Insurance" v={d.lifeInsurance} c={v=>setD({...d,lifeInsurance:v})} /><F l="NSC" v={d.nsc} c={v=>setD({...d,nsc:v})} /><F l="Tuition Fees" v={d.tuitionFees} c={v=>setD({...d,tuitionFees:v})} /><F l="Home Loan Principal" v={d.homeLoanPrincipal} c={v=>setD({...d,homeLoanPrincipal:v})} /></div>
          </div>
          <div className="step-card"><div className="ff-section-title">80CCD(1B) — NPS (max ₹50K)</div><F l="NPS Contribution" v={d.nps} c={v=>setD({...d,nps:v})} /></div>
          <div className="step-card"><div className="ff-section-title">80D — Health Insurance</div><div className="ff-grid-2"><F l="Self Premium" v={d.selfPremium} c={v=>setD({...d,selfPremium:v})} /><F l="Preventive (self)" v={d.selfPreventive} c={v=>setD({...d,selfPreventive:v})} h="Max ₹5K" /><F l="Parents Premium" v={d.parentsPremium} c={v=>setD({...d,parentsPremium:v})} /><F l="Preventive (parents)" v={d.parentsPreventive} c={v=>setD({...d,parentsPreventive:v})} /></div><label className="ff-check"><input type="checkbox" checked={d.parentsSenior} onChange={e=>setD({...d,parentsSenior:e.target.checked})} />Parents are senior citizens (60+)</label></div>
          <div className="step-card"><div className="ff-section-title">80E — Education Loan</div><F l="Interest Paid" v={d.educationLoan} c={v=>setD({...d,educationLoan:v})} h="No upper limit" /></div>
          <div className="step-card"><div className="ff-section-title">80TTA — Savings Interest (max ₹10K)</div><F l="Savings Interest" v={d.savingsInterest80TTA} c={v=>setD({...d,savingsInterest80TTA:v})} /></div>
          <div className="step-card"><div className="ff-section-title">80G — Donations</div><F l="Eligible Donations" v={d.donations} c={v=>setD({...d,donations:v})} /></div>
        </>
      )}

      <div className="step-card summary"><div className="ff-row"><span className="ff-row-label">Total Deductions</span><span className="ff-row-value bold">₹{total.toLocaleString('en-IN')}</span></div></div>

      {Object.keys(errors).length > 0 && <div className="ff-errors"><ul>{Object.values(errors).map((e,i)=><li key={i}>{e}</li>)}</ul></div>}

      <div className="ff-nav"><button className="ff-btn ff-btn-outline" onClick={onBack}><ArrowLeft size={15}/> Back</button><div className="spacer"/><button className="ff-btn ff-btn-primary" onClick={handleNext} disabled={isSaving}>{isSaving?'Saving...':'Next'} <ArrowRight size={15}/></button></div>
    </div>
  );
};

const F = ({l,v,c,h}) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type="number" value={v||''} onChange={e=>c(e.target.value)} placeholder="0"/>{h&&<div className="ff-hint">{h}</div>}</div>);

export default DeductionsStep;
