import { useState, useCallback } from 'react';
import { validateOtherIncomeStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { Button } from '../../../../components/ds';
import FilingField, { FilingGrid, FilingSection } from '../../../../components/Filing/FilingField';
import P from '../../../../styles/palette';

const n = (v) => Number(v) || 0;

export default function OtherIncomeEditor({ payload, onSave, isSaving }) {
  const os = payload?.income?.otherSources || {};
  const agri = n(payload?.income?.agriculturalIncome);
  const [form, setForm] = useState({
    savingsInterest: os.savingsInterest || '',
    fdInterest: os.fdInterest || '',
    dividendIncome: os.dividendIncome || '',
    familyPension: os.familyPension || '',
    interestOnITRefund: os.interestOnITRefund || '',
    winnings: os.winnings || '',
    gifts: os.gifts || '',
    otherIncome: os.otherIncome || '',
    agriculturalIncome: agri || '',
    vdaSaleValue: os.vdaSaleValue || '',
    vdaCostOfAcquisition: os.vdaCostOfAcquisition || '',
  });
  const [errors, setErrors] = useState({});

  const buildPayload = useCallback(() => {
    const { agriculturalIncome: agriVal, vdaSaleValue, vdaCostOfAcquisition, ...otherFields } = form;
    return { income: { otherSources: { ...otherFields, vdaSaleValue, vdaCostOfAcquisition }, agriculturalIncome: n(agriVal) } };
  }, [form]);

  const { markDirty } = useAutoSave(onSave, buildPayload);

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    markDirty();
    const v = validateOtherIncomeStep(next);
    setErrors(v.valid ? {} : v.errors);
  };

  const handleSave = () => {
    const { agriculturalIncome: agriVal, vdaSaleValue, vdaCostOfAcquisition, ...otherFields } = form;
    onSave({ income: { otherSources: { ...otherFields, vdaSaleValue, vdaCostOfAcquisition }, agriculturalIncome: n(agriVal) } });
  };

  const fp = n(form.familyPension);
  const fpExempt = Math.min(Math.round(fp / 3), 15000);
  const vdaGain = Math.max(0, n(form.vdaSaleValue) - n(form.vdaCostOfAcquisition));
  const vdaLoss = n(form.vdaCostOfAcquisition) > n(form.vdaSaleValue) && n(form.vdaSaleValue) > 0;
  const vdaTax = Math.round(vdaGain * 0.30);
  const total = n(form.savingsInterest) + n(form.fdInterest) + n(form.dividendIncome)
    + (fp - fpExempt) + n(form.interestOnITRefund) + n(form.winnings) + n(form.gifts) + n(form.otherIncome) + vdaGain;

  const rs = (v) => `₹${n(v).toLocaleString('en-IN')}`;

  return (
    <div>
      <FilingSection title="Interest Income">
        <FilingGrid cols={3}>
          <FilingField label="Savings Interest" type="currency" value={form.savingsInterest} onChange={v => update('savingsInterest', v)} />
          <FilingField label="FD / RD Interest" type="currency" value={form.fdInterest} onChange={v => update('fdInterest', v)} />
          <FilingField label="IT Refund Interest" type="currency" value={form.interestOnITRefund} onChange={v => update('interestOnITRefund', v)} />
        </FilingGrid>
      </FilingSection>

      <FilingSection title="Other Sources">
        <FilingGrid cols={3}>
          <FilingField label="Dividends" type="currency" value={form.dividendIncome} onChange={v => update('dividendIncome', v)} />
          <FilingField label="Family Pension" type="currency" value={form.familyPension} onChange={v => update('familyPension', v)} hint={fp > 0 ? `Exempt: ₹${fpExempt.toLocaleString('en-IN')}` : undefined} />
          <FilingField label="Winnings / Lottery" type="currency" value={form.winnings} onChange={v => update('winnings', v)} hint="Flat 30% tax" />
          <FilingField label="Gifts (taxable)" type="currency" value={form.gifts} onChange={v => update('gifts', v)} />
          <FilingField label="Other Income" type="currency" value={form.otherIncome} onChange={v => update('otherIncome', v)} />
        </FilingGrid>
      </FilingSection>

      <FilingSection title="Agricultural Income (Exempt)">
        <FilingGrid cols={2}>
          <FilingField label="Agricultural Income" type="currency" value={form.agriculturalIncome} onChange={v => update('agriculturalIncome', v)} hint="Exempt · Affects slab if > ₹5K" />
        </FilingGrid>
      </FilingSection>

      <FilingSection title="Crypto & Digital Assets (VDA)">
        <FilingGrid cols={3}>
          <FilingField label="Sale Value" type="currency" value={form.vdaSaleValue} onChange={v => update('vdaSaleValue', v)} />
          <FilingField label="Cost of Acquisition" type="currency" value={form.vdaCostOfAcquisition} onChange={v => update('vdaCostOfAcquisition', v)} />
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {vdaGain > 0 && <span style={{ color: 'var(--text-primary)' }}>Gain: ₹{vdaGain.toLocaleString('en-IN')}</span>}
            {vdaLoss && <span style={{ color: 'var(--color-error)' }}>Loss (non-deductible)</span>}
          </div>
        </FilingGrid>
      </FilingSection>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ maxWidth: 160 }}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          Total: ₹{total.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
