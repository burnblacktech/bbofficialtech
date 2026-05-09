/**
 * FormulaBar — Live tax computation equation strip.
 * Shows: GROSS − DEDUCTIONS = TAXABLE → TAX + CESS − TDS = REFUND/PAYABLE
 */
const fmt = (v) => `₹${Math.round(Math.abs(Number(v) || 0)).toLocaleString('en-IN')}`;

export default function FormulaBar({ computation, selectedRegime }) {
  const r = computation?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'];
  if (!r) return null;

  const net = Number(r.netPayable) || 0;
  const isRefund = net < 0;

  return (
    <div className="formula-bar">
      <div className="formula-bar__label">TAX</div>
      <div className="formula-bar__equation">
        <span className="formula-bar__val">{fmt(r.grossTotalIncome)}</span>
        <span className="formula-bar__op">−</span>
        <span className="formula-bar__val">{fmt(r.deductions)}</span>
        <span className="formula-bar__op">=</span>
        <span className="formula-bar__val formula-bar__val--highlight">{fmt(r.taxableIncome)}</span>
        <span className="formula-bar__op">→</span>
        <span className="formula-bar__val">{fmt(r.totalTax)}</span>
        <span className="formula-bar__op">−</span>
        <span className="formula-bar__val">{fmt(r.tdsCredit)}</span>
        <span className="formula-bar__op">=</span>
        <span className={`formula-bar__result ${isRefund ? 'refund' : 'payable'}`}>
          {fmt(net)} {isRefund ? 'REFUND' : 'PAYABLE'}
        </span>
      </div>
      <div className="formula-bar__regime">{selectedRegime === 'old' ? 'OLD' : 'NEW'} REGIME</div>
    </div>
  );
}
