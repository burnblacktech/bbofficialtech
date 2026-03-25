/**
 * House Property Step — ITR-1 (Clean UI)
 */
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { validateHousePropertyStep } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;

const HousePropertyStep = ({ payload, onSave, onBack, isSaving }) => {
  const hp = payload?.income?.houseProperty || {};
  const [type, setType] = useState(hp.type || 'NONE');
  const [data, setData] = useState({ annualRentReceived: hp.annualRentReceived || '', municipalTaxesPaid: hp.municipalTaxesPaid || '', interestOnHomeLoan: hp.interestOnHomeLoan || '' });
  const [errors, setErrors] = useState({});

  let netIncome = 0;
  if (type === 'SELF_OCCUPIED') netIncome = -Math.min(n(data.interestOnHomeLoan), 200000);
  else if (type === 'LET_OUT') { const nav = Math.max(0, n(data.annualRentReceived) - n(data.municipalTaxesPaid)); netIncome = nav - Math.round(nav * 0.30) - n(data.interestOnHomeLoan); }

  const handleNext = () => {
    if (type !== 'NONE') { const v = validateHousePropertyStep(type, data); setErrors(v.errors); if (!v.valid) return; }
    onSave({ income: { houseProperty: { type, ...(type !== 'NONE' ? { annualRentReceived: n(data.annualRentReceived), municipalTaxesPaid: n(data.municipalTaxesPaid), interestOnHomeLoan: n(data.interestOnHomeLoan) } : {}) } } });
  };

  return (
    <div>
      <h2 className="step-title">House Property</h2>
      <p className="step-desc">Do you own a house property? (ITR-1 allows one)</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[{ v: 'NONE', l: 'No Property' }, { v: 'SELF_OCCUPIED', l: 'Self-Occupied' }, { v: 'LET_OUT', l: 'Let Out' }].map(o => (
          <div key={o.v} className={`ff-option ${type === o.v ? 'selected' : ''}`} onClick={() => setType(o.v)}><div className="ff-option-label">{o.l}</div></div>
        ))}
      </div>

      {type === 'SELF_OCCUPIED' && <div className="step-card"><F l="Home Loan Interest (₹)" v={data.interestOnHomeLoan} c={v => setData({ ...data, interestOnHomeLoan: v })} h="Max ₹2L deduction" /></div>}
      {type === 'LET_OUT' && <div className="step-card"><F l="Annual Rent Received (₹)" v={data.annualRentReceived} c={v => setData({ ...data, annualRentReceived: v })} /><F l="Municipal Taxes (₹)" v={data.municipalTaxesPaid} c={v => setData({ ...data, municipalTaxesPaid: v })} /><F l="Home Loan Interest (₹)" v={data.interestOnHomeLoan} c={v => setData({ ...data, interestOnHomeLoan: v })} h="No limit for let-out" /></div>}

      {type !== 'NONE' && (
        <div className="step-card summary">
          <div className="ff-row"><span className="ff-row-label">Net HP Income</span><span className={`ff-row-value bold ${netIncome < 0 ? 'green' : ''}`}>{netIncome < 0 ? `- ₹${Math.abs(netIncome).toLocaleString('en-IN')} (loss)` : `₹${netIncome.toLocaleString('en-IN')}`}</span></div>
          {type === 'SELF_OCCUPIED' && n(data.interestOnHomeLoan) > 200000 && <div className="ff-hint" style={{ color: '#d97706' }}>⚠ Only ₹2L allowed for self-occupied</div>}
        </div>
      )}

      {Object.keys(errors).length > 0 && <div className="ff-errors"><ul>{Object.values(errors).map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <div className="ff-nav"><button className="ff-btn ff-btn-outline" onClick={onBack}><ArrowLeft size={15} /> Back</button><div className="spacer" /><button className="ff-btn ff-btn-primary" onClick={handleNext} disabled={isSaving}>{isSaving ? 'Saving...' : 'Next'} <ArrowRight size={15} /></button></div>
    </div>
  );
};

const F = ({ l, v, c, h }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type="number" value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);

export default HousePropertyStep;
