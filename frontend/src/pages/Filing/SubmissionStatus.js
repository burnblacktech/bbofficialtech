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

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="ff-btn ff-btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        {state === 'eri_success' && (
          <button className="ff-btn ff-btn-primary" onClick={() => navigate(`/acknowledgment/${filingId}`)}>
            <Download size={15} /> View Acknowledgment
          </button>
        )}
      </div>
    </div>
  );
}
