/**
 * Tax Summary Step — ITR-2
 * Extends ITR-1 summary with capital gains special rates and foreign tax credit
 */

import React, { useEffect } from 'react';
import { ArrowRight, ArrowLeft, TrendingDown, TrendingUp, CheckCircle } from 'lucide-react';
import { tokens } from '../../../../styles/tokens';

const ITR2TaxSummaryStep = ({ payload, filing, onSave, onBack, onCompute, computation, isComputing, isSaving }) => {
  useEffect(() => { onCompute(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isComputing || !computation) {
    return <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}><p style={{ color: tokens.colors.neutral[600] }}>Computing your tax...</p></div>;
  }

  const { income, oldRegime, newRegime, tds, foreignTaxCredit, recommended, savings } = computation;
  const selected = payload?.selectedRegime || recommended;
  const handleNext = () => onSave({ selectedRegime: selected });
  const fmt = (v) => `₹${Math.abs(v || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <h2 style={styles.heading}>Tax Summary</h2>

      {/* Income Summary */}
      <div style={styles.card}>
        <p style={styles.sectionTitle}>Income Summary</p>
        <Row label="Salary" value={fmt(income.salary.netTaxable)} />
        <Row label="House Property" value={fmt(income.houseProperty.netIncome)} color={income.houseProperty.netIncome < 0 ? tokens.colors.success[600] : undefined} />
        {income.capitalGains.stcg.total > 0 && <Row label="STCG" value={fmt(income.capitalGains.stcg.total)} />}
        {income.capitalGains.ltcg.total > 0 && <Row label="LTCG" value={fmt(income.capitalGains.ltcg.total)} />}
        <Row label="Other Sources" value={fmt(income.otherSources.total)} />
        {income.foreignIncome.totalIncome > 0 && <Row label="Foreign Income" value={fmt(income.foreignIncome.totalIncome)} />}
        <Divider />
        <Row label="Gross Total Income" value={fmt(income.grossTotal)} bold />
      </div>

      {/* Regime Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
        <RegimeCard regime={oldRegime} label="Old Regime" isRec={recommended === 'old'} tds={tds} ftc={foreignTaxCredit} />
        <RegimeCard regime={newRegime} label="New Regime" isRec={recommended === 'new'} tds={tds} ftc={foreignTaxCredit} />
      </div>

      {/* Recommendation */}
      <div style={{ ...styles.card, backgroundColor: `${tokens.colors.success[600]}08`, border: `1px solid ${tokens.colors.success[200]}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <CheckCircle size={20} color={tokens.colors.success[600]} />
          <p style={{ fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[900] }}>
            {recommended === 'old' ? 'Old' : 'New'} Regime saves you {fmt(savings)}
          </p>
        </div>
      </div>

      {/* Net Result */}
      {(() => {
        const r = recommended === 'old' ? oldRegime : newRegime;
        const net = r.totalTax - tds.total - foreignTaxCredit.credit;
        return (
          <div style={{ ...styles.card, backgroundColor: net <= 0 ? `${tokens.colors.success[600]}08` : `${tokens.colors.warning[600]}08` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                {net <= 0 ? <TrendingDown size={24} color={tokens.colors.success[600]} /> : <TrendingUp size={24} color={tokens.colors.warning[600]} />}
                <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{net <= 0 ? 'Refund Due' : 'Tax Payable'}</span>
              </div>
              <span style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: net <= 0 ? tokens.colors.success[600] : tokens.colors.warning[600] }}>{fmt(Math.abs(net))}</span>
            </div>
          </div>
        );
      })()}

      <div style={styles.nav}>
        <button onClick={onBack} style={styles.outlineBtn}><ArrowLeft size={16} /> Back</button>
        <div style={{ flex: 1 }} />
        <button onClick={handleNext} disabled={isSaving} style={styles.primaryBtn}>{isSaving ? 'Saving...' : 'Next: Review'} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};

const RegimeCard = ({ regime, label, isRec, tds, ftc }) => {
  const net = regime.totalTax - tds.total - ftc.credit;
  return (
    <div style={{ padding: tokens.spacing.lg, backgroundColor: tokens.colors.neutral.white, borderRadius: tokens.borderRadius.lg, border: isRec ? `2px solid ${tokens.colors.accent[600]}` : `1px solid ${tokens.colors.neutral[200]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
        <p style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{label}</p>
        {isRec && <span style={{ fontSize: tokens.typography.fontSize.xs, backgroundColor: tokens.colors.accent[100], color: tokens.colors.accent[700], padding: '2px 8px', borderRadius: '12px' }}>Recommended</span>}
      </div>
      <Row label="Normal Income Tax" value={`₹${(regime.normalTax || regime.taxOnIncome || 0).toLocaleString('en-IN')}`} />
      {regime.stcgEquityTax > 0 && <Row label="STCG Equity (20%)" value={`₹${regime.stcgEquityTax.toLocaleString('en-IN')}`} small />}
      {regime.ltcgEquityTax > 0 && <Row label="LTCG Equity (12.5%)" value={`₹${regime.ltcgEquityTax.toLocaleString('en-IN')}`} small />}
      {regime.ltcgOtherTax > 0 && <Row label="LTCG Other (20%)" value={`₹${regime.ltcgOtherTax.toLocaleString('en-IN')}`} small />}
      {regime.rebate > 0 && <Row label="Rebate 87A" value={`- ₹${regime.rebate.toLocaleString('en-IN')}`} color={tokens.colors.success[600]} />}
      <Row label="Cess (4%)" value={`₹${regime.cess.toLocaleString('en-IN')}`} />
      <Divider />
      <Row label="Total Tax" value={`₹${regime.totalTax.toLocaleString('en-IN')}`} bold />
      <Row label={net <= 0 ? 'Refund' : 'Payable'} value={`₹${Math.abs(net).toLocaleString('en-IN')}`} bold color={net <= 0 ? tokens.colors.success[600] : tokens.colors.warning[600]} />
    </div>
  );
};

const Row = ({ label, value, bold, color, small }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: small ? tokens.typography.fontSize.xs : tokens.typography.fontSize.sm }}>
    <span style={{ color: tokens.colors.neutral[600] }}>{label}</span>
    <span style={{ fontWeight: bold ? tokens.typography.fontWeight.semibold : 'normal', color: color || tokens.colors.neutral[900] }}>{value}</span>
  </div>
);
const Divider = () => <div style={{ borderTop: `1px solid ${tokens.colors.neutral[200]}`, margin: '6px 0' }} />;

const styles = {
  heading: { fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.lg },
  card: { padding: tokens.spacing.lg, backgroundColor: tokens.colors.neutral.white, border: `1px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.md },
  sectionTitle: { fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.sm },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: tokens.colors.accent[600], color: '#fff', border: 'none', borderRadius: tokens.borderRadius.md, fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.medium, cursor: 'pointer' },
  outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: 'transparent', color: tokens.colors.neutral[700], border: `1px solid ${tokens.colors.neutral[300]}`, borderRadius: tokens.borderRadius.md, fontSize: tokens.typography.fontSize.base, cursor: 'pointer' },
  nav: { display: 'flex', gap: tokens.spacing.md, marginTop: tokens.spacing.xl, paddingTop: tokens.spacing.lg, borderTop: `1px solid ${tokens.colors.neutral[200]}` },
};

export default ITR2TaxSummaryStep;
