/**
 * Submission Status — Migrated to BurnBlack Design System
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Page, Card, Button, Row, Badge, Alert, Divider } from '../../components/ds';
import PostFilingGuide from '../../components/Filing/PostFilingGuide';
import api from '../../services/api';
import P from '../../styles/palette';
import toast from 'react-hot-toast';

/* eslint-disable camelcase */
const STATUS_MAP = {
  draft: { icon: Clock, tone: 'default', label: 'Draft', desc: 'Filing has not been submitted yet.' },
  submitted_to_eri: { icon: Clock, tone: 'brand', label: 'Submitted', desc: 'Your return has been submitted to the ERI gateway.' },
  eri_in_progress: { icon: Clock, tone: 'warning', label: 'Processing', desc: 'The Income Tax Department is processing your return.' },
  eri_success: { icon: CheckCircle, tone: 'success', label: 'Accepted', desc: 'Your return has been accepted by the Income Tax Department.' },
  eri_failed: { icon: XCircle, tone: 'error', label: 'Failed', desc: 'Submission was rejected. Please review and resubmit.' },
};
/* eslint-enable camelcase */

export default function SubmissionStatus() {
  const { filingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/filings/${filingId}/submission-status`);
        setData(res.data.data);
      } catch {
        toast.error('Failed to load submission status');
      } finally { setLoading(false); }
    };
    fetchStatus();

    // Poll every 30s for in-progress states
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={28} className="animate-spin" color={P.textMuted} /></div>;

  const state = data?.lifecycleState || 'draft';
  const st = STATUS_MAP[state] || STATUS_MAP.draft;
  const Icon = st.icon;

  return (
    <Page title="Submission Status" maxWidth={520}>
      <Card style={{ textAlign: 'center', padding: 16 }}>
        <Icon size={48} color={st.tone === 'success' ? P.success : st.tone === 'error' ? P.error : st.tone === 'brand' ? P.brand : P.textMuted} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <div style={{ fontSize: 14, color: P.textMuted, marginTop: 8 }}>{st.desc}</div>
      </Card>

      {data?.acknowledgmentNumber && (
        <Card variant="success">
          <Row label="Acknowledgment No." value={data.acknowledgmentNumber} bold />
          {data?.filedAt && <Row label="Filed At" value={new Date(data.filedAt).toLocaleString('en-IN')} />}
        </Card>
      )}

      {data?.errorMessage && (
        <Alert tone="error" title="Submission Error">
          {data.errorMessage}
        </Alert>
      )}

      {/* E-verification reminder with countdown */}
      {(state === 'eri_success' || state === 'submitted_to_eri') && (
        <Alert tone="warning" title="E-Verify Your Return">
          {data?.submittedAt && (() => {
            const deadline = new Date(new Date(data.submittedAt).getTime() + 30 * 86400000);
            const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));
            return (
              <div>
                <div style={{ marginBottom: 8 }}>
                  You must e-verify within <strong>{daysLeft} days</strong>, or your return is treated as not filed. Aadhaar OTP is the fastest method.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href="https://eportal.incometax.gov.in/iec/foservices/#/e-verify/user-details" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">E-Verify Now <ExternalLink size={12} /></Button>
                  </a>
                </div>
              </div>
            );
          })()}
        </Alert>
      )}

      {/* Task 10.6: PostFilingGuide for submitted/accepted filings */}
      {(state === 'eri_success' || state === 'submitted_to_eri') && (
        <PostFilingGuide
          filing={{
            lifecycleState: state,
            submittedAt: data?.submittedAt || data?.filedAt,
            assessmentYear: data?.assessmentYear,
          }}
          computation={data?.computation}
        />
      )}

      {/* Manual filing instructions */}
      {state === 'draft' && (
        <Alert tone="info" title="File Manually on ITD Portal">
          <ol style={{ paddingLeft: 20, margin: '4px 0 0', lineHeight: 1.7 }}>
            <li>Download your ITR JSON from the filing page</li>
            <li>Go to <a href="https://eportal.incometax.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: P.brand }}>eportal.incometax.gov.in</a></li>
            <li>Click e-File → Income Tax Returns → File Income Tax Return</li>
            <li>Select your AY and ITR type, choose "Upload JSON"</li>
            <li>Upload the JSON file, verify, and submit</li>
            <li>E-verify using Aadhaar OTP (fastest — 2 minutes)</li>
          </ol>
        </Alert>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </Button>
        {(state === 'draft' || state === 'eri_failed') && data?.filingId && (
          <Button variant="outline" onClick={() => {
            const route = data.itrType ? { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[data.itrType] || 'itr1' : 'itr1';
            navigate(`/filing/${filingId}/${route}`);
          }}>
            Edit Filing
          </Button>
        )}
        {state === 'eri_success' && (
          <Button variant="primary" onClick={() => navigate(`/acknowledgment/${filingId}`)}>
            <Download size={14} /> View Acknowledgment
          </Button>
        )}
      </div>
    </Page>
  );
}
