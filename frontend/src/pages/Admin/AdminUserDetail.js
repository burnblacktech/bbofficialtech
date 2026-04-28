/**
 * AdminUserDetail — User profile, filing summary, payment summary, sessions,
 * action buttons with confirmation dialogs, and audit trail tab.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 6.1, 7.1
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  DollarSign,
  UserX,
  UserCheck,
  Key,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import { Card, Button, Badge, Row, Divider, Section, Alert } from '../../components/ds';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

const ROLE_TONES = { SUPER_ADMIN: 'error', CA: 'warning', PREPARER: 'info', END_USER: 'default' };

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // ── User detail state ──
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Action states ──
  const [actionLoading, setActionLoading] = useState(null); // 'deactivate' | 'reactivate' | 'resetPw'
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, title, message }

  // ── Audit trail state ──
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit'
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditEventType, setAuditEventType] = useState('');

  // ── Fetch user detail ──
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUserDetail(userId);
      setData(res.data || res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  // ── Fetch audit trail ──
  const fetchAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = { page: auditPage, limit: 20 };
      if (auditEventType) params.eventType = auditEventType;
      const res = await adminService.getUserAudit(userId, params);
      setAuditData(res.data || res);
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, [userId, auditPage, auditEventType]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab, fetchAudit]);

  // ── Actions ──
  const handleDeactivate = async () => {
    setConfirmDialog(null);
    setActionLoading('deactivate');
    try {
      await adminService.deactivateUser(userId);
      toast.success('User deactivated');
      fetchUser();
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to deactivate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setConfirmDialog(null);
    setActionLoading('reactivate');
    try {
      await adminService.reactivateUser(userId);
      toast.success('User reactivated');
      fetchUser();
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to reactivate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    setConfirmDialog(null);
    setActionLoading('resetPw');
    try {
      await adminService.resetPassword(userId);
      toast.success('Password reset link sent');
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to send reset');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Loader2 size={24} className="animate-spin" color={P.textMuted} />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate('/admin/users')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back to Users
        </Button>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: P.error, marginBottom: 12 }}>{error}</div>
          <Button variant="outline" onClick={fetchUser}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return <Alert tone="error">User not found</Alert>;

  const { user: u, filingSummary: fs, paymentSummary: ps, sessionInfo: si } = data;

  return (
    <div>
      {/* Confirmation dialog overlay */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          confirmTone={confirmDialog.confirmTone}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <Button variant="ghost" onClick={() => navigate('/admin/users')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Users
      </Button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{u.fullName || 'User'}</h1>
        <Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge>
        <Badge tone={ROLE_TONES[u.role] || 'default'}>{u.role}</Badge>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${P.borderLight}` }}>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')}>
          Audit Trail
        </TabButton>
      </div>

      {activeTab === 'overview' ? (
        <OverviewTab
          u={u}
          fs={fs}
          ps={ps}
          si={si}
          actionLoading={actionLoading}
          onDeactivate={() =>
            setConfirmDialog({
              title: 'Deactivate User',
              message: `Are you sure you want to deactivate ${u.fullName || u.email}? This will revoke all active sessions.`,
              confirmLabel: 'Deactivate',
              confirmTone: 'error',
              onConfirm: handleDeactivate,
            })
          }
          onReactivate={() =>
            setConfirmDialog({
              title: 'Reactivate User',
              message: `Are you sure you want to reactivate ${u.fullName || u.email}?`,
              confirmLabel: 'Reactivate',
              confirmTone: 'success',
              onConfirm: handleReactivate,
            })
          }
          onResetPassword={() =>
            setConfirmDialog({
              title: 'Reset Password',
              message: `Send a password reset link to ${u.email}?`,
              confirmLabel: 'Send Reset Link',
              confirmTone: 'primary',
              onConfirm: handleResetPassword,
            })
          }
        />
      ) : (
        <AuditTab
          auditData={auditData}
          auditLoading={auditLoading}
          auditPage={auditPage}
          setAuditPage={setAuditPage}
          auditEventType={auditEventType}
          setAuditEventType={(v) => { setAuditEventType(v); setAuditPage(1); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Overview Tab
// ═══════════════════════════════════════════════════════
function OverviewTab({ u, fs, ps, si, actionLoading, onDeactivate, onReactivate, onResetPassword }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Profile card */}
        <Card>
          <Section title="Profile" icon={<Shield size={14} />}>
            <Row label="Email" value={u.email} />
            <Row label="Phone" value={u.phone || '—'} />
            <Row label="PAN" value={u.panNumber || '—'} mono />
            <Row label="PAN Verified" bold>
              <Badge tone={u.panVerified ? 'success' : 'warning'}>{u.panVerified ? 'Yes' : 'No'}</Badge>
            </Row>
            <Row label="DOB" value={u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString('en-IN') : '—'} />
            <Row label="Auth Provider" value={u.authProvider} />
            <Row label="Email Verified">
              <Badge tone={u.emailVerified ? 'success' : 'warning'}>{u.emailVerified ? 'Yes' : 'No'}</Badge>
            </Row>
            <Row label="Joined" value={new Date(u.createdAt).toLocaleDateString('en-IN')} />
            <Row label="Updated" value={new Date(u.updatedAt).toLocaleDateString('en-IN')} />
          </Section>
        </Card>

        {/* Actions + Session info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <Section title="Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {u.status === 'active' && u.role !== 'SUPER_ADMIN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading === 'deactivate'}
                    onClick={onDeactivate}
                  >
                    <UserX size={13} style={{ marginRight: 4 }} /> Deactivate Account
                  </Button>
                )}
                {u.status === 'disabled' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading === 'reactivate'}
                    onClick={onReactivate}
                  >
                    <UserCheck size={13} style={{ marginRight: 4 }} /> Reactivate Account
                  </Button>
                )}
                {u.authProvider !== 'google' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading === 'resetPw'}
                    onClick={onResetPassword}
                  >
                    <Key size={13} style={{ marginRight: 4 }} /> Send Password Reset
                  </Button>
                )}
              </div>
            </Section>
          </Card>

          <Card>
            <Section title="Sessions" icon={<Monitor size={14} />}>
              <Row label="Active Sessions" value={si?.activeSessions ?? 0} bold />
              <Row
                label="Last Active"
                value={si?.lastSession?.lastActive ? formatTimestamp(si.lastSession.lastActive) : '—'}
              />
              {si?.lastSession?.deviceInfo && (
                <Row label="Device" value={si.lastSession.deviceInfo} />
              )}
            </Section>
          </Card>
        </div>
      </div>

      {/* Filing summary */}
      <Card style={{ marginTop: 16 }}>
        <Section title="Filing Summary" icon={<FileText size={14} />} cap={`${fs?.total || 0} total`}>
          {renderByState(fs?.byState)}
          {fs?.recentFilings?.length > 0 && (
            <>
              <Divider />
              <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, marginBottom: 4 }}>
                Recent Filings
              </div>
              {fs.recentFilings.map((f) => (
                <Row key={f.id} label={`AY ${f.assessmentYear} · ${f.itrType}`}>
                  <Badge
                    tone={
                      f.lifecycleState === 'eri_success'
                        ? 'success'
                        : f.lifecycleState === 'eri_failed'
                          ? 'error'
                          : f.lifecycleState === 'draft'
                            ? 'default'
                            : 'warning'
                    }
                  >
                    {f.lifecycleState}
                  </Badge>
                </Row>
              ))}
            </>
          )}
        </Section>
      </Card>

      {/* Payment summary */}
      <Card style={{ marginTop: 16 }}>
        <Section
          title="Payment Summary"
          icon={<DollarSign size={14} />}
          cap={`₹${(ps?.totalPaid || 0).toLocaleString('en-IN')}`}
        >
          <Row label="Paid Orders" value={ps?.paidOrders ?? 0} />
          <Row label="Total Paid" value={`₹${(ps?.totalPaid || 0).toLocaleString('en-IN')}`} bold />
          {ps?.recentOrders?.length > 0 && (
            <>
              <Divider />
              <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, marginBottom: 4 }}>
                Recent Orders
              </div>
              {ps.recentOrders.map((o) => (
                <Row key={o.id} label={o.planId || '—'}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                  <Badge tone={o.status === 'paid' ? 'success' : 'warning'} style={{ marginLeft: 6 }}>
                    {o.status}
                  </Badge>
                </Row>
              ))}
            </>
          )}
        </Section>
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// Audit Trail Tab
// ═══════════════════════════════════════════════════════

function AuditTab({ auditData, auditLoading, auditPage, setAuditPage, auditEventType, setAuditEventType }) {
  const events = auditData?.events || auditData?.auditEvents || [];
  const totalPages = auditData?.totalPages || 1;
  const total = auditData?.total || 0;

  return (
    <div>
      {/* Event type filter */}
      <div style={{ marginBottom: 12 }}>
        <input
          className="ds-input"
          value={auditEventType}
          onChange={(e) => setAuditEventType(e.target.value)}
          placeholder="Filter by event type..."
          style={{ maxWidth: 300 }}
        />
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {auditLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={20} className="animate-spin" color={P.textMuted} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: P.textMuted, fontSize: 13 }}>
            No audit events found
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: P.bgMuted, borderBottom: `1px solid ${P.borderLight}` }}>
                    {['Event Type', 'Entity Type', 'Entity ID', 'Timestamp', 'Details'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: P.textMuted,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt) => (
                    <tr key={evt.id} style={{ borderBottom: `1px solid ${P.borderLight}` }}>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge tone={eventTone(evt.eventType)}>{evt.eventType}</Badge>
                      </td>
                      <td style={{ padding: '10px 12px', color: P.textMuted }}>{evt.entityType || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {evt.entityId ? evt.entityId.slice(0, 8) + '…' : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: P.textLight, fontSize: 11, whiteSpace: 'nowrap' }}>
                        {formatTimestamp(evt.createdAt)}
                      </td>
                      <td style={{ padding: '10px 12px', color: P.textMuted, fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {evt.metadata ? JSON.stringify(evt.metadata).slice(0, 80) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderTop: `1px solid ${P.borderLight}`,
                }}
              >
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  style={pgBtn}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12, color: P.textMuted }}>
                  Page {auditPage} of {totalPages} ({total} events)
                </span>
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
                  disabled={auditPage >= totalPages}
                  style={pgBtn}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Confirmation Dialog
// ═══════════════════════════════════════════════════════

function ConfirmDialog({ title, message, confirmLabel, confirmTone, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <Card
        style={{ padding: 24, maxWidth: 400, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={18} color={confirmTone === 'error' ? P.error : P.brand} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        </div>
        <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={confirmTone === 'error' ? 'outline' : 'primary'}
            size="sm"
            onClick={onConfirm}
            style={confirmTone === 'error' ? { color: P.error, borderColor: P.error } : {}}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab Button
// ═══════════════════════════════════════════════════════

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? P.brand : P.textMuted,
        background: 'none',
        border: 'none',
        borderBottom: active ? `2px solid ${P.brand}` : '2px solid transparent',
        cursor: 'pointer',
        minHeight: 'auto',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

function renderByState(byState) {
  if (!byState) return null;
  // Handle both array format [{lifecycleState, count}] and object format {state: count}
  if (Array.isArray(byState)) {
    return byState.map((s) => (
      <Row key={s.lifecycleState} label={s.lifecycleState} value={s.count} />
    ));
  }
  return Object.entries(byState).map(([state, count]) => (
    <Row key={state} label={state} value={count} />
  ));
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventTone(eventType) {
  if (!eventType) return 'default';
  const upper = eventType.toUpperCase();
  if (upper.includes('ERROR') || upper.includes('FAIL')) return 'error';
  if (upper.includes('LOGIN') || upper.includes('SUCCESS')) return 'success';
  if (upper.includes('ADMIN') || upper.includes('DEACTIVAT')) return 'warning';
  return 'default';
}

const pgBtn = {
  background: 'none',
  border: `1px solid ${P.borderMedium}`,
  borderRadius: 6,
  padding: '4px 8px',
  cursor: 'pointer',
  minHeight: 'auto',
  minWidth: 'auto',
};
