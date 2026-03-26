import { useState } from 'react';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;

export default function OtherIncomeEditor({ payload, onSave, isSaving }) {
  const os = payload?.income?.otherSources || {};
  const [form, setForm] = useState({
    savingsInterest: os.savingsInterest || '',
    fdInterest: os.fdInterest || '',
    dividendIncome: os.dividendIncome || '',
    familyPension: os.familyPension || '',
    otherIncome: os.otherIncome || '',
  });

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    onSave({ income: { otherSources: next } });
  };

  const fp = n(form.familyPension);
  const fpExempt = Math.min(Math.round(fp / 3), 15000);
  const total = n(form.savingsInterest) + n(form.fdInterest) + n(form.dividendIncome) + (fp - fpExempt) + n(form.otherIncome);

  return (
    <div>
      <h2 className="step-title">Other Income</h2>
      <p className="step-desc">Interest, dividends, pension and other sources</p>

      <div className="step-card editing">
        <div className="ff-grid-2">
          <F l="Savings Interest (₹)" v={form.savingsInterest} c={v => update('savingsInterest', v)} h="From bank savings accounts" />
          <F l="FD Interest (₹)" v={form.fdInterest} c={v => update('fdInterest', v)} h="Fixed / recurring deposits" />
        </div>
        <div className="ff-grid-2">
          <F l="Dividend Income (₹)" v={form.dividendIncome} c={v => update('dividendIncome', v)} />
          <F l="Family Pension (₹)" v={form.familyPension} c={v => update('familyPension', v)} h={fp > 0 ? `1/3 exempt: ₹${fpExempt.toLocaleString('en-IN')} (max ₹15,000)` : 'Exempt: 1/3 or ₹15,000 whichever is less'} />
        </div>
        <F l="Other Income (₹)" v={form.otherIncome} c={v => update('otherIncome', v)} h="Any other taxable income" />
      </div>

      <div className="step-card summary">
        <div className="ff-row"><span className="ff-row-label">Savings Interest</span><span className="ff-row-value">₹{n(form.savingsInterest).toLocaleString('en-IN')}</span></div>
        <div className="ff-row"><span className="ff-row-label">FD Interest</span><span className="ff-row-value">₹{n(form.fdInterest).toLocaleString('en-IN')}</span></div>
        <div className="ff-row"><span className="ff-row-label">Dividends</span><span className="ff-row-value">₹{n(form.dividendIncome).toLocaleString('en-IN')}</span></div>
        {fp > 0 && <div className="ff-row"><span className="ff-row-label">Family Pension (net)</span><span className="ff-row-value">₹{(fp - fpExempt).toLocaleString('en-IN')}</span></div>}
        <div className="ff-row"><span className="ff-row-label">Other</span><span className="ff-row-value">₹{n(form.otherIncome).toLocaleString('en-IN')}</span></div>
        <div className="ff-divider" />
        <div className="ff-row"><span className="ff-row-label">Total Other Income</span><span className="ff-row-value bold">₹{total.toLocaleString('en-IN')}</span></div>
      </div>
    </div>
  );
}

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
