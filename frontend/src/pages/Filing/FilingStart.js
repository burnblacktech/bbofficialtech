/**
 * FilingStart — Creates a filing and redirects to the editor immediately.
 * Skips the ITR Determination Wizard. ITR type auto-detects from data.
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FilingStart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const creating = useRef(false);

  useEffect(() => {
    if (creating.current || !user) return;
    creating.current = true;

    const state = location.state || {};
    const ay = state.assessmentYear || getCurrentAY();
    const pan = state.taxpayerPan || user.panNumber || user.verifiedPans?.[0]?.pan;

    if (!pan) {
      navigate('/pan-verification', { replace: true });
      return;
    }

    api.get('/filings')
      .then(({ data }) => {
        const existing = data.data?.find(f => f.assessmentYear === ay && !['eri_success'].includes(f.lifecycleState));
        if (existing) {
          navigate(`/filing/${existing.id}`, { replace: true });
          return;
        }

        const body = { assessmentYear: ay, taxpayerPan: pan, itrType: 'ITR-1' };
        if (state.revised) {
          body.filingType = 'revised';
          body.originalAckNumber = state.originalAckNumber || '';
        }

        return api.post('/filings', body);
      })
      .then((res) => {
        if (res) {
          const filing = res.data.data;
          navigate(`/filing/${filing.id}`, { replace: true });
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Failed to create filing');
        navigate('/dashboard', { replace: true });
      });
  }, [user, navigate, location.state]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="ds-spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Setting up your filing...</p>
      </div>
    </div>
  );
}

function getCurrentAY() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-${String(year + 1).slice(2)}`;
}
