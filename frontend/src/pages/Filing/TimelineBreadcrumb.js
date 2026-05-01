import React from 'react';
import {
  Briefcase, Home, DollarSign, TrendingUp, Building2,
  Globe, Shield, Landmark, User, ArrowLeft, Check,
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

export default function TimelineBreadcrumb({ filing }) {
  const { zoomedSection, zoomIn, zoomOut } = useFilingStore();
  const payload = filing?.jsonPayload || {};

  return (
    <nav className="breadcrumb" aria-label="Filing sections">
      <button className="breadcrumb__back" onClick={zoomOut} aria-label="Back to overview">
        <ArrowLeft size={16} />
      </button>
      {SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const active = zoomedSection === sec.id;
        const complete = isComplete(sec.id, payload);

        return (
          <button
            key={sec.id}
            className={`breadcrumb__item${active ? ' breadcrumb__item--active' : ''}`}
            style={active ? { borderColor: sec.color } : undefined}
            onClick={() => zoomIn(sec.id)}
            aria-label={sec.label}
            aria-current={active ? 'step' : undefined}
            title={sec.label}
          >
            <Icon size={16} color={active ? sec.color : undefined} />
            {complete && (
              <span className="breadcrumb__item-check">
                <Check size={7} />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
