/**
 * User Dashboard - MVP
 * Shows: profile status, existing filings, and a clear "File ITR" action.
 * No fake data, no empty cards.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Plus, ArrowRight, User, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { itrService } from '../../services';
import { getCurrentAY, ayToFY } from '../../utils/assessmentYear';
import { tokens } from '../../styles/tokens';

const STATE_LABELS = {
  'draft': { label: 'Draft', color: tokens.colors.neutral[600], icon: Clock },
  'ready_for_submission': { label: 'Ready', color: tokens.colors.accent[600], icon: CheckCircle },
  'submitted_to_eri': { label: 'Submitted', color: tokens.colors.info[600], icon: ArrowRight },
  'eri_in_progress': { label: 'Processing', color: tokens.colors.warning[600], icon: Clock },
  'eri_success': { label: 'Accepted', color: tokens.colors.success[600], icon: CheckCircle },
  'eri_failed': { label: 'Failed', color: tokens.colors.error[600], icon: AlertCircle },
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userName = user?.fullName || user?.name || 'User';
  const panVerified = user?.panVerified || profile?.panVerified || false;
  const panNumber = user?.panNumber || user?.pan || profile?.pan || null;

  // Fetch filings from backend
  const { data: filingsData, isLoading } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => {
      const res = await itrService.getUserITRs();
      return res.filings || [];
    },
    staleTime: 30 * 1000,
  });

  const filings = filingsData || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tokens.colors.neutral[50], padding: tokens.spacing.xl }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: tokens.spacing.xl }}>
          <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.xs }}>
            Welcome, {userName}
          </h1>
          <p style={{ fontSize: tokens.typography.fontSize.base, color: tokens.colors.neutral[500] }}>
            AY {getCurrentAY()} (FY {ayToFY(getCurrentAY())})
          </p>
        </div>

        {/* Profile Status */}
        <div style={{
          display: 'flex', gap: tokens.spacing.md, marginBottom: tokens.spacing.xl, flexWrap: 'wrap',
        }}>
          <StatusChip
            icon={User} label="Profile"
            status={user?.fullName ? 'done' : 'pending'}
            detail={user?.email}
            onClick={() => navigate('/profile')}
          />
          <StatusChip
            icon={Shield} label="PAN"
            status={panVerified ? 'done' : 'pending'}
            detail={panNumber ? `${panNumber.substring(0, 5)}****${panNumber.substring(9)}` : 'Not verified'}
            onClick={() => navigate('/itr/pan-verification')}
          />
        </div>

        {/* Start Filing CTA */}
        <div
          onClick={() => navigate('/filing/start')}
          style={{
            padding: tokens.spacing.lg,
            backgroundColor: tokens.colors.accent[600],
            borderRadius: tokens.borderRadius.lg,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: tokens.spacing.xl,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
            <div style={{
              width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: tokens.borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, color: '#fff', marginBottom: '2px' }}>
                File Income Tax Return
              </p>
              <p style={{ fontSize: tokens.typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' }}>
                ITR-1 to ITR-4 · Guided step-by-step
              </p>
            </div>
          </div>
          <ArrowRight size={24} color="#fff" />
        </div>

        {/* Filings List */}
        <div style={{
          backgroundColor: tokens.colors.neutral.white,
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.neutral[200]}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: tokens.spacing.lg,
            borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
              Your Filings
            </h2>
            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[500] }}>
              {filings.length} filing{filings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.colors.neutral[500] }}>
              Loading filings...
            </div>
          ) : filings.length === 0 ? (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
              <FileText size={40} color={tokens.colors.neutral[300]} style={{ margin: '0 auto 12px' }} />
              <p style={{ color: tokens.colors.neutral[500], marginBottom: tokens.spacing.sm }}>No filings yet</p>
              <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[400] }}>
                Click "File Income Tax Return" above to get started
              </p>
            </div>
          ) : (
            <div>
              {filings.map((filing) => {
                const state = STATE_LABELS[filing.lifecycleState] || STATE_LABELS.draft;
                const StateIcon = state.icon;
                return (
                  <div
                    key={filing.id}
                    onClick={() => {
                      // Route to the correct ITR flow based on filing's ITR type
                      const itrType = filing.itrType || 'ITR-1';
                      const routeMap = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' };
                      navigate(`/filing/${filing.id}/${routeMap[itrType] || 'itr1'}`);
                    }}
                    style={{
                      padding: tokens.spacing.lg,
                      borderBottom: `1px solid ${tokens.colors.neutral[100]}`,
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = tokens.colors.neutral[50]}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                      <FileText size={20} color={tokens.colors.neutral[400]} />
                      <div>
                        <p style={{ fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[900] }}>
                          AY {filing.assessmentYear}
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[500] }}>
                          PAN: {filing.taxpayerPan}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: `2px ${tokens.spacing.sm}`,
                        backgroundColor: `${state.color}15`,
                        color: state.color,
                        borderRadius: tokens.borderRadius.full,
                        fontSize: tokens.typography.fontSize.xs,
                        fontWeight: tokens.typography.fontWeight.medium,
                      }}>
                        <StateIcon size={12} />
                        {state.label}
                      </span>
                      <ArrowRight size={16} color={tokens.colors.neutral[400]} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: tokens.spacing.md, marginTop: tokens.spacing.xl, flexWrap: 'wrap' }}>
          <QuickLink label="Profile Settings" onClick={() => navigate('/profile')} />
          <QuickLink label="Session Management" onClick={() => navigate('/sessions')} />
        </div>
      </div>
    </div>
  );
};

// ── Small Components ──

const StatusChip = ({ icon: Icon, label, status, detail, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
      backgroundColor: tokens.colors.neutral.white,
      border: `1px solid ${status === 'done' ? tokens.colors.success[200] : tokens.colors.neutral[200]}`,
      borderRadius: tokens.borderRadius.md,
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }}
  >
    <Icon size={16} color={status === 'done' ? tokens.colors.success[600] : tokens.colors.neutral[400]} />
    <div>
      <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[900] }}>
        {label}: {status === 'done' ? '✓' : 'Pending'}
      </p>
      <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500] }}>{detail}</p>
    </div>
  </div>
);

const QuickLink = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
      backgroundColor: tokens.colors.neutral.white,
      border: `1px solid ${tokens.colors.neutral[200]}`,
      borderRadius: tokens.borderRadius.md,
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.neutral[700],
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }}
  >
    {label}
  </button>
);

export default UserDashboard;
