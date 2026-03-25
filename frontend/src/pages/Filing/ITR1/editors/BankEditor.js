import { useState } from 'react';
import { Download, Send } from 'lucide-react';
import '../../filing-flow.css';

export default function BankEditor({ payload, onSave, isSaving, computation, filing, onSubmit, isSubmitting, bankData, setBankData, bankErrors, onDownloadJSON }) {
  const [form, setForm] = useState({
    bankName: bankData?.bankName || '',
    accountNumber: bankData?.accountNumber || '',
    ifsc: bankData?.ifsc || '',
    accountType: bankData?.accountType || 'savings',
  });

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    setBankData?.(next);
    onSave({ bankDetails: next });
  };

  const hasErrors = bankErrors && Object.keys(bankErrors).length > 0;

  return (
    <div>
      <h2 className="step-title">Bank & Submit</h2>
      <p className="step-desc">Bank account for refund and final submission</p>

      <div className="step-card editing">
        <div className="ff-grid-2">
          <F l="Bank Name *" v={form.bankName} c={v => update('bankName', v)} t="text" />
          <F l="Account Number *" v={form.accountNumber} c={v => update('accountNumber', v)} t="text" />
        </div>
        <div className="ff-grid-2">
          <F l="IFSC Code *" v={form.ifsc} c={v => update('ifsc', v.toUpperCase())} t="text" />
          <div className="ff-field">
            <label className="ff-label">Account Type</label>
            <select className="ff-select" value={form.accountType} onChange={e => update('accountType', e.target.value)}>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
        </div>
      </div>

      {hasErrors && (
        <div className="ff-errors">
          <div className="ff-errors-title">Validation Errors</div>
          <ul>{Object.values(bankErrors).map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {computation && (
        <div className="step-card summary">
          <div className="ff-section-title">Tax Computation Summary</div>
          <div className="ff-row"><span className="ff-row-label">Gross Total Income</span><span className="ff-row-value">₹{(computation.grossTotalIncome || 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-row"><span className="ff-row-label">Deductions</span><span className="ff-row-value green">- ₹{(computation.totalDeductions || 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-row"><span className="ff-row-label">Taxable Income</span><span className="ff-row-value bold">₹{(computation.taxableIncome || 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-divider" />
          <div className="ff-row"><span className="ff-row-label">Tax Payable</span><span className="ff-row-value bold">₹{(computation.totalTax || 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-row"><span className="ff-row-label">TDS / Advance Tax</span><span className="ff-row-value green">₹{(computation.tdsTotal || 0).toLocaleString('en-IN')}</span></div>
          <div className="ff-divider" />
          {(computation.refund || 0) > 0
            ? <div className="ff-row"><span className="ff-row-label">Refund Due</span><span className="ff-row-value bold green">₹{computation.refund.toLocaleString('en-IN')}</span></div>
            : <div className="ff-row"><span className="ff-row-label">Tax Due</span><span className="ff-row-value bold red">₹{(computation.balanceTax || 0).toLocaleString('en-IN')}</span></div>
          }
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

const F = ({ l, v, c, h, t = 'number' }) => (<div className="ff-field"><label className="ff-label">{l}</label><input className="ff-input" type={t} value={v || ''} onChange={e => c(e.target.value)} placeholder="0" />{h && <div className="ff-hint">{h}</div>}</div>);
