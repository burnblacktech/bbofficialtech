/**
 * Start Filing Page
 * Entry point for creating a new ITR filing
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FileText, ArrowRight, Info } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import newFilingService from '../../services/newFilingService';
import { tokens } from '../../styles/tokens';
import toast from 'react-hot-toast';

const StartFilingPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        financialYear: '2024-25', // Current Assessment Year
        pan: '',
    });
    const [errors, setErrors] = useState({});

    // Create filing mutation
    const createFilingMutation = useMutation({
        mutationFn: (data) => newFilingService.createFiling(data),
        onSuccess: (response) => {
            toast.success('Filing created successfully!');
            const filingId = response.data.filingId;
            navigate(`/filing/${filingId}/salary`);
        },
        onError: (error) => {
            console.error('Create filing error:', error);

            // Check if filing already exists
            if (error.response?.status === 400 && error.response?.data?.data?.filingId) {
                const existingFilingId = error.response.data.data.filingId;
                toast.success('Resuming existing filing...');
                navigate(`/filing/${existingFilingId}/salary`);
            } else {
                toast.error(error.response?.data?.message || 'Failed to create filing');
            }
        },
    });

    const validateForm = () => {
        const newErrors = {};

        // Validate PAN
        if (!formData.pan) {
            newErrors.pan = 'PAN is required';
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
            newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
        }

        // Validate financial year
        if (!formData.financialYear) {
            newErrors.financialYear = 'Financial year is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        createFilingMutation.mutate({
            financialYear: formData.financialYear,
            pan: formData.pan.toUpperCase(),
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: `${tokens.colors.accent[600]}15`,
                        borderRadius: tokens.borderRadius.full,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <FileText size={40} color={tokens.colors.accent[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Start New ITR Filing
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.base,
                        color: tokens.colors.neutral[600],
                    }}>
                        Let's get started with your income tax return for FY 2024-25
                    </p>
                </div>

                {/* Info Card */}
                <Card padding="md" style={{ marginBottom: tokens.spacing.lg, backgroundColor: tokens.colors.info[50], border: `1px solid ${tokens.colors.info[200]}` }}>
                    <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                        <Info size={20} color={tokens.colors.info[600]} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.info[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                What you'll need
                            </h3>
                            <ul style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.info[700],
                                margin: 0,
                                paddingLeft: tokens.spacing.lg,
                            }}>
                                <li>PAN Card</li>
                                <li>Form 16 (if salaried)</li>
                                <li>Investment proofs (80C, 80D, etc.)</li>
                                <li>Bank account details</li>
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Form */}
                <Card padding="xl">
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: tokens.spacing.lg }}>
                            <FormField
                                label="Financial Year"
                                required
                                error={errors.financialYear}
                            >
                                <select
                                    name="financialYear"
                                    value={formData.financialYear}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        fontSize: tokens.typography.fontSize.base,
                                        border: `1px solid ${errors.financialYear ? tokens.colors.error[500] : tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        backgroundColor: tokens.colors.neutral.white,
                                        color: tokens.colors.neutral[900],
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="2024-25">2024-25 (AY 2025-26) - Current</option>
                                    <option value="2023-24">2023-24 (AY 2024-25)</option>
                                    <option value="2022-23">2022-23 (AY 2023-24)</option>
                                    <option value="2021-22">2021-22 (AY 2022-23)</option>
                                </select>
                            </FormField>
                        </div>

                        <div style={{ marginBottom: tokens.spacing.xl }}>
                            <FormField
                                label="PAN Number"
                                required
                                error={errors.pan}
                                hint="Enter your 10-digit PAN (e.g., ABCDE1234F)"
                            >
                                <Input
                                    type="text"
                                    name="pan"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                    style={{
                                        textTransform: 'uppercase',
                                    }}
                                    error={!!errors.pan}
                                />
                            </FormField>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={createFilingMutation.isLoading}
                        >
                            {createFilingMutation.isLoading ? 'Creating Filing...' : 'Start Filing'}
                            {!createFilingMutation.isLoading && <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />}
                        </Button>
                    </form>
                </Card>

                {/* Help Text */}
                <p style={{
                    textAlign: 'center',
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    marginTop: tokens.spacing.lg,
                }}>
                    Don't have your documents ready?{' '}
                    <a
                        href="/documents/upload"
                        style={{
                            color: tokens.colors.accent[600],
                            textDecoration: 'none',
                            fontWeight: tokens.typography.fontWeight.medium,
                        }}
                    >
                        Upload them first
                    </a>
                </p>
            </div>
        </div>
    );
};

export default StartFilingPage;
