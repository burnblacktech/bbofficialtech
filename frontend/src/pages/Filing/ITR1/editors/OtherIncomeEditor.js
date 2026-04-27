import { useState, useCallback } from 'react';
import { validateOtherIncomeStep } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { NumericField, SummaryRow, SaveButton, Divider, EditorHeader } from './EditorShared';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

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

  return (
    <div>
      <EditorHeader title="Other Income" subtitle="Interest, dividends, pension and other sources" />

      <div className="step-card editing">
        <div className="ff-section-title">Interest Income</div>
        <div className="ff-grid-3">
          <NumericField label="Savings Account Interest" value={form.savingsInterest} onChange={v => update('savingsInterest', v)} hint="From bank passbook" />
          <NumericField label="FD / RD Interest" value={form.fdInterest} onChange={v => update('fdInterest', v)} hint="From bank TDS certificate" />
          <NumericField label="Interest on IT Refund" value={form.interestOnITRefund} onChange={v => update('interestOnITRefund', v)} hint="From ITD intimation order" />
        </div>
      </div>

      <div className="step-card editing">
        <div className="ff-section-title">Other Sources</div>
        <div className="ff-grid-3">
          <NumericField label="Dividend Income" value={form.dividendIncome} onChange={v => update('dividendIncome', v)} hint="Shares or MF · Fully taxable" />
          <NumericField label="Family Pension" value={form.familyPension} onChange={v => update('familyPension', v)} hint={fp > 0 ? `1/3 exempt: ₹${fpExempt.toLocaleString('en-IN')} (max ₹15K)` : '1/3 or ₹15K whichever is less'} />
          <NumericField label="Lottery / Winnings" value={form.winnings} onChange={v => update('winnings', v)} hint="Flat 30% tax" />
        </div>
        <div className="ff-grid-3">
          <NumericField label="Gifts (taxable)" value={form.gifts} onChange={v => update('gifts', v)} hint="Taxable if > ₹50K/year" />
          <NumericField label="Any Other Income" value={form.otherIncome} onChange={v => update('otherIncome', v)} hint="Commission, royalty, etc." />
          <div />
        </div>
      </div>

      {/* Agricultural Income — exempt but affects tax calculation */}
      <div className="step-card editing" style={{ borderLeft: '3px solid var(--color-success)' }}>
        <div className="ff-section-title">Agricultural Income (Exempt)</div>
        <NumericField label="Agricultural Income" value={form.agriculturalIncome} onChange={v => update('agriculturalIncome', v)} hint="Exempt from tax · Affects slab rate if > ₹5,000" />
        {n(form.agriculturalIncome) > 5000 && (
          <div className="ff-hint" style={{ color: P.warning, marginTop: 4 }}>
            Since agricultural income exceeds ₹5,000, it will be partially integrated with your other income for tax slab calculation (higher slabs may apply to non-agricultural income).
          </div>
        )}
        {n(form.agriculturalIncome) > 0 && n(form.agriculturalIncome) <= 5000 && (
          <div className="ff-hint" style={{ color: P.success, marginTop: 4 }}>
            Agricultural income up to ₹5,000 has no impact on tax calculation.
          </div>
        )}
      </div>

      {/* Crypto & Digital Assets (VDA) — flat 30% tax */}
      <div className="step-card editing">
        <div className="ff-section-title">Crypto &amp; Digital Assets</div>
        <div className="ff-grid-3">
          <NumericField label="Sale Value" value={form.vdaSaleValue} onChange={v => update('vdaSaleValue', v)} hint="Total sale proceeds from VDA" />
          <NumericField label="Cost of Acquisition" value={form.vdaCostOfAcquisition} onChange={v => update('vdaCostOfAcquisition', v)} hint="Purchase cost of VDA" />
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
            {vdaGain > 0 && <span style={{ fontWeight: 600 }}>Gain: ₹{vdaGain.toLocaleString('en-IN')}</span>}
            {vdaLoss && <span style={{ fontWeight: 600, color: P.error }}>Loss: ₹{(n(form.vdaCostOfAcquisition) - n(form.vdaSaleValue)).toLocaleString('en-IN')}</span>}
          </div>
        </div>
        <div className="ff-hint" style={{ marginTop: 4 }}>
          Flat 30% tax, no deductions except purchase cost, 1% TDS under Section 194S
        </div>
        {vdaLoss && (
          <div className="ff-hint" style={{ color: P.error, marginTop: 4 }}>
            VDA losses cannot offset other income
          </div>
        )}
        {vdaGain > 0 && (
          <div className="ff-hint" style={{ color: P.warning, marginTop: 4 }}>
            Tax: ₹{vdaTax.toLocaleString('en-IN')} (30% flat)
          </div>
        )}
      </div>

      <SaveButton onClick={handleSave} isSaving={isSaving} label="Save Other Income" />

      <div className="step-card summary">
        {n(form.savingsInterest) > 0 && <SummaryRow label="Savings Interest" value={form.savingsInterest} />}
        {n(form.fdInterest) > 0 && <SummaryRow label="FD/RD Interest" value={form.fdInterest} />}
        {n(form.interestOnITRefund) > 0 && <SummaryRow label="IT Refund Interest" value={form.interestOnITRefund} />}
        {n(form.dividendIncome) > 0 && <SummaryRow label="Dividends" value={form.dividendIncome} />}
        {fp > 0 && <SummaryRow label="Family Pension (net)" value={fp - fpExempt} />}
        {n(form.winnings) > 0 && <SummaryRow label="Winnings (30% tax)" value={form.winnings} />}
        {n(form.gifts) > 0 && <SummaryRow label="Gifts" value={form.gifts} />}
        {n(form.otherIncome) > 0 && <SummaryRow label="Other" value={form.otherIncome} />}
        {vdaGain > 0 && <SummaryRow label="VDA Gain (30% flat)" value={vdaGain} />}
        <Divider />
        <SummaryRow label="Total Other Income" value={total} bold />
        {n(form.agriculturalIncome) > 0 && (
          <SummaryRow label="Agricultural Income (exempt)" value={form.agriculturalIncome} green />
        )}
      </div>
    </div>
  );
}
