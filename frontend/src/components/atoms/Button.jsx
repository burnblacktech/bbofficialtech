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
            backgroundColor: tokens.colors.accent[600],
            color: tokens.colors.primary[900],
            border: 'none',
            hover: {
                backgroundColor: tokens.colors.accent[500],
            },
        },
        secondary: {
            backgroundColor: tokens.colors.neutral[100],
            color: tokens.colors.neutral[900],
            border: `1px solid ${tokens.colors.neutral[300]}`,
            hover: {
                backgroundColor: tokens.colors.neutral[200],
            },
        },
        outline: {
            backgroundColor: 'transparent',
            color: tokens.colors.accent[600],
            border: `2px solid ${tokens.colors.accent[600]}`,
            hover: {
                backgroundColor: tokens.colors.accent[50],
            },
        },
        ghost: {
            backgroundColor: 'transparent',
            color: tokens.colors.neutral[700],
            border: 'none',
            hover: {
                backgroundColor: tokens.colors.neutral[100],
            },
        },
        danger: {
            backgroundColor: tokens.colors.error[600],
            color: tokens.colors.neutral.white,
            border: 'none',
            hover: {
                backgroundColor: tokens.colors.error[700],
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
