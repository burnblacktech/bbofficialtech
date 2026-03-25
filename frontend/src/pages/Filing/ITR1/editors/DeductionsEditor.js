import { useState } from 'react';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const rs = (v) => `Rs.${n(v).toLocaleString('en-IN')}`;

export default function DeductionsEditor({ payload, onSave }) {
  const d = payload?.deductions || {};
  const [regime, setRegime] = useState(payload?.selectedRegime || 'old');
  const [form, setForm] = useState({
    ppf: d.ppf || '', elss: d.elss || '', lic: d.lic || '', otherC: d.otherC || '',
    nps: d.nps || '', healthSelf: d.healthSelf || '', healthParents: d.healthParents || '',
    eduLoan: d.eduLoan || '', savingsInt: d.savingsInt || '', donations: d.donations || '',
  });

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    onSave({ deductions: next, selectedRegime: regime });
  };

  const changeRegime = (r) => {
    setRegime(r);
    onSave({ deductions: form, selectedRegime: r });
  };

  const raw80C = n(form.ppf) + n(form.elss) + n(form.lic) + n(form.otherC);
  const cap80C = Math.min(raw80C, 150000);
  const capNps = Math.min(n(form.nps), 50000);
  const capTta = Math.min(n(form.savingsInt), 10000);
  const total = cap80C + capNps + n(form.healthSelf) + n(form.healthParents) + n(form.eduLoan) + capTta + n(form.donations);

  return (
    <div>
      <h2 className="step-title">Deductions</h2>
      <p className="step-desc">Claim deductions to reduce taxable income</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['old', 'Old Regime', 'All deductions available'], ['new', 'New Regime', 'Only standard deduction']].map(([k, label, desc]) => (
          <div key={k} className={`ff-option${regime === k ? ' selected' : ''}`} onClick={() => changeRegime(k)}>
            <div className="ff-option-label">{label}</div>
            <div className="ff-option-desc">{desc}</div>
          </div>
        ))}
      </div>

      {regime === 'new' ? (
        <div className="step-card info">
          <p style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>
            Under the new regime, only standard deduction of Rs.75,000 is available. No Chapter VI-A deductions.
          </p>
        </div>
      ) : (
        <>
          <div className="step-card editing">
            <div className="ff-section-title">
              80C - Investments <span className="ff-section-cap">(max Rs.1,50,000)</span>
            </div>
            <div className="ff-grid-2">
              <F l="PPF" v={form.ppf} c={v => update('ppf', v)} />
              <F l="ELSS" v={form.elss} c={v => update('elss', v)} />
              <F l="LIC Premium" v={form.lic} c={v => update('lic', v)} />
              <F l="Other 80C" v={form.otherC} c={v => update('otherC', v)} h="Tuition, NSC, SCSS, etc." />
            </div>
            {raw80C > 150000 && (
              <div className="ff-hint" style={{ color: '#d97706' }}>
                Total {rs(raw80C)} - capped at Rs.1,50,000
              </div>
            )}
          </div>

          <div className="step-card editing">
            <div className="ff-section-title">Other Deductions</div>
            <div className="ff-grid-2">
              <F l="80CCD(1B) - NPS" v={form.nps} c={v => update('nps', v)} h="Max Rs.50,000" />
              <F l="80D - Health (Self)" v={form.healthSelf} c={v => update('healthSelf', v)} h="Max Rs.25K / Rs.50K senior" />
              <F l="80D - Health (Parents)" v={form.healthParents} c={v => update('healthParents', v)} h="Max Rs.25K / Rs.50K senior" />
              <F l="80E - Education Loan" v={form.eduLoan} c={v => update('eduLoan', v)} h="Interest only, no cap" />
              <F l="80TTA - Savings Interest" v={form.savingsInt} c={v => update('savingsInt', v)} h="Max Rs.10,000" />
              <F l="80G - Donations" v={form.donations} c={v => update('donations', v)} />
            </div>
          </div>
        </>
      )}

      <div className="step-card summary">
        <div className="ff-row">
          <span className="ff-row-label">Regime</span>
          <span className="ff-row-value bold">{regime === 'old' ? 'Old' : 'New'}</span>
        </div>
        {regime === 'old' && (
          <>
            <div className="ff-row"><span className="ff-row-label">80C</span><span className="ff-row-value">{rs(cap80C)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80CCD(1B)</span><span className="ff-row-value">{rs(capNps)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80D</span><span className="ff-row-value">{rs(n(form.healthSelf) + n(form.healthParents))}</span></div>
            <div className="ff-row"><span className="ff-row-label">80E + 80TTA + 80G</span><span className="ff-row-value">{rs(n(form.eduLoan) + capTta + n(form.donations))}</span></div>
            <div className="ff-divider" />
            <div className="ff-row"><span className="ff-row-label">Total Deductions</span><span className="ff-row-value bold green">{rs(total)}</span></div>
          </>
        )}
      </div>
    </div>
  );
}

const F = ({ l, v, c, h }) => (
  <div className="ff-field">
    <label className="ff-label">{l}</label>
    <input className="ff-input" type="number" value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />
    {h && <div className="ff-hint">{h}</div>}
  </div>
);
