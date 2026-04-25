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
  });
  const [errors, setErrors] = useState({});

  const buildPayload = useCallback(() => {
    const { agriculturalIncome: agriVal, ...otherFields } = form;
    return { income: { otherSources: otherFields, agriculturalIncome: n(agriVal) } };
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
    const { agriculturalIncome: agriVal, ...otherFields } = form;
    onSave({ income: { otherSources: otherFields, agriculturalIncome: n(agriVal) } });
  };

  const fp = n(form.familyPension);
  const fpExempt = Math.min(Math.round(fp / 3), 15000);
  const total = n(form.savingsInterest) + n(form.fdInterest) + n(form.dividendIncome)
    + (fp - fpExempt) + n(form.interestOnITRefund) + n(form.winnings) + n(form.gifts) + n(form.otherIncome);

  return (
    <div>
      <EditorHeader title="Other Income" subtitle="Interest, dividends, pension and other sources" />

      <div className="step-card editing">
        <div className="ff-section-title">Interest Income</div>
        <div className="ff-grid-2">
          <NumericField label="Savings Account Interest" value={form.savingsInterest} onChange={v => update('savingsInterest', v)} hint="Interest on savings accounts · From bank passbook" />
          <NumericField label="FD / RD Interest" value={form.fdInterest} onChange={v => update('fdInterest', v)} hint="FD/RD interest earned · From bank TDS certificate" />
        </div>
        <NumericField label="Interest on IT Refund" value={form.interestOnITRefund} onChange={v => update('interestOnITRefund', v)} hint="Interest on your IT refund · From ITD intimation order" />
      </div>

      <div className="step-card editing">
        <div className="ff-section-title">Other Sources</div>
        <div className="ff-grid-2">
          <NumericField label="Dividend Income" value={form.dividendIncome} onChange={v => update('dividendIncome', v)} hint="Dividends from shares or MF · Fully taxable" />
          <NumericField label="Family Pension" value={form.familyPension} onChange={v => update('familyPension', v)} hint={fp > 0 ? `1/3 exempt: ₹${fpExempt.toLocaleString('en-IN')} (max ₹15,000)` : '1/3 or ₹15,000 whichever is less'} />
        </div>
        <div className="ff-grid-2">
          <NumericField label="Lottery / Winnings" value={form.winnings} onChange={v => update('winnings', v)} hint="Lottery, games, betting · Flat 30% tax" />
          <NumericField label="Gifts (taxable)" value={form.gifts} onChange={v => update('gifts', v)} hint="Gifts from non-relatives · Taxable if total > ₹50,000/year" />
        </div>
        <NumericField label="Any Other Income" value={form.otherIncome} onChange={v => update('otherIncome', v)} hint="Commission, royalty, interest on loans given, etc." />
      </div>

      {/* Agricultural Income — exempt but affects tax calculation */}
      <div className="step-card editing">
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
        <Divider />
        <SummaryRow label="Total Other Income" value={total} bold />
        {n(form.agriculturalIncome) > 0 && (
          <SummaryRow label="Agricultural Income (exempt)" value={form.agriculturalIncome} green />
        )}
      </div>
    </div>
  );
}
