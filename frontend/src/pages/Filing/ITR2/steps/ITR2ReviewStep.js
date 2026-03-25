/**
 * Review & Submit Step — ITR-2
 * Same pattern as ITR-1 ReviewStep but calls ITR-2 endpoints
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Download, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { tokens } from '../../../../styles/tokens';
import toast from 'react-hot-toast';

const ITR2ReviewStep = ({ payload, filing, onBack, onCompute, computation, isComputing, onDownloadJSON, isSaving, itrType }) => {
  const navigate = useNavigate();
  const validateUrl = `/filings/${filing.id}/${itrType === 'ITR-3' ? 'itr3' : 'itr2'}/validate`;
  const [bank, setBank] = useState(payload?.bankAccount || { bankName: '', accountNumber: '', ifsc: '', accountType: 'SAVINGS' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (!computation) onCompute();
    api.get(validateUrl).then(r => setValidation(r.data.data)).catch(() => setValidation({ valid: false, errors: [{ message: 'Validation failed' }] }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    await api.put(`/filings/${filing.id}`, { jsonPayload: { ...payload, bankAccount: bank } }).catch(() => {});
    setIsSubmitting(true);
    try {
      await api.post(`/filings/${filing.id}/submit`);
      toast.success('Filing submitted!');
      navigate(`/filing/${filing.id}/submission-status`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setIsSubmitting(false); }
  };

  const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;
  const income = computation?.income;
  const regime = computation?.[payload?.selectedRegime === 'new' ? 'newRegime' : 'oldRegime'] || computation?.oldRegime;
  const tds = computation?.tds;
  const ftc = computation?.foreignTaxCredit;

  return (
    <div>
      <h2 style={styles.heading}>Review & Submit</h2>

      {validation && (
        <div style={{ ...styles.card, backgroundColor: validation.valid ? `${tokens.colors.success[600]}08` : `${tokens.colors.error[600]}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
            {validation.valid ? <CheckCircle size={20} color={tokens.colors.success[600]} /> : <AlertCircle size={20} color={tokens.colors.error[600]} />}
            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{validation.valid ? 'Ready to submit' : `${validation.errors.length} issue(s)`}</span>
          </div>
          {!validation.valid && <ul style={{ margin: '8px 0 0 28px', listStyle: 'disc' }}>{validation.errors.map((e, i) => <li key={i} style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.error[700] }}>{e.message}</li>)}</ul>}
        </div>
      )}

      {income && (
        <div style={styles.card}>
          <p style={styles.sectionTitle}>Income</p>
          <Row label="Salary" value={fmt(income.salary.netTaxable)} />
          <Row label="House Property" value={fmt(income.houseProperty.netIncome)} />
          <Row label="Capital Gains" value={fmt(income.capitalGains.totalTaxable)} />
          <Row label="Other Sources" value={fmt(income.otherSources.total)} />
          {income.foreignIncome.totalIncome > 0 && <Row label="Foreign Income" value={fmt(income.foreignIncome.totalIncome)} />}
          <Divider />
          <Row label="Gross Total" value={fmt(income.grossTotal)} bold />
        </div>
      )}

      {regime && (
        <div style={styles.card}>
          <p style={styles.sectionTitle}>Tax ({payload?.selectedRegime === 'new' ? 'New' : 'Old'} Regime)</p>
          <Row label="Total Tax" value={fmt(regime.totalTax)} bold />
          {tds && <Row label="TDS" value={`- ${fmt(tds.total)}`} color={tokens.colors.success[600]} />}
          {ftc?.credit > 0 && <Row label="Foreign Tax Credit" value={`- ${fmt(ftc.credit)}`} color={tokens.colors.success[600]} />}
          <Divider />
          {tds && <Row label={regime.totalTax > tds.total + (ftc?.credit || 0) ? 'Payable' : 'Refund'} value={fmt(Math.abs(regime.totalTax - tds.total - (ftc?.credit || 0)))} bold color={regime.totalTax > tds.total + (ftc?.credit || 0) ? tokens.colors.warning[600] : tokens.colors.success[600]} />}
        </div>
      )}

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Bank Account</p>
        <div style={styles.grid2}>
          <Field label="Bank Name" value={bank.bankName} onChange={v => setBank({ ...bank, bankName: v })} />
          <Field label="Account Number" value={bank.accountNumber} onChange={v => setBank({ ...bank, accountNumber: v })} />
          <Field label="IFSC" value={bank.ifsc} onChange={v => setBank({ ...bank, ifsc: v.toUpperCase() })} />
          <div><label style={styles.label}>Type</label><select value={bank.accountType} onChange={e => setBank({ ...bank, accountType: e.target.value })} style={styles.input}><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select></div>
        </div>
      </div>

      <div style={styles.nav}>
        <button onClick={onBack} style={styles.outlineBtn}><ArrowLeft size={16} /> Back</button>
        <div style={{ flex: 1 }} />
        <button onClick={onDownloadJSON} style={styles.outlineBtn}><Download size={16} /> JSON</button>
        <button onClick={handleSubmit} disabled={isSubmitting || (validation && !validation.valid)} style={{ ...styles.primaryBtn, opacity: validation && !validation.valid ? 0.5 : 1 }}>
          {isSubmitting ? <><Loader2 size={16} /> Submitting...</> : <><Send size={16} /> Submit</>}
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold, color }) => (<div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>{label}</span><span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: bold ? tokens.typography.fontWeight.semibold : 'normal', color: color || tokens.colors.neutral[900] }}>{value}</span></div>);
const Divider = () => <div style={{ borderTop: `1px solid ${tokens.colors.neutral[200]}`, margin: '6px 0' }} />;
const Field = ({ label, value, onChange }) => (<div style={{ marginBottom: tokens.spacing.sm }}><label style={styles.label}>{label}</label><input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={styles.input} /></div>);

const styles = {
  heading: { fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.lg },
  card: { padding: tokens.spacing.lg, backgroundColor: tokens.colors.neutral.white, border: `1px solid ${tokens.colors.neutral[200]}`, borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.md },
  sectionTitle: { fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.sm },
  label: { display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[700], marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: `1px solid ${tokens.colors.neutral[300]}`, borderRadius: tokens.borderRadius.md, fontSize: tokens.typography.fontSize.base, boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: tokens.colors.accent[600], color: '#fff', border: 'none', borderRadius: tokens.borderRadius.md, fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.medium, cursor: 'pointer' },
  outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: 'transparent', color: tokens.colors.neutral[700], border: `1px solid ${tokens.colors.neutral[300]}`, borderRadius: tokens.borderRadius.md, fontSize: tokens.typography.fontSize.base, cursor: 'pointer' },
  nav: { display: 'flex', gap: tokens.spacing.md, marginTop: tokens.spacing.xl, paddingTop: tokens.spacing.lg, borderTop: `1px solid ${tokens.colors.neutral[200]}` },
};

export default ITR2ReviewStep;
