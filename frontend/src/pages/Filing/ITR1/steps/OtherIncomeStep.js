/**
 * Other Income Step — ITR-1 (Clean UI)
 */
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { validateOtherIncomeStep } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;

const OtherIncomeStep = ({ payload, onSave, onBack, isSaving }) => {
  const os = payload?.income?.otherSources || {};
  const [data, setData] = useState({ savingsInterest: os.savingsInterest || '', fdInterest: os.fdInterest || '', dividendIncome: os.dividendIncome || '', familyPension: os.familyPension || '', otherIncome: os.otherIncome || '' });
  const [errors, setErrors] = useState({});

  const fpExempt = Math.min(Math.round(n(data.familyPension) / 3), 15000);
  const total = n(data.savingsInterest) + n(data.fdInterest) + n(data.dividendIncome) + (n(data.familyPension) - fpExempt) + n(data.otherIncome);

  const handleNext = () => {
    const v = validateOtherIncomeStep(data); setErrors(v.errors); if (!v.valid) return;
    onSave({ income: { otherSources: { savingsInterest: n(data.savingsInterest), fdInterest: n(data.fdInterest), dividendIncome: n(data.dividendIncome), familyPension: n(data.familyPension), otherIncome: n(data.otherIncome) } } });
  };

  return (
    <div>
      <h2 className="step-title">Other Income</h2>
      <p className="step-desc">Interest, dividends, pension, and other sources</p>
      <div className="step-card">
        <F l="Savings Account Interest (₹)" v={data.savingsInterest} c={v => setData({ ...data, savingsInterest: v })} h="Up to ₹10K deductible under 80TTA" />
        <F l="FD / RD Interest (₹)" v={data.fdInterest} c={v => setData({ ...data, fdInterest: v })} />
        <F l="Dividend Income (₹)" v={data.dividendIncome} c={v => setData({ ...data, dividendIncome: v })} />
        <F l="Family Pension (₹)" v={data.familyPension} c={v => setData({ ...data, familyPension: v })} h={n(data.familyPension) > 0 ? `1/3 exempt (max ₹15K) = ₹${fpExempt.toLocaleString('en-IN')}` : ''} />
        <F l="Other Income (₹)" v={data.otherIncome} c={v => setData({ ...data, otherIncome: v })} />
      </div>
      <div className="step-card summary"><div className="ff-row"><span className="ff-row-label">Total Other Income</span><span className="ff-row-value bold">₹{total.toLocaleString('en-IN')}</span></div></div>
      {Object.keys(errors).length > 0 && <div className="ff-errors"><ul>{Object.values(errors).map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
      <div className="ff-nav"><button className="ff-btn ff-btn-outline" onClick={onBack}><ArrowLeft size={15} /> Back</button><div className="spacer" /><button className="ff-btn ff-btn-primary" onClick={handleNext} disabled={isSaving}>{isSaving ? 'Saving...' : 'Next'} <ArrowRight size={15} /></button></div>
    </div>
  );
};

const F = ({ l, v, c, h }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type="number" value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);

export default OtherIncomeStep;
