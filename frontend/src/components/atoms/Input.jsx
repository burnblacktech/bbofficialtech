/**
 * Input Component (Atom)
 * Reusable input field following design system tokens
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Input = ({
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled = false,
    error = false,
    success = false,
    fullWidth = false,
    size = 'md',
    leftIcon,
    rightIcon,
    ...props
}) => {
    const sizes = {
        sm: {
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.sm,
            minHeight: '36px',
        },
        md: {
            padding: `${tokens.spacing.md} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.base,
            minHeight: '48px',
        },
        lg: {
            padding: `${tokens.spacing.lg} ${tokens.spacing.lg}`,
            fontSize: tokens.typography.fontSize.lg,
            minHeight: '56px',
        },
    };

    const sizeStyle = sizes[size];

    // Determine border color based on state
    let borderColor = tokens.colors.neutral[300];
    if (error) borderColor = tokens.colors.error[600];
    if (success) borderColor = tokens.colors.success[600];
    if (disabled) borderColor = tokens.colors.neutral[200];

    const baseStyles = {
        fontFamily: tokens.typography.fontFamily.primary,
        fontWeight: tokens.typography.fontWeight.normal,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${borderColor}`,
        backgroundColor: disabled ? tokens.colors.neutral[50] : tokens.colors.neutral.white,
        color: disabled ? tokens.colors.neutral[400] : tokens.colors.neutral[900],
        cursor: disabled ? 'not-allowed' : 'text',
        transition: tokens.transitions.base,
        width: fullWidth ? '100%' : 'auto',
        outline: 'none',
        ...sizeStyle,
    };

    const [isFocused, setIsFocused] = React.useState(false);

    const focusStyles = isFocused && !disabled ? {
        borderColor: tokens.colors.accent[600],
        boxShadow: `0 0 0 3px ${tokens.colors.accent[300]}`,
    } : {};

    const containerStyles = {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto',
    };

    const iconStyles = {
        position: 'absolute',
        color: tokens.colors.neutral[500],
        pointerEvents: 'none',
    };

    return (
        <div style={containerStyles}>
            {leftIcon && (
                <span style={{ ...iconStyles, left: tokens.spacing.md }}>
                    {leftIcon}
                </span>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    ...baseStyles,
                    ...focusStyles,
                    paddingLeft: leftIcon ? '40px' : sizeStyle.padding.split(' ')[1],
                    paddingRight: rightIcon ? '40px' : sizeStyle.padding.split(' ')[1],
                }}
                {...props}
            />
            {rightIcon && (
                <span style={{ ...iconStyles, right: tokens.spacing.md }}>
                    {rightIcon}
                </span>
            )}
        </div>
    );
};

export default Input;
