/**
 * EditorShared — Shared components for all filing editors.
 * Bridges the existing ff-* CSS system with the DS component library.
 * Editors use these instead of inline <F> helpers for consistency.
 */

import { Save, CheckCircle, AlertTriangle } from 'lucide-react';
import P from '../../../../styles/palette';

const n = (v) => Number(v) || 0;

/**
 * NumericField — Standard number input with label and hint.
 * Uses ff-* classes (already DS-aligned via CSS variables).
 */
export function NumericField({ label, value, onChange, hint, error, disabled }) {
  return (
    <div className="ff-field">
      <label className="ff-label">{label}</label>
      <input
        className={`ff-input ${error ? 'error' : ''}`}
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        disabled={disabled}
        style={{ fontFamily: 'var(--font-mono)' }}
      />
      {error ? <div className="ff-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * TextField — Standard text input with label and hint.
 */
export function TextField({ label, value, onChange, onBlur, hint, error, placeholder, maxLength, disabled, style }) {
  return (
    <div className="ff-field">
      <label className="ff-label">{label}</label>
      <input
        className={`ff-input ${error ? 'error' : ''}`}
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={style}
      />
      {error ? <div className="ff-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * SelectField — Standard select with label.
 */
export function SelectField({ label, value, onChange, onBlur, options, error, hint }) {
  return (
    <div className="ff-field">
      <label className="ff-label">{label}</label>
      <select className={`ff-select ${error ? 'error' : ''}`} value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <div className="ff-hint" style={{ color: P.error }}>{error}</div>
        : hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * SummaryRow — Label + formatted money value.
 */
export function SummaryRow({ label, value, bold, green, red }) {
  const color = green ? P.success : red ? P.error : P.textPrimary;
  return (
    <div className="ff-row">
      <span className="ff-row-label">{label}</span>
      <span className={`ff-row-value ${bold ? 'bold' : ''}`} style={{ color, fontFamily: 'var(--font-mono)' }}>
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
    <button className="ff-btn ff-btn-primary" onClick={onClick} disabled={isSaving}
      style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
      {isSaving ? <><span className="ff-spinner" /> Saving...</> : <><Save size={14} /> {label}</>}
    </button>
  );
}

/**
 * Divider — Horizontal line in summary cards.
 */
export function Divider() {
  return <div className="ff-divider" />;
}
