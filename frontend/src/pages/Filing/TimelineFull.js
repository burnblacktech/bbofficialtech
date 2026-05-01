import React from 'react';
import {
  Briefcase, Home, DollarSign, TrendingUp, Building2,
  Globe, Shield, Landmark, User, Check,
} from 'lucide-react';
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

const fmt = (v) => v ? `₹${Math.round(Number(v)).toLocaleString('en-IN')}` : '—';

const n = (v) => Number(v) || 0;

function isComplete(id, payload) {
  const p = payload || {};
  switch (id) {
    case 'personalInfo': return !!(p.personalInfo?.pan);
    case 'salary': return (p.income?.salary?.employers || []).length > 0;
    case 'house_property': return !!(p.income?.houseProperty?.type && !['none', 'NONE'].includes(p.income.houseProperty.type));
    case 'other': return n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) + n(p.income?.otherSources?.dividendIncome) + n(p.income?.otherSources?.otherIncome) > 0;
    case 'capital_gains': return (p.income?.capitalGains?.transactions || []).length > 0;
    case 'business': return (p.income?.presumptive?.entries || []).length > 0 || (p.income?.business?.businesses || []).length > 0;
    case 'foreign': return (p.income?.foreignIncome?.incomes || []).length > 0;
    case 'deductions': return n(p.deductions?.ppf) + n(p.deductions?.elss) + n(p.deductions?.lic) + n(p.deductions?.nps) + n(p.deductions?.healthSelf) > 0;
    case 'bank': return !!(p.bankDetails?.bankName && p.bankDetails?.accountNumber);
    default: return false;
  }
}

function getAmount(id, payload, regime) {
  const inc = regime?.income || {};
  switch (id) {
    case 'salary': return inc.salary?.netTaxable;
    case 'house_property': return inc.houseProperty?.netIncome;
    case 'other': return inc.otherSources?.total;
    case 'capital_gains': return inc.capitalGains?.totalTaxable;
    case 'business': return inc.business?.netProfit || inc.presumptive?.totalIncome;
    case 'deductions': return regime?.deductions;
    default: return null;
  }
}

export default function TimelineFull({ filing, computation }) {
  const { zoomIn, selectedRegime, setSelectedRegime } = useFilingStore();
  const payload = filing?.jsonPayload || {};
  const regime = computation?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'] || {};

  const cx = 350;
  const cy = 200;
  const rx = 300;
  const ry = 170;
  const count = SECTIONS.length;

  const grossIncome = regime.grossTotalIncome;
  const deductions = regime.deductions;
  const taxable = regime.totalTaxableIncome;
  const tax = regime.totalTax;
  const tds = regime.tdsCredit || regime.prepaidTaxes;
  const result = regime.refundOrPayable ?? (n(tds) - n(tax));
  const isRefund = n(result) >= 0;

  return (
    <div className="orbital">
      <div className="orbital__ring">
        <svg className="orbital__path" viewBox="0 0 700 400" preserveAspectRatio="xMidYMid meet">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </svg>

        {SECTIONS.map((sec, i) => {
          const angle = ((2 * Math.PI) / count) * i - Math.PI / 2;
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);
          const left = `${(x / 700) * 100}%`;
          const top = `${(y / 400) * 100}%`;
          const complete = isComplete(sec.id, payload);
          const amount = getAmount(sec.id, payload, regime);
          const Icon = sec.icon;

          return (
            <div
              key={sec.id}
              className="orbital__node"
              style={{ left, top }}
              onClick={() => zoomIn(sec.id)}
              role="button"
              tabIndex={0}
              aria-label={`${sec.label}${complete ? ' (complete)' : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomIn(sec.id); } }}
            >
              <div
                className={`orbital__node-circle${complete ? ' orbital__node-circle--complete' : ''}`}
                style={!complete ? { borderColor: sec.color } : undefined}
              >
                {complete
                  ? <Check size={18} color="var(--color-success, #16A34A)" />
                  : <Icon size={18} color={sec.color} />}
              </div>
              <span className="orbital__node-label">{sec.label}</span>
              {amount != null && <span className="orbital__node-amount">{fmt(amount)}</span>}
            </div>
          );
        })}

        <div className="orbital__hub">
          <div className="orbital__hub-row">
            <span className="orbital__hub-label">Gross Income</span>
            <span className="orbital__hub-value">{fmt(grossIncome)}</span>
          </div>
          <div className="orbital__hub-row">
            <span className="orbital__hub-label">Deductions</span>
            <span className="orbital__hub-value">{fmt(deductions)}</span>
          </div>
          <div className="orbital__hub-row">
            <span className="orbital__hub-label">Taxable</span>
            <span className="orbital__hub-value">{fmt(taxable)}</span>
          </div>
          <div className="orbital__hub-row">
            <span className="orbital__hub-label">Tax</span>
            <span className="orbital__hub-value">{fmt(tax)}</span>
          </div>
          <div className="orbital__hub-row">
            <span className="orbital__hub-label">TDS</span>
            <span className="orbital__hub-value">{fmt(tds)}</span>
          </div>
          <div className={`orbital__hub-result ${isRefund ? 'orbital__hub-result--refund' : 'orbital__hub-result--payable'}`}>
            {isRefund ? `Refund ${fmt(Math.abs(n(result)))}` : `Payable ${fmt(Math.abs(n(result)))}`}
          </div>
          <div className="regime-toggle">
            <button
              className={`regime-toggle__btn${selectedRegime === 'old' ? ' regime-toggle__btn--active' : ''}`}
              onClick={() => setSelectedRegime('old')}
            >
              Old
            </button>
            <button
              className={`regime-toggle__btn${selectedRegime === 'new' ? ' regime-toggle__btn--active' : ''}`}
              onClick={() => setSelectedRegime('new')}
            >
              New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
