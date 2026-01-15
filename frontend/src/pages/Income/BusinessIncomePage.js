/**
 * Business/Freelance Income Page
 * Track professional income, consultancy, and business earnings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const BusinessIncomePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch business income sources
    const { data: businessData, isLoading } = useQuery({
        queryKey: ['income', 'business'],
        queryFn: async () => {
            const response = await api.get('/api/income/business');
            return response.data;
        },
    });

    // Create business income mutation
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
                businessName: '',
                businessType: 'freelance',
                grossReceipts: '',
                expenses: '',
                presumptiveTaxation: false,
                presumptiveRate: '50',
            });
        },
    });

    // Delete business income mutation
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
        businessName: '',
        businessType: 'freelance',
        grossReceipts: '',
        expenses: '',
        presumptiveTaxation: false,
        presumptiveRate: '50',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const grossReceipts = parseFloat(formData.grossReceipts);
        const expenses = parseFloat(formData.expenses || 0);

        // Calculate net profit
        let netProfit;
        if (formData.presumptiveTaxation) {
            // Presumptive taxation: 50% of gross receipts (44AD) or 50% (44ADA for professionals)
            const rate = parseFloat(formData.presumptiveRate) / 100;
            netProfit = grossReceipts * rate;
        } else {
            netProfit = grossReceipts - expenses;
        }

        const sourceData = {
            businessName: formData.businessName,
            businessType: formData.businessType,
            grossReceipts,
            expenses,
            netProfit,
            presumptiveTaxation: formData.presumptiveTaxation,
            presumptiveRate: formData.presumptiveTaxation ? parseFloat(formData.presumptiveRate) : null,
        };

        createMutation.mutate({
            sourceType: 'business',
            sourceData,
            amount: netProfit,
            financialYear: '2024-25',
        });
    };

    const handleDelete = (id) => {
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to delete this business income?')) {
            deleteMutation.mutate(id);
        }
    };

    const businessIncomes = businessData?.data || [];
    const totalIncome = businessIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0);

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
                        Business/Freelance Income
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Track professional income, consultancy, and business earnings
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.info[600],
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
                    Add Business Income
                </button>
            </div>

            {/* Total Summary */}
            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.info[600]}10`,
                border: `2px solid ${tokens.colors.info[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.info[700],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Total Business/Freelance Income (FY 2024-25)
                </p>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['4xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.info[900],
                }}>
                    ₹{totalIncome.toLocaleString('en-IN')}
                </h2>
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
                        Add Business/Freelance Income
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Business/Professional Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    required
                                    placeholder="e.g., ABC Consultancy, Freelance Design"
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
                                    Business Type *
                                </label>
                                <select
                                    value={formData.businessType}
                                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                >
                                    <option value="freelance">Freelance/Consultancy</option>
                                    <option value="business">Business</option>
                                    <option value="professional">Professional Services</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Gross Receipts *
                                </label>
                                <input
                                    type="number"
                                    value={formData.grossReceipts}
                                    onChange={(e) => setFormData({ ...formData, grossReceipts: e.target.value })}
                                    required
                                    placeholder="Total revenue"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>

                            {/* Presumptive Taxation Option */}
                            <div style={{ gridColumn: '1 / -1', padding: tokens.spacing.md, backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.md }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.presumptiveTaxation}
                                        onChange={(e) => setFormData({ ...formData, presumptiveTaxation: e.target.checked })}
                                        style={{ marginRight: tokens.spacing.sm }}
                                    />
                                    <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium }}>
                                        Use Presumptive Taxation (Section 44AD/44ADA)
                                    </span>
                                </label>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginTop: tokens.spacing.xs, marginLeft: '24px' }}>
                                    Simplified taxation for small businesses. Profit deemed at {formData.presumptiveRate}% of gross receipts.
                                </p>

                                {formData.presumptiveTaxation && (
                                    <div style={{ marginTop: tokens.spacing.sm, marginLeft: '24px' }}>
                                        <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                            Presumptive Rate (%)
                                        </label>
                                        <select
                                            value={formData.presumptiveRate}
                                            onChange={(e) => setFormData({ ...formData, presumptiveRate: e.target.value })}
                                            style={{
                                                width: '200px',
                                                padding: tokens.spacing.sm,
                                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                                borderRadius: tokens.borderRadius.md,
                                                fontSize: tokens.typography.fontSize.base,
                                            }}
                                        >
                                            <option value="50">50% (44ADA - Professionals)</option>
                                            <option value="8">8% (44AD - Business)</option>
                                            <option value="6">6% (44AD - Digital payments)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {!formData.presumptiveTaxation && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                        Business Expenses
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.expenses}
                                        onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                                        placeholder="Total expenses (optional)"
                                        style={{
                                            width: '100%',
                                            padding: tokens.spacing.sm,
                                            border: `1px solid ${tokens.colors.neutral[300]}`,
                                            borderRadius: tokens.borderRadius.md,
                                            fontSize: tokens.typography.fontSize.base,
                                        }}
                                    />
                                    <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginTop: tokens.spacing.xs }}>
                                        Net Profit = Gross Receipts - Expenses
                                    </p>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
                            <button
                                type="submit"
                                disabled={createMutation.isLoading}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.info[600],
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
                {businessIncomes.length === 0 ? (
                    <div style={{
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        <Building size={48} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                        <p style={{ color: tokens.colors.neutral[600] }}>
                            No business income added yet. Click "Add Business Income" to get started.
                        </p>
                    </div>
                ) : (
                    businessIncomes.map((income) => (
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
                                        {income.source_data?.businessName || 'Business'}
                                    </h3>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.sm,
                                        color: tokens.colors.neutral[600],
                                        marginBottom: tokens.spacing.md,
                                    }}>
                                        {income.source_data?.businessType === 'freelance' ? 'Freelance/Consultancy' :
                                            income.source_data?.businessType === 'business' ? 'Business' : 'Professional Services'}
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Gross Receipts</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{parseFloat(income.source_data?.grossReceipts || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        {income.source_data?.presumptiveTaxation ? (
                                            <div>
                                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Presumptive ({income.source_data?.presumptiveRate}%)</p>
                                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.info[600] }}>
                                                    ₹{parseFloat(income.amount).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Expenses</p>
                                                    <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                        ₹{parseFloat(income.source_data?.expenses || 0).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Net Profit</p>
                                                    <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                                        ₹{parseFloat(income.amount).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </>
                                        )}
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

export default BusinessIncomePage;
