import React from 'react';

const MONO = { fontFamily: "'DM Mono', monospace" };

function Row({ label, value, bold }) {
  return (
    <div className={`fr-comp-row ${bold ? 'fr-comp-row--bold' : ''}`}>
      <span className="fr-comp-row--label">{label}</span>
      <span className="fr-comp-row--value" style={MONO}>₹{(value || 0).toLocaleString('en-IN')}</span>
    </div>
  );
}

export default function ComputationBand({ computation, regime, onRegimeChange }) {
  const c = computation || {};
  const resultAmt = Math.abs(c.taxPayable ?? c.refund ?? 0);
  const isRefund = (c.refund && c.refund > 0) || (c.taxPayable && c.taxPayable < 0);

  return (
    <div className="fr-band" id="computation">
      <div className="fr-band__header">
        <span className="fr-band__title">Tax Computation</span>
        <div className="fr-regime-toggle">
          <button className={`fr-regime-btn ${regime === 'old' ? 'fr-regime-btn--active' : ''}`} onClick={() => onRegimeChange('old')}>Old</button>
          <button className={`fr-regime-btn ${regime === 'new' ? 'fr-regime-btn--active' : ''}`} onClick={() => onRegimeChange('new')}>New</button>
        </div>
      </div>
      <div className="fr-computation">
        <Row label="Gross Total Income" value={c.grossTotalIncome} />
        <Row label="Less: Deductions" value={c.totalDeductions} />
        <div className="fr-comp-divider" />
        <Row label="Total Taxable Income" value={c.totalTaxableIncome} bold />
        <div className="fr-comp-divider" />
        <Row label="Tax on Total Income" value={c.taxOnIncome} />
        <Row label="Add: Surcharge" value={c.surcharge} />
        <Row label="Add: Health & Education Cess (4%)" value={c.cess} />
        <div className="fr-comp-divider" />
        <Row label="Total Tax Liability" value={c.totalTaxLiability} bold />
        <Row label="Less: TDS / Advance Tax" value={c.totalTaxPaid} />
        <div className="fr-comp-divider--double" />
        <div className="fr-comp-row fr-comp-row--bold">
          <span>{isRefund ? 'Refund' : 'Tax Payable'}</span>
          <span className="fr-comp-result" style={{ ...MONO, color: isRefund ? 'var(--fr-success)' : 'var(--fr-error)' }}>
            ₹{resultAmt.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      {c.comparison && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fr-muted)', textAlign: 'center' }}>
          {c.comparison.betterRegime === regime
            ? `You save ₹${(c.comparison.savings || 0).toLocaleString('en-IN')} with ${regime} regime`
            : `Switch to ${c.comparison.betterRegime} regime to save ₹${(c.comparison.savings || 0).toLocaleString('en-IN')}`}
        </div>
      )}
    </div>
  );
}
