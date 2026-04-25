import { useState, useCallback } from 'react';
import { validateHousePropertyStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { NumericField, SummaryRow, SaveButton, Divider, EditorHeader } from './EditorShared';
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
      <EditorHeader title="House Property" subtitle="Income or loss from house property" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['none', 'None'], ['selfOccupied', 'Self-Occupied'], ['letOut', 'Let-Out']].map(([k, label]) => (
          <div key={k} className={`ff-option${type === k ? ' selected' : ''}`} onClick={() => changeType(k)}>
            <div className="ff-option-label">{label}</div>
          </div>
        ))}
      </div>

      {type === 'selfOccupied' && (
        <div className="step-card editing">
          <NumericField label="Home Loan Interest (₹)" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="Home loan interest paid · Max ₹2,00,000 for self-occupied" error={errors.interest} />
        </div>
      )}

      {type === 'letOut' && (
        <div className="step-card editing">
          <div className="ff-grid-2">
            <NumericField label="Annual Rent Received (₹)" value={form.annualRentReceived} onChange={v => update('annualRentReceived', v)} hint="Total rent collected this year · From rent agreement" error={errors.rent} />
            <NumericField label="Municipal Taxes Paid (₹)" value={form.municipalTaxesPaid} onChange={v => update('municipalTaxesPaid', v)} hint="Property tax paid · From municipal corporation receipt" error={errors.municipal} />
          </div>
          <NumericField label="Home Loan Interest (₹)" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="Home loan interest paid · No cap for let-out property" error={errors.interest} />
        </div>
      )}

      {type !== 'none' && (
        <>
          <SaveButton onClick={handleSave} isSaving={isSaving} label="Save House Property" />
          <div className="step-card summary">
            {type === 'letOut' && <>
              <SummaryRow label="Net Annual Value" value={netAV} />
              <SummaryRow label="Std Deduction (30%)" value={-stdDed} />
            </>}
            <SummaryRow label="Loan Interest" value={-cap} />
            <Divider />
            <SummaryRow label="Net Income" value={netIncome} bold red={netIncome < 0} />
          </div>
        </>
      )}
    </div>
  );
}
