/**
 * ProgressStepper - Multi-step progress indicator
 * Shows current step, completed steps, and upcoming steps
 */

import React from 'react';
import { Check } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const ProgressStepper = ({ steps, currentStep }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.sm,
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.neutral.white,
            borderRadius: tokens.borderRadius.lg,
            border: `1px solid ${tokens.colors.neutral[200]}`,
        }}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isUpcoming = index > currentStep;

                return (
                    <React.Fragment key={index}>
                        {/* Step */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.xs,
                            flex: 1,
                        }}>
                            {/* Circle */}
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: tokens.borderRadius.full,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isCompleted
                                    ? tokens.colors.success[600]
                                    : isCurrent
                                        ? tokens.colors.accent[600]
                                        : tokens.colors.neutral[200],
                                color: tokens.colors.neutral.white,
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                flexShrink: 0,
                            }}>
                                {isCompleted ? <Check size={16} /> : index + 1}
                            </div>

                            {/* Label */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    fontWeight: isCurrent ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                                    color: isCompleted || isCurrent ? tokens.colors.neutral[900] : tokens.colors.neutral[500],
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {step}
                                </div>
                            </div>
                        </div>

                        {/* Connector */}
                        {index < steps.length - 1 && (
                            <div style={{
                                height: '2px',
                                width: '24px',
                                backgroundColor: isCompleted ? tokens.colors.success[600] : tokens.colors.neutral[200],
                                flexShrink: 0,
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default ProgressStepper;
