/**
 * FilingEntrySelector Component (Organism)
 * Main entry point for ITR filing with three options
 */

import React from 'react';
import { Upload, RefreshCw, MessageCircle } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

const FilingEntrySelector = ({ onSelect, verifiedPansCount = 0 }) => {
    const options = [
        {
            id: 'upload',
            icon: Upload,
            title: 'I have my Form 16',
            description: 'Upload and we\'ll do the rest',
            recommended: true,
            badge: 'Fastest',
        },
        {
            id: 'verified',
            icon: RefreshCw,
            title: 'I\'ve filed before',
            description: 'Let\'s use your saved details',
            disabled: verifiedPansCount === 0,
            badge: verifiedPansCount > 0 ? `${verifiedPansCount} PAN${verifiedPansCount > 1 ? 's' : ''}` : null,
        },
        {
            id: 'manual',
            icon: MessageCircle,
            title: 'Starting fresh',
            description: 'I\'ll guide you step by step',
        },
    ];

    return (
        <div style={{
            padding: tokens.spacing.xl,
            maxWidth: '600px',
            margin: '0 auto',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: tokens.spacing['2xl'] }}>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['4xl'],
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.md,
                    lineHeight: tokens.typography.lineHeight.tight,
                }}>
                    ✨ Ready to file your taxes?
                </h2>

                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                    lineHeight: tokens.typography.lineHeight.relaxed,
                }}>
                    We'll make this quick and painless. Promise.
                </p>
            </div>

            {/* Options */}
            <div style={{
                display: 'grid',
                gap: tokens.spacing.md,
            }}>
                {options.map(option => {
                    const IconComponent = option.icon;
                    const isDisabled = option.disabled;

                    return (
                        <Card
                            key={option.id}
                            onClick={() => !isDisabled && onSelect(option.id)}
                            hoverable={!isDisabled}
                            style={{
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.5 : 1,
                                border: option.recommended
                                    ? `2px solid ${tokens.colors.accent[600]}`
                                    : `1px solid ${tokens.colors.neutral[200]}`,
                                position: 'relative',
                            }}
                        >
                            {/* Recommended badge */}
                            {option.recommended && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: tokens.spacing.lg,
                                }}>
                                    <Badge variant="accent" size="sm">
                                        Recommended
                                    </Badge>
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.lg,
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: tokens.borderRadius.lg,
                                    backgroundColor: option.recommended
                                        ? tokens.colors.accent[100]
                                        : tokens.colors.neutral[100],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <IconComponent
                                        size={28}
                                        color={option.recommended
                                            ? tokens.colors.accent[600]
                                            : tokens.colors.neutral[600]
                                        }
                                    />
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.lg,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        color: tokens.colors.neutral[900],
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        {option.title}
                                    </h3>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.neutral[600],
                                        lineHeight: tokens.typography.lineHeight.normal,
                                    }}>
                                        {option.description}
                                    </p>
                                </div>

                                {/* Badge */}
                                {option.badge && (
                                    <Badge
                                        variant={option.recommended ? 'accent' : 'default'}
                                        size="sm"
                                    >
                                        {option.badge}
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div style={{
                marginTop: tokens.spacing.xl,
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.info[50],
                borderRadius: tokens.borderRadius.lg,
                border: `1px solid ${tokens.colors.info[100]}`,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.info[700],
                    lineHeight: tokens.typography.lineHeight.normal,
                    margin: 0,
                }}>
                    💡 <strong>Pro tip:</strong> Upload your Form 16 for the fastest filing experience. We'll auto-fill 95% of your details!
                </p>
            </div>
        </div>
    );
};

export default FilingEntrySelector;
