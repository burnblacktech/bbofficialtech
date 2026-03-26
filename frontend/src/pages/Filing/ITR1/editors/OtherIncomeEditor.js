import { useState } from 'react';
import { Save } from 'lucide-react';
import { validateOtherIncomeStep } from '../../../../utils/itrValidation';
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
  const [dirty, setDirty] = useState(false);

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    setDirty(true);
    const v = validateOtherIncomeStep(next);
    setErrors(v.valid ? {} : v.errors);
  };

  const handleSave = () => {
    const { agriculturalIncome: agriVal, ...otherFields } = form;
    onSave({ income: { otherSources: otherFields, agriculturalIncome: n(agriVal) } });
    setDirty(false);
  };

  const fp = n(form.familyPension);
  const fpExempt = Math.min(Math.round(fp / 3), 15000);
  const total = n(form.savingsInterest) + n(form.fdInterest) + n(form.dividendIncome)
    + (fp - fpExempt) + n(form.interestOnITRefund) + n(form.winnings) + n(form.gifts) + n(form.otherIncome);

  return (
    <div>
      <h2 className="step-title">Other Income</h2>
      <p className="step-desc">Interest, dividends, pension and other sources</p>

      <div className="step-card editing">
        <div className="ff-section-title">Interest Income</div>
        <div className="ff-grid-2">
          <F l="Savings Account Interest" v={form.savingsInterest} c={v => update('savingsInterest', v)} h="From bank savings accounts" />
          <F l="FD / RD Interest" v={form.fdInterest} c={v => update('fdInterest', v)} h="Fixed / recurring deposits" />
        </div>
        <F l="Interest on IT Refund" v={form.interestOnITRefund} c={v => update('interestOnITRefund', v)} h="u/s 244A — shown in intimation" />
      </div>

      <div className="step-card editing">
        <div className="ff-section-title">Other Sources</div>
        <div className="ff-grid-2">
          <F l="Dividend Income" v={form.dividendIncome} c={v => update('dividendIncome', v)} h="From shares, MF (taxable from AY 2021-22)" />
          <F l="Family Pension" v={form.familyPension} c={v => update('familyPension', v)} h={fp > 0 ? `1/3 exempt: \u20B9${fpExempt.toLocaleString('en-IN')} (max \u20B915,000)` : '1/3 or \u20B915,000 whichever is less'} />
        </div>
        <div className="ff-grid-2">
          <F l="Lottery / Winnings" v={form.winnings} c={v => update('winnings', v)} h="Taxed at flat 30% (no deductions)" />
          <F l="Gifts (taxable)" v={form.gifts} c={v => update('gifts', v)} h="Aggregate > \u20B950,000 in a year" />
        </div>
        <F l="Any Other Income" v={form.otherIncome} c={v => update('otherIncome', v)} h="Commission, royalty, etc." />
      </div>

      {/* Agricultural Income — exempt but affects tax calculation */}
      <div className="step-card editing">
        <div className="ff-section-title">Agricultural Income (Exempt)</div>
        <F l="Agricultural Income" v={form.agriculturalIncome} c={v => update('agriculturalIncome', v)} h="Exempt from tax, but used for slab rate calculation if > \u20B95,000" />
        {n(form.agriculturalIncome) > 5000 && (
          <div className="ff-hint" style={{ color: '#d97706', marginTop: 4 }}>
            Since agricultural income exceeds \u20B95,000, it will be partially integrated with your other income for tax slab calculation (higher slabs may apply to non-agricultural income).
          </div>
        )}
        {n(form.agriculturalIncome) > 0 && n(form.agriculturalIncome) <= 5000 && (
          <div className="ff-hint" style={{ color: '#16a34a', marginTop: 4 }}>
            Agricultural income up to \u20B95,000 has no impact on tax calculation.
          </div>
        )}
      </div>

      {dirty && (
        <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={isSaving} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          {isSaving ? 'Saving...' : <><Save size={14} /> Save Other Income</>}
        </button>
      )}

      <div className="step-card summary">
        {n(form.savingsInterest) > 0 && <R l="Savings Interest" v={form.savingsInterest} />}
        {n(form.fdInterest) > 0 && <R l="FD/RD Interest" v={form.fdInterest} />}
        {n(form.interestOnITRefund) > 0 && <R l="IT Refund Interest" v={form.interestOnITRefund} />}
        {n(form.dividendIncome) > 0 && <R l="Dividends" v={form.dividendIncome} />}
        {fp > 0 && <R l="Family Pension (net)" v={fp - fpExempt} />}
        {n(form.winnings) > 0 && <R l="Winnings (30% tax)" v={form.winnings} />}
        {n(form.gifts) > 0 && <R l="Gifts" v={form.gifts} />}
        {n(form.otherIncome) > 0 && <R l="Other" v={form.otherIncome} />}
        <div className="ff-divider" />
        <div className="ff-row"><span className="ff-row-label">Total Other Income</span><span className="ff-row-value bold">{'\u20B9'}{total.toLocaleString('en-IN')}</span></div>
      </div>
    </div>
  );
}

const F = ({ l, v, c, h }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type="number" value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
const R = ({ l, v }) => (<div className="ff-row"><span className="ff-row-label">{l}</span><span className="ff-row-value">{'\u20B9'}{n(v).toLocaleString('en-IN')}</span></div>);
