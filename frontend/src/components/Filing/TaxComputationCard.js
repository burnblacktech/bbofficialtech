// =====================================================
// TAX COMPUTATION CARD — Horizontal 6-column inline strip
// Each key metric gets its own column for maximum space usage
// =====================================================

import React, { useState, useMemo } from 'react';
import CountingNumber from '../UI/CountingNumber';
import RegimeComparatorModal from './RegimeComparatorModal';
import { buildComparison } from '../../utils/regimeComparator';

const n = (v) => Number(v) || 0;

export default function TaxComputationCard({ comp, selectedRegime, onNavigateToSection, onSwitchRegime }) {
  const [showComparator, setShowComparator] = useState(false);

  // Task 10.3: Build comparison data for the modal
  const comparison = useMemo(() => buildComparison(comp), [comp]);

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

  // Task 10.3: Compact regime comparison indicator
  const savingsText = comparison && comparison.totalSavings > 0
    ? `${comparison.recommended === selectedRegime ? 'Best' : 'Save'} ₹${comparison.totalSavings.toLocaleString('en-IN')}`
    : null;

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
        {/* Task 10.3: Compact regime comparison indicator */}
        {savingsText && (
          <button
            onClick={() => setShowComparator(true)}
            className="tax-computation-card__compare-btn"
            aria-label="Compare tax regimes"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', marginLeft: 6, borderRadius: 'var(--radius-full)',
              background: comparison.recommended !== selectedRegime ? 'var(--color-success-bg)' : 'var(--bg-muted)',
              border: `1px solid ${comparison.recommended !== selectedRegime ? 'var(--color-success-border)' : 'var(--border-light)'}`,
              color: comparison.recommended !== selectedRegime ? 'var(--color-success)' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
          >
            {comparison.recommended !== selectedRegime ? '↗ ' : '✓ '}{savingsText}
          </button>
        )}
      </div>

      {/* Mobile summary — only final result */}
      <div className="tax-computation-card__mobile-summary">
        <span className="tax-computation-card__result-label">{resultLabel}</span>
        <CountingNumber
          value={resultValue}
          className={`tax-computation-card__result-value ${isRefund ? 'tax-computation-card__result--refund' : 'tax-computation-card__result--payable'}`}
        />
      </div>

      {/* Task 10.3: Regime Comparator Modal */}
      {showComparator && comparison && (
        <RegimeComparatorModal
          comparison={comparison}
          selectedRegime={selectedRegime}
          onSwitchRegime={(regime) => {
            onSwitchRegime?.(regime);
            setShowComparator(false);
          }}
          onClose={() => setShowComparator(false)}
        />
      )}
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
