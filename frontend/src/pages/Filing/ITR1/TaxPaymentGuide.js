/**
 * TaxPaymentGuide — Shows when tax is payable, guides user through e-Pay Tax
 * Appears in the BankEditor section when computation shows tax due.
 */

import { useState } from 'react';
import { AlertCircle, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Button, Card, Section, Field } from '../../../components/ds';
import P from '../../../styles/palette';

const fmt = (v) => `₹${Math.abs(Number(v) || 0).toLocaleString('en-IN')}`;

export default function TaxPaymentGuide({ computation, pan, assessmentYear, onChallanSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [challan, setChallan] = useState({ bsrCode: '', challanNo: '', dateOfDeposit: '', amount: '' });
  const [saved, setSaved] = useState(false);

  const netPayable = computation?.netPayable || computation?.balanceTax || 0;
  if (netPayable <= 0) return null;

  const copyText = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const handleSaveChallan = () => {
    if (!challan.bsrCode || !challan.challanNo || !challan.amount) return;
    onChallanSaved?.({
      selfAssessmentTaxEntries: [{
        bsrCode: challan.bsrCode,
        challanNo: challan.challanNo,
        dateOfDeposit: challan.dateOfDeposit,
        amount: Number(challan.amount) || 0,
      }],
    });
    setSaved(true);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Alert banner */}
      <div style={{
        padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 10, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <AlertCircle size={16} style={{ color: P.error, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
            Self-Assessment Tax Due: {fmt(netPayable)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
          You need to pay this amount before filing your return. Pay via the ITD e-Pay Tax portal, then enter the challan details below.
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: P.brand, padding: 0, minHeight: 'auto',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide payment steps' : 'How to pay'}
        </button>
      </div>

      {/* Expandable payment instructions */}
      {expanded && (
        <Card className="editing" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <Section title="Pay via e-Pay Tax (ITD Portal)" />

          {/* Pre-filled details for easy copy */}
          <div style={{ background: P.bgMuted, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, marginBottom: 6 }}>YOUR PAYMENT DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              <CopyRow label="PAN" value={pan || ''} onCopy={copyText} />
              <CopyRow label="Assessment Year" value={assessmentYear || ''} onCopy={copyText} />
              <CopyRow label="Tax Type" value="Self-Assessment Tax (300)" onCopy={() => copyText('300')} />
              <CopyRow label="Amount" value={fmt(netPayable)} onCopy={() => copyText(String(netPayable))} />
            </div>
          </div>

          <ol style={{ paddingLeft: 20, margin: '0 0 12px', color: P.textSecondary }}>
            <li style={{ marginBottom: 6 }}>
              Go to{' '}
              <a href="https://eportal.incometax.gov.in/iec/foservices/#/e-pay-tax-prelogin/user-details" target="_blank" rel="noopener noreferrer"
                style={{ color: P.brand, fontWeight: 600, textDecoration: 'none' }}>
                e-Pay Tax <ExternalLink size={11} style={{ verticalAlign: -1 }} />
              </a>
            </li>
            <li style={{ marginBottom: 6 }}>Enter your PAN and mobile number</li>
            <li style={{ marginBottom: 6 }}>Select <strong>Income Tax</strong> → <strong>Self-Assessment Tax (300)</strong></li>
            <li style={{ marginBottom: 6 }}>Enter Assessment Year: <strong>{assessmentYear}</strong></li>
            <li style={{ marginBottom: 6 }}>Enter amount: <strong>{fmt(netPayable)}</strong></li>
            <li style={{ marginBottom: 6 }}>Pay via Net Banking, UPI, Debit Card, or NEFT/RTGS</li>
            <li>Note the <strong>BSR Code</strong>, <strong>Challan Serial Number</strong>, and <strong>Date of Deposit</strong></li>
          </ol>

          <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: P.warning }}>
            💡 After payment, it takes 2-3 hours for the challan to reflect in 26AS. You can file immediately using the challan details.
          </div>
        </Card>
      )}

      {/* Challan entry */}
      <Card className="editing">
        <Section title={saved ? <><CheckCircle size={14} style={{ color: P.success }} /> Challan Recorded</> : 'Enter Challan Details (after payment)'} />
        {saved ? (
          <div style={{ fontSize: 13, color: P.success }}>
            Self-assessment tax of {fmt(challan.amount)} recorded. This will be included in your filing.
          </div>
        ) : (
          <>
            <div className="ff-grid-2">
              <Field label="BSR Code" value={challan.bsrCode} onChange={v => setChallan(p => ({ ...p, bsrCode: v }))} placeholder="7-digit code" hint="From challan receipt" />
              <Field label="Challan Serial No." value={challan.challanNo} onChange={v => setChallan(p => ({ ...p, challanNo: v }))} placeholder="5-digit number" />
            </div>
            <div className="ff-grid-2">
              <Field label="Date of Deposit" type="date" value={challan.dateOfDeposit} onChange={v => setChallan(p => ({ ...p, dateOfDeposit: v }))} />
              <Field label="Amount Paid (₹)" type="number" value={challan.amount} onChange={v => setChallan(p => ({ ...p, amount: v }))} placeholder={String(netPayable)} />
            </div>
            <Button variant="primary" onClick={handleSaveChallan} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              <CheckCircle size={14} /> Save Challan Details
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: P.textMuted }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: P.textPrimary, fontFamily: 'var(--font-mono)' }}>{value}</span>
        <button onClick={() => onCopy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: P.textLight, minHeight: 'auto', minWidth: 'auto' }} title="Copy">
          <Copy size={11} />
        </button>
      </span>
    </div>
  );
}
