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
      navigate('/itr/pan-verification', { replace: true });
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
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', height: '80vh', gap: 1, background: 'var(--border-light)' }}>
      <div style={{ background: 'var(--bg-card)', padding: 12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 28, borderRadius: 6, background: 'var(--bg-muted)', margin: '6px 0', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />)}
      </div>
      <div style={{ background: 'var(--bg-page)', padding: 24 }}>
        <div style={{ width: 180, height: 18, borderRadius: 4, background: 'var(--bg-muted)', marginBottom: 16, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        {[1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 8, background: 'var(--bg-muted)', marginBottom: 10, animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.12}s` }} />)}
      </div>
      <div style={{ background: 'var(--bg-card)', padding: 14 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 16, borderRadius: 4, background: 'var(--bg-muted)', marginBottom: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />)}
      </div>
    </div>
  );
}

function getCurrentAY() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-${String(year + 1).slice(2)}`;
}
