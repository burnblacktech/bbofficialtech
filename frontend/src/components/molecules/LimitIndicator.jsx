/**
 * LimitIndicator - Progress bar with limit tracking
 * Shows usage against a maximum limit (e.g., ₹1.5L for 80C)
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const LimitIndicator = ({ current, limit, label, formatValue = (v) => `₹${v.toLocaleString()}` }) => {
    const percentage = Math.min((current / limit) * 100, 100);
    const isNearLimit = percentage > 80;
    const isAtLimit = percentage >= 100;

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing.xs,
            }}>
                <span style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[700],
                }}>
                    {label}
                </span>
                <span style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: isAtLimit
                        ? tokens.colors.success[600]
                        : isNearLimit
                            ? tokens.colors.warning[600]
                            : tokens.colors.accent[600],
                }}>
                    {formatValue(current)} / {formatValue(limit)}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{
                height: '8px',
                backgroundColor: tokens.colors.neutral[200],
                borderRadius: tokens.borderRadius.full,
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: isAtLimit
                        ? tokens.colors.success[600]
                        : isNearLimit
                            ? tokens.colors.warning[500]
                            : tokens.colors.accent[600],
                    transition: 'width 0.3s ease',
                }} />
            </div>

            {/* Helper Text */}
            {isAtLimit && (
                <div style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.success[600],
                    marginTop: tokens.spacing.xs,
                }}>
                    ✓ Maximum limit reached
                </div>
            )}
            {!isAtLimit && (
                <div style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.neutral[500],
                    marginTop: tokens.spacing.xs,
                }}>
                    {formatValue(limit - current)} remaining
                </div>
            )}
        </div>
    );
};

export default LimitIndicator;
