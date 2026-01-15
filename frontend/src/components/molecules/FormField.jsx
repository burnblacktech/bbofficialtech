/**
 * FormField Component (Molecule)
 * Combines label, input, and error/hint text
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const FormField = ({
    label,
    error,
    hint,
    required = false,
    children,
    htmlFor,
    ...props
}) => {
    return (
        <div style={{ marginBottom: tokens.spacing.lg }} {...props}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    style={{
                        display: 'block',
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.medium,
                        color: tokens.colors.neutral[700],
                        marginBottom: tokens.spacing.sm,
                    }}
                >
                    {label}
                    {required && (
                        <span style={{ color: tokens.colors.error[600], marginLeft: '4px' }}>
                            *
                        </span>
                    )}
                </label>
            )}

            {children}

            {hint && !error && (
                <p
                    style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[500],
                        marginTop: tokens.spacing.xs,
                        lineHeight: tokens.typography.lineHeight.normal,
                    }}
                >
                    {hint}
                </p>
            )}

            {error && (
                <p
                    style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.error[600],
                        marginTop: tokens.spacing.xs,
                        lineHeight: tokens.typography.lineHeight.normal,
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                    }}
                >
                    <span>⚠️</span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
