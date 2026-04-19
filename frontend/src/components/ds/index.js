/**
 * BurnBlack Design System — Component Library
 *
 * RULES:
 * - Every component uses CSS variables from theme.css
 * - No inline color values — use semantic props (variant, tone)
 * - Typography: only 6 sizes (24, 18, 14, 13, 12, 11)
 * - Spacing: only multiples of 4 (4, 8, 12, 16, 20, 24, 32)
 * - Financial numbers always use DM Mono
 * - One primary action per screen (gold button)
 *
 * Usage:
 *   import { Card, Button, Input, Money, Row, Badge, Alert, Section } from '../components/ds';
 */

import { useState, useEffect, forwardRef } from 'react';
import './ds.css';

// ═══════════════════════════════════════════════════════
// CARD — The fundamental container
// ═══════════════════════════════════════════════════════

export function Card({ variant = 'default', children, className = '', style, onClick, ...rest }) {
  const cls = ['ds-card', `ds-card--${variant}`, className].filter(Boolean).join(' ');
  return <div className={cls} style={style} onClick={onClick} {...rest}>{children}</div>;
}

// ═══════════════════════════════════════════════════════
// BUTTON — 3 variants only: primary, outline, ghost
// ═══════════════════════════════════════════════════════

export function Button({ variant = 'primary', size = 'md', children, disabled, loading, block, className = '', ...rest }) {
  const cls = [
    'ds-btn', `ds-btn--${variant}`, `ds-btn--${size}`,
    block && 'ds-btn--block', loading && 'ds-btn--loading',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="ds-spinner" />}
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// INPUT — text, number, select, date (DD/MM/YYYY)
// ═══════════════════════════════════════════════════════

export const Input = forwardRef(function Input(
  { label, hint, error, type = 'text', locked, required, className = '', ...rest }, ref
) {
  return (
    <div className={`ds-field ${className}`}>
      {label && (
        <label className="ds-label">
          {label}
          {required && <span className="ds-required">*</span>}
          {locked && <LockIcon />}
        </label>
      )}
      {type === 'select' ? (
        <select
          ref={ref}
          className={`ds-select ${error ? 'ds-select--error' : ''}`}
          disabled={locked}
          {...rest}
        />
      ) : type === 'textarea' ? (
        <textarea
          ref={ref}
          className={`ds-input ds-textarea ${error ? 'ds-input--error' : ''}`}
          readOnly={locked} disabled={locked}
          {...rest}
        />
      ) : type === 'date' ? (
        <DateInput ref={ref} locked={locked} error={error} {...rest} />
      ) : (
        <input
          ref={ref}
          className={`ds-input ${error ? 'ds-input--error' : ''} ${type === 'number' ? 'ds-input--mono' : ''}`}
          type={type}
          readOnly={locked} disabled={locked}
          {...rest}
        />
      )}
      {error ? <span className="ds-hint ds-hint--error">{error}</span>
        : hint ? <span className="ds-hint">{hint}</span> : null}
    </div>
  );
});

// ═══════════════════════════════════════════════════════
// DATE INPUT — DD/MM/YYYY with auto-formatting
// ═══════════════════════════════════════════════════════

const DateInput = forwardRef(function DateInput({ value, onChange, onBlur, locked, error, ...rest }, ref) {
  const toDisplay = (iso) => {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };
  const toISO = (display) => {
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  };

  const [text, setText] = useState(toDisplay(value));
  useEffect(() => { const d = toDisplay(value); if (d && d !== text) setText(d); }, [value]); // eslint-disable-line

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d/]/g, '');
    if (raw.length === 2 && !raw.includes('/')) raw += '/';
    else if (raw.length === 5 && raw.charAt(2) === '/' && raw.split('/').length === 2) raw += '/';
    if (raw.length > 10) raw = raw.slice(0, 10);
    setText(raw);
    if (raw.length === 10) { const iso = toISO(raw); if (iso) onChange?.(iso); }
  };

  const handleBlur = (e) => {
    if (text.length === 10) {
      const iso = toISO(text);
      if (iso) {
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) onChange?.(iso);
      }
    }
    onBlur?.(e);
  };

  return (
    <input
      ref={ref}
      className={`ds-input ds-input--mono ${error ? 'ds-input--error' : ''}`}
      type="text" inputMode="numeric"
      value={locked ? toDisplay(value) : text}
      onChange={locked ? undefined : handleChange}
      onBlur={locked ? undefined : handleBlur}
      readOnly={locked} disabled={locked}
      placeholder="DD/MM/YYYY" maxLength={10}
      {...rest}
    />
  );
});

// ═══════════════════════════════════════════════════════
// MONEY — Formatted ₹ amount in DM Mono
// ═══════════════════════════════════════════════════════

export function Money({ value, sign, size = 'md', tone, className = '' }) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-IN');
  const prefix = sign ? (n < 0 ? '-' : n > 0 ? '+' : '') : '';
  const cls = ['ds-money', `ds-money--${size}`, tone && `ds-money--${tone}`, className].filter(Boolean).join(' ');
  return <span className={cls}>{prefix}₹{formatted}</span>;
}

// ═══════════════════════════════════════════════════════
// ROW — Label + Value (for summaries, key-value displays)
// ═══════════════════════════════════════════════════════

export function Row({ label, value, bold, tone, mono = true, divider, onClick, children }) {
  if (divider) return <div className="ds-divider" />;
  const valCls = ['ds-row-value', bold && 'ds-row-value--bold', tone && `ds-row-value--${tone}`, mono && 'ds-row-value--mono'].filter(Boolean).join(' ');
  return (
    <div className={`ds-row ${onClick ? 'ds-row--clickable' : ''}`} onClick={onClick}>
      <span className="ds-row-label">{label}</span>
      {children || <span className={valCls}>{typeof value === 'number' ? <Money value={value} /> : value}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BADGE — Status indicators
// ═══════════════════════════════════════════════════════

export function Badge({ tone = 'default', children, icon, className = '' }) {
  const cls = ['ds-badge', `ds-badge--${tone}`, className].filter(Boolean).join(' ');
  return <span className={cls}>{icon}{children}</span>;
}

// ═══════════════════════════════════════════════════════
// ALERT — Contextual messages
// ═══════════════════════════════════════════════════════

export function Alert({ tone = 'info', icon, title, children, className = '' }) {
  const cls = ['ds-alert', `ds-alert--${tone}`, className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {(icon || title) && (
        <div className="ds-alert-header">
          {icon && <span className="ds-alert-icon">{icon}</span>}
          {title && <span className="ds-alert-title">{title}</span>}
        </div>
      )}
      <div className="ds-alert-body">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SECTION — Title + optional subtitle + children
// ═══════════════════════════════════════════════════════

export function Section({ title, subtitle, icon, cap, actions, children }) {
  return (
    <div className="ds-section">
      <div className="ds-section-header">
        <div className="ds-section-title">
          {icon && <span className="ds-section-icon">{icon}</span>}
          {title}
          {cap && <span className="ds-section-cap">{cap}</span>}
        </div>
        {actions && <div className="ds-section-actions">{actions}</div>}
      </div>
      {subtitle && <p className="ds-section-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GRID — Consistent 2-col and 3-col layouts
// ═══════════════════════════════════════════════════════

export function Grid({ cols = 2, gap = 12, children, className = '' }) {
  return <div className={`ds-grid ds-grid--${cols} ${className}`} style={{ gap }}>{children}</div>;
}

// ═══════════════════════════════════════════════════════
// PAGE — Page-level wrapper with title
// ═══════════════════════════════════════════════════════

export function Page({ title, subtitle, maxWidth = 640, actions, children }) {
  return (
    <div className="ds-page" style={{ maxWidth }}>
      {(title || actions) && (
        <div className="ds-page-header">
          <div>
            {title && <h1 className="ds-page-title">{title}</h1>}
            {subtitle && <p className="ds-page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ds-page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SMALL UTILITIES
// ═══════════════════════════════════════════════════════

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -1, marginLeft: 3, color: 'var(--text-light)' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function Spinner({ size = 16 }) {
  return <span className="ds-spinner" style={{ width: size, height: size }} />;
}

export function Divider() {
  return <div className="ds-divider" />;
}
