/**
 * Card Component (Atom)
 * Reusable card container following design system tokens
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Card = ({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    onClick,
    className = '',
    style = {},
    ...props
}) => {
    const variants = {
        default: {
            backgroundColor: tokens.colors.neutral.white,
            border: `1px solid ${tokens.colors.neutral[200]}`,
            boxShadow: tokens.shadows.sm,
        },
        elevated: {
            backgroundColor: tokens.colors.neutral.white,
            border: 'none',
            boxShadow: tokens.shadows.lg,
        },
        outlined: {
            backgroundColor: tokens.colors.neutral.white,
            border: `2px solid ${tokens.colors.neutral[300]}`,
            boxShadow: 'none',
        },
        flat: {
            backgroundColor: tokens.colors.neutral[50],
            border: 'none',
            boxShadow: 'none',
        },
    };

    const paddings = {
        none: '0',
        sm: tokens.spacing.md,
        md: tokens.spacing.lg,
        lg: tokens.spacing.xl,
        xl: tokens.spacing['2xl'],
    };

    const [isHovered, setIsHovered] = React.useState(false);

    const baseStyles = {
        borderRadius: tokens.borderRadius.xl,
        transition: tokens.transitions.base,
        cursor: onClick || hoverable ? 'pointer' : 'default',
        padding: paddings[padding],
        ...variants[variant],
    };

    const hoverStyles = (onClick || hoverable) && isHovered ? {
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadows.lg,
    } : {};

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={className}
            style={{
                ...baseStyles,
                ...hoverStyles,
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
