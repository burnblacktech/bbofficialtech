import { useState, useEffect, useCallback } from 'react';
import { Download, Save, CheckCircle, ExternalLink, Shield, Info, Plus, Trash2 } from 'lucide-react';
import { validateBankAccount, validateTDS2Entry } from '../../../../utils/itrValidation';
import useAutoSave from '../../../../hooks/useAutoSave';
import { Field, Select, Grid, Card, Section, Row, Button, Badge, Divider, Money, Alert } from '../../../../components/ds';

const num = (v) => Number(v) || 0;
const fmt = (v) => `₹${num(v).toLocaleString('en-IN')}`;

const EMPTY_CHALLAN = { bsrCode: '', challanNo: '', dateOfDeposit: '', amount: '' };

const SECTION_CODE_OPTIONS = [
  { value: '194A', label: '194A — Interest' },
  { value: '194B', label: '194B — Lottery' },
  { value: '194C', label: '194C — Contractor' },
  { value: '194D', label: '194D — Insurance' },
  { value: '194H', label: '194H — Commission' },
  { value: '194I', label: '194I — Rent' },
  { value: '194J', label: '194J — Professional' },
  { value: '194K', label: '194K — MF Income' },
  { value: '194N', label: '194N — Cash Withdrawal' },
  { value: '194S', label: '194S — VDA/Crypto' },
  { value: 'OTH', label: 'Other' },
];

const EMPTY_TDS_ENTRY = { deductorTan: '', deductorName: '', sectionCode: '', amountPaid: '', tdsDeducted: '', tdsClaimed: '' };

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

  const savedTaxes = payload?.taxes || {};

  const initNonSalaryTDS = () => {
    if (savedTaxes.tds?.nonSalaryEntries?.length) return savedTaxes.tds.nonSalaryEntries;
    const oldFD = num(savedTaxes.tds?.fromFD);
    const oldOther = num(savedTaxes.tds?.fromOther);
    if (oldFD > 0 || oldOther > 0) {
      const entries = [];
      if (oldFD > 0) entries.push({ deductorTan: '', deductorName: '', sectionCode: '194A', amountPaid: oldFD, tdsDeducted: oldFD, tdsClaimed: oldFD });
      if (oldOther > 0) entries.push({ deductorTan: '', deductorName: '', sectionCode: 'OTH', amountPaid: oldOther, tdsDeducted: oldOther, tdsClaimed: oldOther });
      return entries;
    }
    return [];
  };

  const [nonSalaryTDS, setNonSalaryTDS] = useState(initNonSalaryTDS);
  const [tdsEntryErrors, setTdsEntryErrors] = useState({});
  const [advanceEntries, setAdvanceEntries] = useState(savedTaxes.advanceTaxEntries?.length ? savedTaxes.advanceTaxEntries : []);
  const [satEntries, setSatEntries] = useState(savedTaxes.selfAssessmentTaxEntries?.length ? savedTaxes.selfAssessmentTaxEntries : []);
  const [taxDirty, setTaxDirty] = useState(false);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    const bd = payload?.bankDetails || {};
    if (bd.bankName || bd.accountNumber) setForm({ bankName: bd.bankName || '', accountNumber: bd.accountNumber || '', ifsc: bd.ifsc || '', accountType: bd.accountType || 'SAVINGS' });
    const tx = payload?.taxes || {};
    if (tx.tds?.nonSalaryEntries?.length) {
      setNonSalaryTDS(tx.tds.nonSalaryEntries);
    } else {
      const oldFD = num(tx.tds?.fromFD);
      const oldOther = num(tx.tds?.fromOther);
      if (oldFD > 0 || oldOther > 0) {
        const entries = [];
        if (oldFD > 0) entries.push({ deductorTan: '', deductorName: '', sectionCode: '194A', amountPaid: oldFD, tdsDeducted: oldFD, tdsClaimed: oldFD });
        if (oldOther > 0) entries.push({ deductorTan: '', deductorName: '', sectionCode: 'OTH', amountPaid: oldOther, tdsDeducted: oldOther, tdsClaimed: oldOther });
        setNonSalaryTDS(entries);
      }
    }
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
    markBankDirty();
  };

  const buildBankPayload = useCallback(() => ({ bankDetails: form }), [form]);
  const { markDirty: markBankDirty } = useAutoSave(onSave, buildBankPayload);

  const handleSave = () => {
    const v = validateBankAccount(form);
    setErrors(v.valid ? {} : v.errors);
    onSave({ bankDetails: form });
    setDirty(false);
  };

  const advanceTotal = advanceEntries.reduce((s, e) => s + num(e.amount), 0);
  const satTotal = satEntries.reduce((s, e) => s + num(e.amount), 0);
  const nonSalaryTDSTotal = nonSalaryTDS.reduce((s, e) => s + num(e.tdsClaimed), 0);

  const handleSaveTaxes = useCallback(() => {
    onSave({
      taxes: {
        tds: { ...(payload?.taxes?.tds || {}), nonSalaryEntries: nonSalaryTDS.filter(e => e.deductorTan || e.deductorName || num(e.tdsDeducted) > 0) },
        advanceTax: advanceTotal,
        selfAssessmentTax: satTotal,
        advanceTaxEntries: advanceEntries.filter(e => num(e.amount) > 0),
        selfAssessmentTaxEntries: satEntries.filter(e => num(e.amount) > 0),
      },
    });
    setTaxDirty(false);
  }, [nonSalaryTDS, advanceEntries, satEntries, advanceTotal, satTotal, onSave, payload?.taxes?.tds]);

  const buildTaxPayload = useCallback(() => ({
    taxes: {
      tds: { ...(payload?.taxes?.tds || {}), nonSalaryEntries: nonSalaryTDS.filter(e => e.deductorTan || e.deductorName || num(e.tdsDeducted) > 0) },
      advanceTax: advanceTotal,
      selfAssessmentTax: satTotal,
      advanceTaxEntries: advanceEntries.filter(e => num(e.amount) > 0),
      selfAssessmentTaxEntries: satEntries.filter(e => num(e.amount) > 0),
    },
  }), [nonSalaryTDS, advanceEntries, satEntries, advanceTotal, satTotal, payload?.taxes?.tds]);

  const { markDirty: markTaxDirty } = useAutoSave(onSave, buildTaxPayload);

  const updateTDSEntry = (idx, field, val) => {
    setNonSalaryTDS(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
    setTaxDirty(true);
    markTaxDirty();
  };

  const validateTDSEntryOnBlur = (idx) => {
    const entry = nonSalaryTDS[idx];
    if (!entry) return;
    const result = validateTDS2Entry(entry);
    setTdsEntryErrors(prev => {
      const next = { ...prev };
      if (result.valid) { delete next[idx]; } else { next[idx] = result.errors; }
      return next;
    });
  };

  const addTDSEntry = () => {
    setNonSalaryTDS(prev => [...prev, { ...EMPTY_TDS_ENTRY }]);
    setTaxDirty(true);
    markTaxDirty();
  };

  const removeTDSEntry = (idx) => {
    setNonSalaryTDS(prev => prev.filter((_, i) => i !== idx));
    setTdsEntryErrors(prev => { const next = { ...prev }; delete next[idx]; return next; });
    setTaxDirty(true);
    markTaxDirty();
  };

  const updateChallan = (list, setList, idx, field, val) => {
    setList(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
    setTaxDirty(true);
    markTaxDirty();
  };

  const handleDownload = () => {
    onDownloadJSON?.();
    setDownloaded(true);
  };

  const hasErrors = errors && Object.keys(errors).length > 0;
  const best = computation?.[computation?.recommended === 'old' ? 'oldRegime' : 'newRegime'];

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
      <h2 className="step-title">Taxes Paid, Bank & Submit</h2>
      <p className="step-desc">Enter taxes already paid, bank details for refund, and download your ITR JSON</p>

      {/* Bank Details */}
      <Card active>
        <Section title="Your Bank Account for Refund" />
        <Alert variant="info">If you are due a refund, ITD credits it to this account. Use the bank linked to your PAN.</Alert>
        <Grid cols={3} style={{ marginTop: 12 }}>
          <Field
            label="Bank Name *"
            value={form.bankName}
            onChange={v => update('bankName', v)}
            error={errors.bankName}
            hint={!errors.bankName ? 'Bank for refund credit · As on cheque book or passbook' : undefined}
            placeholder="e.g., State Bank of India"
          />
          <Field
            label="Account Number *"
            value={form.accountNumber}
            onChange={v => update('accountNumber', v)}
            error={errors.accountNumber}
            hint={!errors.accountNumber ? 'Savings or current account · For refund credit' : undefined}
            placeholder="e.g., 1234567890"
          />
          <Field
            label="IFSC Code"
            value={form.ifsc}
            onChange={v => update('ifsc', v.toUpperCase())}
            error={errors.ifsc}
            hint={!errors.ifsc ? '11-character branch code · On cheque leaf or bank website' : undefined}
            placeholder="e.g., SBIN0001234"
          />
        </Grid>
        <Grid cols={3}>
          <Select
            label="Account Type"
            value={form.accountType}
            onChange={v => update('accountType', v)}
            options={[{ value: 'SAVINGS', label: 'Savings' }, { value: 'CURRENT', label: 'Current' }]}
          />
        </Grid>
        {dirty && (
          <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ marginTop: 8 }}>
            {isSaving ? 'Saving...' : <><Save size={14} /> Save Bank Details</>}
          </Button>
        )}
      </Card>

      {/* Taxes Paid */}
      <Card active>
        <Section title="Taxes Already Paid" />
        <Alert variant="info">
          Enter TDS from sources other than salary, advance tax, and self-assessment tax paid during the year. These reduce your final tax liability.
        </Alert>

        {/* TDS from non-salary sources */}
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} align="center">
            <span className="ds-label" style={{ margin: 0 }}>TDS on Non-Salary Income (Schedule TDS2)</span>
            <Button variant="ghost" size="sm" onClick={addTDSEntry}><Plus size={12} /> Add TDS Entry</Button>
          </Row>
          <div className="ds-hint" style={{ marginBottom: 8 }}>TDS deducted on FD interest, rent, professional fees, etc. Enter each deductor separately with their TAN and section code.</div>
          {nonSalaryTDS.map((entry, i) => {
            const errs = tdsEntryErrors[i] || {};
            return (
              <Card key={i} muted style={{ marginBottom: 8 }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} align="center">
                  <Badge>Entry {i + 1}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeTDSEntry(i)}><Trash2 size={14} /></Button>
                </Row>
                <Grid cols={3}>
                  <Field
                    label="Deductor TAN *"
                    value={entry.deductorTan}
                    onChange={v => updateTDSEntry(i, 'deductorTan', v.toUpperCase())}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.deductorTan}
                    placeholder="e.g., ABCD12345E"
                    maxLength={10}
                  />
                  <Field
                    label="Deductor Name *"
                    value={entry.deductorName}
                    onChange={v => updateTDSEntry(i, 'deductorName', v)}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.deductorName}
                    placeholder="e.g., State Bank of India"
                  />
                </Grid>
                <Grid cols={3} style={{ marginTop: 6 }}>
                  <Select
                    label="Section Code *"
                    value={entry.sectionCode}
                    onChange={v => updateTDSEntry(i, 'sectionCode', v)}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.sectionCode}
                    options={SECTION_CODE_OPTIONS}
                    placeholder="Select section..."
                  />
                  <Field
                    label="Amount Paid / Credited (₹)"
                    type="number"
                    value={entry.amountPaid}
                    onChange={v => updateTDSEntry(i, 'amountPaid', v)}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.amountPaid}
                    placeholder="0"
                  />
                </Grid>
                <Grid cols={3} style={{ marginTop: 6 }}>
                  <Field
                    label="TDS Deducted (₹)"
                    type="number"
                    value={entry.tdsDeducted}
                    onChange={v => updateTDSEntry(i, 'tdsDeducted', v)}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.tdsDeducted}
                    placeholder="0"
                  />
                  <Field
                    label="TDS Claimed This Year (₹)"
                    type="number"
                    value={entry.tdsClaimed}
                    onChange={v => updateTDSEntry(i, 'tdsClaimed', v)}
                    onBlur={() => validateTDSEntryOnBlur(i)}
                    error={errs.tdsClaimed}
                    placeholder="0"
                  />
                </Grid>
              </Card>
            );
          })}
          {nonSalaryTDS.length > 0 && <Money label="Total Non-Salary TDS" value={fmt(nonSalaryTDSTotal)} bold />}
        </div>

        {/* Advance Tax */}
        <div style={{ marginTop: 16 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} align="center">
            <span className="ds-label" style={{ margin: 0 }}>Advance Tax Paid</span>
            <Button variant="ghost" size="sm" onClick={() => { setAdvanceEntries(prev => [...prev, { ...EMPTY_CHALLAN }]); setTaxDirty(true); markTaxDirty(); }}>
              <Plus size={12} /> Add Challan
            </Button>
          </Row>
          <div className="ds-hint" style={{ marginBottom: 8 }}>Quarterly tax payments made during the financial year. Enter each challan separately.</div>
          {advanceEntries.map((entry, i) => (
            <Card key={i} muted style={{ marginBottom: 8 }}>
              <Row align="flex-end" gap="sm">
                <Field label="BSR Code" value={entry.bsrCode} onChange={v => updateChallan(advanceEntries, setAdvanceEntries, i, 'bsrCode', v)} placeholder="7 digits" maxLength={7} style={{ flex: 1 }} />
                <Field label="Challan No." value={entry.challanNo} onChange={v => updateChallan(advanceEntries, setAdvanceEntries, i, 'challanNo', v)} placeholder="Serial no." style={{ flex: 1 }} />
                <Field label="Date" type="date" value={entry.dateOfDeposit} onChange={v => updateChallan(advanceEntries, setAdvanceEntries, i, 'dateOfDeposit', v)} style={{ flex: 1 }} />
                <Field label="Amount (₹)" type="number" value={entry.amount} onChange={v => updateChallan(advanceEntries, setAdvanceEntries, i, 'amount', v)} placeholder="0" style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" onClick={() => { setAdvanceEntries(prev => prev.filter((_, j) => j !== i)); setTaxDirty(true); markTaxDirty(); }}>
                  <Trash2 size={14} />
                </Button>
              </Row>
            </Card>
          ))}
          {advanceEntries.length > 0 && <Money label="Total Advance Tax" value={fmt(advanceTotal)} bold />}
        </div>

        {/* Self-Assessment Tax */}
        <div style={{ marginTop: 16 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} align="center">
            <span className="ds-label" style={{ margin: 0 }}>Self-Assessment Tax Paid</span>
            <Button variant="ghost" size="sm" onClick={() => { setSatEntries(prev => [...prev, { ...EMPTY_CHALLAN }]); setTaxDirty(true); markTaxDirty(); }}>
              <Plus size={12} /> Add Challan
            </Button>
          </Row>
          <div className="ds-hint" style={{ marginBottom: 8 }}>Tax paid before filing when your total tax exceeds TDS. Enter challan details from your bank receipt.</div>
          {satEntries.map((entry, i) => (
            <Card key={i} muted style={{ marginBottom: 8 }}>
              <Row align="flex-end" gap="sm">
                <Field label="BSR Code" value={entry.bsrCode} onChange={v => updateChallan(satEntries, setSatEntries, i, 'bsrCode', v)} placeholder="7 digits" maxLength={7} style={{ flex: 1 }} />
                <Field label="Challan No." value={entry.challanNo} onChange={v => updateChallan(satEntries, setSatEntries, i, 'challanNo', v)} placeholder="Serial no." style={{ flex: 1 }} />
                <Field label="Date" type="date" value={entry.dateOfDeposit} onChange={v => updateChallan(satEntries, setSatEntries, i, 'dateOfDeposit', v)} style={{ flex: 1 }} />
                <Field label="Amount (₹)" type="number" value={entry.amount} onChange={v => updateChallan(satEntries, setSatEntries, i, 'amount', v)} placeholder="0" style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" onClick={() => { setSatEntries(prev => prev.filter((_, j) => j !== i)); setTaxDirty(true); markTaxDirty(); }}>
                  <Trash2 size={14} />
                </Button>
              </Row>
            </Card>
          ))}
          {satEntries.length > 0 && <Money label="Total Self-Assessment Tax" value={fmt(satTotal)} bold />}
        </div>

        {/* Total taxes paid summary */}
        {(nonSalaryTDSTotal + advanceTotal + satTotal > 0) && (
          <>
            <Divider />
            <Money label="Total Additional Taxes Paid" value={fmt(nonSalaryTDSTotal + advanceTotal + satTotal)} bold color="green" />
          </>
        )}

        {taxDirty && (
          <Button variant="primary" onClick={handleSaveTaxes} disabled={isSaving} style={{ marginTop: 10 }}>
            {isSaving ? 'Saving...' : <><Save size={14} /> Save Taxes Paid</>}
          </Button>
        )}
      </Card>

      {/* Tax Summary */}
      {best && (
        <Card muted>
          <Section title="Your Tax Summary" />
          <Money label="Gross Total Income" value={fmt(computation.income?.grossTotal)} />
          <Money label="Deductions" value={`- ${fmt(best.deductions)}`} color="green" />
          <Money label="Taxable Income" value={fmt(best.taxableIncome)} bold />
          <Divider />
          <Money label={`Tax (${computation.recommended} regime)`} value={fmt(best.totalTax)} bold />
          {computation.tds && computation.tds.fromSalary > 0 && <Money label="TDS from Salary" value={fmt(computation.tds.fromSalary)} color="green" />}
          {computation.tds && (computation.tds.fromFD + computation.tds.fromOther) > 0 && <Money label="TDS from FD / Other" value={fmt(computation.tds.fromFD + computation.tds.fromOther)} color="green" />}
          {computation.tds && computation.tds.fromCapitalGains > 0 && <Money label="TDS on Capital Gains" value={fmt(computation.tds.fromCapitalGains)} color="green" />}
          {computation.tds && computation.tds.advanceTax > 0 && <Money label="Advance Tax" value={fmt(computation.tds.advanceTax)} color="green" />}
          {computation.tds && computation.tds.selfAssessment > 0 && <Money label="Self-Assessment Tax" value={fmt(computation.tds.selfAssessment)} color="green" />}
          {computation.tds && <Money label="Total Tax Credits" value={fmt(computation.tds.total)} bold color="green" />}
          <Divider />
          <Money
            label={best.netPayable <= 0 ? 'Refund Due' : 'Tax Payable'}
            value={fmt(Math.abs(best.netPayable || 0))}
            bold
            color={best.netPayable <= 0 ? 'green' : 'red'}
          />
        </Card>
      )}

      {/* Readiness Checklist */}
      <Card>
        <Section title="Filing Readiness" />
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 13 }}>
            <CheckCircle size={16} color={c.ok ? 'var(--c-success)' : 'var(--c-border)'} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ color: c.ok ? 'var(--c-text)' : 'var(--c-text-muted)' }}>{c.label}</span>
              {c.warn && <div style={{ fontSize: 11, color: 'var(--c-error)', marginTop: 1 }}>{c.warn}</div>}
            </div>
          </div>
        ))}
        {allReady && (
          <Alert variant="success" style={{ marginTop: 8 }}>
            <Shield size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Your filing is ready for submission
          </Alert>
        )}
      </Card>

      {/* Download & Submit */}
      <Card active>
        <Section title="Download & Submit" />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Button variant="primary" onClick={handleDownload} disabled={!allReady} style={{ flex: 1, justifyContent: 'center' }}>
            <Download size={15} /> Download ITR JSON
          </Button>
        </div>

        {downloaded && (
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              <CheckCircle size={16} color="var(--c-success)" style={{ verticalAlign: -3, marginRight: 6 }} />
              JSON Downloaded! Now submit it to the Income Tax Department:
            </div>
            <ol style={{ margin: '0 0 0 20px', padding: 0, fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.8 }}>
              <li>Go to <a href="https://www.incometax.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-brand)', fontWeight: 500 }}>incometax.gov.in <ExternalLink size={11} style={{ verticalAlign: -1 }} /></a> and login with your PAN</li>
              <li>Click <strong>e-File</strong> → <strong>Income Tax Returns</strong> → <strong>File Income Tax Return</strong></li>
              <li>Select <strong>AY {filing?.assessmentYear}</strong> and <strong>{filing?.itrType || 'ITR-1'}</strong></li>
              <li>Choose <strong>"Upload JSON"</strong> and upload the file you just downloaded</li>
              <li>Verify the data and <strong>Submit</strong></li>
              <li>Complete <strong>e-Verification</strong> using Aadhaar OTP (fastest — takes 2 minutes)</li>
            </ol>
            <Alert variant="warning" style={{ marginTop: 10 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1, verticalAlign: -2, marginRight: 4 }} />
              You must e-verify within 30 days of filing, otherwise your return is treated as not filed.
            </Alert>
          </Card>
        )}
      </Card>
    </div>
  );
}
