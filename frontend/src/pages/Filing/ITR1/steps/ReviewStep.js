/**
 * Review & Submit Step — ITR-1 (Clean UI)
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Download, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import { validateBankAccount } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

const ReviewStep = ({ payload, filing, onBack, onCompute, computation, isComputing, onDownloadJSON, itrType }) => {
  const navigate = useNavigate();
  const validateUrl = `/filings/${filing.id}/${itrType === 'ITR-4' ? 'itr4' : 'itr1'}/validate`;
  const [bank, setBank] = useState(payload?.bankAccount || { bankName: '', accountNumber: '', ifsc: '', accountType: 'SAVINGS' });
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState(null);
  const [bankErrors, setBankErrors] = useState({});

  useEffect(() => {
    if (!computation) onCompute();
    api.get(validateUrl).then(r => setValidation(r.data.data)).catch(() => setValidation({ valid: false, errors: [{ message: 'Validation failed' }] }));
  }, []); // eslint-disable-line

  const handleSubmit = async () => {
    const bv = validateBankAccount(bank); setBankErrors(bv.errors);
    if (!bv.valid) return;
    await api.put(`/filings/${filing.id}`, { jsonPayload: { ...payload, bankAccount: bank } }).catch(() => {});
    setSubmitting(true);
    try { await api.post(`/filings/${filing.id}/submit`); toast.success('Filed!'); navigate(`/filing/${filing.id}/submission-status`); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const income = computation?.income;
  const regime = computation?.[payload?.selectedRegime === 'new' ? 'newRegime' : 'oldRegime'] || computation?.oldRegime;
  const tds = computation?.tds;

  return (
    <div>
      <h2 className="step-title">Review & Submit</h2>

      {validation && (
        <div className={`step-card ${validation.valid ? 'success' : 'error'}`}>
          {validation.valid ? <><CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />Ready to submit</> : <><AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />{validation.errors.length} issue(s)<ul style={{ margin: '6px 0 0 22px', listStyle: 'disc' }}>{validation.errors.map((e, i) => <li key={i} style={{ fontSize: 13 }}>{e.message}</li>)}</ul></>}
        </div>
      )}

      {income && <div className="step-card"><div className="ff-section-title">Income</div><R l="Salary" v={fmt(income.salary.netTaxable)} /><R l="House Property" v={fmt(income.houseProperty.netIncome)} /><R l="Other" v={fmt(income.otherSources.total)} /><div className="ff-divider" /><R l="Gross Total" v={fmt(income.grossTotal)} b /></div>}

      {regime && <div className="step-card"><div className="ff-section-title">Tax ({payload?.selectedRegime === 'new' ? 'New' : 'Old'} Regime)</div><R l="Total Tax" v={fmt(regime.totalTax)} b />{tds && <R l="TDS" v={`- ${fmt(tds.total)}`} g />}<div className="ff-divider" />{tds && <R l={regime.totalTax > tds.total ? 'Payable' : 'Refund'} v={fmt(Math.abs(regime.totalTax - tds.total))} b g={regime.totalTax <= tds.total} r={regime.totalTax > tds.total} />}</div>}

      <div className="step-card">
        <div className="ff-section-title">Bank Account (for refund)</div>
        <div className="ff-grid-2">
          <F l="Bank Name" v={bank.bankName} c={v => setBank({ ...bank, bankName: v })} e={bankErrors.bankName} />
          <F l="Account Number" v={bank.accountNumber} c={v => setBank({ ...bank, accountNumber: v })} e={bankErrors.accountNumber} />
          <F l="IFSC Code" v={bank.ifsc} c={v => setBank({ ...bank, ifsc: v.toUpperCase() })} e={bankErrors.ifsc} />
          <div className="ff-field"><label className="ff-label">Type</label><select className="ff-select" value={bank.accountType} onChange={e => setBank({ ...bank, accountType: e.target.value })}><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select></div>
        </div>
      </div>

      <div className="ff-nav">
        <button className="ff-btn ff-btn-outline" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div className="spacer" />
        <button className="ff-btn ff-btn-outline" onClick={onDownloadJSON}><Download size={15} /> JSON</button>
        <button className="ff-btn ff-btn-primary" onClick={handleSubmit} disabled={submitting || (validation && !validation.valid)} style={{ opacity: validation && !validation.valid ? 0.5 : 1 }}>
          {submitting ? <><Loader2 size={15} /> Submitting...</> : <><Send size={15} /> Submit</>}
        </button>
      </div>
    </div>
  );
};

const R = ({ l, v, b, g, r }) => (<div className="ff-row"><span className="ff-row-label">{l}</span><span className={`ff-row-value ${b ? 'bold' : ''} ${g ? 'green' : ''} ${r ? 'red' : ''}`}>{v}</span></div>);
const F = ({ l, v, c, e }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className={`ff-input ${e ? 'error' : ''}`} value={v || ''} onChange={ev => c(ev.target.value)} />{e && <div className="ff-hint" style={{ color: '#ef4444' }}>{e}</div>}</div>);

export default ReviewStep;
