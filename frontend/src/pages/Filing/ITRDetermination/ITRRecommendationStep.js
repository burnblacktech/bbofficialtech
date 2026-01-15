/**
 * ITR Recommendation Step
 * Final step: Show ITR recommendation and create filing
 */

import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Card from '../../../components/atoms/Card';
import Badge from '../../../components/atoms/Badge';
import { tokens } from '../../../styles/tokens';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import newFilingService from '../../../services/newFilingService';

const ITRRecommendationStep = ({ data, onContinue, onBack }) => {
    // Determine ITR mutation
    const determineITRMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/api/itr/determine', {
                profile: data.profile,
                incomeSources: data.incomeSources,
                additionalInfo: data.additionalInfo,
            });
            return response.data;
        },
    });

    // Create filing mutation
    const createFilingMutation = useMutation({
        mutationFn: async (determinationResult) => {
            const response = await newFilingService.createFiling({
                financialYear: '2024-25',
                pan: data.pan,
                determinedITR: determinationResult.recommendedITR,
                determinationData: {
                    profile: data.profile,
                    incomeSources: data.incomeSources,
                    additionalInfo: data.additionalInfo,
                    eligibility: determinationResult.eligibility,
                    determinedAt: new Date().toISOString(),
                },
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success('Filing created successfully!');
            onContinue(response.filingId);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create filing');
        },
    });

    // Auto-determine ITR on mount
    useEffect(() => {
        if (!data.determinationResult) {
            determineITRMutation.mutate();
        }
    }, []);

    const handleContinue = () => {
        const result = determineITRMutation.data?.data || data.determinationResult;
        createFilingMutation.mutate(result);
    };

    if (determineITRMutation.isLoading) {
        return (
            <Card padding="xl">
                <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: `4px solid ${tokens.colors.neutral[200]}`,
                        borderTop: `4px solid ${tokens.colors.accent[600]}`,
                        borderRadius: tokens.borderRadius.full,
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.md,
                    }} />
                    <p style={{ color: tokens.colors.neutral[600] }}>Determining your ITR form...</p>
                </div>
            </Card>
        );
    }

    if (determineITRMutation.isError) {
        return (
            <Card padding="xl">
                <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
                    <p style={{ color: tokens.colors.error[600], marginBottom: tokens.spacing.md }}>
                        Failed to determine ITR form
                    </p>
                    <Button variant="primary" onClick={() => determineITRMutation.mutate()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    const result = determineITRMutation.data?.data || data.determinationResult;
    if (!result) return null;

    const { recommendedITR, explanation, formDetails } = result;

    return (
        <Card padding="xl">
            {/* Success Header */}
            <div style={{ textAlign: 'center', marginBottom: tokens.spacing.xl }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: `${tokens.colors.success[600]}15`,
                    borderRadius: tokens.borderRadius.full,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    marginBottom: tokens.spacing.md,
                }}>
                    <CheckCircle size={40} color={tokens.colors.success[600]} />
                </div>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Your Recommended ITR Form
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.neutral[600],
                }}>
                    Based on your profile and income sources
                </p>
            </div>

            {/* ITR Form Card */}
            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.accent[600]}10`,
                border: `2px solid ${tokens.colors.accent[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.lg,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.md }}>
                    <div>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.xl,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.accent[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            {explanation.title}
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.accent[700],
                        }}>
                            {explanation.description}
                        </p>
                    </div>
                    <Badge variant="success">Recommended</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
                    <div>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                            Complexity
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                            {explanation.complexity}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                            Estimated Time
                        </p>
                        <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                            {explanation.estimatedTime}
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: tokens.colors.neutral[800],
                        marginBottom: tokens.spacing.sm,
                    }}>
                        Benefits:
                    </p>
                    <ul style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[700],
                        margin: 0,
                        paddingLeft: tokens.spacing.lg,
                    }}>
                        {explanation.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Why this ITR? */}
            <div style={{
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.info[50],
                border: `1px solid ${tokens.colors.info[200]}`,
                borderRadius: tokens.borderRadius.md,
                marginBottom: tokens.spacing.xl,
            }}>
                <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                    <Info size={20} color={tokens.colors.info[600]} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.info[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Why {recommendedITR}?
                        </p>
                        <ul style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.info[700],
                            margin: 0,
                            paddingLeft: tokens.spacing.lg,
                        }}>
                            {explanation.requirements.map((req, idx) => (
                                <li key={idx}>{req}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex',
                gap: tokens.spacing.sm,
                justifyContent: 'space-between',
            }}>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={onBack}
                    disabled={createFilingMutation.isLoading}
                >
                    <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                    Back
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleContinue}
                    disabled={createFilingMutation.isLoading}
                >
                    {createFilingMutation.isLoading ? 'Creating Filing...' : 'Start Filing'}
                    {!createFilingMutation.isLoading && (
                        <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default ITRRecommendationStep;
