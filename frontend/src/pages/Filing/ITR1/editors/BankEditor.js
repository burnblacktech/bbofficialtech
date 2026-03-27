import { useState, useEffect, useCallback } from 'react';
import { Download, Save, CheckCircle, ExternalLink, Shield, Info, Plus, Trash2 } from 'lucide-react';
import { validateBankAccount } from '../../../../utils/itrValidation';
import P from '../../../../styles/palette';
import '../../filing-flow.css';

const num = (v) => Number(v) || 0;
const fmt = (v) => `₹${num(v).toLocaleString('en-IN')}`;

const EMPTY_CHALLAN = { bsrCode: '', challanNo: '', dateOfDeposit: '', amount: '' };

export default function BankEditor({ payload, onSave, isSaving, computation, filing, onSubmit, isSubmitting, bankData, setBankData, bankErrors, onDownloadJSON, itrType }) {
  const saved = payload?.bankDetails || {};
  const [form, setForm] = useState({
    bankName: saved.bankName || bankData?.bankName || '',
    accountNumber: saved.accountNumber || bankData?.accountNumber || '',
    ifsc: saved.ifsc || bankData?.ifsc || '',
    accountType: saved.accountType || bankData?.accountType || 'SAVINGS',
  });
  const [errors, setErrors] = useState(bankErrors || {});
  const [dirty, setDirty] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Taxes paid state
  const savedTaxes = payload?.taxes || {};
  const [tdsFromFD, setTdsFromFD] = useState(num(savedTaxes.tds?.fromFD));
  const [tdsFromOther, setTdsFromOther] = useState(num(savedTaxes.tds?.fromOther));
  const [advanceEntries, setAdvanceEntries] = useState(savedTaxes.advanceTaxEntries?.length ? savedTaxes.advanceTaxEntries : []);
  const [satEntries, setSatEntries] = useState(savedTaxes.selfAssessmentTaxEntries?.length ? savedTaxes.selfAssessmentTaxEntries : []);
  const [taxDirty, setTaxDirty] = useState(false);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    const bd = payload?.bankDetails || {};
    if (bd.bankName || bd.accountNumber) setForm({ bankName: bd.bankName || '', accountNumber: bd.accountNumber || '', ifsc: bd.ifsc || '', accountType: bd.accountType || 'SAVINGS' });
    const tx = payload?.taxes || {};
    setTdsFromFD(num(tx.tds?.fromFD));
    setTdsFromOther(num(tx.tds?.fromOther));
    if (tx.advanceTaxEntries?.length) setAdvanceEntries(tx.advanceTaxEntries);
    if (tx.selfAssessmentTaxEntries?.length) setSatEntries(tx.selfAssessmentTaxEntries);
    setInitialized(true);
  }, [payload?.bankDetails, payload?.taxes]); // eslint-disable-line

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setBankData?.(prev => ({ ...prev, [key]: val }));
    setDirty(true);
    const next = { ...form, [key]: val };
    setErrors(validateBankAccount(next).valid ? {} : validateBankAccount(next).errors);
  };

  const handleSave = () => {
    const v = validateBankAccount(form);
    setErrors(v.valid ? {} : v.errors);
    onSave({ bankDetails: form });
    setDirty(false);
  };

  // Taxes paid save
  const advanceTotal = advanceEntries.reduce((s, e) => s + num(e.amount), 0);
  const satTotal = satEntries.reduce((s, e) => s + num(e.amount), 0);

  const handleSaveTaxes = useCallback(() => {
    onSave({
      taxes: {
        tds: { ...(payload?.taxes?.tds || {}), fromFD: num(tdsFromFD), fromOther: num(tdsFromOther) },
        advanceTax: advanceTotal,
        selfAssessmentTax: satTotal,
        advanceTaxEntries: advanceEntries.filter(e => num(e.amount) > 0),
        selfAssessmentTaxEntries: satEntries.filter(e => num(e.amount) > 0),
      },
    });
    setTaxDirty(false);
  }, [tdsFromFD, tdsFromOther, advanceEntries, satEntries, advanceTotal, satTotal, onSave, payload?.taxes?.tds]);

  const updateChallan = (list, setList, idx, field, val) => {
    setList(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
    setTaxDirty(true);
  };

  const handleDownload = () => {
    onDownloadJSON?.();
    setDownloaded(true);
  };

  const hasErrors = errors && Object.keys(errors).length > 0;
  const best = computation?.[computation?.recommended === 'old' ? 'oldRegime' : 'newRegime'];

  // Readiness checks
  const grossTotal = computation?.income?.grossTotal || 0;
  const incomeWithinLimit = !((itrType === 'ITR-1' || itrType === 'ITR-4') && grossTotal > 5000000);
  const checks = [
    { label: 'Income sources entered', ok: grossTotal > 0 },
    { label: 'Tax computed', ok: !!best },
    { label: 'Income within ITR limit', ok: incomeWithinLimit, warn: !incomeWithinLimit ? `₹${grossTotal.toLocaleString('en-IN')} exceeds ₹50L limit for ${itrType || 'ITR-1'}` : null },
    { label: 'Bank details saved', ok: !!(payload?.bankDetails?.bankName && payload?.bankDetails?.accountNumber) },
    { label: 'No validation errors', ok: !hasErrors },
  ];
  const allReady = checks.every(c => c.ok);

  return (
    <div>
      <h2 className="step-title">Review & Submit</h2>
      <p className="step-desc">Verify your details, download JSON, and submit to the Income Tax Department</p>

      {/* Bank Details */}
      <div className="step-card editing">
        <div className="ff-section-title">Bank Account for Refund</div>
        <div className="ff-hint" style={{ marginBottom: 12, marginTop: -8 }}>If you're due a refund, it will be credited to this account. Use the same account linked to your PAN.</div>
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">Bank Name *</label>
            <input className={`ff-input ${errors.bankName ? 'error' : ''}`} type="text" value={form.bankName} onChange={e => update('bankName', e.target.value)} placeholder="e.g., State Bank of India" />
            {errors.bankName ? <div className="ff-hint" style={{ color: P.error }}>{errors.bankName}</div> : <div className="ff-hint">As printed on your cheque book or passbook</div>}
          </div>
          <div className="ff-field">
            <label className="ff-label">Account Number *</label>
            <input className={`ff-input ${errors.accountNumber ? 'error' : ''}`} type="text" value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} placeholder="e.g., 1234567890" />
            {errors.accountNumber ? <div className="ff-hint" style={{ color: P.error }}>{errors.accountNumber}</div> : <div className="ff-hint">Your savings or current account number</div>}
          </div>
        </div>
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">IFSC Code</label>
            <input className={`ff-input ${errors.ifsc ? 'error' : ''}`} type="text" value={form.ifsc} onChange={e => update('ifsc', e.target.value.toUpperCase())} placeholder="e.g., SBIN0001234" />
            {errors.ifsc ? <div className="ff-hint" style={{ color: P.error }}>{errors.ifsc}</div> : <div className="ff-hint">11-character code on your cheque leaf or bank website</div>}
          </div>
          <div className="ff-field">
            <label className="ff-label">Account Type</label>
            <select className="ff-select" value={form.accountType} onChange={e => update('accountType', e.target.value)}>
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </select>
          </div>
        </div>
        {dirty && (
          <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={isSaving} style={{ marginTop: 8 }}>
            {isSaving ? 'Saving...' : <><Save size={14} /> Save Bank Details</>}
          </button>
        )}
      </div>

      {/* Taxes Paid */}
      <div className="step-card editing">
        <div className="ff-section-title">Taxes Already Paid</div>
        <div className="ff-hint" style={{ marginBottom: 12, marginTop: -8 }}>
          Enter TDS from sources other than salary, advance tax, and self-assessment tax paid during the year. These reduce your final tax liability.
        </div>

        {/* TDS from non-salary sources */}
        <div className="ff-grid-2">
          <div className="ff-field">
            <label className="ff-label">TDS on Fixed Deposits</label>
            <input className="ff-input" type="number" min="0" value={tdsFromFD || ''} onChange={e => { setTdsFromFD(num(e.target.value)); setTaxDirty(true); }} placeholder="0" />
            <div className="ff-hint">TDS deducted by bank on FD interest (Section 194A)</div>
          </div>
          <div className="ff-field">
            <label className="ff-label">TDS from Other Sources</label>
            <input className="ff-input" type="number" min="0" value={tdsFromOther || ''} onChange={e => { setTdsFromOther(num(e.target.value)); setTaxDirty(true); }} placeholder="0" />
            <div className="ff-hint">TDS on rent, professional fees, commission, etc.</div>
          </div>
        </div>

        {/* Advance Tax */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="ff-label" style={{ margin: 0 }}>Advance Tax Paid</label>
            <button className="ff-btn ff-btn-outline" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => { setAdvanceEntries(prev => [...prev, { ...EMPTY_CHALLAN }]); setTaxDirty(true); }}>
              <Plus size={12} /> Add Challan
            </button>
          </div>
          <div className="ff-hint" style={{ marginBottom: 8 }}>Quarterly tax payments made during the financial year. Enter each challan separately.</div>
          {advanceEntries.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8, padding: 10, background: P.bgMuted, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>BSR Code</label>
                <input className="ff-input" type="text" maxLength={7} value={entry.bsrCode} onChange={e => updateChallan(advanceEntries, setAdvanceEntries, i, 'bsrCode', e.target.value)} placeholder="7 digits" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Challan No.</label>
                <input className="ff-input" type="text" value={entry.challanNo} onChange={e => updateChallan(advanceEntries, setAdvanceEntries, i, 'challanNo', e.target.value)} placeholder="Serial no." />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Date</label>
                <input className="ff-input" type="date" value={entry.dateOfDeposit} onChange={e => updateChallan(advanceEntries, setAdvanceEntries, i, 'dateOfDeposit', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Amount (₹)</label>
                <input className="ff-input" type="number" min="0" value={entry.amount || ''} onChange={e => updateChallan(advanceEntries, setAdvanceEntries, i, 'amount', e.target.value)} placeholder="0" />
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, padding: 4, marginBottom: 2, minHeight: 'auto', minWidth: 'auto' }} onClick={() => { setAdvanceEntries(prev => prev.filter((_, j) => j !== i)); setTaxDirty(true); }} title="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {advanceEntries.length > 0 && (
            <div className="ff-row" style={{ marginTop: 4 }}>
              <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Advance Tax</span>
              <span className="ff-row-value bold">{fmt(advanceTotal)}</span>
            </div>
          )}
        </div>

        {/* Self-Assessment Tax */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="ff-label" style={{ margin: 0 }}>Self-Assessment Tax Paid</label>
            <button className="ff-btn ff-btn-outline" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => { setSatEntries(prev => [...prev, { ...EMPTY_CHALLAN }]); setTaxDirty(true); }}>
              <Plus size={12} /> Add Challan
            </button>
          </div>
          <div className="ff-hint" style={{ marginBottom: 8 }}>Tax paid before filing when your total tax exceeds TDS. Enter challan details from your bank receipt.</div>
          {satEntries.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8, padding: 10, background: P.bgMuted, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>BSR Code</label>
                <input className="ff-input" type="text" maxLength={7} value={entry.bsrCode} onChange={e => updateChallan(satEntries, setSatEntries, i, 'bsrCode', e.target.value)} placeholder="7 digits" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Challan No.</label>
                <input className="ff-input" type="text" value={entry.challanNo} onChange={e => updateChallan(satEntries, setSatEntries, i, 'challanNo', e.target.value)} placeholder="Serial no." />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Date</label>
                <input className="ff-input" type="date" value={entry.dateOfDeposit} onChange={e => updateChallan(satEntries, setSatEntries, i, 'dateOfDeposit', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="ff-label" style={{ fontSize: 11 }}>Amount (₹)</label>
                <input className="ff-input" type="number" min="0" value={entry.amount || ''} onChange={e => updateChallan(satEntries, setSatEntries, i, 'amount', e.target.value)} placeholder="0" />
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, padding: 4, marginBottom: 2, minHeight: 'auto', minWidth: 'auto' }} onClick={() => { setSatEntries(prev => prev.filter((_, j) => j !== i)); setTaxDirty(true); }} title="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {satEntries.length > 0 && (
            <div className="ff-row" style={{ marginTop: 4 }}>
              <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Self-Assessment Tax</span>
              <span className="ff-row-value bold">{fmt(satTotal)}</span>
            </div>
          )}
        </div>

        {/* Total taxes paid summary */}
        {(num(tdsFromFD) + num(tdsFromOther) + advanceTotal + satTotal > 0) && (
          <>
            <div className="ff-divider" />
            <div className="ff-row">
              <span className="ff-row-label" style={{ fontWeight: 600 }}>Total Additional Taxes Paid</span>
              <span className="ff-row-value bold green">{fmt(num(tdsFromFD) + num(tdsFromOther) + advanceTotal + satTotal)}</span>
            </div>
          </>
        )}

        {taxDirty && (
          <button className="ff-btn ff-btn-primary" onClick={handleSaveTaxes} disabled={isSaving} style={{ marginTop: 10 }}>
            {isSaving ? 'Saving...' : <><Save size={14} /> Save Taxes Paid</>}
          </button>
        )}
      </div>

      {/* Tax Summary */}
      {best && (
        <div className="step-card summary">
          <div className="ff-section-title">Your Tax Summary</div>
          <div className="ff-row"><span className="ff-row-label">Gross Total Income</span><span className="ff-row-value">{fmt(computation.income?.grossTotal)}</span></div>
          <div className="ff-row"><span className="ff-row-label">Deductions</span><span className="ff-row-value green">- {fmt(best.deductions)}</span></div>
          <div className="ff-row"><span className="ff-row-label">Taxable Income</span><span className="ff-row-value bold">{fmt(best.taxableIncome)}</span></div>
          <div className="ff-divider" />
          <div className="ff-row"><span className="ff-row-label">Tax ({computation.recommended} regime)</span><span className="ff-row-value bold">{fmt(best.totalTax)}</span></div>
          {computation.tds && computation.tds.fromSalary > 0 && <div className="ff-row"><span className="ff-row-label">TDS from Salary</span><span className="ff-row-value green">{fmt(computation.tds.fromSalary)}</span></div>}
          {computation.tds && (computation.tds.fromFD + computation.tds.fromOther) > 0 && <div className="ff-row"><span className="ff-row-label">TDS from FD / Other</span><span className="ff-row-value green">{fmt(computation.tds.fromFD + computation.tds.fromOther)}</span></div>}
          {computation.tds && computation.tds.fromCapitalGains > 0 && <div className="ff-row"><span className="ff-row-label">TDS on Capital Gains</span><span className="ff-row-value green">{fmt(computation.tds.fromCapitalGains)}</span></div>}
          {computation.tds && computation.tds.advanceTax > 0 && <div className="ff-row"><span className="ff-row-label">Advance Tax</span><span className="ff-row-value green">{fmt(computation.tds.advanceTax)}</span></div>}
          {computation.tds && computation.tds.selfAssessment > 0 && <div className="ff-row"><span className="ff-row-label">Self-Assessment Tax</span><span className="ff-row-value green">{fmt(computation.tds.selfAssessment)}</span></div>}
          {computation.tds && <div className="ff-row"><span className="ff-row-label" style={{ fontWeight: 600 }}>Total Tax Credits</span><span className="ff-row-value green bold">{fmt(computation.tds.total)}</span></div>}
          <div className="ff-divider" />
          <div className="ff-row">
            <span className="ff-row-label" style={{ fontWeight: 600 }}>{best.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'}</span>
            <span className={`ff-row-value bold ${best.netPayable <= 0 ? 'green' : 'red'}`}>{fmt(Math.abs(best.netPayable || 0))}</span>
          </div>
        </div>
      )}

      {/* Readiness Checklist */}
      <div className="step-card">
        <div className="ff-section-title">Filing Readiness</div>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 13 }}>
            <CheckCircle size={16} color={c.ok ? P.success : P.borderMedium} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ color: c.ok ? P.textPrimary : P.textLight }}>{c.label}</span>
              {c.warn && <div style={{ fontSize: 11, color: P.error, marginTop: 1 }}>{c.warn}</div>}
            </div>
          </div>
        ))}
        {allReady && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: P.successBg, borderRadius: 8, fontSize: 13, color: P.success, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} /> Your filing is ready for submission
          </div>
        )}
      </div>

      {/* Download & Submit */}
      <div className="step-card" style={{ background: P.brandLight, borderColor: '#bfdbfe' }}>
        <div className="ff-section-title">Download & Submit</div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button className="ff-btn ff-btn-primary" onClick={handleDownload} disabled={!allReady} style={{ flex: 1, justifyContent: 'center' }}>
            <Download size={15} /> Download ITR JSON
          </button>
        </div>

        {downloaded && (
          <div className="step-card success" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.textPrimary, marginBottom: 10 }}>
              <CheckCircle size={16} color={P.success} style={{ verticalAlign: -3, marginRight: 6 }} />
              JSON Downloaded! Now submit it to the Income Tax Department:
            </div>
            <ol style={{ margin: '0 0 0 20px', padding: 0, fontSize: 13, color: P.textSecondary, lineHeight: 1.8 }}>
              <li>Go to <a href="https://www.incometax.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: P.brand, fontWeight: 500 }}>incometax.gov.in <ExternalLink size={11} style={{ verticalAlign: -1 }} /></a> and login with your PAN</li>
              <li>Click <strong>e-File</strong> → <strong>Income Tax Returns</strong> → <strong>File Income Tax Return</strong></li>
              <li>Select <strong>AY {filing?.assessmentYear}</strong> and <strong>{filing?.itrType || 'ITR-1'}</strong></li>
              <li>Choose <strong>"Upload JSON"</strong> and upload the file you just downloaded</li>
              <li>Verify the data and <strong>Submit</strong></li>
              <li>Complete <strong>e-Verification</strong> using Aadhaar OTP (fastest — takes 2 minutes)</li>
            </ol>
            <div style={{ marginTop: 10, padding: '8px 10px', background: P.warningBg, borderRadius: 6, fontSize: 12, color: P.warning, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>You must e-verify within 30 days of filing, otherwise your return is treated as not filed.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
