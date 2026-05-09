import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function ReportSidebar({ taxResult, isRefund, regime, onRegimeChange, completeness, sections, filingId }) {
  return (
    <aside className="fr-sidebar">
      <div style={{ fontSize: 11, color: 'var(--fr-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
        BurnBlack
      </div>

      <div className="fr-sidebar__result-box">
        <div className="fr-sidebar__result-label">{isRefund ? 'Refund' : 'Tax Payable'}</div>
        <div className={`fr-sidebar__result-amount ${isRefund ? 'fr-sidebar__result-amount--refund' : 'fr-sidebar__result-amount--payable'}`} style={MONO}>
          ₹{Math.abs(taxResult || 0).toLocaleString('en-IN')}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="fr-regime-toggle">
          <button className={`fr-regime-btn ${regime === 'old' ? 'fr-regime-btn--active' : ''}`} onClick={() => onRegimeChange('old')}>Old Regime</button>
          <button className={`fr-regime-btn ${regime === 'new' ? 'fr-regime-btn--active' : ''}`} onClick={() => onRegimeChange('new')}>New Regime</button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fr-muted)', marginBottom: 6 }}>
          <span>Completeness</span>
          <span style={MONO}>{Math.round(completeness)}%</span>
        </div>
        <div className="fr-progress" style={{ height: 6 }}>
          <div
            className={`fr-progress__fill ${completeness >= 100 ? 'fr-progress__fill--full' : 'fr-progress__fill--partial'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <nav style={{ flex: 1, marginBottom: 24 }}>
        {sections.map((s) => (
          <button key={s.id} className="fr-nav-item" onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}>
            <span>{s.label}</span>
            {s.complete && <span className="fr-nav-item__check"><Check size={14} /></span>}
          </button>
        ))}
      </nav>

      <button className={`fr-submit-btn ${completeness >= 100 ? 'fr-submit-btn--ready' : 'fr-submit-btn--disabled'}`} disabled={completeness < 100}>
        Submit to Income Tax <ArrowRight size={14} />
      </button>
    </aside>
  );
}
