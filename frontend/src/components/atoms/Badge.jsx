/**
 * Badge Component (Atom)
 * Small status indicator following design system tokens
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    ...props
}) => {
    const variants = {
        default: {
            backgroundColor: tokens.colors.neutral[100],
            color: tokens.colors.neutral[700],
        },
        primary: {
            backgroundColor: tokens.colors.primary[100],
            color: tokens.colors.primary[700],
        },
        accent: {
            backgroundColor: tokens.colors.accent[300],
            color: tokens.colors.primary[900],
        },
        success: {
            backgroundColor: tokens.colors.success[100],
            color: tokens.colors.success[700],
        },
        warning: {
            backgroundColor: tokens.colors.warning[100],
            color: tokens.colors.warning[700],
        },
        error: {
            backgroundColor: tokens.colors.error[100],
            color: tokens.colors.error[700],
        },
        info: {
            backgroundColor: tokens.colors.info[100],
            color: tokens.colors.info[700],
        },
    };

    const sizes = {
        sm: {
            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
            fontSize: tokens.typography.fontSize.xs,
        },
        md: {
            padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.sm,
        },
        lg: {
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.base,
        },
    };

    const variantStyle = variants[variant];
    const sizeStyle = sizes[size];

    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        fontFamily: tokens.typography.fontFamily.primary,
        fontWeight: tokens.typography.fontWeight.medium,
        borderRadius: tokens.borderRadius.full,
        whiteSpace: 'nowrap',
        ...variantStyle,
        ...sizeStyle,
    };

    const dotStyles = {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor',
    };

    return (
        <span style={baseStyles} {...props}>
            {dot && <span style={dotStyles} />}
            {children}
        </span>
    );
};

export default Badge;
