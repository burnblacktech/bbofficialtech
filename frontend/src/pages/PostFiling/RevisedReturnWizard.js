/**
 * RevisedReturnWizard — Detect differences and create revised return
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Page, Card, Button, Alert, Row, Badge, Divider, Section } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

export default function RevisedReturnWizard() {
  const { filingId } = useParams();
  const navigate = useNavigate();

  const { data: everify } = useQuery({
    queryKey: ['everify-status', filingId],
    queryFn: async () => (await api.get(`/post-filing/${filingId}/everify-status`)).data.data,
  });

  const { data: summary } = useQuery({
    queryKey: ['post-filing-summary', filingId],
    queryFn: async () => (await api.get(`/post-filing/${filingId}/summary`)).data.data,
  });

  const reviseMut = useMutation({
    mutationFn: async () => (await api.post(`/post-filing/${filingId}/revised-return`)).data.data,
    onSuccess: (data) => {
      toast.success('Revised return created');
      const route = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[data.itrType] || 'itr1';
      navigate(`/filing/${data.id}/${route}`);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create revised return'),
  });

  return (
    <Page title="Revised Return" subtitle="Correct errors in your filed return" maxWidth={560}>
      {/* Filing summary */}
      {summary && (
        <Card>
          <Row label="Assessment Year" value={summary.assessmentYear} />
          <Row label="ITR Type" value={summary.itrType} />
          <Row label="Ack. Number" value={summary.acknowledgmentNumber || 'Pending'} bold />
          <Row label="Status" bold>
            <Badge tone={summary.isRefund ? 'success' : 'warning'}>
              {summary.isRefund ? `Refund ₹${summary.amount.toLocaleString('en-IN')}` : `Tax Due ₹${summary.amount.toLocaleString('en-IN')}`}
            </Badge>
          </Row>
        </Card>
      )}

      {/* E-verification status */}
      {everify && !everify.isVerified && (
        <Alert tone={everify.severity} icon={<AlertTriangle size={14} />} title={`E-Verify: ${everify.daysLeft} days left`}>
          {everify.message}
        </Alert>
      )}

      {/* Revised return info */}
      <Card variant="active">
        <Section title="File Revised Return" icon={<RefreshCw size={14} />}>
          <p style={{ fontSize: 13, color: P.textSecondary, lineHeight: 1.6, margin: '0 0 12px' }}>
            A revised return replaces your original filing. Use it to correct errors in income, deductions, or personal details.
            Your original data will be pre-filled — just make the corrections and submit.
          </p>
          <div style={{ fontSize: 12, color: P.textMuted, marginBottom: 12 }}>
            Deadline: Before March 31 of the assessment year or completion of assessment, whichever is earlier.
          </div>
          <Button variant="primary" loading={reviseMut.isPending} onClick={() => reviseMut.mutate()}>
            <RefreshCw size={14} /> Create Revised Return
          </Button>
        </Section>
      </Card>

      <Alert tone="info" icon={<CheckCircle size={14} />}>
        The revised return will be pre-populated with your original filing data. You only need to change the fields that were incorrect.
        The original acknowledgment number will be automatically linked.
      </Alert>
    </Page>
  );
}
