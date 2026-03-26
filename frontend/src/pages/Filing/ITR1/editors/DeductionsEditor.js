import { useState } from 'react';
import { Save } from 'lucide-react';
import '../../filing-flow.css';

const n = (v) => Number(v) || 0;
const rs = (v) => `\u20B9${n(v).toLocaleString('en-IN')}`;

export default function DeductionsEditor({ payload, onSave, selectedRegime: regimeProp }) {
  const d = payload?.deductions || {};
  const [regime, setRegime] = useState(regimeProp || payload?.selectedRegime || 'new');
  const [form, setForm] = useState({
    // 80C components
    ppf: d.ppf || '', elss: d.elss || '', lic: d.lic || '',
    tuitionFees: d.tuitionFees || '', homeLoanPrincipal: d.homeLoanPrincipal || '',
    sukanyaSamriddhi: d.sukanyaSamriddhi || '', fiveYearFD: d.fiveYearFD || '',
    nsc: d.nsc || '', otherC: d.otherC || '',
    // Other deductions
    nps: d.nps || '',
    healthSelf: d.healthSelf || '', healthParents: d.healthParents || '',
    eduLoan: d.eduLoan || '',
    savingsInt: d.savingsInt || '',
    donations: d.donations || '',
    rentPaid: d.rentPaid || '',       // 80GG
    disability: d.disability || '',   // 80U
  });

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    // Don't save on keystroke — wait for explicit save
  };

  const changeRegime = (r) => {
    setRegime(r);
    // Regime change saves immediately (it's a toggle, not text input)
    onSave({ deductions: form, selectedRegime: r });
  };

  const handleSave = () => {
    onSave({ deductions: form, selectedRegime: regime });
  };

  // 80C total
  const raw80C = n(form.ppf) + n(form.elss) + n(form.lic) + n(form.tuitionFees) + n(form.homeLoanPrincipal) + n(form.sukanyaSamriddhi) + n(form.fiveYearFD) + n(form.nsc) + n(form.otherC);
  const cap80C = Math.min(raw80C, 150000);
  const capNps = Math.min(n(form.nps), 50000);
  const capTta = Math.min(n(form.savingsInt), 10000);
  const capRent = Math.min(n(form.rentPaid), 60000); // 80GG max ₹5000/month
  const total = cap80C + capNps + n(form.healthSelf) + n(form.healthParents) + n(form.eduLoan) + capTta + n(form.donations) + capRent + n(form.disability);

  return (
    <div>
      <h2 className="step-title">Deductions & Regime</h2>
      <p className="step-desc">Choose your tax regime and claim deductions</p>

      {/* Regime Toggle — prominent */}
      <div className="step-card" style={{ marginBottom: 16 }}>
        <div className="ff-section-title">Tax Regime</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['old', 'Old Regime', 'All deductions + exemptions'], ['new', 'New Regime', 'Lower slabs, std deduction only']].map(([k, label, desc]) => (
            <div key={k} className={`ff-option${regime === k ? ' selected' : ''}`} onClick={() => changeRegime(k)} style={{ flex: 1 }}>
              <div className="ff-option-label">{label}</div>
              <div className="ff-option-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {regime === 'new' ? (
        <div className="step-card info">
          <p style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>
            Under the new regime, only standard deduction of {rs(75000)} is available. No Chapter VI-A deductions apply.
            The new regime has lower tax slabs which may benefit you if your deductions are less than ~{rs(375000)}.
          </p>
        </div>
      ) : (
        <>
          {/* 80C */}
          <div className="step-card editing">
            <div className="ff-section-title">80C — Investments & Payments <span className="ff-section-cap">(max {rs(150000)})</span></div>
            <div className="ff-grid-2">
              <F l="PPF" v={form.ppf} c={v => update('ppf', v)} />
              <F l="ELSS Mutual Funds" v={form.elss} c={v => update('elss', v)} />
              <F l="LIC Premium" v={form.lic} c={v => update('lic', v)} />
              <F l="Tuition Fees" v={form.tuitionFees} c={v => update('tuitionFees', v)} h="Max 2 children" />
              <F l="Home Loan Principal" v={form.homeLoanPrincipal} c={v => update('homeLoanPrincipal', v)} />
              <F l="Sukanya Samriddhi" v={form.sukanyaSamriddhi} c={v => update('sukanyaSamriddhi', v)} />
              <F l="5-Year Tax Saver FD" v={form.fiveYearFD} c={v => update('fiveYearFD', v)} />
              <F l="NSC" v={form.nsc} c={v => update('nsc', v)} />
            </div>
            <F l="Other 80C" v={form.otherC} c={v => update('otherC', v)} h="SCSS, stamp duty, etc." />
            {raw80C > 150000 && <div className="ff-hint" style={{ color: '#d97706', marginTop: 4 }}>Total {rs(raw80C)} — capped at {rs(150000)}</div>}
            {raw80C > 0 && raw80C <= 150000 && <div className="ff-hint" style={{ color: '#16a34a', marginTop: 4 }}>Used {rs(raw80C)} of {rs(150000)} limit</div>}
          </div>

          {/* Health & Insurance */}
          <div className="step-card editing">
            <div className="ff-section-title">Health & Insurance</div>
            <div className="ff-grid-2">
              <F l="80CCD(1B) — NPS" v={form.nps} c={v => update('nps', v)} h={`Max ${rs(50000)}`} />
              <F l="80D — Health (Self/Family)" v={form.healthSelf} c={v => update('healthSelf', v)} h={`Max ${rs(25000)} / ${rs(50000)} senior`} />
              <F l="80D — Health (Parents)" v={form.healthParents} c={v => update('healthParents', v)} h={`Max ${rs(25000)} / ${rs(50000)} senior`} />
              <F l="80U — Disability" v={form.disability} c={v => update('disability', v)} h={`${rs(75000)} / ${rs(125000)} severe`} />
            </div>
          </div>

          {/* Other Deductions */}
          <div className="step-card editing">
            <div className="ff-section-title">Other Deductions</div>
            <div className="ff-grid-2">
              <F l="80E — Education Loan Interest" v={form.eduLoan} c={v => update('eduLoan', v)} h="No cap, interest only" />
              <F l="80TTA — Savings Interest" v={form.savingsInt} c={v => update('savingsInt', v)} h={`Max ${rs(10000)}`} />
              <F l="80G — Donations" v={form.donations} c={v => update('donations', v)} h="50% or 100% eligible" />
              <F l="80GG — Rent Paid" v={form.rentPaid} c={v => update('rentPaid', v)} h={`No HRA? Max ${rs(5000)}/month`} />
            </div>
          </div>
        </>
      )}

      {regime === 'old' && (
        <button className="ff-btn ff-btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          <Save size={14} /> Save Deductions
        </button>
      )}

      {/* Summary */}
      <div className="step-card summary">
        <div className="ff-row"><span className="ff-row-label">Regime</span><span className="ff-row-value bold">{regime === 'old' ? 'Old Regime' : 'New Regime'}</span></div>
        {regime === 'old' && (
          <>
            <div className="ff-row"><span className="ff-row-label">80C</span><span className="ff-row-value">{rs(cap80C)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80CCD(1B) NPS</span><span className="ff-row-value">{rs(capNps)}</span></div>
            <div className="ff-row"><span className="ff-row-label">80D Health</span><span className="ff-row-value">{rs(n(form.healthSelf) + n(form.healthParents))}</span></div>
            {n(form.disability) > 0 && <div className="ff-row"><span className="ff-row-label">80U Disability</span><span className="ff-row-value">{rs(form.disability)}</span></div>}
            {n(form.eduLoan) > 0 && <div className="ff-row"><span className="ff-row-label">80E Edu Loan</span><span className="ff-row-value">{rs(form.eduLoan)}</span></div>}
            {capTta > 0 && <div className="ff-row"><span className="ff-row-label">80TTA</span><span className="ff-row-value">{rs(capTta)}</span></div>}
            {n(form.donations) > 0 && <div className="ff-row"><span className="ff-row-label">80G Donations</span><span className="ff-row-value">{rs(form.donations)}</span></div>}
            {capRent > 0 && <div className="ff-row"><span className="ff-row-label">80GG Rent</span><span className="ff-row-value">{rs(capRent)}</span></div>}
            <div className="ff-divider" />
            <div className="ff-row"><span className="ff-row-label">Total Deductions</span><span className="ff-row-value bold green">{rs(total)}</span></div>
          </>
        )}
        {regime === 'new' && (
          <div className="ff-row"><span className="ff-row-label">Standard Deduction</span><span className="ff-row-value">{rs(75000)}</span></div>
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
