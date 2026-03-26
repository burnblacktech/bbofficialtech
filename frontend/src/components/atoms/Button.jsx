/**
 * Button Component (Atom) — Solid, professional buttons
 */

import React from 'react';

const VARIANTS = {
  primary: {
    background: '#2563eb',
    color: '#fff',
    border: '1px solid #1d4ed8',
    shadow: '0 1px 2px rgba(37,99,235,0.3)',
    hover: { background: '#1d4ed8', border: '1px solid #1e40af', shadow: '0 2px 4px rgba(37,99,235,0.35)' },
  },
  secondary: {
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    shadow: '0 1px 2px rgba(0,0,0,0.05)',
    hover: { background: '#f9fafb', border: '1px solid #9ca3af' },
  },
  outline: {
    background: 'transparent',
    color: '#2563eb',
    border: '2px solid #2563eb',
    shadow: 'none',
    hover: { background: '#eff6ff' },
  },
  ghost: {
    background: 'transparent',
    color: '#374151',
    border: '1px solid transparent',
    shadow: 'none',
    hover: { background: '#f3f4f6', border: '1px solid #e5e7eb' },
  },
  danger: {
    background: '#ef4444',
    color: '#fff',
    border: '1px solid #dc2626',
    shadow: '0 1px 2px rgba(239,68,68,0.3)',
    hover: { background: '#dc2626', border: '1px solid #b91c1c' },
  },
};

const SIZES = {
  sm: { padding: '8px 14px', fontSize: '13px', minHeight: '34px' },
  md: { padding: '10px 20px', fontSize: '14px', minHeight: '42px' },
  lg: { padding: '12px 28px', fontSize: '16px', minHeight: '48px' },
};

const Button = ({ children, variant = 'primary', size = 'md', disabled = false, loading = false, fullWidth = false, onClick, type = 'button', style: styleProp, ...props }) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const [hovered, setHovered] = React.useState(false);

  const base = {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 600,
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '-0.01em',
    lineHeight: 1,
    background: v.background,
    color: v.color,
    border: v.border,
    boxShadow: v.shadow || 'none',
    ...s,
    ...(hovered && !disabled && !loading ? {
      background: v.hover?.background || v.background,
      border: v.hover?.border || v.border,
      boxShadow: v.hover?.shadow || v.shadow || 'none',
    } : {}),
    ...styleProp,
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={base} {...props}>
      {loading ? (
        <>
          <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
          Loading...
        </>
      ) : children}
    </button>
  );
};

export default Button;
