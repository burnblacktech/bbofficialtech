import React, { useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import '../../filing-flow.css';

const fmt = (v) => `₹${Math.abs(v || 0).toLocaleString('en-IN')}`;

const TaxSummaryStep = ({ payload, onSave, onBack, onCompute, computation, isComputing, isSaving }) => {
  useEffect(() => { onCompute(); }, []);

  if (isComputing || !computation) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Computing tax...</div>;

  const { income, oldRegime, newRegime, tds, recommended, savings } = computation;

  return (
    <div>
      <h2 className="step-title">Tax Summary</h2>

      <div className="step-card">
        <div className="ff-section-title">Income</div>
        {income.salary?.netTaxable > 0 && <R l="Salary" v={fmt(income.salary.netTaxable)} />}
        {income.presumptive?.totalIncome > 0 && <R l="Presumptive Business" v={fmt(income.presumptive.totalIncome)} />}
        {income.houseProperty && income.houseProperty.netIncome !== 0 && <R l="House Property" v={fmt(income.houseProperty.netIncome)} g={income.houseProperty.netIncome < 0} />}
        {income.otherSources?.total > 0 && <R l="Other Sources" v={fmt(income.otherSources.total)} />}
        <div className="ff-divider" />
        <R l="Gross Total Income" v={fmt(income.grossTotal)} b />
      </div>

      <div className="ff-grid-2" style={{ marginBottom: 12 }}>
        <RegimeCard r={oldRegime} label="Old Regime" rec={recommended === 'old'} tds={tds} />
        <RegimeCard r={newRegime} label="New Regime" rec={recommended === 'new'} tds={tds} />
      </div>

      <div className="step-card success">
        <CheckCircle size={16} style={{ display: 'inline', marginRight: 6, color: '#16a34a' }} />
        <strong>{recommended === 'old' ? 'Old' : 'New'} Regime saves {fmt(savings)}</strong>
      </div>

      {tds && tds.total > 0 && (
        <div className="step-card summary">
          <div className="ff-section-title">Taxes Paid</div>
          {tds.fromSalary > 0 && <R l="TDS Salary" v={fmt(tds.fromSalary)} />}
          {tds.fromFD > 0 && <R l="TDS FD" v={fmt(tds.fromFD)} />}
          <div className="ff-divider" />
          <R l="Total Paid" v={fmt(tds.total)} b />
        </div>
      )}

      {(() => {
        const net = (recommended === 'old' ? oldRegime : newRegime).totalTax - (tds?.total || 0);
        return <div className={`step-card ${net <= 0 ? 'success' : 'error'}`}>
          <R l={net <= 0 ? 'Refund Due' : 'Tax Payable'} v={fmt(Math.abs(net))} b g={net <= 0} r={net > 0} />
        </div>;
      })()}

      <div className="ff-nav">
        <button className="ff-btn ff-btn-outline" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div className="spacer" />
        <button className="ff-btn ff-btn-primary" onClick={() => onSave({ selectedRegime: recommended })} disabled={isSaving}>{isSaving ? 'Saving...' : 'Next: Review'} <ArrowRight size={15} /></button>
      </div>
    </div>
  );
};

const RegimeCard = ({ r, label, rec, tds }) => {
  const net = r.totalTax - (tds?.total || 0);
  return (
    <div className="step-card" style={rec ? { borderColor: '#2563eb', borderWidth: 2 } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        {rec && <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12 }}>Recommended</span>}
      </div>
      <R l="Deductions" v={fmt(r.deductions)} />
      <R l="Taxable Income" v={fmt(r.taxableIncome)} />
      <R l="Tax" v={fmt(r.taxOnIncome)} />
      {r.rebate > 0 && <R l="Rebate 87A" v={`- ${fmt(r.rebate)}`} g />}
      <R l="Cess 4%" v={fmt(r.cess)} />
      <div className="ff-divider" />
      <R l="Total Tax" v={fmt(r.totalTax)} b />
      <R l={net <= 0 ? 'Refund' : 'Payable'} v={fmt(Math.abs(net))} b g={net <= 0} r={net > 0} />
    </div>
  );
};

const R = ({ l, v, b, g, r }) => (
  <div className="ff-row">
    <span className="ff-row-label">{l}</span>
    <span className={`ff-row-value ${b ? 'bold' : ''} ${g ? 'green' : ''} ${r ? 'red' : ''}`}>{v}</span>
  </div>
);

export default TaxSummaryStep;
