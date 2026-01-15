/**
 * StatCard - Numeric stat display with icon
 * For showing key metrics and numbers
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const StatCard = ({ icon: Icon, label, value, trend, color = tokens.colors.accent[600] }) => {
    return (
        <div style={{
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.neutral.white,
            borderRadius: tokens.borderRadius.lg,
            border: `1px solid ${tokens.colors.neutral[200]}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
                {Icon && (
                    <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: `${color}15`,
                        borderRadius: tokens.borderRadius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Icon size={20} color={color} />
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[600],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                    }}>
                        {value}
                    </div>
                </div>
            </div>
            {trend && (
                <div style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: trend.type === 'up' ? tokens.colors.success[600] : tokens.colors.error[600],
                }}>
                    {trend.value}
                </div>
            )}
        </div>
    );
};

export default StatCard;
