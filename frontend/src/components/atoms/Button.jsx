/**
 * Button Component (Atom) — Solid, professional buttons
 */

import React from 'react';
import P from '../../styles/palette';

const VARIANTS = {
  primary: {
    background: P.brand,
    color: P.textWhite,
    border: `1px solid ${P.brandHover}`,
    shadow: '0 1px 2px rgba(37,99,235,0.3)',
    hover: { background: P.brandHover, border: `1px solid ${P.brandDark}`, shadow: '0 2px 4px rgba(37,99,235,0.35)' },
  },
  secondary: {
    background: P.bgCard,
    color: P.textSecondary,
    border: `1px solid ${P.borderMedium}`,
    shadow: '0 1px 2px rgba(0,0,0,0.05)',
    hover: { background: P.bgCardHover, border: `1px solid ${P.textLight}` },
  },
  outline: {
    background: 'transparent',
    color: P.brand,
    border: `2px solid ${P.brand}`,
    shadow: 'none',
    hover: { background: P.brandLight },
  },
  ghost: {
    background: 'transparent',
    color: P.textSecondary,
    border: '1px solid transparent',
    shadow: 'none',
    hover: { background: P.bgMuted, border: `1px solid ${P.borderLight}` },
  },
  danger: {
    background: P.error,
    color: P.textWhite,
    border: `1px solid ${P.dangerHover}`,
    shadow: '0 1px 2px rgba(239,68,68,0.3)',
    hover: { background: P.dangerHover, border: `1px solid ${P.dangerDark}` },
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
