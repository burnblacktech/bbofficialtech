/**
 * Filing History — View all past filings
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ArrowLeft, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { itrService } from '../../services';
import P from '../../styles/palette';
import '../Filing/filing-flow.css';

/* eslint-disable camelcase */
const STATES = {
  draft: { label: 'Draft', color: P.textMuted, Icon: Clock },
  ready_for_submission: { label: 'Ready', color: P.brand, Icon: CheckCircle },
  submitted_to_eri: { label: 'Submitted', color: P.brand, Icon: ArrowRight },
  eri_in_progress: { label: 'Processing', color: P.warning, Icon: Clock },
  eri_success: { label: 'Accepted', color: P.success, Icon: CheckCircle },
  eri_failed: { label: 'Failed', color: P.error, Icon: AlertCircle },
};
/* eslint-enable camelcase */

export default function FilingHistory() {
  const navigate = useNavigate();
  const { data: filings = [], isLoading } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => (await itrService.getUserITRs()).filings || [],
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="ff-btn ff-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, padding: '4px 0' }}>
        <ArrowLeft size={14} /> Dashboard
      </button>
      <h1 className="step-title">Filing History</h1>
      <p className="step-desc">All your ITR filings</p>

      {isLoading ? (
        <div className="step-card" style={{ textAlign: 'center', padding: 32, color: P.textMuted }}>Loading...</div>
      ) : filings.length === 0 ? (
        <div className="step-card" style={{ textAlign: 'center', padding: 32 }}>
          <FileText size={32} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: P.textMuted, fontSize: 14 }}>No filings yet</p>
          <button className="ff-btn ff-btn-primary" onClick={() => navigate('/filing/start')} style={{ marginTop: 12 }}>File ITR</button>
        </div>
      ) : (
        filings.map(f => {
          const st = STATES[f.lifecycleState] || STATES.draft;
          const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[f.itrType] || 'itr1';
          return (
            <div key={f.id} className="step-card" style={{ cursor: 'pointer', marginBottom: 8 }}
              onClick={() => navigate(`/filing/${f.id}/${route}`)}>
              <div className="ff-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color={P.textLight} />
                  <div>
                    <div className="ff-item-name">AY {f.assessmentYear} · {f.itrType || 'ITR-1'}</div>
                    <div className="ff-item-detail">PAN: {f.taxpayerPan}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: st.color, background: `${st.color}12` }}>
                    <st.Icon size={12} /> {st.label}
                  </span>
                  <ArrowRight size={14} color={P.borderMedium} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
