import { useState, useCallback } from 'react';
import { Save } from 'lucide-react';
import { validateHousePropertyStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;

export default function HousePropertyEditor({ payload, onSave, isSaving }) {
  const hp = payload?.income?.houseProperty || {};
  const [type, setType] = useState(hp.type || 'none');
  const [form, setForm] = useState({
    annualRentReceived: hp.annualRentReceived || '',
    municipalTaxesPaid: hp.municipalTaxesPaid || '',
    interestOnHomeLoan: hp.interestOnHomeLoan || '',
  });
  const [errors, setErrors] = useState({});

  const buildPayload = useCallback(() => {
    const reset = type === 'none' ? { annualRentReceived: '', municipalTaxesPaid: '', interestOnHomeLoan: '' } : form;
    return { income: { houseProperty: { type, ...reset } } };
  }, [type, form]);

  const { markDirty } = useAutoSave(onSave, buildPayload);

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    markDirty();
    const v = validateHousePropertyStep(type.toUpperCase().replace('LETOUT', 'LET_OUT').replace('SELFOCCUPIED', 'SELF_OCCUPIED'), next);
    setErrors(v.valid ? {} : v.errors);
  };

  const changeType = (t) => {
    setType(t);
    markDirty();
    if (t === 'none') setForm({ annualRentReceived: '', municipalTaxesPaid: '', interestOnHomeLoan: '' });
  };

  const handleSave = () => {
    const reset = type === 'none' ? { annualRentReceived: '', municipalTaxesPaid: '', interestOnHomeLoan: '' } : form;
    onSave({ income: { houseProperty: { type, ...reset } } });
  };

  const rent = n(form.annualRentReceived);
  const muni = n(form.municipalTaxesPaid);
  const interest = n(form.interestOnHomeLoan);
  const netAV = type === 'letOut' ? Math.max(rent - muni, 0) : 0;
  const stdDed = Math.round(netAV * 0.3);
  const cap = type === 'selfOccupied' ? Math.min(interest, 200000) : interest;
  const netIncome = type === 'none' ? 0 : type === 'selfOccupied' ? -cap : netAV - stdDed - interest;

  return (
    <div>
      <h2 className="step-title">House Property</h2>
      <p className="step-desc">Income or loss from house property</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['none', 'None'], ['selfOccupied', 'Self-Occupied'], ['letOut', 'Let-Out']].map(([k, label]) => (
          <div key={k} className={`ff-option${type === k ? ' selected' : ''}`} onClick={() => changeType(k)}>
            <div className="ff-option-label">{label}</div>
          </div>
        ))}
      </div>

      {type === 'selfOccupied' && (
        <div className="step-card editing">
          <F l="Home Loan Interest (₹)" v={form.interestOnHomeLoan} c={v => update('interestOnHomeLoan', v)} h="Home loan interest paid · Max ₹2,00,000 for self-occupied" />
        </div>
      )}

      {type === 'letOut' && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <F l="Annual Rent Received (₹)" v={form.annualRentReceived} c={v => update('annualRentReceived', v)} h="Total rent collected this year · From rent agreement" />
            <F l="Municipal Taxes Paid (₹)" v={form.municipalTaxesPaid} c={v => update('municipalTaxesPaid', v)} h="Property tax paid · From municipal corporation receipt" />
          </div>
          <F l="Home Loan Interest (₹)" v={form.interestOnHomeLoan} c={v => update('interestOnHomeLoan', v)} h="Home loan interest paid · No cap for let-out property" />
        </div>
      )}

      {type !== 'none' && (
        <>
          <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={isSaving} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
            {isSaving ? 'Saving...' : <><Save size={14} /> Save House Property</>}
          </button>
          <div className="step-card summary">
          {type === 'letOut' && <>
            <div className="ff-row"><span className="ff-row-label">Net Annual Value</span><span className="ff-row-value">₹{netAV.toLocaleString('en-IN')}</span></div>
            <div className="ff-row"><span className="ff-row-label">Std Deduction (30%)</span><span className="ff-row-value">- ₹{stdDed.toLocaleString('en-IN')}</span></div>
          </>}
          <div className="ff-row"><span className="ff-row-label">Loan Interest</span><span className="ff-row-value">- ₹{cap.toLocaleString('en-IN')}</span></div>
          <div className="ff-divider" />
          <div className="ff-row"><span className="ff-row-label">Net Income</span><span className={`ff-row-value bold ${netIncome < 0 ? 'red' : ''}`}>₹{netIncome.toLocaleString('en-IN')}</span></div>
        </div>
        </>
      )}
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
