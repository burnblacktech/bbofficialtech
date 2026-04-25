/**
 * Dashboard — Compact, single-screen, no scroll
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Plus, ArrowRight, Shield, CheckCircle, AlertCircle, Clock, RefreshCw, Upload, Users, FolderOpen, Activity } from 'lucide-react';
import { itrService } from '../../services';
import { getCurrentAY, ayToFY, getDeadlineInfo } from '../../utils/assessmentYear';
import P from '../../styles/palette';

/* eslint-disable camelcase */
const STATE_MAP = {
  draft: { label: 'Draft', color: P.textMuted, Icon: Clock },
  ready_for_submission: { label: 'Ready', color: P.brand, Icon: CheckCircle },
  submitted_to_eri: { label: 'Submitted', color: P.brand, Icon: ArrowRight },
  eri_in_progress: { label: 'Processing', color: P.warning, Icon: Clock },
  eri_success: { label: 'Accepted', color: P.success, Icon: CheckCircle },
  eri_failed: { label: 'Failed', color: P.error, Icon: AlertCircle },
};
/* eslint-enable camelcase */

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const name = user?.fullName || 'User';
  const pan = user?.panNumber || user?.pan || profile?.pan || null;
  const panOk = !!(user?.panVerified || profile?.panVerified);

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => (await itrService.getUserITRs()).filings || [],
    staleTime: 30000,
  });

  const dl = getDeadlineInfo();

  return (
    <div style={S.page}>
      {/* Deadline banner */}
      {!dl.isPastDue && dl.daysLeft <= 120 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: dl.daysLeft <= 30 ? '#fef2f2' : '#fffbeb', border: `1px solid ${dl.daysLeft <= 30 ? '#fecaca' : '#fde68a'}`, borderRadius: 8, fontSize: 13, color: dl.daysLeft <= 30 ? P.error : P.warning, marginBottom: 12 }}>
          <Clock size={14} style={{ flexShrink: 0 }} />
          <span>Filing deadline: {dl.label} · {dl.daysLeft} days left{dl.daysLeft <= 30 ? ' — file now to avoid late fees' : ''}</span>
        </div>
      )}
      {dl.isPastDue && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: P.error, marginBottom: 12 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Deadline passed ({dl.label}). You can still file a belated return, but interest under Section 234A may apply.</span>
        </div>
      )}

      <div style={S.topRow}>
        <div>
          <h1 style={S.h1}>Welcome, {name.split(' ')[0]}</h1>
          <p style={S.sub}>AY {getCurrentAY()} (FY {ayToFY(getCurrentAY())})</p>
        </div>
        <button style={S.cta} onClick={() => navigate('/filing/start')}>
          <Plus size={18} /> File ITR
        </button>
      </div>

      <div style={S.chips}>
        <Chip icon={<Shield size={14} />} label="PAN" ok={panOk} detail={pan ? `${pan.substring(0, 5)}****${pan.substring(9)}` : 'Not set'} onClick={() => navigate('/itr/pan-verification')} />
        <Chip icon={<CheckCircle size={14} />} label="Profile" ok={!!user?.fullName} detail={user?.email || ''} onClick={() => navigate('/profile')} />
      </div>

      {/* Quick tools */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: '14px 18px', background: P.brandLight, border: `1px solid ${P.brand}40`, borderRadius: 10, cursor: 'pointer' }} onClick={() => navigate('/filing/start')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Upload size={15} style={{ color: P.brand }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary }}>{filings.length === 0 ? 'Quick Start with Form 16' : 'New Filing'}</span>
          </div>
          <div style={{ fontSize: 11, color: P.textMuted, lineHeight: 1.4 }}>
            {filings.length === 0 ? 'Upload Form 16 and auto-fill 80% of your filing' : 'Start a new ITR filing for this year'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '14px 18px', background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 10, cursor: 'pointer' }} onClick={() => navigate('/tax-calculator')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FileText size={15} style={{ color: P.secondary }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary }}>Tax Calculator</span>
          </div>
          <div style={{ fontSize: 11, color: P.textMuted, lineHeight: 1.4 }}>
            Compare old vs new regime instantly
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { icon: <Users size={13} />, label: 'Family', path: '/family', color: '#7c3aed' },
          { icon: <FolderOpen size={13} />, label: 'Documents', path: '/vault', color: P.secondary },
          { icon: <Activity size={13} />, label: 'Activity', path: '/activity', color: P.textMuted },
          { icon: <Shield size={13} />, label: 'Settings', path: '/profile', color: P.brand },
        ].map(l => (
          <div key={l.path} onClick={() => navigate(l.path)} style={{ flex: 1, padding: '8px 12px', background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = l.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.borderLight; }}>
            <span style={{ color: l.color }}>{l.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: P.textSecondary }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Your Filings</span>
          <span style={S.cardCount}>{filings.length}</span>
        </div>
        {isLoading ? (
          <p style={S.empty}>Loading...</p>
        ) : filings.length === 0 ? (
          <div style={S.emptyBox}>
            <FileText size={32} color={P.borderMedium} />
            <p style={S.emptyText}>Ready to file? It takes about 15 minutes for most salaried individuals.</p>
            <button style={{ ...S.cta, marginTop: 8 }} onClick={() => navigate('/filing/start')}>
              <Plus size={16} /> Start Filing
            </button>
          </div>
        ) : (
          <div style={S.list}>
            {filings.map(f => {
              const st = STATE_MAP[f.lifecycleState] || STATE_MAP.draft;
              const isSubmitted = f.lifecycleState === 'eri_success' || f.lifecycleState === 'submitted_to_eri';
              const isRevised = f.filingType === 'revised';
              return (
                <div key={f.id} style={S.row} onClick={() => {
                  const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[f.itrType] || 'itr1';
                  navigate(`/filing/${f.id}/${route}`);
                }}
                onMouseEnter={e => { e.currentTarget.style.background = P.bgCardHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={S.rowLeft}>
                    <FileText size={16} color={P.textLight} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={S.rowTitle}>AY {f.assessmentYear}</span>
                        {isRevised && <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 8 }}>REVISED</span>}
                      </div>
                      <div style={S.rowSub}>{f.taxpayerPan} · {f.itrType || 'ITR-1'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSubmitted && !isRevised && (
                      <button style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/filing/start', { state: { revised: true, assessmentYear: f.assessmentYear, taxpayerPan: f.taxpayerPan } }); }}>
                        <RefreshCw size={10} /> Revise
                      </button>
                    )}
                    {f.lifecycleState === 'eri_success' && (
                      <button style={{ fontSize: 11, fontWeight: 600, color: P.success, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/post-filing/${f.id}/refund`); }}>
                        Track
                      </button>
                    )}
                    <span style={{ ...S.badge, color: st.color, background: `${st.color}12` }}>
                      <st.Icon size={11} /> {st.label}
                    </span>
                    <ArrowRight size={14} color={P.borderMedium} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label, ok, detail, onClick }) {
  return (
    <div onClick={onClick} style={{ ...S.chip, borderColor: ok ? P.successBorder : P.borderLight }}>
      <span style={{ color: ok ? P.success : P.textLight }}>{icon}</span>
      <div>
        <div style={S.chipLabel}>{label}: {ok ? 'Done' : 'Pending'}</div>
        <div style={S.chipDetail}>{detail}</div>
      </div>
    </div>
  );
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 56px - 48px)', overflow: 'hidden' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 20, fontWeight: 700, color: P.textPrimary, margin: 0 },
  sub: { fontSize: 13, color: P.textMuted, margin: 0 },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: P.brand, color: P.textWhite, border: `1px solid ${P.brandHover}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(37,99,235,0.3)' },
  chips: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  chip: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s' },
  chipLabel: { fontSize: 12, fontWeight: 600, color: P.textPrimary },
  chipDetail: { fontSize: 11, color: P.textLight },
  card: { flex: 1, background: P.bgCard, border: `1px solid ${P.borderLight}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${P.borderLight}` },
  cardTitle: { fontSize: 14, fontWeight: 600, color: P.textPrimary },
  cardCount: { fontSize: 12, color: P.textLight },
  list: { flex: 1, overflowY: 'auto' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${P.bgMuted}`, cursor: 'pointer', transition: 'background 0.1s' },
  rowLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  rowTitle: { fontSize: 13, fontWeight: 600, color: P.textPrimary },
  rowSub: { fontSize: 11, color: P.textLight },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  empty: { padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 },
  emptyBox: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: P.textLight },
};
