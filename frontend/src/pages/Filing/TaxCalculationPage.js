/**
 * Tax Calculation Page
 * Calculate tax and compare regimes
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calculator, ArrowRight, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import newFilingService from '../../services/newFilingService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';

const TaxCalculationPage = () => {
    const navigate = useNavigate();
    const { filingId } = useParams();
    const [selectedRegime, setSelectedRegime] = useState('OLD');

    // Calculate tax mutation
    const calculateTaxMutation = useMutation({
        mutationFn: (regime) => newFilingService.calculateTax(filingId, regime),
        onSuccess: (response) => {
            toast.success('Tax calculated successfully!');
        },
        onError: (error) => {
            console.error('Calculate tax error:', error);
            toast.error('Failed to calculate tax');
        },
    });

    // Compare regimes query
    const { data: comparisonData, isLoading: isComparing } = useQuery({
        queryKey: ['regime-comparison', filingId],
        queryFn: () => newFilingService.compareRegimes(filingId),
        enabled: !!filingId,
    });

    const handleCalculate = () => {
        calculateTaxMutation.mutate(selectedRegime);
    };

    const handleContinue = () => {
        navigate(`/filing/${filingId}/review`);
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const comparison = comparisonData?.data;
    const oldRegime = comparison?.oldRegime;
    const newRegime = comparison?.newRegime;
    const recommendation = comparison?.recommendation;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: `${tokens.colors.accent[600]}15`,
                        borderRadius: tokens.borderRadius.full,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <Calculator size={32} color={tokens.colors.accent[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Tax Calculation
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        Compare old vs new tax regime and see your tax liability
                    </p>
                </div>

                {/* Regime Comparison */}
                {isComparing ? (
                    <Card padding="xl">
                        <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
                            <p style={{ color: tokens.colors.neutral[600] }}>Calculating tax...</p>
                        </div>
                    </Card>
                ) : comparison ? (
                    <div>
                        {/* Recommendation Banner */}
                        <Card padding="md" style={{
                            marginBottom: tokens.spacing.lg,
                            backgroundColor: tokens.colors.success[50],
                            border: `2px solid ${tokens.colors.success[200]}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                <TrendingDown size={24} color={tokens.colors.success[600]} />
                                <div>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.base,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        color: tokens.colors.success[900],
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        Recommended: {recommendation === 'OLD' ? 'Old Regime' : 'New Regime'}
                                    </p>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.success[700],
                                    }}>
                                        Save {formatCurrency(comparison.savings)} by choosing the {recommendation === 'OLD' ? 'old' : 'new'} regime
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Comparison Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: tokens.spacing.lg,
                            marginBottom: tokens.spacing.xl,
                        }}>
                            {/* Old Regime */}
                            <Card
                                padding="lg"
                                style={{
                                    border: recommendation === 'OLD' ? `3px solid ${tokens.colors.success[500]}` : undefined,
                                    position: 'relative',
                                }}
                            >
                                {recommendation === 'OLD' && (
                                    <Badge
                                        variant="success"
                                        style={{
                                            position: 'absolute',
                                            top: tokens.spacing.sm,
                                            right: tokens.spacing.sm,
                                        }}
                                    >
                                        Recommended
                                    </Badge>
                                )}
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.lg,
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.md,
                                }}>
                                    Old Regime
                                </h3>
                                <div style={{ marginBottom: tokens.spacing.md }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Gross Income:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                            {formatCurrency(oldRegime?.grossTotalIncome)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Deductions:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.success[600] }}>
                                            - {formatCurrency(oldRegime?.totalDeductions)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Taxable Income:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>
                                            {formatCurrency(oldRegime?.taxableIncome)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    paddingTop: tokens.spacing.md,
                                    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                            Total Tax:
                                        </span>
                                        <span style={{
                                            fontSize: tokens.typography.fontSize.xl,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.error[600],
                                        }}>
                                            {formatCurrency(oldRegime?.totalTaxLiability)}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* New Regime */}
                            <Card
                                padding="lg"
                                style={{
                                    border: recommendation === 'NEW' ? `3px solid ${tokens.colors.success[500]}` : undefined,
                                    position: 'relative',
                                }}
                            >
                                {recommendation === 'NEW' && (
                                    <Badge
                                        variant="success"
                                        style={{
                                            position: 'absolute',
                                            top: tokens.spacing.sm,
                                            right: tokens.spacing.sm,
                                        }}
                                    >
                                        Recommended
                                    </Badge>
                                )}
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.lg,
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.md,
                                }}>
                                    New Regime
                                </h3>
                                <div style={{ marginBottom: tokens.spacing.md }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Gross Income:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                            {formatCurrency(newRegime?.grossTotalIncome)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Deductions:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[400] }}>
                                            Not allowed
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            Taxable Income:
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>
                                            {formatCurrency(newRegime?.taxableIncome)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    paddingTop: tokens.spacing.md,
                                    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                            Total Tax:
                                        </span>
                                        <span style={{
                                            fontSize: tokens.typography.fontSize.xl,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.error[600],
                                        }}>
                                            {formatCurrency(newRegime?.totalTaxLiability)}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Refund/Payable */}
                        {oldRegime && (
                            <Card padding="lg" style={{
                                marginBottom: tokens.spacing.xl,
                                backgroundColor: oldRegime.isRefund ? tokens.colors.success[50] : tokens.colors.warning[50],
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.neutral[700],
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        {oldRegime.isRefund ? 'Refund Amount' : 'Tax Payable'}
                                    </p>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize['3xl'],
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: oldRegime.isRefund ? tokens.colors.success[700] : tokens.colors.warning[700],
                                    }}>
                                        {formatCurrency(Math.abs(oldRegime.refundOrPayable))}
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'space-between' }}>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate(`/filing/${filingId}/deductions`)}
                            >
                                <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                                Back
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="lg"
                                onClick={handleContinue}
                            >
                                Continue to Review
                                <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Card padding="xl">
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing.lg }}>
                                Click below to calculate your tax
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleCalculate}
                                disabled={calculateTaxMutation.isLoading}
                            >
                                {calculateTaxMutation.isLoading ? 'Calculating...' : 'Calculate Tax'}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default TaxCalculationPage;
