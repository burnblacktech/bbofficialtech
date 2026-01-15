/**
 * Streamlined ITR Filing - Screen 1: Identity Verification
 * Quick PAN verification and data fetching
 */

import { useState } from 'react';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import { tokens } from '../../../styles/tokens';
import itrDataAggregator from '../../../services/itrDataAggregator';
import toast from 'react-hot-toast';

const IdentityVerificationScreen = ({ onNext }) => {
    const { user, profile } = useAuth();
    const [fetchingSources, setFetchingSources] = useState({
        form16: false,
        ais: false,
        income: false,
        deductions: false,
    });

    const aggregateDataMutation = useMutation({
        mutationFn: async () => {
            setFetchingSources({ form16: true, ais: true, income: true, deductions: true });

            // Simulate fetching from different sources
            await new Promise(resolve => setTimeout(resolve, 1500));

            const aggregatedData = await itrDataAggregator.aggregateAllData(user.id, '2024-25');
            return aggregatedData;
        },
        onSuccess: (data) => {
            toast.success('All data fetched successfully!');
            onNext(data);
        },
        onError: (error) => {
            toast.error('Failed to fetch data: ' + error.message);
            setFetchingSources({ form16: false, ais: false, income: false, deductions: false });
        },
    });

    const pan = user?.panNumber || profile?.pan || '';
    const name = user?.fullName || '';
    const personalInfo = itrDataAggregator.derivePersonalInfo(pan, name);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: tokens.spacing.xl }}>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.xs,
                    }}>
                        🎯 ITR Filing - FY 2024-25
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.base,
                        color: tokens.colors.neutral[600],
                    }}>
                        Let's file your taxes in 3 minutes
                    </p>
                </div>

                <Card padding="xl">
                    {/* PAN Details */}
                    <div style={{ marginBottom: tokens.spacing.xl }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.sm,
                            marginBottom: tokens.spacing.md,
                        }}>
                            <div style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                            }}>
                                PAN: {pan}
                            </div>
                            <CheckCircle size={20} color={tokens.colors.success[600]} />
                            <span style={{
                                fontSize: tokens.typography.fontSize.xs,
                                color: tokens.colors.success[600],
                                fontWeight: tokens.typography.fontWeight.medium,
                            }}>
                                Verified
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gap: tokens.spacing.sm,
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[700],
                        }}>
                            <div><strong>Name:</strong> {name}</div>
                            {personalInfo.age && (
                                <div>
                                    <strong>Age:</strong> {personalInfo.age} years
                                    <span style={{
                                        marginLeft: tokens.spacing.xs,
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.neutral[500],
                                    }}>
                                        (derived from PAN)
                                    </span>
                                </div>
                            )}
                            {personalInfo.gender && (
                                <div><strong>Gender:</strong> {personalInfo.gender}</div>
                            )}
                        </div>
                    </div>

                    {/* Data Sources */}
                    <div style={{
                        borderTop: `1px solid ${tokens.colors.neutral[100]}`,
                        paddingTop: tokens.spacing.lg,
                        marginBottom: tokens.spacing.xl,
                    }}>
                        <div style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            marginBottom: tokens.spacing.md,
                        }}>
                            We'll fetch data from:
                        </div>

                        <div style={{ display: 'grid', gap: tokens.spacing.sm }}>
                            {[
                                { key: 'form16', label: 'Form 16 (uploaded)', available: true },
                                { key: 'ais', label: 'AIS (Income Tax Portal)', available: false },
                                { key: 'income', label: 'Your Income Module', available: true },
                                { key: 'deductions', label: 'Your Deductions Module', available: true },
                            ].map(source => (
                                <div
                                    key={source.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacing.sm,
                                        padding: tokens.spacing.sm,
                                        backgroundColor: tokens.colors.neutral[50],
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.sm,
                                    }}
                                >
                                    {fetchingSources[source.key] ? (
                                        <Loader size={16} className="spin" color={tokens.colors.accent[600]} />
                                    ) : source.available ? (
                                        <CheckCircle size={16} color={tokens.colors.success[600]} />
                                    ) : (
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            border: `2px solid ${tokens.colors.neutral[300]}`,
                                        }} />
                                    )}
                                    <span style={{ color: source.available ? tokens.colors.neutral[700] : tokens.colors.neutral[500] }}>
                                        {source.label}
                                        {!source.available && ' (not available)'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        variant="primary"
                        onClick={() => aggregateDataMutation.mutate()}
                        disabled={aggregateDataMutation.isLoading}
                        icon={aggregateDataMutation.isLoading ? <Loader size={16} className="spin" /> : <ArrowRight size={16} />}
                        iconPosition="right"
                        style={{ width: '100%' }}
                    >
                        {aggregateDataMutation.isLoading ? 'Fetching Data...' : 'Fetch & Continue'}
                    </Button>
                </Card>

                <style>{`
                    .spin {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default IdentityVerificationScreen;
