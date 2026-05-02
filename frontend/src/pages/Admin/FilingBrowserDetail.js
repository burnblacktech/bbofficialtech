/**
 * FilingBrowserDetail — Full detail view for a single filing.
 * Shows filing metadata, user info, payment info, submission history,
 * ERI data, and a "View JSON" button that opens the JsonViewer modal.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RefreshCw, Code, FileText, User, CreditCard, Clock, Radio } from 'lucide-react';
import { Card, Button, Badge, Row, Section, Divider } from '../../components/ds';
import adminService from '../../services/adminService';
import JsonViewer from './components/JsonViewer';
import P from '../../styles/palette';

/* eslint-disable camelcase */
const STATE_TONES = {
  draft: 'default', review_pending: 'warning', reviewed: 'info',
  approved_by_ca: 'info', submitted_to_eri: 'info', eri_in_progress: 'warning',
  eri_success: 'success', eri_failed: 'error',
};
/* eslint-enable camelcase */
const PAYMENT_TONES = { paid: 'success', unpaid: 'warning', free: 'default' };

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function money(paise) {
  if (paise == null) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function FilingBrowserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showJson, setShowJson] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-filing-browser-detail', id],
    queryFn: () => adminService.getFilingBrowserDetail(id).then((r) => r.data || r),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Loader2 size={24} className="animate-spin" color={P.textMuted} />
      </div>
    );
  }

  if (isError) {
    const is404 = error?.response?.status === 404;
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate('/admin/filing-browser')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back to Filing Browser
        </Button>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: P.error, marginBottom: 12 }}>
            {is404 ? 'Filing not found' : 'Failed to load filing detail'}
          </div>
          {!is404 && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const { filing, user, order, paymentStatus } = data || {};
  if (!filing) return null;

  const snapshots = filing.snapshots || [];
  const hasERI = filing.ackNumber || filing.acknowledgmentNumber || filing.verificationStatus;

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/filing-browser')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Filing Browser
      </Button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Filing Detail</h1>
        <Badge tone={STATE_TONES[filing.lifecycleState] || 'default'}>{filing.lifecycleState}</Badge>
        <Badge tone={PAYMENT_TONES[paymentStatus] || 'default'}>{paymentStatus}</Badge>
        {filing.deletedAt && <Badge tone="error">Deleted</Badge>}
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="outline" size="sm" onClick={() => setShowJson(true)}>
            <Code size={13} /> View JSON
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Filing Metadata */}
        <Card>
          <Section title="Filing Metadata" icon={<FileText size={14} />}>
            <Row label="Filing ID" value={filing.id} />
            <Row label="Taxpayer PAN" value={filing.taxpayerPan} />
            <Row label="Assessment Year" value={filing.assessmentYear} />
            <Row label="ITR Type" value={filing.itrType || '—'} />
            <Row label="Filing Type" value={filing.filingType || 'original'} />
            <Row label="Created" value={fmt(filing.createdAt)} />
            <Row label="Updated" value={fmt(filing.updatedAt)} />
            {filing.deletedAt && <Row label="Deleted" value={fmt(filing.deletedAt)} />}
          </Section>
        </Card>

        {/* User Info */}
        <Card>
          <Section title="User Info" icon={<User size={14} />}>
            {user ? (
              <>
                <Row label="User ID" value={user.id} />
                <Row label="Full Name" value={user.fullName || '—'} />
                <Row label="Email" value={user.email || '—'} />
                <Row label="PAN Number" value={user.panNumber || '—'} />
              </>
            ) : (
              <div style={{ fontSize: 13, color: P.textMuted, padding: '8px 0' }}>No user data</div>
            )}
          </Section>
        </Card>
      </div>

      {/* Payment Info */}
      {order && (
        <Card style={{ marginTop: 16 }}>
          <Section title="Payment Info" icon={<CreditCard size={14} />}>
            <Row label="Order ID" value={order.id} />
            <Row label="Plan" value={order.planId || '—'} />
            <Row label="Amount" value={money(order.amount)} />
            <Row label="Discount" value={money(order.discount)} />
            <Row label="GST" value={money(order.gstAmount)} />
            <Row label="Total" value={money(order.totalAmount)} />
            <Row label="Status">
              <Badge tone={order.status === 'paid' ? 'success' : 'warning'}>{order.status}</Badge>
            </Row>
            <Row label="Invoice" value={order.invoiceNumber || '—'} />
            <Row label="Paid At" value={fmt(order.paidAt)} />
          </Section>
        </Card>
      )}

      {/* Submission History */}
      {snapshots.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <Section title="Submission History" icon={<Clock size={14} />} cap={`${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {snapshots.map((snap, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: i < snapshots.length - 1 ? `1px solid ${P.borderLight}` : 'none',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: P.textLight, fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 140 }}>
                    {fmt(snap.timestamp || snap.createdAt)}
                  </span>
                  {snap.state && <Badge tone={STATE_TONES[snap.state] || 'default'}>{snap.state}</Badge>}
                  {snap.comment && <span style={{ color: P.textMuted }}>{snap.comment}</span>}
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}

      {/* ERI Data */}
      {hasERI && (
        <Card style={{ marginTop: 16 }}>
          <Section title="ERI Data" icon={<Radio size={14} />}>
            <Row label="Ack Number" value={filing.ackNumber || filing.acknowledgmentNumber || '—'} />
            <Row label="Verification Status" value={filing.verificationStatus || '—'} />
            <Row label="Verification Method" value={filing.verificationMethod || '—'} />
          </Section>
        </Card>
      )}

      {/* JSON Viewer Modal */}
      {showJson && (
        <JsonViewer data={filing.jsonPayload} onClose={() => setShowJson(false)} />
      )}
    </div>
  );
}
