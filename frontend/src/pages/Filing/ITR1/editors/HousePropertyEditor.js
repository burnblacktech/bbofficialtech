import { useState, useCallback } from 'react';
import { validateHousePropertyStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { Field, Grid, Card, Button, Money, Divider } from '../../../../components/ds';

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
      <h2 className="step-title">House Property</h2>
      <p className="step-desc">Income or loss from house property</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['none', "I don't own property"], ['selfOccupied', 'I live in my own house'], ['letOut', 'I rent out my property']].map(([k, label]) => (
          <div key={k} className={`ds-option${type === k ? ' selected' : ''}`} onClick={() => changeType(k)}>
            <div className="ds-option__label">{label}</div>
          </div>
        ))}
      </div>

      {type === 'selfOccupied' && (
        <Card>
          <Field label="Home Loan Interest (₹)" type="number" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="Home loan interest paid · Max ₹2,00,000 for self-occupied" error={errors.interest} />
        </Card>
      )}

      {type === 'letOut' && (
        <Card>
          <Grid cols={3}>
            <Field label="Annual Rent Received (₹)" type="number" value={form.annualRentReceived} onChange={v => update('annualRentReceived', v)} hint="Total rent collected" error={errors.rent} />
            <Field label="Municipal Taxes Paid (₹)" type="number" value={form.municipalTaxesPaid} onChange={v => update('municipalTaxesPaid', v)} hint="Property tax paid" error={errors.municipal} />
            <Field label="Home Loan Interest (₹)" type="number" value={form.interestOnHomeLoan} onChange={v => update('interestOnHomeLoan', v)} hint="No cap for let-out" error={errors.interest} />
          </Grid>
        </Card>
      )}

      {type !== 'none' && (
        <>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ width: '100%', marginTop: 14 }}>
            {isSaving ? 'Saving…' : 'Save House Property'}
          </Button>
          <Card muted style={{ marginTop: 14 }}>
            {type === 'letOut' && <>
              <Money label="Net Annual Value" value={rs(netAV)} />
              <Money label="Std Deduction (30%)" value={`-${rs(stdDed)}`} />
            </>}
            <Money label="Loan Interest" value={`-${rs(cap)}`} />
            <Divider />
            <Money label="Net Income" value={`${netIncome < 0 ? '-' : ''}${rs(netIncome)}`} bold color={netIncome < 0 ? 'red' : undefined} />
          </Card>
        </>
      )}
    </div>
  );
}
