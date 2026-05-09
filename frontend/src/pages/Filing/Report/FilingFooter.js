import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, FileJson, FileText, Printer } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function FilingFooter({ completeness, filingId, onSubmit }) {
  const isReady = completeness >= 100;

  const handleDownloadJSON = async () => {
    try {
      const { data } = await api.get(`/filings/${filingId}/export/json`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ITR_${filingId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON downloaded');
    } catch (err) {
      toast.error(err?.userMessage || 'Failed to download JSON');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { data } = await api.get(`/filings/${filingId}/computation-pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaxComputation_${filingId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err?.userMessage || 'Failed to download PDF');
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="fr-footer">
      <div className="fr-footer__box">
        <div style={{ textAlign: 'center' }}>
          {isReady ? (
            <>
              <CheckCircle2 size={24} style={{ color: 'var(--fr-success)', marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Ready to File</div>
              <div style={{ fontSize: 13, color: 'var(--fr-muted)', marginBottom: 16 }}>
                All sections complete. Download your ITR JSON and upload to the Income Tax portal.
              </div>
              <button className="fr-submit-btn fr-submit-btn--ready fr-pulse-gold" onClick={handleDownloadJSON}>
                Download ITR JSON <FileJson size={14} />
              </button>
            </>
          ) : (
            <>
              <AlertCircle size={24} style={{ color: 'var(--fr-warning)', marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Incomplete</div>
              <div style={{ fontSize: 13, color: 'var(--fr-muted)', marginBottom: 16 }}>
                Complete all sections before downloading ({Math.round(completeness)}% done).
              </div>
              <button className="fr-submit-btn fr-submit-btn--disabled" disabled>
                Download ITR JSON <FileJson size={14} />
              </button>
            </>
          )}
        </div>
        <div className="fr-footer__actions">
          <button className="fr-footer__action" onClick={handleDownloadJSON}><FileJson size={14} /> JSON</button>
          <button className="fr-footer__action" onClick={handleDownloadPDF}><FileText size={14} /> PDF</button>
          <button className="fr-footer__action" onClick={handlePrint}><Printer size={14} /> Print</button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--fr-muted)', textAlign: 'center', marginTop: 16 }}>
        Upload the JSON file to <a href="https://eportal.incometax.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--fr-gold)' }}>incometax.gov.in</a> to complete your filing.
      </p>
    </div>
  );
}
