import { useState, useEffect } from 'react';
import { Download, Send, AlertCircle } from 'lucide-react';
import { validateBankAccount } from '../../../../utils/itrValidation';
import '../../filing-flow.css';

export default function BankEditor({ payload, onSave, isSaving, computation, filing, onSubmit, isSubmitting, bankData, setBankData, bankErrors, onDownloadJSON }) {
  // Init from filing payload (persisted data) or from parent state
  const saved = payload?.bankDetails || {};
  const [form, setForm] = useState({
    bankName: saved.bankName || bankData?.bankName || '',
    accountNumber: saved.accountNumber || bankData?.accountNumber || '',
    ifsc: saved.ifsc || bankData?.ifsc || '',
    accountType: saved.accountType || bankData?.accountType || 'SAVINGS',
  });
  const [errors, setErrors] = useState(bankErrors || {});

  // Sync if filing data changes
  useEffect(() => {
    const bd = payload?.bankDetails || {};
    if (bd.bankName || bd.accountNumber) {
      setForm(prev => ({
        bankName: bd.bankName || prev.bankName,
        accountNumber: bd.accountNumber || prev.accountNumber,
        ifsc: bd.ifsc || prev.ifsc,
        accountType: bd.accountType || prev.accountType,
      }));
    }
  }, [payload?.bankDetails]);

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    setBankData?.(next);
    // Validate on change
    const v = validateBankAccount(next);
    setErrors(v.valid ? {} : v.errors);
    onSave({ bankDetails: next });
  };

  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <div>
      <h2 className="step-title">Bank & Submit</h2>
      <p className="step-desc">Bank account for refund and final submission</p>

      <div className="step-card editing">
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">Bank Name *</label>
            <input className={`ff-input ${errors.bankName ? 'error' : ''}`} type="text" value={form.bankName} onChange={e => update('bankName', e.target.value)} placeholder="e.g., State Bank of India" />
            {errors.bankName && <div className="ff-hint" style={{ color: '#ef4444' }}>{errors.bankName}</div>}
          </div>
          <div className="ff-field">
            <label className="ff-label">Account Number *</label>
            <input className={`ff-input ${errors.accountNumber ? 'error' : ''}`} type="text" value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} placeholder="e.g., 1234567890" />
            {errors.accountNumber && <div className="ff-hint" style={{ color: '#ef4444' }}>{errors.accountNumber}</div>}
          </div>
        </div>
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">IFSC Code</label>
            <input className={`ff-input ${errors.ifsc ? 'error' : ''}`} type="text" value={form.ifsc} onChange={e => update('ifsc', e.target.value.toUpperCase())} placeholder="e.g., SBIN0001234" />
            {errors.ifsc && <div className="ff-hint" style={{ color: '#ef4444' }}>{errors.ifsc}</div>}
          </div>
          <div className="ff-field">
            <label className="ff-label">Account Type</label>
            <select className="ff-select" value={form.accountType} onChange={e => update('accountType', e.target.value)}>
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </select>
          </div>
        </div>
      </div>

      {hasErrors && (
        <div className="ff-errors">
          <div className="ff-errors-title"><AlertCircle size={14} /> Fix these before submitting</div>
          <ul>{Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {computation && (
        <div className="step-card summary">
          <div className="ff-section-title">Tax Computation Summary</div>
          {computation.income && <div className="ff-row"><span className="ff-row-label">Gross Total Income</span><span className="ff-row-value">{'\u20B9'}{(computation.income.grossTotal || 0).toLocaleString('en-IN')}</span></div>}
          {computation.recommended && (() => {
            const best = computation[computation.recommended === 'old' ? 'oldRegime' : 'newRegime'];
            return best ? (
              <>
                <div className="ff-row"><span className="ff-row-label">Deductions</span><span className="ff-row-value green">- {'\u20B9'}{(best.deductions || 0).toLocaleString('en-IN')}</span></div>
                <div className="ff-row"><span className="ff-row-label">Taxable Income</span><span className="ff-row-value bold">{'\u20B9'}{(best.taxableIncome || 0).toLocaleString('en-IN')}</span></div>
                <div className="ff-divider" />
                <div className="ff-row"><span className="ff-row-label">Total Tax ({computation.recommended})</span><span className="ff-row-value bold">{'\u20B9'}{(best.totalTax || 0).toLocaleString('en-IN')}</span></div>
                {computation.tds && <div className="ff-row"><span className="ff-row-label">TDS / Advance Tax</span><span className="ff-row-value green">{'\u20B9'}{(computation.tds.total || 0).toLocaleString('en-IN')}</span></div>}
                <div className="ff-divider" />
                <div className="ff-row">
                  <span className="ff-row-label">{best.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'}</span>
                  <span className={`ff-row-value bold ${best.netPayable <= 0 ? 'green' : 'red'}`}>{'\u20B9'}{Math.abs(best.netPayable || 0).toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : null;
          })()}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {onDownloadJSON && (
          <button className="ff-btn ff-btn-outline" onClick={onDownloadJSON}>
            <Download size={15} /> Download JSON
          </button>
        )}
        {onSubmit && (
          <button className="ff-btn ff-btn-primary" onClick={onSubmit} disabled={isSubmitting || hasErrors}>
            {isSubmitting ? <><span className="ff-spinner" /> Submitting...</> : <><Send size={15} /> Submit Filing</>}
          </button>
        )}
      </div>
    </div>
  );
}
