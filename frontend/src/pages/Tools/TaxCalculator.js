/**
 * Tax Calculator — Standalone tool, no login required.
 * Enter salary + deductions → see old vs new regime comparison.
 */

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Field, Button, Section } from '../../components/ds';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

const n = (v) => Number(v) || 0;
const fmt = (v) => `\u20B9${Math.abs(n(v)).toLocaleString('en-IN')}`;

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];
const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

function applySlabs(income, slabs) {
  let remaining = income;
  let tax = 0;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const width = slab.max === Infinity ? remaining : Math.min(remaining, slab.max - slab.min);
    tax += Math.round(width * slab.rate / 100);
    remaining -= width;
  }
  return tax;
}

function computeTax(income, deductions, regime) {
  const stdDed = 75000;
  const taxableOld = Math.max(0, income - stdDed - deductions);
  const taxableNew = Math.max(0, income - stdDed);

  const taxable = regime === 'old' ? taxableOld : taxableNew;
  const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
  const tax = applySlabs(taxable, slabs);

  const rebateLimit = regime === 'old' ? 500000 : 700000;
  const rebateMax = regime === 'old' ? 12500 : 25000;
  const rebate = taxable <= rebateLimit ? Math.min(tax, rebateMax) : 0;
  const afterRebate = tax - rebate;
  const cess = Math.round(afterRebate * 4 / 100);
  const total = afterRebate + cess;

  return { taxable, tax, rebate, cess, total };
}

export default function TaxCalculator() {
  const navigate = useNavigate();
  const [salary, setSalary] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [s80c, setS80c] = useState('');
  const [s80d, setS80d] = useState('');
  const [nps, setNps] = useState('');
  const [hraExempt, setHraExempt] = useState('');
  const [tds, setTds] = useState('');

  const totalIncome = n(salary) + n(otherIncome);
  const totalDeductions = Math.min(n(s80c), 150000) + n(s80d) + Math.min(n(nps), 50000) + n(hraExempt);

  const oldRegime = useMemo(() => computeTax(totalIncome, totalDeductions, 'old'), [totalIncome, totalDeductions]);
  const newRegime = useMemo(() => computeTax(totalIncome, 0, 'new'), [totalIncome]);
  const savings = Math.abs(oldRegime.total - newRegime.total);
  const recommended = oldRegime.total <= newRegime.total ? 'old' : 'new';

  return (
    <div style={{ minHeight: '100vh', background: P.bgPage }}>
      {/* Nav */}
      <nav style={{ background: P.brandBlack, borderBottom: '1px solid #2A2A2A', padding: '12px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: '#1A1A1A', borderRadius: 8, border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/bb-logo.svg" alt="BB" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: P.brand }}>BurnBlack</span>
          </div>
          <Button variant="primary" onClick={() => navigate('/signup')} size="sm" style={{ padding: '8px 16px', fontSize: 13 }}>
            File ITR Free <ArrowRight size={14} />
          </Button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 48px' }}>
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 12, padding: '4px 0', color: P.textMuted }}>
          <ArrowLeft size={14} /> Back
        </Button>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: P.textPrimary, marginBottom: 4 }}>Income Tax Calculator</h1>
        <p style={{ fontSize: 14, color: P.textMuted, marginBottom: 24 }}>AY 2025-26 · Old vs New Regime · Instant comparison</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: Inputs */}
          <div>
            <Card active>
              <Section title="Income" />
              <Field label="Annual Salary (CTC)" type="number" value={salary} onChange={setSalary} hint="Gross salary before deductions" placeholder="0" />
              <Field label="Other Income" type="number" value={otherIncome} onChange={setOtherIncome} hint="FD interest, dividends, rent, etc." placeholder="0" />
            </Card>

            <Card active style={{ marginTop: 12 }}>
              <Section title="Deductions (Old Regime)" />
              <Field label="80C (PPF, ELSS, LIC...)" type="number" value={s80c} onChange={setS80c} hint="Max ₹1,50,000" placeholder="0" />
              <Field label="80D (Health Insurance)" type="number" value={s80d} onChange={setS80d} hint="Self ₹25K + Parents ₹25K" placeholder="0" />
              <Field label="80CCD(1B) NPS" type="number" value={nps} onChange={setNps} hint="Additional ₹50,000" placeholder="0" />
              <Field label="HRA Exemption" type="number" value={hraExempt} onChange={setHraExempt} hint="Tax-free portion of HRA" placeholder="0" />
              <div className="ds-hint" style={{ marginTop: 4, color: P.textLight }}>
                Standard deduction of ₹75,000 is auto-applied in both regimes.
              </div>
            </Card>

            <Card active style={{ marginTop: 12 }}>
              <Section title="TDS Already Paid" />
              <Field label="TDS Deducted by Employer" type="number" value={tds} onChange={setTds} hint="From Form 16 Part A" placeholder="0" />
            </Card>
          </div>

          {/* Right: Results */}
          <div>
            {/* Regime comparison cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <RegimeCard label="Old Regime" regime={oldRegime} recommended={recommended === 'old'} tds={n(tds)} />
              <RegimeCard label="New Regime" regime={newRegime} recommended={recommended === 'new'} tds={n(tds)} />
            </div>

            {savings > 0 && (
              <div style={{ textAlign: 'center', padding: '10px 14px', background: P.successBg, border: `1px solid ${P.successBorder}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: P.success, marginBottom: 16 }}>
                {recommended === 'old' ? 'Old' : 'New'} Regime saves you {fmt(savings)}
              </div>
            )}

            {/* Detailed breakdown */}
            <Card>
              <Section title={`Breakdown (${recommended === 'old' ? 'Old' : 'New'} Regime)`} />
              <div className="ds-summary"><span className="ds-summary__label">Gross Income</span><span className="ds-summary__value">{fmt(totalIncome)}</span></div>
              <div className="ds-summary"><span className="ds-summary__label">Standard Deduction</span><span className="ds-summary__value ds-summary__value--green">-{fmt(75000)}</span></div>
              {recommended === 'old' && n(totalDeductions) > 0 && (
                <div className="ds-summary"><span className="ds-summary__label">Chapter VI-A Deductions</span><span className="ds-summary__value ds-summary__value--green">-{fmt(totalDeductions)}</span></div>
              )}
              <div className="ds-divider" />
              <div className="ds-summary"><span className="ds-summary__label">Taxable Income</span><span className="ds-summary__value ds-summary__value--bold">{fmt(recommended === 'old' ? oldRegime.taxable : newRegime.taxable)}</span></div>
              <div className="ds-summary"><span className="ds-summary__label">Tax</span><span className="ds-summary__value">{fmt(recommended === 'old' ? oldRegime.tax : newRegime.tax)}</span></div>
              {(recommended === 'old' ? oldRegime.rebate : newRegime.rebate) > 0 && (
                <div className="ds-summary"><span className="ds-summary__label">Rebate 87A</span><span className="ds-summary__value ds-summary__value--green">-{fmt(recommended === 'old' ? oldRegime.rebate : newRegime.rebate)}</span></div>
              )}
              <div className="ds-summary"><span className="ds-summary__label">Cess (4%)</span><span className="ds-summary__value">{fmt(recommended === 'old' ? oldRegime.cess : newRegime.cess)}</span></div>
              <div className="ds-divider" />
              <div className="ds-summary"><span className="ds-summary__label">Total Tax</span><span className="ds-summary__value ds-summary__value--bold">{fmt(recommended === 'old' ? oldRegime.total : newRegime.total)}</span></div>
              {n(tds) > 0 && <div className="ds-summary"><span className="ds-summary__label">TDS Paid</span><span className="ds-summary__value ds-summary__value--green">-{fmt(tds)}</span></div>}
              {n(tds) > 0 && (
                <>
                  <div className="ds-divider" />
                  {(() => {
                    const best = recommended === 'old' ? oldRegime : newRegime;
                    const net = best.total - n(tds);
                    return <div className="ds-summary"><span className="ds-summary__label" style={{ fontWeight: 600 }}>{net <= 0 ? 'Refund Due' : 'Tax Payable'}</span><span className={`ds-summary__value bold ${net <= 0 ? 'green' : 'red'}`}>{fmt(Math.abs(net))}</span></div>;
                  })()}
                </>
              )}
            </Card>

            {/* CTA */}
            <Button variant="primary" onClick={() => navigate('/signup')} style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '12px 0', fontSize: 15 }}>
              File Your ITR Now <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegimeCard({ label, regime, recommended, tds }) {
  const net = regime.total - tds;
  return (
    <div style={{ padding: 14, borderRadius: 10, border: recommended ? `2px solid ${P.brand}` : `1px solid ${P.borderLight}`, background: recommended ? P.brandLight : P.bgCard, position: 'relative' }}>
      {recommended && <span style={{ position: 'absolute', top: -8, right: 8, fontSize: 10, fontWeight: 700, color: P.brandBlack, background: P.brand, padding: '1px 8px', borderRadius: 10 }}>BEST</span>}
      <div style={{ fontSize: 14, fontWeight: 700, color: P.textPrimary, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 2 }}>Taxable: {fmt(regime.taxable)}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: P.textPrimary, fontFamily: 'var(--font-mono)' }}>{fmt(regime.total)}</div>
      <div style={{ fontSize: 11, color: P.textMuted }}>tax liability</div>
      {tds > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: net <= 0 ? P.success : P.error }}>
          {net <= 0 ? `Refund ${fmt(Math.abs(net))}` : `Pay ${fmt(net)}`}
        </div>
      )}
    </div>
  );
}
