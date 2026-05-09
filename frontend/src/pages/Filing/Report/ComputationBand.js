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
  const tdsCredit = c.tdsCredit || 0;
  const totalTax = c.totalTax || 0;
  const netPayable = totalTax - tdsCredit;
  const isRefund = netPayable < 0;

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
        <Row label="Less: Deductions" value={c.deductions} />
        <div className="fr-comp-divider" />
        <Row label="Taxable Income" value={c.taxableIncome} bold />
        <div className="fr-comp-divider" />
        <Row label="Tax on Income" value={c.taxOnIncome} />
        {c.rebate > 0 && <Row label="Less: Rebate u/s 87A" value={c.rebate} />}
        {c.surcharge > 0 && <Row label="Add: Surcharge" value={c.surcharge} />}
        <Row label="Add: Cess (4%)" value={c.cess} />
        <div className="fr-comp-divider" />
        <Row label="Total Tax" value={totalTax} bold />
        {tdsCredit > 0 && <Row label="Less: TDS" value={tdsCredit} />}
        <div className="fr-comp-divider--double" />
        <div className="fr-comp-row fr-comp-row--bold">
          <span>{isRefund ? 'REFUND' : 'TAX PAYABLE'}</span>
          <span className="fr-comp-result" style={{ ...MONO, color: isRefund ? 'var(--fr-success)' : 'var(--fr-error)' }}>
            ₹{Math.abs(netPayable).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
