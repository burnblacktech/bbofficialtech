// =====================================================
// POST-FILING GUIDE — Post-submission guidance
// Timeline, e-verification countdown, refund/advance tax
// =====================================================

import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Upload } from 'lucide-react';
import { Card } from '../ds';

const ADVANCE_TAX_DATES = ['Jun 15', 'Sep 15', 'Dec 15', 'Mar 15'];
const ADVANCE_TAX_PCTS = [0.15, 0.30, 0.30, 0.25];

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'e_verified', label: 'E-Verified' },
  { key: 'processed', label: 'Processed' },
  { key: 'refund', label: 'Refund / Demand' },
];

export function getEVerificationSeverity(submittedAt) {
  if (!submittedAt) return { daysLeft: 30, severity: 'info' };
  const days = Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86400000);
  const left = 30 - days;
  if (left <= 0) return { daysLeft: left, severity: 'overdue' };
  if (left <= 7) return { daysLeft: left, severity: 'warning' };
  return { daysLeft: left, severity: 'info' };
}

export function computeInstallments(liability) {
  const total = Math.max(0, Number(liability) || 0);
  if (total === 0) return [];
  return ADVANCE_TAX_PCTS.map((pct, i) => ({
    date: ADVANCE_TAX_DATES[i],
    amount: i < 3 ? Math.floor(total * pct) : total - ADVANCE_TAX_PCTS.slice(0, 3).reduce((s, p) => s + Math.floor(total * p), 0),
  }));
}

function getActiveStep(lifecycleState) {
  if (!lifecycleState) return 0;
  const s = lifecycleState.toLowerCase();
  if (s.includes('refund') || s.includes('demand') || s.includes('processed')) return 3;
  if (s.includes('verified') || s.includes('e_verified')) return 2;
  return 1; // submitted
}

const fmt = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;

export default function PostFilingGuide({ filing = {}, computation }) {
  const { lifecycleState, submittedAt, assessmentYear } = filing;
  const activeStep = getActiveStep(lifecycleState);
  const { daysLeft, severity } = getEVerificationSeverity(submittedAt);
  const netPayable = Number(computation?.netPayable ?? computation?.oldRegime?.netPayable ?? 0);
  const isRefund = netPayable < 0;
  const isPayable = netPayable > 0;

  return (
    <Card style={{ padding: '16px 14px' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        Post-Filing Guide {assessmentYear ? `— AY ${assessmentYear}` : ''}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, overflowX: 'auto' }}>
        {STEPS.map((step, i) => {
          const done = i < activeStep, current = i === activeStep;
          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div style={{ flex: 1, height: 2, minWidth: 16, background: done ? 'var(--color-success)' : 'var(--border-light)' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--color-success)' : current ? 'var(--brand-primary)' : 'var(--bg-muted)',
                  color: done || current ? '#fff' : 'var(--text-light)', fontSize: 11, fontWeight: 600,
                  border: current ? '2px solid var(--brand-primary)' : 'none',
                }}>{done ? <CheckCircle size={14} /> : i + 1}</div>
                <span style={{ fontSize: 10, fontWeight: current ? 600 : 400, whiteSpace: 'nowrap', color: current ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
              </div>
            </React.Fragment>);
        })}
      </div>

      {/* E-verification countdown */}
      {activeStep <= 1 && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: 10,
          background: severity === 'overdue' ? 'var(--color-error-bg)' : severity === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
          border: `1px solid ${severity === 'overdue' ? 'var(--color-error-border)' : severity === 'warning' ? 'var(--color-warning-border)' : 'var(--color-info-border)'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {severity === 'overdue' ? <AlertTriangle size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            : <Clock size={14} style={{ color: severity === 'warning' ? 'var(--color-warning)' : 'var(--color-info)', flexShrink: 0 }} />}
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {severity === 'overdue'
              ? 'E-verification overdue! Complete it immediately to avoid your return being treated as invalid.'
              : `E-verify within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to complete your filing.`}
          </span>
        </div>
      )}

      {/* Refund section */}
      {isRefund && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: 10,
          background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', marginBottom: 4 }}>
            Expected Refund: {fmt(Math.abs(netPayable))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Refunds typically take 30–120 days after processing. Check status on the ITD portal.
          </p>
        </div>
      )}

      {/* Advance tax dates */}
      {isPayable && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Advance Tax Dates (Next FY)
          </div>
          {computeInstallments(netPayable).map((inst) => (
            <div key={inst.date} style={{
              display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{inst.date}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{fmt(inst.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Manual upload instructions */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Upload size={12} /> Manual Upload Steps
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <li>Download your ITR JSON from BurnBlack</li>
          <li>Go to incometax.gov.in → Login → e-File → Income Tax Returns</li>
          <li>Select AY, ITR type, and upload the JSON file</li>
          <li>Verify the pre-filled data and submit</li>
          <li>E-verify using Aadhaar OTP, net banking, or DSC</li>
        </ol>
      </div>
    </Card>
  );
}
