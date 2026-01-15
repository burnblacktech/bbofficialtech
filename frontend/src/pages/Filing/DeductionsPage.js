/**
 * 80C Deductions Page
 * Collect 80C deduction details
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { PiggyBank, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import newFilingService from '../../services/newFilingService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';

const DeductionsPage = () => {
    const navigate = useNavigate();
    const { filingId } = useParams();

    const [formData, setFormData] = useState({
        ppf: '',
        elss: '',
        lifeInsurance: '',
        nsc: '',
        tuitionFees: '',
        homeLoanPrincipal: '',
    });

    const MAX_80C_LIMIT = 150000;

    // Add deductions mutation
    const addDeductionsMutation = useMutation({
        mutationFn: (data) => newFilingService.add80CDeductions(filingId, data),
        onSuccess: (response) => {
            toast.success(`80C deductions saved! Tax savings: ₹${response.data.taxSavings.toLocaleString('en-IN')}`);
            navigate(`/filing/${filingId}/tax-calculation`);
        },
        onError: (error) => {
            console.error('Add deductions error:', error);
            toast.error(error.response?.data?.message || 'Failed to save deductions');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const deductionData = {
            ppf: parseFloat(formData.ppf) || 0,
            elss: parseFloat(formData.elss) || 0,
            lifeInsurance: parseFloat(formData.lifeInsurance) || 0,
            nsc: parseFloat(formData.nsc) || 0,
            tuitionFees: parseFloat(formData.tuitionFees) || 0,
            homeLoanPrincipal: parseFloat(formData.homeLoanPrincipal) || 0,
        };

        addDeductionsMutation.mutate(deductionData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const calculateTotal = () => {
        return Object.values(formData).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

    const getEligibleAmount = () => {
        return Math.min(calculateTotal(), MAX_80C_LIMIT);
    };

    const isOverLimit = () => {
        return calculateTotal() > MAX_80C_LIMIT;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const deductionItems = [
        { name: 'ppf', label: 'PPF (Public Provident Fund)', hint: 'Contributions to PPF account' },
        { name: 'elss', label: 'ELSS (Equity Linked Savings Scheme)', hint: 'Mutual fund investments' },
        { name: 'lifeInsurance', label: 'Life Insurance Premium', hint: 'Premium paid for life insurance' },
        { name: 'nsc', label: 'NSC (National Savings Certificate)', hint: 'Investment in NSC' },
        { name: 'tuitionFees', label: 'Tuition Fees', hint: 'Children education fees (max 2 children)' },
        { name: 'homeLoanPrincipal', label: 'Home Loan Principal', hint: 'Principal repayment only' },
    ];

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
                        <PiggyBank size={32} color={tokens.colors.accent[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        80C Deductions
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        Enter your investments and payments eligible for 80C deduction
                    </p>
                </div>

                {/* Limit Info */}
                <Card padding="md" style={{
                    marginBottom: tokens.spacing.lg,
                    backgroundColor: isOverLimit() ? tokens.colors.warning[50] : tokens.colors.info[50],
                    border: `1px solid ${isOverLimit() ? tokens.colors.warning[200] : tokens.colors.info[200]}`,
                }}>
                    <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'start' }}>
                        <AlertCircle size={20} color={isOverLimit() ? tokens.colors.warning[600] : tokens.colors.info[600]} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: isOverLimit() ? tokens.colors.warning[900] : tokens.colors.info[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                {isOverLimit() ? 'Over Limit!' : 'Maximum Deduction Limit'}
                            </p>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: isOverLimit() ? tokens.colors.warning[700] : tokens.colors.info[700],
                            }}>
                                {isOverLimit()
                                    ? `You've entered ${formatCurrency(calculateTotal())}, but only ${formatCurrency(MAX_80C_LIMIT)} is eligible for deduction.`
                                    : `Maximum deduction under Section 80C is ${formatCurrency(MAX_80C_LIMIT)} per year.`
                                }
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Form */}
                <Card padding="xl">
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: tokens.spacing.xl }}>
                            {deductionItems.map((item) => (
                                <div key={item.name} style={{ marginBottom: tokens.spacing.md }}>
                                    <FormField
                                        label={item.label}
                                        hint={item.hint}
                                    >
                                        <Input
                                            type="number"
                                            name={item.name}
                                            value={formData[item.name]}
                                            onChange={handleChange}
                                            placeholder="0"
                                        />
                                    </FormField>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <Card padding="lg" style={{
                            backgroundColor: tokens.colors.accent[50],
                            marginBottom: tokens.spacing.xl,
                            border: `2px solid ${tokens.colors.accent[200]}`,
                        }}>
                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                    <span style={{ color: tokens.colors.neutral[700] }}>Total Claimed:</span>
                                    <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>
                                        {formatCurrency(calculateTotal())}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                    <span style={{ color: tokens.colors.neutral[700] }}>Eligible Amount:</span>
                                    <span style={{
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: tokens.colors.accent[700],
                                    }}>
                                        {formatCurrency(getEligibleAmount())}
                                    </span>
                                </div>
                            </div>
                            <div style={{
                                paddingTop: tokens.spacing.md,
                                borderTop: `1px solid ${tokens.colors.accent[200]}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.neutral[700],
                                    }}>
                                        Estimated Tax Savings (30% bracket):
                                    </span>
                                    <span style={{
                                        fontSize: tokens.typography.fontSize.xl,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: tokens.colors.success[600],
                                    }}>
                                        {formatCurrency(getEligibleAmount() * 0.3)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'space-between' }}>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate(`/filing/${filingId}/salary`)}
                            >
                                <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={addDeductionsMutation.isLoading}
                            >
                                {addDeductionsMutation.isLoading ? 'Saving...' : 'Continue'}
                                {!addDeductionsMutation.isLoading && <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Skip Option */}
                <p style={{
                    textAlign: 'center',
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    marginTop: tokens.spacing.md,
                }}>
                    No deductions?{' '}
                    <button
                        onClick={() => navigate(`/filing/${filingId}/tax-calculation`)}
                        style={{
                            color: tokens.colors.accent[600],
                            textDecoration: 'none',
                            fontWeight: tokens.typography.fontWeight.medium,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Skip this step
                    </button>
                </p>
            </div>
        </div>
    );
};

export default DeductionsPage;
