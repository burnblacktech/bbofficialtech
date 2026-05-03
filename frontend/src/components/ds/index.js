import React from 'react';

// ── Field: label + input + hint/error ──
export function Field({ label, value, onChange, onBlur, error, hint, type = 'text', disabled, locked, placeholder, className = '', style, children, ...rest }) {
  const isNumeric = type === 'number' || rest.inputMode === 'numeric';
  return (
    <div className={`ds-field ${className}`} style={style}>
      {label && <label className="ds-label">{label}</label>}
      {children || (
        <input
          className={`ds-input ${error ? 'error' : ''}`}
          type={type === 'number' ? 'text' : type}
          inputMode={isNumeric ? 'numeric' : undefined}
          value={value ?? ''}
          onChange={e => onChange?.(isNumeric ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value)}
          onBlur={onBlur}
          disabled={disabled || locked}
          placeholder={placeholder}
          {...rest}
        />
      )}
      {error && <div className="ds-error-hint">{error}</div>}
      {hint && !error && <div className="ds-hint">{hint}</div>}
    </div>
  );
}

// ── Select: label + select + hint/error ──
export function Select({ label, value, onChange, onBlur, error, hint, options = [], disabled, placeholder, className = '', style }) {
  return (
    <div className={`ds-field ${className}`} style={style}>
      {label && <label className="ds-label">{label}</label>}
      <select className={`ds-select ${error ? 'error' : ''}`} value={value ?? ''} onChange={e => onChange?.(e.target.value)} onBlur={onBlur} disabled={disabled}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <div className="ds-error-hint">{error}</div>}
      {hint && !error && <div className="ds-hint">{hint}</div>}
    </div>
  );
}

// ── Card: bordered container ──
export function Card({ children, active, muted, className = '', style, onClick }) {
  const cls = `ds-card ${active ? 'ds-card--active' : ''} ${muted ? 'ds-card--muted' : ''} ${className}`;
  return <div className={cls.trim()} style={style} onClick={onClick}>{children}</div>;
}

// ── Section: title with optional icon ──
export function Section({ icon: Icon, title, children, className = '' }) {
  return (
    <>
      <div className={`ds-section ${className}`}>
        {Icon && <Icon size={14} />}
        <span>{title}</span>
      </div>
      {children}
    </>
  );
}

// ── Grid: 1/2/3 column grid ──
export function Grid({ cols = 3, children, className = '', style }) {
  return <div className={`ds-grid-${cols} ${className}`} style={style}>{children}</div>;
}

// ── Row: horizontal flex ──
export function Row({ children, gap, className = '', style, align }) {
  const cls = gap === 'sm' ? 'ds-row-sm' : 'ds-row';
  return <div className={`${cls} ${className}`} style={{ ...style, alignItems: align }}>{children}</div>;
}

// ── Stack: vertical flex ──
export function Stack({ children, gap, className = '', style }) {
  const cls = gap === 'sm' ? 'ds-stack-sm' : 'ds-stack';
  return <div className={`${cls} ${className}`} style={style}>{children}</div>;
}

// ── Button ──
export function Button({ children, variant = 'secondary', size = 'md', disabled, onClick, className = '', style, type = 'button' }) {
  return (
    <button
      type={type}
      className={`ds-btn ds-btn-${size} ds-btn-${variant} ${className}`}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ── Badge ──
export function Badge({ children, variant = 'muted', className = '' }) {
  return <span className={`ds-badge ds-badge--${variant} ${className}`}>{children}</span>;
}

// ── Summary row (label + mono value) ──
export function Money({ label, value, bold, color }) {
  const cls = `ds-summary__value ${bold ? 'ds-summary__value--bold' : ''} ${color === 'green' ? 'ds-summary__value--green' : ''} ${color === 'red' ? 'ds-summary__value--red' : ''}`;
  return (
    <div className="ds-summary">
      <span className="ds-summary__label">{label}</span>
      <span className={cls.trim()}>{value}</span>
    </div>
  );
}

// ── Divider ──
export function Divider() { return <hr className="ds-divider" />; }

// ── Page shell ──
export function Page({ children, form }) {
  return <div className={form ? 'ds-form-page' : 'ds-page'}>{children}</div>;
}

// ── Locked data display (verified/imported read-only) ──
export function LockIcon({ size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

// ── Spinner ──
export function Spinner({ size = 16 }) {
  return <span style={{ width: size, height: size, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--c-brand)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />;
}

// ── Alert ──
export function Alert({ children, variant = 'info', className = '' }) {
  const colors = { info: { bg: '#f0fdfa', border: '#99f6e4', color: 'var(--c-info)' }, warning: { bg: '#fffbeb', border: '#fde68a', color: 'var(--c-warning)' }, error: { bg: '#fef2f2', border: '#fecaca', color: 'var(--c-error)' }, success: { bg: '#f0fdf4', border: '#bbf7d0', color: 'var(--c-success)' } };
  const c = colors[variant] || colors.info;
  return <div className={className} style={{ padding: '8px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r-lg)', fontSize: 'var(--fs-sm)', color: c.color, lineHeight: 1.4 }}>{children}</div>;
}

// ── Input: alias for Field (backward compat) ──
export { Field as Input };
