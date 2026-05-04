/**
 * TimelineMobile — Vertical section list for mobile screens.
 * Replaces the orbital ring on viewports < 768px.
 */
import { Check, User, Briefcase, Home, DollarSign, TrendingUp, Building2, Globe, Shield, Landmark } from 'lucide-react';
import useFilingStore from '../../store/useFilingStore';

const SECTIONS = [
  { id: 'personalInfo', icon: User, label: 'Personal Info', color: '#6366f1' },
  { id: 'salary', icon: Briefcase, label: 'Salary', color: '#059669' },
  { id: 'house_property', icon: Home, label: 'House Property', color: '#7c3aed' },
  { id: 'other', icon: DollarSign, label: 'Other Income', color: '#6b7280' },
  { id: 'capital_gains', icon: TrendingUp, label: 'Capital Gains', color: '#0D9488' },
  { id: 'business', icon: Building2, label: 'Business', color: '#CA8A04' },
  { id: 'foreign', icon: Globe, label: 'Foreign Income', color: '#0891b2' },
  { id: 'deductions', icon: Shield, label: 'Deductions', color: '#059669' },
  { id: 'bank', icon: Landmark, label: 'Bank & Submit', color: '#6b7280' },
];

const fmt = (v) => v ? `₹${Math.round(Number(v)).toLocaleString('en-IN')}` : null;

function isComplete(id, payload) {
  if (!payload) return false;
  const p = payload;
  switch (id) {
    case 'personalInfo': return !!(p.personalInfo?.pan && p.personalInfo?.firstName);
    case 'salary': return (p.income?.salary?.employers || []).length > 0;
    case 'deductions': return Object.keys(p.deductions?.section80C || {}).some(k => Number(p.deductions.section80C[k]) > 0);
    case 'bank': return !!(p.bankDetails?.bankName && p.bankDetails?.accountNumber);
    default: return false;
  }
}

function getAmount(id, computation, regime) {
  if (!computation) return null;
  const r = computation[regime === 'old' ? 'oldRegime' : 'newRegime'];
  switch (id) {
    case 'salary': return fmt(computation.income?.salary?.netTaxable);
    case 'house_property': return fmt(computation.income?.houseProperty?.netIncome);
    case 'other': return fmt(computation.income?.otherSources?.total);
    case 'deductions': return r?.deductions ? fmt(-r.deductions) : null;
    default: return null;
  }
}

export default function TimelineMobile({ filing, computation }) {
  const { zoomIn, activeSources, selectedRegime } = useFilingStore();
  const payload = filing?.jsonPayload || {};

  const visible = SECTIONS.filter(s =>
    ['personalInfo', 'deductions', 'bank'].includes(s.id) || activeSources.includes(s.id)
  );

  const r = computation?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'];
  const net = Number(r?.netPayable) || 0;
  const isRefund = net < 0;

  return (
    <div className="mobile-timeline">
      {/* Tax summary strip */}
      {r && (
        <div className="mobile-timeline__summary">
          <div className="mobile-timeline__summary-row">
            <span>Gross</span>
            <span className="mono">{fmt(r.grossTotalIncome)}</span>
          </div>
          <div className="mobile-timeline__summary-row">
            <span>Tax</span>
            <span className="mono">{fmt(r.totalTax)}</span>
          </div>
          <div className="mobile-timeline__summary-row" style={{ fontWeight: 700, color: isRefund ? 'var(--c-success)' : 'var(--c-error)' }}>
            <span>{isRefund ? 'Refund' : 'Payable'}</span>
            <span className="mono">{fmt(Math.abs(net))}</span>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="mobile-timeline__list">
        {visible.map((s) => {
          const done = isComplete(s.id, payload);
          const amount = getAmount(s.id, computation, selectedRegime);
          const Icon = s.icon;
          return (
            <button key={s.id} className="mobile-timeline__card" onClick={() => zoomIn(s.id)}>
              <div className="mobile-timeline__icon" style={{ background: s.color + '18', color: s.color }}>
                {done ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <div className="mobile-timeline__info">
                <span className="mobile-timeline__label">{s.label}</span>
                {amount && <span className="mobile-timeline__amount">{amount}</span>}
              </div>
              <span className={`mobile-timeline__dot ${done ? 'done' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
