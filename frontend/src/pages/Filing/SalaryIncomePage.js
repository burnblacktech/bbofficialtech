/**
 * Salary Income Page
 * Collect salary details for ITR filing
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DollarSign, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import newFilingService from '../../services/newFilingService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';

const SalaryIncomePage = () => {
    const navigate = useNavigate();
    const { filingId } = useParams();

    const [formData, setFormData] = useState({
        employerName: '',
        employerPAN: '',
        grossSalary: '',
        exemptions: '',
        professionalTax: '',
        tdsDeducted: '',
    });
    const [errors, setErrors] = useState({});

    // Get filing data
    const { data: filingData } = useQuery({
        queryKey: ['filing', filingId],
        queryFn: () => newFilingService.getFiling(filingId),
        enabled: !!filingId,
    });

    // Add salary mutation
    const addSalaryMutation = useMutation({
        mutationFn: (data) => newFilingService.addSalaryIncome(filingId, data),
        onSuccess: (response) => {
            toast.success('Salary income saved!');
            navigate(`/filing/${filingId}/deductions`);
        },
        onError: (error) => {
            console.error('Add salary error:', error);
            toast.error(error.response?.data?.message || 'Failed to save salary income');
        },
    });

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employerName.trim()) {
            newErrors.employerName = 'Employer name is required';
        }

        if (!formData.grossSalary || parseFloat(formData.grossSalary) <= 0) {
            newErrors.grossSalary = 'Valid gross salary is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        addSalaryMutation.mutate({
            employerName: formData.employerName,
            employerPAN: formData.employerPAN,
            grossSalary: parseFloat(formData.grossSalary),
            exemptions: parseFloat(formData.exemptions) || 0,
            professionalTax: parseFloat(formData.professionalTax) || 0,
            tdsDeducted: parseFloat(formData.tdsDeducted) || 0,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const netSalary = () => {
        const gross = parseFloat(formData.grossSalary) || 0;
        const exempt = parseFloat(formData.exemptions) || 0;
        const profTax = parseFloat(formData.professionalTax) || 0;
        const standardDed = 50000;
        return Math.max(0, gross - exempt - profTax - standardDed);
    };

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
                        <DollarSign size={32} color={tokens.colors.accent[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Salary Income
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        Enter your salary details from Form 16
                    </p>
                </div>

                {/* Form */}
                <Card padding="xl">
                    <form onSubmit={handleSubmit}>
                        {/* Employer Details */}
                        <div style={{ marginBottom: tokens.spacing.xl }}>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.md,
                            }}>
                                Employer Details
                            </h3>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="Employer Name"
                                    required
                                    error={errors.employerName}
                                >
                                    <Input
                                        type="text"
                                        name="employerName"
                                        value={formData.employerName}
                                        onChange={handleChange}
                                        placeholder="ABC Corporation Ltd"
                                        error={!!errors.employerName}
                                    />
                                </FormField>
                            </div>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="Employer PAN"
                                    hint="Optional - from Form 16"
                                >
                                    <Input
                                        type="text"
                                        name="employerPAN"
                                        value={formData.employerPAN}
                                        onChange={handleChange}
                                        placeholder="AAAAA1111A"
                                        maxLength={10}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Salary Details */}
                        <div style={{ marginBottom: tokens.spacing.xl }}>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.md,
                            }}>
                                Salary Details
                            </h3>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="Gross Salary"
                                    required
                                    error={errors.grossSalary}
                                    hint="Total salary before deductions"
                                >
                                    <Input
                                        type="number"
                                        name="grossSalary"
                                        value={formData.grossSalary}
                                        onChange={handleChange}
                                        placeholder="850000"
                                        error={!!errors.grossSalary}
                                    />
                                </FormField>
                            </div>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="Exemptions"
                                    hint="HRA, LTA, etc."
                                >
                                    <Input
                                        type="number"
                                        name="exemptions"
                                        value={formData.exemptions}
                                        onChange={handleChange}
                                        placeholder="0"
                                    />
                                </FormField>
                            </div>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="Professional Tax"
                                    hint="Tax paid to state government"
                                >
                                    <Input
                                        type="number"
                                        name="professionalTax"
                                        value={formData.professionalTax}
                                        onChange={handleChange}
                                        placeholder="2400"
                                    />
                                </FormField>
                            </div>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <FormField
                                    label="TDS Deducted"
                                    hint="Tax already deducted by employer"
                                >
                                    <Input
                                        type="number"
                                        name="tdsDeducted"
                                        value={formData.tdsDeducted}
                                        onChange={handleChange}
                                        placeholder="45000"
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Summary */}
                        <Card padding="md" style={{ backgroundColor: tokens.colors.accent[50], marginBottom: tokens.spacing.xl }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.neutral[600],
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        Net Taxable Salary
                                    </p>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.xl,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: tokens.colors.accent[700],
                                    }}>
                                        {formatCurrency(netSalary())}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.neutral[600],
                                    }}>
                                        Standard Deduction: ₹50,000
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'space-between' }}>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={addSalaryMutation.isLoading}
                            >
                                {addSalaryMutation.isLoading ? 'Saving...' : 'Continue'}
                                {!addSalaryMutation.isLoading && <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default SalaryIncomePage;
