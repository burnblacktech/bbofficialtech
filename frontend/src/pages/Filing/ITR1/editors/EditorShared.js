/**
 * EditorShared — Shared components for all filing editors.
 * Bridges the existing ff-* CSS system with the DS component library.
 * Editors use these instead of inline <F> helpers for consistency.
 */

import { useState } from 'react';
import { Save, CheckCircle, AlertTriangle, Lock, Info } from 'lucide-react';
import P from '../../../../styles/palette';

const n = (v) => Number(v) || 0;

// Source label map for display
const SOURCE_LABELS = {
  '26as': '26AS',
  ais: 'AIS',
  form16: 'Form 16',
  form16a: 'Form 16A',
  form16b: 'Form 16B',
  form16c: 'Form 16C',
  manual: 'Manual',
};

function formatImportDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

/**
 * SourceIndicator — Shows document type + import date when a field has a recorded source.
 */
function SourceIndicator({ fieldSource }) {
  if (!fieldSource?.source || fieldSource.source === 'manual') return null;
  const label = SOURCE_LABELS[fieldSource.source] || fieldSource.source;
  const date = formatImportDate(fieldSource.importedAt);
  return (
    <div className="ds-hint" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: P.textLight }}>
      <Info size={10} />
      <span>From {label}{date ? ` · ${date}` : ''}</span>
    </div>
  );
}

/**
 * NumericField — Standard number input with label and hint.
 * Uses ff-* classes (already DS-aligned via CSS variables).
 * Supports optional fieldSource prop for edit lock behavior.
 */
export function NumericField({ label, value, onChange, hint, error, disabled, fieldSource }) {
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const editLock = fieldSource?.editLock || 'free';
  const isLocked = editLock === 'locked';
  const isWarn = editLock === 'warn';

  const handleFocus = () => {
    if (isWarn && !showWarnDialog) {
      setShowWarnDialog(true);
    }
  };

  const handleWarnConfirm = () => {
    setShowWarnDialog(false);
  };

  const handleWarnCancel = () => {
    setShowWarnDialog(false);
  };

  return (
    <div className="ds-field">
      <label className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isLocked && <Lock size={12} style={{ color: P.textLight }} title="Value from 26AS/AIS — edit by re-importing" />}
      </label>
      <input
        className={`ds-input ${error ? 'error' : ''}`}
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder="0"
        disabled={disabled || isLocked}
        readOnly={isLocked}
        title={isLocked ? 'Value from 26AS/AIS — edit by re-importing' : undefined}
        style={{ fontFamily: 'var(--font-mono)', ...(isLocked ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
      />
      {showWarnDialog && (
        <div style={{ padding: '6px 10px', marginTop: 4, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12 }}>
          <span style={{ color: '#92400e' }}>This value was imported from {SOURCE_LABELS[fieldSource?.source] || 'an employer document'}. Edit anyway?</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button onClick={handleWarnConfirm} style={{ fontSize: 11, padding: '2px 8px', background: P.brand, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Yes, edit</button>
            <button onClick={handleWarnCancel} style={{ fontSize: 11, padding: '2px 8px', background: P.bgMuted, color: P.textSecondary, border: `1px solid ${P.borderLight}`, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {error ? <div className="ds-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ds-hint">{hint}</div> : null}
      <SourceIndicator fieldSource={fieldSource} />
    </div>
  );
}

/**
 * TextField — Standard text input with label and hint.
 * Supports optional fieldSource prop for edit lock behavior.
 */
export function TextField({ label, value, onChange, onBlur, hint, error, placeholder, maxLength, disabled, style, fieldSource }) {
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const editLock = fieldSource?.editLock || 'free';
  const isLocked = editLock === 'locked';
  const isWarn = editLock === 'warn';

  const handleFocus = () => {
    if (isWarn && !showWarnDialog) {
      setShowWarnDialog(true);
    }
  };

  const handleWarnConfirm = () => {
    setShowWarnDialog(false);
  };

  const handleWarnCancel = () => {
    setShowWarnDialog(false);
  };

  return (
    <div className="ds-field">
      <label className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isLocked && <Lock size={12} style={{ color: P.textLight }} title="Value from 26AS/AIS — edit by re-importing" />}
      </label>
      <input
        className={`ds-input ${error ? 'error' : ''}`}
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled || isLocked}
        readOnly={isLocked}
        title={isLocked ? 'Value from 26AS/AIS — edit by re-importing' : undefined}
        style={{ ...style, ...(isLocked ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
      />
      {showWarnDialog && (
        <div style={{ padding: '6px 10px', marginTop: 4, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12 }}>
          <span style={{ color: '#92400e' }}>This value was imported from {SOURCE_LABELS[fieldSource?.source] || 'an employer document'}. Edit anyway?</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button onClick={handleWarnConfirm} style={{ fontSize: 11, padding: '2px 8px', background: P.brand, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Yes, edit</button>
            <button onClick={handleWarnCancel} style={{ fontSize: 11, padding: '2px 8px', background: P.bgMuted, color: P.textSecondary, border: `1px solid ${P.borderLight}`, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {error ? <div className="ds-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ds-hint">{hint}</div> : null}
      <SourceIndicator fieldSource={fieldSource} />
    </div>
  );
}

/**
 * SelectField — Standard select with label.
 */
export function SelectField({ label, value, onChange, onBlur, options, error, hint }) {
  return (
    <div className="ds-field">
      <label className="ds-label">{label}</label>
      <select className={`ds-select ${error ? 'error' : ''}`} value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <div className="ds-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ds-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * SummaryRow — Label + formatted money value.
 */
export function SummaryRow({ label, value, bold, green, red }) {
  const color = green ? P.success : red ? P.error : P.textPrimary;
  return (
    <div className="ds-summary">
      <span className="ds-summary__label">{label}</span>
      <span className={`ds-summary__value ${bold ? 'bold' : ''}`} style={{ color, fontFamily: 'var(--font-mono)' }}>
        ₹{n(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}

/**
 * EditorHeader — Title + completion indicator for each editor.
 */
export function EditorHeader({ title, subtitle, filled, total, complete }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 className="step-title" style={{ margin: 0 }}>{title}</h2>
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: complete ? P.success : P.warning }}>
              {filled}/{total}
            </span>
            {complete ? <CheckCircle size={16} color={P.success} /> : <AlertTriangle size={16} color={P.warning} />}
          </div>
        )}
      </div>
      {subtitle && <p className="step-desc">{subtitle}</p>}
    </div>
  );
}

/**
 * SaveButton — Consistent save button across all editors.
 */
export function SaveButton({ onClick, isSaving, label = 'Save' }) {
  return (
    <button className="ds-btn ds-btn-md ds-btn-primary" onClick={onClick} disabled={isSaving}
      style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
      {isSaving ? <><span className="ds-spinner" /> Saving...</> : <><Save size={14} /> {label}</>}
    </button>
  );
}

/**
 * Divider — Horizontal line in summary cards.
 */
export function Divider() {
  return <div className="ds-divider" />;
}
