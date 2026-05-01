import { useCallback } from 'react';
import useFilingStore from '../../store/useFilingStore';

const fmt = (v) => `₹${Math.round(Number(v) || 0).toLocaleString('en-IN')}`;

// eslint-disable-next-line no-unused-vars
export default function TaxBar({ filingId, filing }) {
  const { computation, selectedRegime, setSelectedRegime } = useFilingStore();
  const pickOld = useCallback(() => setSelectedRegime('old'), [setSelectedRegime]);
  const pickNew = useCallback(() => setSelectedRegime('new'), [setSelectedRegime]);

  const r = computation?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'];
  const alt = computation?.[selectedRegime === 'old' ? 'newRegime' : 'oldRegime'];
  const altLabel = selectedRegime === 'old' ? 'New Regime' : 'Old Regime';

  const savings = r && alt ? Math.round((Number(r.totalTax) || 0) - (Number(alt.totalTax) || 0)) : 0;

  if (!computation || !r) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.5, flex: 1 }}>
        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
          Fill data to see computation
        </p>
      </div>
    );
  }

  const netPayable = Number(r.netPayable) || 0;
  const isRefund = netPayable < 0;

  return (
    <>
      {/* Regime toggle */}
      <div className="regime-toggle">
        <button
          className={`regime-toggle__btn ${selectedRegime === 'old' ? 'regime-toggle__btn--active' : ''}`}
          onClick={pickOld}
        >
          Old
        </button>
        <button
          className={`regime-toggle__btn ${selectedRegime === 'new' ? 'regime-toggle__btn--active' : ''}`}
          onClick={pickNew}
        >
          New
        </button>
      </div>

      {/* Savings hint */}
      {savings > 0 && (
        <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--color-success, #16A34A)', fontWeight: 600 }}>
          Save {fmt(savings)} with {altLabel}
        </p>
      )}

      {/* Computation rows */}
      <Row label="Gross Income" value={fmt(r.grossTotalIncome)} />
      <Row label="Deductions" value={fmt(r.deductions)} />
      <Row label="Taxable Income" value={fmt(r.taxableIncome)} bold />
      <hr className="taxbar__divider" />
      <Row label="Tax on Income" value={fmt(r.taxOnIncome || r.incomeTax)} />
      <Row label="Surcharge" value={fmt(r.surcharge)} />
      <Row label="Cess" value={fmt(r.cess)} />
      <Row label="Total Tax" value={fmt(r.totalTax)} bold />
      <hr className="taxbar__divider" />
      <Row label="TDS Credit" value={fmt(r.tdsCredit)} />
      <hr className="taxbar__divider" />

      {/* Result */}
      <div
        className="taxbar__result"
        style={{ color: isRefund ? 'var(--color-success, #16A34A)' : 'var(--color-error, #DC2626)' }}
      >
        {isRefund ? 'Refund' : 'Net Payable'}: {fmt(Math.abs(netPayable))}
      </div>

      {/* Actions */}
      <div className="taxbar__actions">
        <button className="taxbar__btn">Download PDF</button>
        <button className="taxbar__btn">Download JSON</button>
        <button className="taxbar__btn taxbar__btn--primary">Submit Filing</button>
      </div>
    </>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="taxbar__row">
      <span className="taxbar__label">{label}</span>
      <span className="taxbar__value" style={bold ? { fontWeight: 700 } : undefined}>{value}</span>
    </div>
  );
}
