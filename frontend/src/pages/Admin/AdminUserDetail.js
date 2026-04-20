/**
 * AdminUserDetail — User profile, filings, payments, sessions, actions
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, FileText, DollarSign, Clock, UserX, UserCheck, Key, Loader2 } from 'lucide-react';
import { Card, Button, Badge, Row, Divider, Section, Alert } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => (await api.get(`/admin/users/${userId}`)).data.data,
  });

  const deactivateMut = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); toast.success('User deactivated'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const reactivateMut = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/reactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); toast.success('User reactivated'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const resetPwMut = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/reset-password`),
    onSuccess: () => toast.success('Password reset link sent'),
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color={P.textMuted} /></div>;
  if (!data) return <Alert tone="error">User not found</Alert>;

  const { user: u, filingSummary: fs, paymentSummary: ps, sessionInfo: si } = data;

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/users')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Users
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{u.fullName || 'User'}</h1>
        <Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge>
        <Badge tone={u.role === 'SUPER_ADMIN' ? 'error' : 'default'}>{u.role}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Profile */}
        <Card>
          <Section title="Profile" icon={<Shield size={14} />}>
            <Row label="Email" value={u.email} />
            <Row label="Phone" value={u.phone || '—'} />
            <Row label="PAN" value={u.panNumber || '—'} mono />
            <Row label="PAN Verified" bold><Badge tone={u.panVerified ? 'success' : 'warning'}>{u.panVerified ? 'Yes' : 'No'}</Badge></Row>
            <Row label="DOB" value={u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString('en-IN') : '—'} />
            <Row label="Auth" value={u.authProvider} />
            <Row label="Joined" value={new Date(u.createdAt).toLocaleDateString('en-IN')} />
          </Section>
        </Card>

        {/* Actions */}
        <Card>
          <Section title="Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {u.status === 'active' && u.role !== 'SUPER_ADMIN' && (
                <Button variant="danger" size="sm" loading={deactivateMut.isPending} onClick={() => deactivateMut.mutate()}>
                  <UserX size={13} /> Deactivate Account
                </Button>
              )}
              {u.status === 'disabled' && (
                <Button variant="primary" size="sm" loading={reactivateMut.isPending} onClick={() => reactivateMut.mutate()}>
                  <UserCheck size={13} /> Reactivate Account
                </Button>
              )}
              {u.authProvider !== 'google' && (
                <Button variant="outline" size="sm" loading={resetPwMut.isPending} onClick={() => resetPwMut.mutate()}>
                  <Key size={13} /> Send Password Reset
                </Button>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Row label="Active Sessions" value={si?.activeSessions || 0} bold />
              {si?.lastSession && <Row label="Last Active" value={si.lastSession.deviceInfo || '—'} />}
            </div>
          </Section>
        </Card>
      </div>

      {/* Filings */}
      <Card style={{ marginTop: 16 }}>
        <Section title="Filings" icon={<FileText size={14} />} cap={`${fs?.total || 0} total`}>
          {fs?.byState && Object.entries(fs.byState).map(([state, count]) => (
            <Row key={state} label={state} value={count} />
          ))}
          {fs?.recent?.length > 0 && (
            <>
              <Divider />
              <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, marginBottom: 4 }}>Recent</div>
              {fs.recent.map(f => (
                <Row key={f.id} label={`AY ${f.assessmentYear} · ${f.itrType}`}>
                  <Badge tone={f.lifecycleState === 'eri_success' ? 'success' : f.lifecycleState === 'draft' ? 'default' : 'warning'}>{f.lifecycleState}</Badge>
                </Row>
              ))}
            </>
          )}
        </Section>
      </Card>

      {/* Payments */}
      <Card style={{ marginTop: 16 }}>
        <Section title="Payments" icon={<DollarSign size={14} />} cap={`₹${(ps?.totalPaid || 0).toLocaleString('en-IN')}`}>
          <Row label="Paid Orders" value={ps?.paidOrders || 0} />
          <Row label="Total Paid" value={`₹${(ps?.totalPaid || 0).toLocaleString('en-IN')}`} bold />
          {ps?.recent?.length > 0 && (
            <>
              <Divider />
              {ps.recent.map(o => (
                <Row key={o.id} label={o.planId}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{(o.totalAmount || 0).toLocaleString('en-IN')}</span>
                  <Badge tone={o.status === 'paid' ? 'success' : 'warning'} style={{ marginLeft: 6 }}>{o.status}</Badge>
                </Row>
              ))}
            </>
          )}
        </Section>
      </Card>
    </div>
  );
}
