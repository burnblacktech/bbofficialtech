/**
 * Checklist - Checklist with checkmarks
 * For showing completion status of multiple items
 */

import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const Checklist = ({ items }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing.sm,
        }}>
            {items.map((item, index) => {
                const Icon = item.status === 'complete'
                    ? Check
                    : item.status === 'incomplete'
                        ? X
                        : AlertCircle;

                const color = item.status === 'complete'
                    ? tokens.colors.success[600]
                    : item.status === 'incomplete'
                        ? tokens.colors.error[600]
                        : tokens.colors.warning[600];

                return (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.sm,
                            padding: tokens.spacing.sm,
                            backgroundColor: item.status === 'complete'
                                ? tokens.colors.success[50]
                                : tokens.colors.neutral[50],
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${item.status === 'complete'
                                ? tokens.colors.success[200]
                                : tokens.colors.neutral[200]}`,
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: tokens.borderRadius.full,
                            backgroundColor: `${color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon size={14} color={color} />
                        </div>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[900],
                            flex: 1,
                        }}>
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default Checklist;
