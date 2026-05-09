import React from 'react';
import { ArrowRight } from 'lucide-react';

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function MobileBar({ taxResult, isRefund, completeness }) {
  return (
    <div className="fr-mobile-bar">
      <div className="fr-mobile-bar__inner">
        <div>
          <div style={{ fontSize: 11, color: 'var(--fr-muted)' }}>{isRefund ? 'Refund' : 'Tax Payable'}</div>
          <div style={{ ...MONO, fontSize: 18, fontWeight: 700, color: isRefund ? 'var(--fr-success)' : 'var(--fr-error)' }}>
            ₹{Math.abs(taxResult || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <button className="fr-mobile-bar__btn" disabled={completeness < 100}>
          Submit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
