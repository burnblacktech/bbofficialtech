/**
 * Filing History — View all past filings
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ArrowLeft, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { itrService } from '../../services';
import { Card, Button, Spinner } from '../../components/ds';
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
      <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, padding: '4px 0' }}>
        <ArrowLeft size={14} /> Dashboard
      </Button>
      <h1 className="step-title">Filing History</h1>
      <p className="step-desc">All your ITR filings</p>

      {isLoading ? (
        <Card style={{ textAlign: 'center', padding: 16, color: P.textMuted }}><Spinner /> Loading...</Card>
      ) : filings.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 16 }}>
          <FileText size={32} color={P.borderMedium} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: P.textMuted, fontSize: 14 }}>No filings yet</p>
          <Button variant="primary" onClick={() => navigate('/filing/start')} style={{ marginTop: 12 }}>File ITR</Button>
        </Card>
      ) : (
        filings.map(f => {
          const st = STATES[f.lifecycleState] || STATES.draft;
          const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[f.itrType] || 'itr1';
          return (
            <Card key={f.id} style={{ cursor: 'pointer', marginBottom: 8 }} onClick={() => navigate(`/filing/${f.id}/${route}`)}>
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
            </Card>
          );
        })
      )}
    </div>
  );
}
