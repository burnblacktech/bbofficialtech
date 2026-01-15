/**
 * Review & Submit Page
 * Final review before filing submission
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, FileCheck, ArrowLeft, Send } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import newFilingService from '../../services/newFilingService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';

const ReviewSubmitPage = () => {
    const navigate = useNavigate();
    const { filingId } = useParams();

    // Get filing data
    const { data: filingData, isLoading } = useQuery({
        queryKey: ['filing', filingId],
        queryFn: () => newFilingService.getFiling(filingId),
        enabled: !!filingId,
    });

    // Validate filing
    const { data: validationData } = useQuery({
        queryKey: ['filing-validation', filingId],
        queryFn: () => newFilingService.validateFiling(filingId),
        enabled: !!filingId,
    });

    const filing = filingData?.data;
    const validation = validationData?.data;

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = () => {
        toast.success('Filing submitted successfully! (Demo mode)');
        navigate('/dashboard');
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: tokens.colors.neutral[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <p style={{ color: tokens.colors.neutral[600] }}>Loading filing data...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                        <FileCheck size={32} color={tokens.colors.accent[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Review & Submit
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        Review your filing details before submission
                    </p>
                </div>

                {/* Validation Status */}
                {validation && (
                    <Card padding="md" style={{
                        marginBottom: tokens.spacing.lg,
                        backgroundColor: validation.isValid ? tokens.colors.success[50] : tokens.colors.warning[50],
                        border: `1px solid ${validation.isValid ? tokens.colors.success[200] : tokens.colors.warning[200]}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                            <CheckCircle size={20} color={validation.isValid ? tokens.colors.success[600] : tokens.colors.warning[600]} />
                            <div>
                                <p style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: validation.isValid ? tokens.colors.success[900] : tokens.colors.warning[900],
                                }}>
                                    {validation.isValid ? 'Ready to Submit' : 'Please Review'}
                                </p>
                                {validation.warnings && validation.warnings.length > 0 && (
                                    <ul style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.warning[700],
                                        marginTop: tokens.spacing.xs,
                                        paddingLeft: tokens.spacing.lg,
                                    }}>
                                        {validation.warnings.map((warning, idx) => (
                                            <li key={idx}>{warning}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Filing Summary */}
                <Card padding="xl" style={{ marginBottom: tokens.spacing.lg }}>
                    <h3 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Filing Summary
                    </h3>

                    {/* Basic Info */}
                    <div style={{ marginBottom: tokens.spacing.lg }}>
                        <h4 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[800],
                            marginBottom: tokens.spacing.md,
                        }}>
                            Basic Information
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    PAN
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.medium }}>
                                    {filing?.taxpayerPan || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    Assessment Year
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.medium }}>
                                    {filing?.assessmentYear || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Income Summary */}
                    <div style={{ marginBottom: tokens.spacing.lg }}>
                        <h4 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[800],
                            marginBottom: tokens.spacing.md,
                        }}>
                            Income Summary
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                            <span style={{ color: tokens.colors.neutral[700] }}>Salary Income:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                                {formatCurrency(filing?.filingData?.incomeFromSalary?.[0]?.netSalary || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Deductions Summary */}
                    <div style={{ marginBottom: tokens.spacing.lg }}>
                        <h4 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[800],
                            marginBottom: tokens.spacing.md,
                        }}>
                            Deductions
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                            <span style={{ color: tokens.colors.neutral[700] }}>Section 80C:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.success[600] }}>
                                {formatCurrency(filing?.filingData?.deductions?.section80C?.total || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Tax Summary */}
                    <div style={{
                        paddingTop: tokens.spacing.lg,
                        borderTop: `2px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <h4 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[800],
                            marginBottom: tokens.spacing.md,
                        }}>
                            Tax Calculation
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                            <span style={{ color: tokens.colors.neutral[700] }}>Total Tax Liability:</span>
                            <span style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.error[600],
                            }}>
                                {formatCurrency(filing?.filingData?.taxCalculation?.totalTaxLiability || 0)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                            <span style={{ color: tokens.colors.neutral[700] }}>TDS Deducted:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                                {formatCurrency(filing?.filingData?.taxCalculation?.tdsAndTcs || 0)}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: tokens.spacing.md,
                            borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                        }}>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>
                                {filing?.filingData?.taxCalculation?.isRefund ? 'Refund Amount:' : 'Tax Payable:'}
                            </span>
                            <span style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: filing?.filingData?.taxCalculation?.isRefund ? tokens.colors.success[600] : tokens.colors.warning[600],
                            }}>
                                {formatCurrency(Math.abs(filing?.filingData?.taxCalculation?.refundOrPayable || 0))}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Progress */}
                <Card padding="md" style={{ marginBottom: tokens.spacing.xl }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                            Filing Progress
                        </span>
                        <Badge variant="success">
                            {filing?.progress || 0}% Complete
                        </Badge>
                    </div>
                </Card>

                {/* Actions */}
                <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'space-between' }}>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(`/filing/${filingId}/tax-calculation`)}
                    >
                        <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                        Back
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!validation?.isValid}
                    >
                        Submit Filing
                        <Send size={20} style={{ marginLeft: tokens.spacing.xs }} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewSubmitPage;
