// =====================================================
// REGIME COMPARATOR MODAL — Side-by-side old vs new regime
// Focus trap, Escape to close, click-outside to close
// =====================================================

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ds';

const fmt = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;

const LINE_ITEMS = [
  { key: 'grossIncome', label: 'Gross Income' },
  { key: 'deductions', label: 'Deductions' },
  { key: 'taxableIncome', label: 'Taxable Income' },
  { key: 'taxOnIncome', label: 'Tax on Income' },
  { key: 'rebate', label: 'Rebate' },
  { key: 'surcharge', label: 'Surcharge' },
  { key: 'cess', label: 'Cess' },
  { key: 'totalTax', label: 'Total Tax' },
  { key: 'tdsCredit', label: 'TDS Credit' },
  { key: 'netPayable', label: 'Net Payable' },
];

export default function RegimeComparatorModal({ comparison, selectedRegime, onSwitchRegime, onClose }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    // Focus trap
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!comparison) return null;
  const { oldRegime, newRegime, recommended, totalSavings, perSectionSavings, explanation } = comparison;
  const recLabel = recommended === 'old' ? 'Old Regime' : 'New Regime';

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
      role="dialog" aria-modal="true" aria-labelledby="regime-modal-title"
    >
      <div ref={modalRef} style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 24,
        maxWidth: 560, width: '90vw', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id="regime-modal-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Regime Comparison
          </h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', display: 'flex',
          }}><X size={18} /></button>
        </div>

        {/* Recommendation banner */}
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16,
          background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>
              {recLabel} saves {fmt(totalSavings)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{explanation}</div>
          </div>
          {selectedRegime !== recommended && (
            <Button variant="primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => onSwitchRegime?.(recommended)}>
              Switch to {recLabel}
            </Button>
          )}
        </div>

        {/* Side-by-side table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 500 }}> </th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 500 }}>Old Regime</th>
              <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 500 }}>New Regime</th>
            </tr>
          </thead>
          <tbody>
            {LINE_ITEMS.map(({ key, label }) => {
              const oldVal = Number(oldRegime?.[key]) || 0;
              const newVal = Number(newRegime?.[key]) || 0;
              const diff = oldVal - newVal;
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>{label}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(oldVal)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(newVal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Per-section savings */}
        {perSectionSavings?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Deduction Savings</div>
            {perSectionSavings.map((s) => (
              <div key={s.section} style={{
                display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{s.section}</span>
                <span style={{ color: s.difference > 0 ? 'var(--color-success)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {s.difference > 0 ? '+' : ''}{fmt(s.difference)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
