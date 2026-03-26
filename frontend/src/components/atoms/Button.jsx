/**
 * Button Component (Atom)
 * Reusable button following design system tokens
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    onClick,
    type = 'button',
    ...props
}) => {
    // Variant styles
    const variants = {
        primary: {
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            hover: {
                backgroundColor: '#1d4ed8',
            },
        },
        secondary: {
            backgroundColor: '#f3f4f6',
            color: '#111827',
            border: '1px solid #d1d5db',
            hover: {
                backgroundColor: '#e5e7eb',
            },
        },
        outline: {
            backgroundColor: 'transparent',
            color: '#2563eb',
            border: '2px solid #2563eb',
            hover: {
                backgroundColor: '#eff6ff',
            },
        },
        ghost: {
            backgroundColor: 'transparent',
            color: '#374151',
            border: '1px solid transparent',
            hover: {
                backgroundColor: '#f3f4f6',
            },
        },
        danger: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            hover: {
                backgroundColor: '#dc2626',
            },
        },
    };

    // Size styles
    const sizes = {
        sm: {
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.sm,
            minHeight: '36px',
        },
        md: {
            padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
            fontSize: tokens.typography.fontSize.base,
            minHeight: '48px', // Touch-friendly
        },
        lg: {
            padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
            fontSize: tokens.typography.fontSize.lg,
            minHeight: '56px',
        },
    };

    const variantStyle = variants[variant];
    const sizeStyle = sizes[size];

    const baseStyles = {
        fontFamily: tokens.typography.fontFamily.primary,
        fontWeight: tokens.typography.fontWeight.semibold,
        borderRadius: tokens.borderRadius.lg,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: tokens.transitions.base,
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing.sm,
        ...variantStyle,
        ...sizeStyle,
    };

    const [isHovered, setIsHovered] = React.useState(false);

    const currentStyles = {
        ...baseStyles,
        ...(isHovered && !disabled && !loading ? variantStyle.hover : {}),
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={currentStyles}
            {...props}
        >
            {loading ? (
                <>
                    <span className="spinner" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                    }} />
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
};

// Add spinner animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Button;
