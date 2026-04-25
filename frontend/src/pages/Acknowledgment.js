/**
 * Acknowledgment — Migrated to BurnBlack Design System
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Page, Card, Button, Row, Badge, Divider } from '../components/ds';
import api from '../services/api';
import P from '../styles/palette';
import toast from 'react-hot-toast';

export default function Acknowledgment() {
  const { filingId } = useParams();
  const navigate = useNavigate();

  const { data: filing, isLoading } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => (await api.get(`/filings/${filingId}`)).data.data,
    enabled: !!filingId,
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" color={P.textMuted} /></div>;

  const downloadJSON = async () => {
    try {
      const itr = filing?.itrType || 'ITR-1';
      const ep = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[itr] || 'itr1';
      const r = await api.get(`/filings/${filingId}/${ep}/json`);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)]));
      a.download = `${itr.replace('-', '')}_AY${filing?.assessmentYear}.json`;
      a.click();
    } catch { toast.error('Download failed'); }
  };

  return (
    <Page title="Filing Acknowledgment" maxWidth={520}>
      <Card variant="success" style={{ textAlign: 'center', padding: 32 }}>
        <CheckCircle size={48} color={P.success} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: P.success, marginBottom: 4 }}>ITR Filed Successfully</div>
        <div style={{ fontSize: 13, color: P.textMuted }}>Your return has been submitted to the Income Tax Department</div>
      </Card>

      {filing && (
        <Card>
          <Row label="PAN" value={filing.taxpayerPan} mono />
          <Row label="Assessment Year" value={filing.assessmentYear} />
          <Row label="ITR Type" value={filing.itrType || 'ITR-1'} />
          <Row label="Status" bold>
            <Badge tone="success">{filing.lifecycleState === 'eri_success' ? 'Accepted' : filing.lifecycleState}</Badge>
          </Row>
          {filing.acknowledgmentNumber && (
            <>
              <Divider />
              <Row label="Acknowledgment No." value={filing.acknowledgmentNumber} bold />
            </>
          )}
          {filing.submittedAt && <Row label="Filed On" value={new Date(filing.submittedAt).toLocaleString('en-IN')} />}
        </Card>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </Button>
        <Button variant="primary" onClick={downloadJSON}>
          <Download size={14} /> Download JSON
        </Button>
      </div>
    </Page>
  );
}
