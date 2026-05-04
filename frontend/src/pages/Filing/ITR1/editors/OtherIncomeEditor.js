import { useState, useCallback } from 'react';
import { validateOtherIncomeStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { Field, Grid, Card, Section, Button, Money, Divider } from '../../../../components/ds';
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
      <h2 className="step-title">Other Income</h2>
      <p className="step-desc">Interest, dividends, pension and other sources</p>

      <Card>
        <Section title="Interest Income" />
        <Grid cols={3}>
          <Field label="Savings Account Interest" type="number" value={form.savingsInterest} onChange={v => update('savingsInterest', v)} hint="From bank passbook" />
          <Field label="FD / RD Interest" type="number" value={form.fdInterest} onChange={v => update('fdInterest', v)} hint="From bank TDS certificate" />
          <Field label="Interest on IT Refund" type="number" value={form.interestOnITRefund} onChange={v => update('interestOnITRefund', v)} hint="From ITD intimation order" />
        </Grid>
      </Card>

      <Card>
        <Section title="Other Sources" />
        <Grid cols={3}>
          <Field label="Dividend Income" type="number" value={form.dividendIncome} onChange={v => update('dividendIncome', v)} hint="Shares or MF · Fully taxable" />
          <Field label="Family Pension" type="number" value={form.familyPension} onChange={v => update('familyPension', v)} hint={fp > 0 ? `1/3 exempt: ₹${fpExempt.toLocaleString('en-IN')} (max ₹15K)` : '1/3 or ₹15K whichever is less'} />
          <Field label="Lottery / Winnings" type="number" value={form.winnings} onChange={v => update('winnings', v)} hint="Flat 30% tax" />
        </Grid>
        <Grid cols={3}>
          <Field label="Gifts (taxable)" type="number" value={form.gifts} onChange={v => update('gifts', v)} hint="Taxable if > ₹50K/year" />
          <Field label="Any Other Income" type="number" value={form.otherIncome} onChange={v => update('otherIncome', v)} hint="Commission, royalty, etc." />
          <div />
        </Grid>
      </Card>

      {/* Agricultural Income — exempt but affects tax calculation */}
      <Card style={{ borderLeft: '3px solid var(--color-success)' }}>
        <Section title="Agricultural Income (Exempt)" />
        <Field label="Agricultural Income" type="number" value={form.agriculturalIncome} onChange={v => update('agriculturalIncome', v)} hint="Exempt from tax · Affects slab rate if > ₹5,000" />
        {n(form.agriculturalIncome) > 5000 && (
          <div className="ds-hint" style={{ color: P.warning, marginTop: 4 }}>
            Since agricultural income exceeds ₹5,000, it will be partially integrated with your other income for tax slab calculation (higher slabs may apply to non-agricultural income).
          </div>
        )}
        {n(form.agriculturalIncome) > 0 && n(form.agriculturalIncome) <= 5000 && (
          <div className="ds-hint" style={{ color: P.success, marginTop: 4 }}>
            Agricultural income up to ₹5,000 has no impact on tax calculation.
          </div>
        )}
      </Card>

      {/* Crypto & Digital Assets (VDA) — flat 30% tax */}
      <Card>
        <Section title="Crypto & Digital Assets" />
        <Grid cols={3}>
          <Field label="Sale Value" type="number" value={form.vdaSaleValue} onChange={v => update('vdaSaleValue', v)} hint="Total sale proceeds from VDA" />
          <Field label="Cost of Acquisition" type="number" value={form.vdaCostOfAcquisition} onChange={v => update('vdaCostOfAcquisition', v)} hint="Purchase cost of VDA" />
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
            {vdaGain > 0 && <span style={{ fontWeight: 600 }}>Gain: ₹{vdaGain.toLocaleString('en-IN')}</span>}
            {vdaLoss && <span style={{ fontWeight: 600, color: P.error }}>Loss: ₹{(n(form.vdaCostOfAcquisition) - n(form.vdaSaleValue)).toLocaleString('en-IN')}</span>}
          </div>
        </Grid>
        <div className="ds-hint" style={{ marginTop: 4 }}>
          Flat 30% tax, no deductions except purchase cost, 1% TDS under Section 194S
        </div>
        {vdaLoss && (
          <div className="ds-hint" style={{ color: P.error, marginTop: 4 }}>
            VDA losses cannot offset other income
          </div>
        )}
        {vdaGain > 0 && (
          <div className="ds-hint" style={{ color: P.warning, marginTop: 4 }}>
            Tax: ₹{vdaTax.toLocaleString('en-IN')} (30% flat)
          </div>
        )}
      </Card>

      <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ width: '100%', marginTop: 14 }}>
        {isSaving ? 'Saving…' : 'Save Other Income'}
      </Button>

      <Card muted style={{ marginTop: 14 }}>
        {n(form.savingsInterest) > 0 && <Money label="Savings Interest" value={rs(form.savingsInterest)} />}
        {n(form.fdInterest) > 0 && <Money label="FD/RD Interest" value={rs(form.fdInterest)} />}
        {n(form.interestOnITRefund) > 0 && <Money label="IT Refund Interest" value={rs(form.interestOnITRefund)} />}
        {n(form.dividendIncome) > 0 && <Money label="Dividends" value={rs(form.dividendIncome)} />}
        {fp > 0 && <Money label="Family Pension (net)" value={rs(fp - fpExempt)} />}
        {n(form.winnings) > 0 && <Money label="Winnings (30% tax)" value={rs(form.winnings)} />}
        {n(form.gifts) > 0 && <Money label="Gifts" value={rs(form.gifts)} />}
        {n(form.otherIncome) > 0 && <Money label="Other" value={rs(form.otherIncome)} />}
        {vdaGain > 0 && <Money label="VDA Gain (30% flat)" value={rs(vdaGain)} />}
        <Divider />
        <Money label="Total Other Income" value={rs(total)} bold />
        {n(form.agriculturalIncome) > 0 && (
          <Money label="Agricultural Income (exempt)" value={rs(form.agriculturalIncome)} color="green" />
        )}
      </Card>
    </div>
  );
}
