import { useState, useCallback } from 'react';
import { validateHousePropertyStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { Button } from '../../../../components/ds';
import FilingField, { FilingGrid, FilingSection } from '../../../../components/Filing/FilingField';

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

  const rs = (v) => `₹${Math.abs(n(v)).toLocaleString('en-IN')}`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['none', 'No Property'], ['selfOccupied', 'Self-Occupied'], ['letOut', 'Let Out (Rented)']].map(([k, label]) => (
          <button key={k} onClick={() => changeType(k)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: type === k ? 700 : 500, border: `1px solid ${type === k ? 'var(--brand-primary)' : 'var(--border-light)'}`, borderRadius: 6, background: type === k ? 'var(--brand-primary-light)' : 'var(--bg-card)', color: type === k ? 'var(--brand-primary-dark)' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {type === 'selfOccupied' && (
        <FilingSection title="Self-Occupied Property">
          <FilingGrid cols={2}>
            <FilingField label="Home Loan Interest" type="currency" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="Max ₹2L deduction" error={errors.interest} />
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-success)' }}>
              Loss: -₹{cap.toLocaleString('en-IN')}
            </div>
          </FilingGrid>
        </FilingSection>
      )}

      {type === 'letOut' && (
        <FilingSection title="Let-Out Property">
          <FilingGrid cols={3}>
            <FilingField label="Annual Rent" type="currency" value={form.annualRentReceived} onChange={v => update('annualRentReceived', v)} error={errors.rent} />
            <FilingField label="Municipal Tax" type="currency" value={form.municipalTaxesPaid} onChange={v => update('municipalTaxesPaid', v)} error={errors.municipal} />
            <FilingField label="Loan Interest" type="currency" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="No cap for let-out" error={errors.interest} />
          </FilingGrid>
          <div style={{ marginTop: 8, fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', gap: 16 }}>
            <span>NAV: ₹{netAV.toLocaleString('en-IN')}</span>
            <span>Std Ded: -₹{stdDed.toLocaleString('en-IN')}</span>
            <span style={{ fontWeight: 700, color: netIncome < 0 ? 'var(--color-success)' : 'var(--text-primary)' }}>Net: {netIncome < 0 ? '-' : ''}₹{Math.abs(netIncome).toLocaleString('en-IN')}</span>
          </div>
        </FilingSection>
      )}

      {type !== 'none' && (
        <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ maxWidth: 160, marginTop: 8 }}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      )}
    </div>
  );
}
