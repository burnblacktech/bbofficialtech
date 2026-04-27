// =====================================================
// TAX COMPUTATION CARD — Horizontal 6-column inline strip
// Each key metric gets its own column for maximum space usage
// =====================================================

import React from 'react';
import CountingNumber from '../UI/CountingNumber';

const n = (v) => Number(v) || 0;

export default function TaxComputationCard({ comp, selectedRegime, onNavigateToSection }) {
  if (!comp) {
    return (
      <div className="tax-computation-card">
        <p className="tax-computation-card__empty">Add income to see computation</p>
      </div>
    );
  }

  const regime = selectedRegime === 'old' ? comp.oldRegime : comp.newRegime;
  if (!regime) {
    return (
      <div className="tax-computation-card">
        <p className="tax-computation-card__empty">Add income to see computation</p>
      </div>
    );
  }

  const netPayable = n(regime.netPayable);
  const isRefund = netPayable <= 0;
  const resultLabel = netPayable < 0 ? 'Refund Due' : 'Tax Payable';
  const resultValue = Math.abs(netPayable);

  const nav = (id) => onNavigateToSection?.(id);

  return (
    <div className="tax-computation-card">
      {/* Horizontal 6-column strip — hidden on mobile */}
      <div className="tax-computation-card__strip">
        <Metric
          label="Gross Income"
          value={n(regime.grossTotalIncome)}
          clickable
          onClick={() => nav('salary')}
        />
        <div className="tax-computation-card__op">−</div>
        <Metric
          label={selectedRegime === 'old' ? 'Deductions' : 'Std. Deduction'}
          value={n(regime.deductions)}
          clickable={selectedRegime === 'old'}
          onClick={() => nav('deductions')}
        />
        <div className="tax-computation-card__op">=</div>
        <Metric label="Taxable" value={n(regime.taxableIncome)} bold />
        <div className="tax-computation-card__op">→</div>
        <Metric label="Tax + Cess" value={n(regime.totalTax)} />
        <div className="tax-computation-card__op">−</div>
        <Metric
          label="TDS Paid"
          value={n(regime.tdsCredit)}
          clickable
          onClick={() => nav('bank')}
        />
        <div className="tax-computation-card__op">=</div>
        <Metric
          label={resultLabel}
          value={resultValue}
          bold
          isRefund={isRefund}
          large
        />
      </div>

      {/* Mobile summary — only final result */}
      <div className="tax-computation-card__mobile-summary">
        <span className="tax-computation-card__result-label">{resultLabel}</span>
        <CountingNumber
          value={resultValue}
          className={`tax-computation-card__result-value ${isRefund ? 'tax-computation-card__result--refund' : 'tax-computation-card__result--payable'}`}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, bold, clickable, onClick, isRefund, large }) {
  const valueClass = [
    'tax-computation-card__metric-value',
    bold && 'bold',
    large && 'large',
    large && isRefund && 'refund',
    large && !isRefund && 'payable',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`tax-computation-card__metric ${clickable ? 'tax-computation-card__metric--clickable' : ''}`}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="tax-computation-card__metric-label">{label}</span>
      <CountingNumber value={value} className={valueClass} duration={400} />
    </div>
  );
}
