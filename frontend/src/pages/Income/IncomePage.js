/**
 * Income Overview Page
 * Central hub for all income sources
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Briefcase,
    Building,
    Home,
    TrendingUp,
    Plus,
    ArrowRight,
    DollarSign,
} from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const IncomePage = () => {
    const navigate = useNavigate();

    // Fetch income summary from backend
    const { data: summaryData, isLoading } = useQuery({
        queryKey: ['income', 'summary'],
        queryFn: async () => {
            const response = await api.get('/api/income/summary');
            return response.data;
        },
    });

    const incomeSummary = summaryData?.data || [];

    // Calculate total income
    const totalIncome = incomeSummary.reduce((sum, item) => sum + item.totalAmount, 0);

    // Income categories with icons and routes
    const incomeCategories = [
        {
            id: 'salary',
            title: 'Salary Income',
            description: 'Employment income, Form 16, TDS',
            icon: Briefcase,
            color: tokens.colors.accent[600],
            bgColor: `${tokens.colors.accent[600]}15`,
            route: '/income/salary',
        },
        {
            id: 'business',
            title: 'Business/Freelance',
            description: 'Professional income, consultancy',
            icon: Building,
            color: tokens.colors.info[600],
            bgColor: `${tokens.colors.info[600]}15`,
            route: '/income/business',
        },
        {
            id: 'rental',
            title: 'Rental Income',
            description: 'House property income',
            icon: Home,
            color: tokens.colors.success[600],
            bgColor: `${tokens.colors.success[600]}15`,
            route: '/income/rental',
        },
        {
            id: 'interest',
            title: 'Investment Income',
            description: 'Interest, dividends, capital gains',
            icon: TrendingUp,
            color: tokens.colors.warning[600],
            bgColor: `${tokens.colors.warning[600]}15`,
            route: '/income/investments',
        },
    ];

    // Get amount for each category
    const getCategoryAmount = (categoryId) => {
        const category = incomeSummary.find(item => item.sourceType === categoryId);
        return category?.totalAmount || 0;
    };

    const getCategoryCount = (categoryId) => {
        const category = incomeSummary.find(item => item.sourceType === categoryId);
        return category?.count || 0;
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
                <div style={{ textAlign: 'center' }}>
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
                    <p style={{ color: tokens.colors.neutral[600] }}>Loading income data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Income Overview
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Track all your income sources for FY 2024-25
                    </p>
                </div>

                {/* Total Income Summary */}
                <div style={{
                    padding: tokens.spacing.xl,
                    backgroundColor: `${tokens.colors.accent[600]}10`,
                    border: `2px solid ${tokens.colors.accent[600]}`,
                    borderRadius: tokens.borderRadius.lg,
                    marginBottom: tokens.spacing.xl,
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.md,
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: tokens.colors.accent[600],
                        borderRadius: tokens.borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <DollarSign size={32} color={tokens.colors.neutral.white} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.accent[700],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Total Income (FY 2024-25)
                        </p>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize['4xl'],
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.accent[900],
                        }}>
                            ₹{totalIncome.toLocaleString('en-IN')}
                        </h2>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.accent[700],
                            marginTop: tokens.spacing.xs,
                        }}>
                            {incomeSummary.length} income source{incomeSummary.length !== 1 ? 's' : ''} added
                        </p>
                    </div>
                </div>

                {/* Income Categories Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: tokens.spacing.lg,
                }}>
                    {incomeCategories.map((category) => {
                        const Icon = category.icon;
                        const amount = getCategoryAmount(category.id);
                        const count = getCategoryCount(category.id);

                        return (
                            <div
                                key={category.id}
                                onClick={() => navigate(category.route)}
                                style={{
                                    padding: tokens.spacing.lg,
                                    backgroundColor: tokens.colors.neutral.white,
                                    border: `1px solid ${tokens.colors.neutral[200]}`,
                                    borderRadius: tokens.borderRadius.lg,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = category.color;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = tokens.shadows.md;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: category.bgColor,
                                        borderRadius: tokens.borderRadius.md,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Icon size={24} color={category.color} />
                                    </div>
                                    <ArrowRight size={20} color={tokens.colors.neutral[400]} />
                                </div>

                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.lg,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    {category.title}
                                </h3>

                                <p style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    color: tokens.colors.neutral[600],
                                    marginBottom: tokens.spacing.md,
                                }}>
                                    {category.description}
                                </p>

                                <div style={{
                                    paddingTop: tokens.spacing.md,
                                    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                }}>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize['2xl'],
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: category.color,
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        ₹{amount.toLocaleString('en-IN')}
                                    </p>
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.neutral[600],
                                    }}>
                                        {count > 0 ? `${count} source${count !== 1 ? 's' : ''}` : 'No sources added'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {totalIncome === 0 && (
                    <div style={{
                        marginTop: tokens.spacing.xl,
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral.white,
                        border: `2px dashed ${tokens.colors.neutral[300]}`,
                        borderRadius: tokens.borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        <Plus size={48} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.xl,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.sm,
                        }}>
                            No Income Added Yet
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.neutral[600],
                            marginBottom: tokens.spacing.lg,
                        }}>
                            Start by adding your income sources. Click on any category above to get started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomePage;
