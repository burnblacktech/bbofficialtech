/**
 * SummaryCards — 4-up metric cards showing key filing numbers.
 */
const fmt = (v) => `₹${Math.round(Math.abs(Number(v) || 0)).toLocaleString('en-IN')}`;

export default function SummaryCards({ computation, selectedRegime, tds }) {
  const r = computation?.[selectedRegime === 'old' ? 'oldRegime' : 'newRegime'];

  const cards = [
    { label: 'Gross Income', value: r?.grossTotalIncome, variant: '' },
    { label: 'Deductions', value: r?.deductions, variant: 'success' },
    { label: 'TDS Paid', value: tds?.total || r?.tdsCredit, variant: 'muted' },
    { label: 'Taxable Income', value: r?.taxableIncome, variant: 'brand' },
  ];

  return (
    <div className="summary-cards">
      {cards.map((c) => (
        <div key={c.label} className={`summary-cards__card summary-cards__card--${c.variant}`}>
          <div className="summary-cards__label">{c.label}</div>
          <div className="summary-cards__value">{fmt(c.value)}</div>
        </div>
      ))}
    </div>
  );
}
