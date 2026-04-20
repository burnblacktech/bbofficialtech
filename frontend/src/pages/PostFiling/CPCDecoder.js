/**
 * CPCDecoder — Decode Section 143(1) CPC intimation in plain English
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Page, Card, Button, Input, Section, Alert, Row, Badge, Divider } from '../../components/ds';
import api from '../../services/api';
import toast from 'react-hot-toast';
import P from '../../styles/palette';

export default function CPCDecoder() {
  const { filingId } = useParams();
  const [intimationJson, setIntimationJson] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDecode = async () => {
    setLoading(true);
    try {
      let data;
      try { data = JSON.parse(intimationJson); } catch { toast.error('Invalid JSON format'); setLoading(false); return; }
      const res = await api.post(`/post-filing/${filingId}/cpc-decode`, data);
      setResult(res.data.data);
    } catch (e) { toast.error(e.response?.data?.error || 'Decoding failed'); }
    finally { setLoading(false); }
  };

  return (
    <Page title="CPC Intimation Decoder" subtitle="Understand your Section 143(1) notice in plain English" maxWidth={640}>
      {!result ? (
        <Card variant="active">
          <Section title="Paste CPC Intimation Data" icon={<FileText size={14} />}>
            <Input label="Intimation JSON" type="textarea" value={intimationJson} onChange={e => setIntimationJson(e.target.value)}
              placeholder='{"adjustments": [...], "demandAmount": 0, "refundAmount": 0}' style={{ minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            <Button variant="primary" loading={loading} onClick={handleDecode} disabled={!intimationJson.trim()}>
              <FileText size={14} /> Decode Intimation
            </Button>
          </Section>
        </Card>
      ) : (
        <>
          {/* Adjustments */}
          {result.adjustments?.length > 0 && (
            <Card>
              <Section title="Adjustments Made by CPC">
                {result.adjustments.map((adj, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i < result.adjustments.length - 1 ? `1px solid ${P.borderLight}` : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: P.textPrimary, marginBottom: 4 }}>{adj.code}</div>
                    <div style={{ fontSize: 13, color: P.textSecondary, lineHeight: 1.5 }}>{adj.description}</div>
                    {adj.difference !== 0 && (
                      <div style={{ fontSize: 12, color: adj.difference > 0 ? P.error : P.success, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        As per return: ₹{adj.asPerReturn.toLocaleString('en-IN')} → As per CPC: ₹{adj.asPerCPC.toLocaleString('en-IN')} (diff: ₹{Math.abs(adj.difference).toLocaleString('en-IN')})
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            </Card>
          )}

          {/* Demand */}
          {result.demand && (
            <Alert tone="error" icon={<AlertTriangle size={16} />} title={`Tax Demand: ₹${result.demand.amount.toLocaleString('en-IN')}`}>
              <p style={{ margin: '0 0 12px' }}>{result.demand.explanation}</p>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Your options:</div>
              {result.demand.options.map((opt, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: i < 2 ? `1px solid ${P.errorBorder}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: P.textMuted }}>{opt.description}</div>
                </div>
              ))}
            </Alert>
          )}

          {/* Refund */}
          {result.refund && (
            <Alert tone="success" icon={<CheckCircle size={16} />} title={`Refund: ₹${result.refund.amount.toLocaleString('en-IN')}`}>
              {result.refund.explanation}
            </Alert>
          )}

          {!result.success && (
            <Alert tone="warning">
              Unable to fully parse this intimation format. Please check the ITD portal directly for complete details.
            </Alert>
          )}

          <Button variant="outline" onClick={() => setResult(null)} style={{ marginTop: 12 }}>
            ← Decode Another
          </Button>
        </>
      )}
    </Page>
  );
}
