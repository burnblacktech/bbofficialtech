/**
 * RefundTracker — Track refund status after filing
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Page, Card, Row, Badge, Alert, Divider } from '../../components/ds';
import api from '../../services/api';
import P from '../../styles/palette';

const STATUS_CONFIG = {
  processed: { icon: Clock, tone: 'info', label: 'Processed', desc: 'CPC has processed your return. Refund is being issued.' },
  issued: { icon: Clock, tone: 'warning', label: 'Issued', desc: 'Refund has been issued by ITD. Awaiting bank credit.' },
  credited: { icon: CheckCircle, tone: 'success', label: 'Credited', desc: 'Refund has been credited to your bank account.' },
  failed: { icon: AlertCircle, tone: 'error', label: 'Failed', desc: 'Refund could not be processed.' },
};

export default function RefundTracker() {
  const { filingId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['refund-status', filingId],
    queryFn: async () => (await api.get(`/post-filing/${filingId}/refund-status`)).data.data,
    refetchInterval: 60000,
  });

  const { data: summary } = useQuery({
    queryKey: ['post-filing-summary', filingId],
    queryFn: async () => (await api.get(`/post-filing/${filingId}/summary`)).data.data,
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color={P.textMuted} /></div>;

  if (!data?.hasRefund) {
    return (
      <Page title="Refund Tracker" maxWidth={520}>
        <Alert tone="info">No refund is due for this filing. Your tax liability matches your TDS/advance tax payments.</Alert>
      </Page>
    );
  }

  const st = STATUS_CONFIG[data.status] || STATUS_CONFIG.processed;
  const Icon = st.icon;

  return (
    <Page title="Refund Tracker" maxWidth={520}>
      <Card style={{ textAlign: 'center', padding: 28 }}>
        <Icon size={40} color={st.tone === 'success' ? P.success : st.tone === 'error' ? P.error : P.brand} style={{ margin: '0 auto 10px' }} />
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: P.success, marginBottom: 4 }}>
          ₹{Number(data.amount || 0).toLocaleString('en-IN')}
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
        <div style={{ fontSize: 13, color: P.textMuted, marginTop: 8 }}>{st.desc}</div>
      </Card>

      {data.status === 'failed' && data.failureReason && (
        <Alert tone="error" title="Refund Failed">
          {data.failureReason}. Common fixes: update bank details on ITD portal, complete KYC, or contact your bank.
        </Alert>
      )}

      {summary?.refundComposition && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Refund Breakdown</div>
          {summary.refundComposition.components.map((c, i) => (
            <Row key={i} label={c.source} value={c.amount} />
          ))}
          <Divider />
          <Row label="Total Tax Credits" value={summary.refundComposition.totalCredits} bold tone="success" />
          <Row label="Actual Tax Liability" value={summary.refundComposition.totalTax} bold />
          <Divider />
          <Row label="Refund Due" value={summary.refundComposition.refundAmount} bold tone="success" />
        </Card>
      )}

      {data.source === 'mock' && (
        <Alert tone="warning">
          Refund status is simulated. Live tracking will be available once ERI integration is confirmed by ITD.
        </Alert>
      )}
    </Page>
  );
}
