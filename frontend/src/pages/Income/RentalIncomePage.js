/**
 * Rental Income Page
 * Track house property income and rental earnings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const RentalIncomePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch rental income sources
    const { data: rentalData, isLoading } = useQuery({
        queryKey: ['income', 'rental'],
        queryFn: async () => {
            const response = await api.get('/api/income/rental');
            return response.data;
        },
    });

    // Create rental income mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/api/income', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['income']);
            queryClient.invalidateQueries(['dashboard']);
            setShowAddForm(false);
            setFormData({
                propertyAddress: '',
                annualRent: '',
                municipalTaxes: '',
                homeLoanInterest: '',
            });
        },
    });

    // Delete rental income mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/api/income/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['income']);
            queryClient.invalidateQueries(['dashboard']);
        },
    });

    const [formData, setFormData] = useState({
        propertyAddress: '',
        annualRent: '',
        municipalTaxes: '',
        homeLoanInterest: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const annualRent = parseFloat(formData.annualRent);
        const municipalTaxes = parseFloat(formData.municipalTaxes || 0);
        const homeLoanInterest = parseFloat(formData.homeLoanInterest || 0);

        // Calculate net rental income
        // Formula: Annual Rent - Municipal Taxes - 30% Standard Deduction - Home Loan Interest
        const standardDeduction = annualRent * 0.30; // 30% of annual rent
        const netRentalIncome = annualRent - municipalTaxes - standardDeduction - homeLoanInterest;

        const sourceData = {
            propertyAddress: formData.propertyAddress,
            annualRent,
            municipalTaxes,
            standardDeduction,
            homeLoanInterest,
            netRentalIncome,
        };

        createMutation.mutate({
            sourceType: 'rental',
            sourceData,
            amount: Math.max(0, netRentalIncome), // Can't be negative
            financialYear: '2024-25',
        });
    };

    const handleDelete = (id) => {
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to delete this rental income?')) {
            deleteMutation.mutate(id);
        }
    };

    const rentalIncomes = rentalData?.data || [];
    const totalIncome = rentalIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0);

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xl }}>
                <div>
                    <button
                        onClick={() => navigate('/income')}
                        style={{
                            padding: tokens.spacing.sm,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: tokens.colors.accent[600],
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.xs,
                            marginBottom: tokens.spacing.sm,
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Income Overview
                    </button>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Rental Income
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Track house property income and rental earnings
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.success[600],
                        color: tokens.colors.neutral.white,
                        border: 'none',
                        borderRadius: tokens.borderRadius.md,
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.medium,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                    }}
                >
                    <Plus size={16} />
                    Add Rental Income
                </button>
            </div>

            {/* Total Summary */}
            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.success[600]}10`,
                border: `2px solid ${tokens.colors.success[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.success[700],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Total Rental Income (FY 2024-25)
                </p>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['4xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.success[900],
                }}>
                    ₹{totalIncome.toLocaleString('en-IN')}
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.success[700],
                    marginTop: tokens.spacing.xs,
                }}>
                    After 30% standard deduction and other deductions
                </p>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.borderRadius.lg,
                    marginBottom: tokens.spacing.xl,
                }}>
                    <h3 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Add Rental Income
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Property Address *
                                </label>
                                <input
                                    type="text"
                                    value={formData.propertyAddress}
                                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                                    required
                                    placeholder="e.g., 123 Main Street, Mumbai"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Annual Rent Received *
                                </label>
                                <input
                                    type="number"
                                    value={formData.annualRent}
                                    onChange={(e) => setFormData({ ...formData, annualRent: e.target.value })}
                                    required
                                    placeholder="Total rent for the year"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Municipal Taxes Paid
                                </label>
                                <input
                                    type="number"
                                    value={formData.municipalTaxes}
                                    onChange={(e) => setFormData({ ...formData, municipalTaxes: e.target.value })}
                                    placeholder="Property tax paid"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Home Loan Interest
                                </label>
                                <input
                                    type="number"
                                    value={formData.homeLoanInterest}
                                    onChange={(e) => setFormData({ ...formData, homeLoanInterest: e.target.value })}
                                    placeholder="Interest paid on home loan (if any)"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginTop: tokens.spacing.xs }}>
                                    Maximum deduction: ₹2,00,000 per year
                                </p>
                            </div>

                            {/* Calculation Preview */}
                            {formData.annualRent && (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    padding: tokens.spacing.md,
                                    backgroundColor: tokens.colors.neutral[50],
                                    borderRadius: tokens.borderRadius.md,
                                }}>
                                    <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.sm }}>
                                        Calculation Preview:
                                    </p>
                                    <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Annual Rent:</span>
                                            <span>₹{parseFloat(formData.annualRent || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Less: Municipal Taxes:</span>
                                            <span>- ₹{parseFloat(formData.municipalTaxes || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Less: Standard Deduction (30%):</span>
                                            <span>- ₹{(parseFloat(formData.annualRent || 0) * 0.30).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Less: Home Loan Interest:</span>
                                            <span>- ₹{parseFloat(formData.homeLoanInterest || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: tokens.spacing.sm,
                                            borderTop: `1px solid ${tokens.colors.neutral[300]}`,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.success[600],
                                        }}>
                                            <span>Net Rental Income:</span>
                                            <span>
                                                ₹{Math.max(0, parseFloat(formData.annualRent || 0) - parseFloat(formData.municipalTaxes || 0) - (parseFloat(formData.annualRent || 0) * 0.30) - parseFloat(formData.homeLoanInterest || 0)).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
                            <button
                                type="submit"
                                disabled={createMutation.isLoading}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.success[600],
                                    color: tokens.colors.neutral.white,
                                    border: 'none',
                                    borderRadius: tokens.borderRadius.md,
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    cursor: 'pointer',
                                }}
                            >
                                {createMutation.isLoading ? 'Adding...' : 'Add Income'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.neutral.white,
                                    color: tokens.colors.neutral[700],
                                    border: `1px solid ${tokens.colors.neutral[300]}`,
                                    borderRadius: tokens.borderRadius.md,
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {rentalIncomes.length === 0 ? (
                    <div style={{
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        <Home size={48} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                        <p style={{ color: tokens.colors.neutral[600] }}>
                            No rental income added yet. Click "Add Rental Income" to get started.
                        </p>
                    </div>
                ) : (
                    rentalIncomes.map((income) => (
                        <div
                            key={income.id}
                            style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.lg,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        marginBottom: tokens.spacing.sm,
                                    }}>
                                        {income.source_data?.propertyAddress || 'Property'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginTop: tokens.spacing.md }}>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Annual Rent</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{parseFloat(income.source_data?.annualRent || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Standard Deduction</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{parseFloat(income.source_data?.standardDeduction || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Loan Interest</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{parseFloat(income.source_data?.homeLoanInterest || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Net Income</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                                ₹{parseFloat(income.amount).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    style={{
                                        padding: tokens.spacing.sm,
                                        backgroundColor: 'transparent',
                                        color: tokens.colors.error[600],
                                        border: 'none',
                                        borderRadius: tokens.borderRadius.md,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RentalIncomePage;
