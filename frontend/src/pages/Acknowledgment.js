/**
 * Acknowledgment — Shows filing acknowledgment after successful submission
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, ArrowLeft, Download, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Filing/filing-flow.css';

export default function Acknowledgment() {
  const { filingId } = useParams();
  const navigate = useNavigate();

  const { data: filing, isLoading } = useQuery({
    queryKey: ['filing', filingId],
    queryFn: async () => (await api.get(`/filings/${filingId}`)).data.data,
    enabled: !!filingId,
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" color="#6b7280" /></div>;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="step-title">Filing Acknowledgment</h1>

      <div className="step-card success" style={{ textAlign: 'center', padding: 32 }}>
        <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>ITR Filed Successfully</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Your return has been submitted to the Income Tax Department</div>
      </div>

      {filing && (
        <div className="step-card" style={{ marginTop: 12 }}>
          <div className="ff-row"><span className="ff-row-label">PAN</span><span className="ff-row-value">{filing.taxpayerPan}</span></div>
          <div className="ff-row"><span className="ff-row-label">Assessment Year</span><span className="ff-row-value">{filing.assessmentYear}</span></div>
          <div className="ff-row"><span className="ff-row-label">Status</span><span className="ff-row-value bold">{filing.lifecycleState}</span></div>
          {filing.acknowledgmentNumber && (
            <div className="ff-row"><span className="ff-row-label">Ack. No.</span><span className="ff-row-value bold">{filing.acknowledgmentNumber}</span></div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="ff-btn ff-btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <button className="ff-btn ff-btn-primary" onClick={async () => {
          try {
            const itr = filing?.itrType || 'ITR-1';
            const ep = { 'ITR-1': 'itr1', 'ITR-2': 'itr2', 'ITR-3': 'itr3', 'ITR-4': 'itr4' }[itr] || 'itr1';
            const r = await api.get(`/filings/${filingId}/${ep}/json`);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)]));
            a.download = `${itr.replace('-', '')}_AY${filing?.assessmentYear}.json`;
            a.click();
          } catch { toast.error('Download failed'); }
        }}>
          <Download size={15} /> Download JSON
        </button>
      </div>
    </div>
  );
}
