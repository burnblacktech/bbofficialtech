import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, FileJson, FileText, Printer } from 'lucide-react';

export default function FilingFooter({ completeness, filingId }) {
  const isReady = completeness >= 100;

  return (
    <div className="fr-footer">
      <div className="fr-footer__box">
        <div style={{ textAlign: 'center' }}>
          {isReady ? (
            <>
              <CheckCircle2 size={24} style={{ color: 'var(--fr-success)', marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Ready to File</div>
              <div style={{ fontSize: 13, color: 'var(--fr-muted)', marginBottom: 16 }}>
                All sections complete. You can submit your ITR.
              </div>
              <button className="fr-submit-btn fr-submit-btn--ready">
                Submit to Income Tax <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <AlertCircle size={24} style={{ color: 'var(--fr-warning)', marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Incomplete</div>
              <div style={{ fontSize: 13, color: 'var(--fr-muted)', marginBottom: 16 }}>
                Complete all sections before submitting ({Math.round(completeness)}% done).
              </div>
              <button className="fr-submit-btn fr-submit-btn--disabled" disabled>
                Submit to Income Tax <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
        <div className="fr-footer__actions">
          <button className="fr-footer__action"><FileJson size={14} /> JSON</button>
          <button className="fr-footer__action"><FileText size={14} /> PDF</button>
          <button className="fr-footer__action"><Printer size={14} /> Print</button>
        </div>
      </div>
    </div>
  );
}
