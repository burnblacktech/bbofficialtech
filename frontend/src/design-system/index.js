/**
 * BurnBlack Design System — Central Component Library
 * Import everything from here: import { Button, Card, Input, ... } from '../design-system';
 */

import './tokens.css';
import './components.css';

// ── Button ──
export function Button({ children, variant = 'primary', size = 'md', disabled, onClick, className = '', type = 'button', ...rest }) {
  return (
    <button type={type} className={`bb-btn bb-btn--${size} bb-btn--${variant} ${className}`} disabled={disabled} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

// ── Card ──
export function Card({ children, variant = 'default', className = '', onClick, ...rest }) {
  const cls = variant === 'default' ? 'bb-card' : `bb-card bb-card--${variant}`;
  return <div className={`${cls} ${className}`} onClick={onClick} {...rest}>{children}</div>;
}

// ── Input ──
export function Input({ value, onChange, onBlur, type = 'text', placeholder, disabled, mono, error, size, className = '', ...rest }) {
  const cls = `bb-input ${mono ? 'bb-input--mono' : ''} ${error ? 'bb-input--error' : ''} ${size === 'sm' ? 'bb-input--sm' : ''} ${className}`;
  return <input type={type} className={cls} value={value ?? ''} onChange={e => onChange?.(e.target.value)} onBlur={onBlur} placeholder={placeholder} disabled={disabled} {...rest} />;
}

// ── Select ──
export function Select({ value, onChange, onBlur, options = [], placeholder, disabled, className = '', ...rest }) {
  return (
    <select className={`bb-select ${className}`} value={value ?? ''} onChange={e => onChange?.(e.target.value)} onBlur={onBlur} disabled={disabled} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Field (label + input + error/hint) ──
export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={`bb-field ${className}`}>
      {label && <label className="bb-field__label">{label}</label>}
      {children}
      {error && <div className="bb-field__error">{error}</div>}
      {hint && !error && <div className="bb-field__hint">{hint}</div>}
    </div>
  );
}

// ── Badge ──
export function Badge({ children, variant = 'default', className = '' }) {
  return <span className={`bb-badge bb-badge--${variant} ${className}`}>{children}</span>;
}

// ── Alert ──
export function Alert({ children, variant = 'info', className = '', ...rest }) {
  return <div className={`bb-alert bb-alert--${variant} ${className}`} {...rest}>{children}</div>;
}

// ── Spinner ──
export function Spinner({ size = 'md', className = '' }) {
  return <span className={`bb-spinner bb-spinner--${size} ${className}`} />;
}

// ── Progress ──
export function Progress({ value = 0, max = 100, color, className = '' }) {
  const pct = Math.min((value / max) * 100, 100);
  const bg = color || (pct >= 100 ? 'var(--bb-status-success)' : 'var(--bb-brand)');
  return (
    <div className={`bb-progress ${className}`}>
      <div className="bb-progress__fill" style={{ width: `${pct}%`, background: bg }} />
    </div>
  );
}

// ── Stat ──
export function Stat({ label, value, trend, className = '' }) {
  return (
    <div className={className}>
      <div className="bb-stat__label">{label}</div>
      <div className="bb-stat__value">{value}</div>
      {trend && <div className={`bb-stat__trend ${trend > 0 ? 'bb-stat__trend--up' : 'bb-stat__trend--down'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</div>}
    </div>
  );
}

// ── Money ──
export function Money({ amount, className = '' }) {
  const formatted = `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  const cls = `bb-money ${amount > 0 ? 'bb-money--positive' : amount < 0 ? 'bb-money--negative' : ''} ${className}`;
  return <span className={cls}>{amount < 0 ? `−${formatted}` : formatted}</span>;
}

// ── Layout ──
export function Stack({ children, gap = 'md', className = '' }) {
  return <div className={`bb-stack bb-stack--${gap} ${className}`}>{children}</div>;
}

export function Row({ children, gap = 'md', between, className = '' }) {
  return <div className={`bb-row bb-row--${gap} ${between ? 'bb-row--between' : ''} ${className}`}>{children}</div>;
}

export function Grid({ children, cols = 2, className = '' }) {
  return <div className={`bb-grid bb-grid--${cols} ${className}`}>{children}</div>;
}

export function Page({ children, className = '' }) {
  return <div className={`bb-page ${className}`}>{children}</div>;
}

export function Divider({ className = '' }) {
  return <hr className={`bb-divider ${className}`} />;
}
