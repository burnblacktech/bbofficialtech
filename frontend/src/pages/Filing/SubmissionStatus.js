/**
 * Submission Status — Shows ERI submission outcome
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Download } from 'lucide-react';
import api from '../../services/api';
import P from '../../styles/palette';
import toast from 'react-hot-toast';
import './filing-flow.css';

/* eslint-disable camelcase */
const STATUS_MAP = {
  draft: { icon: Clock, color: P.textMuted, label: 'Draft', desc: 'Filing has not been submitted yet.' },
  submitted_to_eri: { icon: Clock, color: P.brand, label: 'Submitted', desc: 'Your return has been submitted to the ERI gateway.' },
  eri_in_progress: { icon: Clock, color: P.warning, label: 'Processing', desc: 'The Income Tax Department is processing your return.' },
  eri_success: { icon: CheckCircle, color: P.success, label: 'Accepted', desc: 'Your return has been accepted by the Income Tax Department.' },
  eri_failed: { icon: XCircle, color: P.error, label: 'Failed', desc: 'Submission was rejected. Please review and resubmit.' },
};
/* eslint-enable camelcase */

export default function SubmissionStatus() {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/filings/${filingId}/submission-status`);
        setData(res.data.data);
      } catch {
        toast.error('Failed to load submission status');
      } finally { setLoading(false); }
    };
    fetch();
    // Poll every 30s if status is in-progress
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/filings/${filingId}/submission-status`);
        setData(res.data.data);
        const st = res.data.data?.lifecycleState;
        if (st === 'eri_success' || st === 'eri_failed') clearInterval(interval);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [filingId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" color={P.textMuted} /></div>;

  const state = data?.lifecycleState || 'draft';
  const st = STATUS_MAP[state] || STATUS_MAP.draft;
  const Icon = st.icon;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="step-title">Submission Status</h1>

      <div className="step-card" style={{ textAlign: 'center', padding: 32 }}>
        <Icon size={48} color={st.color} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: st.color, marginBottom: 4 }}>{st.label}</div>
        <div style={{ fontSize: 14, color: P.textMuted, marginBottom: 16 }}>{st.desc}</div>

        {data?.acknowledgmentNumber && (
          <div className="step-card success" style={{ textAlign: 'left', marginTop: 12 }}>
            <div className="ff-row"><span className="ff-row-label">Acknowledgment No.</span><span className="ff-row-value bold">{data.acknowledgmentNumber}</span></div>
            {data?.filedAt && <div className="ff-row"><span className="ff-row-label">Filed At</span><span className="ff-row-value">{new Date(data.filedAt).toLocaleString()}</span></div>}
          </div>
        )}

        {data?.errorMessage && (
          <div className="step-card error" style={{ textAlign: 'left', marginTop: 12 }}>
            <div style={{ fontSize: 13, color: P.errorDark }}>{data.errorMessage}</div>
          </div>
        )}
      </div>

      {/* E-verification reminder with countdown */}
      {(state === 'eri_success' || state === 'submitted_to_eri') && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>E-Verify Your Return</div>
            {data?.submittedAt && (() => {
              const deadline = new Date(new Date(data.submittedAt).getTime() + 30 * 86400000);
              const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));
              return (
                <span style={{ fontSize: 12, fontWeight: 700, color: daysLeft <= 7 ? P.error : '#92400e', background: daysLeft <= 7 ? '#fef2f2' : '#fef3c7', padding: '2px 8px', borderRadius: 10 }}>
                  {daysLeft} days left
                </span>
              );
            })()}
          </div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            You must e-verify within 30 days of filing, or your return is treated as not filed. Aadhaar OTP is the fastest method (2 minutes).
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <a href="https://eportal.incometax.gov.in/iec/foservices/#/e-verify/user-details" target="_blank" rel="noopener noreferrer"
              className="ff-btn ff-btn-primary" style={{ fontSize: 13, padding: '8px 14px', textDecoration: 'none' }}>
              E-Verify Now →
            </a>
            <a href="https://www.incometax.gov.in" target="_blank" rel="noopener noreferrer"
              className="ff-btn ff-btn-outline" style={{ fontSize: 13, padding: '8px 14px', textDecoration: 'none' }}>
              ITD Portal
            </a>
          </div>
        </div>
      )}

      {/* Manual filing instructions (when ERI not live) */}
      {state === 'draft' && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: P.infoBg, border: `1px solid ${P.infoBorder}`, borderRadius: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: P.info, marginBottom: 6 }}>File Manually on ITD Portal</div>
          <ol style={{ fontSize: 13, color: P.textSecondary, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            <li>Download your ITR JSON from the filing page</li>
            <li>Go to <a href="https://eportal.incometax.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: P.brand }}>eportal.incometax.gov.in</a></li>
            <li>Click e-File → Income Tax Returns → File Income Tax Return</li>
            <li>Select your AY and ITR type, choose "Upload JSON"</li>
            <li>Upload the JSON file and verify the data</li>
            <li>Submit and e-verify using Aadhaar OTP</li>
          </ol>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="ff-btn ff-btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        {(state === 'draft' || state === 'eri_failed') && data?.filingId && (
          <button className="ff-btn ff-btn-outline" onClick={() => {
            const route = data.itrType ? { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[data.itrType] || 'itr1' : 'itr1';
            navigate(`/filing/${filingId}/${route}`);
          }}>
            Edit Filing
          </button>
        )}
        {state === 'eri_success' && (
          <button className="ff-btn ff-btn-primary" onClick={() => navigate(`/acknowledgment/${filingId}`)}>
            <Download size={15} /> View Acknowledgment
          </button>
        )}
      </div>
    </div>
  );
}
