/**
 * Investment Income Page
 * Track interest, dividends, and capital gains
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const InvestmentIncomePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch investment income sources
    const { data: investmentData, isLoading } = useQuery({
        queryKey: ['income', 'interest'],
        queryFn: async () => {
            const response = await api.get('/api/income/interest');
            return response.data;
        },
    });

    // Create investment income mutation
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
                investmentType: 'interest',
                source: '',
                amount: '',
                description: '',
            });
        },
    });

    // Delete investment income mutation
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
        investmentType: 'interest',
        source: '',
        amount: '',
        description: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const sourceData = {
            investmentType: formData.investmentType,
            source: formData.source,
            description: formData.description,
        };

        createMutation.mutate({
            sourceType: 'interest', // Using 'interest' as the main type
            sourceData,
            amount: parseFloat(formData.amount),
            financialYear: '2024-25',
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this investment income?')) { // eslint-disable-line no-alert
            deleteMutation.mutate(id);
        }
    };

    const investmentIncomes = investmentData?.data || [];
    const totalIncome = investmentIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0);

    const investmentTypes = [
        { value: 'interest', label: 'Interest Income', examples: 'Savings Account, Fixed Deposit, Bonds' },
        { value: 'dividend', label: 'Dividend Income', examples: 'Equity Shares, Mutual Funds' },
        { value: 'capital_gains', label: 'Capital Gains', examples: 'Stocks, Property, Mutual Funds' },
    ];

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
                        Investment Income
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Track interest, dividends, and capital gains
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.warning[600],
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
                    Add Investment Income
                </button>
            </div>

            {/* Total Summary */}
            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.warning[600]}10`,
                border: `2px solid ${tokens.colors.warning[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.warning[700],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Total Investment Income (FY 2024-25)
                </p>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['4xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.warning[900],
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
                        Add Investment Income
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Investment Type *
                                </label>
                                <select
                                    value={formData.investmentType}
                                    onChange={(e) => setFormData({ ...formData, investmentType: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                >
                                    {investmentTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label} - {type.examples}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Source *
                                </label>
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    required
                                    placeholder="e.g., HDFC Bank FD, ICICI Mutual Fund"
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
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    placeholder="Income amount"
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
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Additional details about this investment income"
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
                            <button
                                type="submit"
                                disabled={createMutation.isLoading}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.warning[600],
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
                {investmentIncomes.length === 0 ? (
                    <div style={{
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        <TrendingUp size={48} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                        <p style={{ color: tokens.colors.neutral[600] }}>
                            No investment income added yet. Click "Add Investment Income" to get started.
                        </p>
                    </div>
                ) : (
                    investmentIncomes.map((income) => (
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.lg,
                                            fontWeight: tokens.typography.fontWeight.semibold,
                                        }}>
                                            {income.source_data?.source || 'Investment'}
                                        </h3>
                                        <span style={{
                                            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                                            backgroundColor: `${tokens.colors.warning[600]}15`,
                                            color: tokens.colors.warning[700],
                                            borderRadius: tokens.borderRadius.sm,
                                            fontSize: tokens.typography.fontSize.xs,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                        }}>
                                            {income.source_data?.investmentType === 'interest' ? 'Interest' :
                                                income.source_data?.investmentType === 'dividend' ? 'Dividend' : 'Capital Gains'}
                                        </span>
                                    </div>
                                    {income.source_data?.description && (
                                        <p style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            color: tokens.colors.neutral[600],
                                            marginBottom: tokens.spacing.md,
                                        }}>
                                            {income.source_data.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Amount</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.warning[600] }}>
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

export default InvestmentIncomePage;
