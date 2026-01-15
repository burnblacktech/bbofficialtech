/**
 * Tax Planner Page
 * Year-round tax optimization hub
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Calculator,
    Target,
    Calendar,
    TrendingDown,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const TaxPlannerPage = () => {
    const navigate = useNavigate();

    // Fetch dashboard/financial overview
    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['dashboard', 'data'],
        queryFn: async () => {
            const response = await api.get('/api/dashboard/data');
            return response.data;
        },
    });

    // Fetch tax tasks/calendar
    const { data: tasks, isLoading: isTasksLoading } = useQuery({
        queryKey: ['tax', 'tasks'],
        queryFn: async () => {
            const response = await api.get('/api/tax/tasks');
            return response.data.data;
        },
    });

    const overview = dashboardData?.financialOverview || {
        totalIncome: 0,
        taxLiability: 0,
        taxSaved: 0,
        refund: 0,
        payable: 0,
    };

    const nextDeadline = tasks?.find(t => !t.isCompleted);

    const tools = [
        {
            icon: Calculator,
            title: 'Tax Calculator',
            description: 'Compare Old vs New regime and find your best fit',
            path: '/tax-planner/calculator',
            color: tokens.colors.accent[600],
        },
        {
            icon: TrendingDown,
            title: 'Deduction Optimizer',
            description: 'Maximize your 80C, 80D and other tax deductions',
            path: '/tax-planner/optimizer',
            color: tokens.colors.success[600],
        },
        {
            icon: Target,
            title: 'Regime Comparison',
            description: 'Detailed analysis of tax impact across regimes',
            path: '/tax-planner/comparison',
            color: tokens.colors.info[600],
        },
        {
            icon: Calendar,
            title: 'Tax Calendar',
            description: 'Stay on top of advance tax and filing deadlines',
            path: '/tax-planner/calendar',
            color: tokens.colors.warning[600],
        },
    ];

    if (isDashboardLoading || isTasksLoading) {
        return (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
                <Clock className="animate-spin" style={{ color: tokens.colors.accent[600], marginBottom: tokens.spacing.md }} size={48} />
                <p>Loading your tax planner...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: tokens.spacing.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Tax Planner
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Your center for tax optimization and compliance
                    </p>
                </div>
                <div style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                    backgroundColor: tokens.colors.neutral[100],
                    borderRadius: tokens.borderRadius.full,
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[700],
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.sm,
                }}>
                    FY 2024-25
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: tokens.spacing.xl }}>
                {/* Main Content */}
                <div>
                    {/* Tax Summary Card */}
                    <div style={{
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral.white,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                        borderRadius: tokens.borderRadius.lg,
                        marginBottom: tokens.spacing.xl,
                        boxShadow: tokens.shadows.sm,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
                            <h2 style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[900],
                            }}>
                                Projected Tax Summary
                            </h2>
                            <span style={{
                                fontSize: tokens.typography.fontSize.xs,
                                color: tokens.colors.neutral[500],
                                fontWeight: tokens.typography.fontWeight.medium,
                            }}>
                                BASED ON CURRENT INCOME
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Tax Liability
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                    ₹{overview.taxLiability.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Current Savings
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[600] }}>
                                    ₹{overview.taxSaved.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {overview.refund > 0 ? 'Est. Refund' : 'Est. Payable'}
                                </p>
                                <p style={{
                                    fontSize: tokens.typography.fontSize['2xl'],
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: overview.refund > 0 ? tokens.colors.info[600] : tokens.colors.error[600],
                                }}>
                                    ₹{(overview.refund > 0 ? overview.refund : overview.payable).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tools Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.lg }}>
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <div
                                    key={tool.title}
                                    onClick={() => navigate(tool.path)}
                                    style={{
                                        padding: tokens.spacing.lg,
                                        backgroundColor: tokens.colors.neutral.white,
                                        border: `1px solid ${tokens.colors.neutral[200]}`,
                                        borderRadius: tokens.borderRadius.lg,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: tokens.spacing.sm,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = tool.color;
                                        e.currentTarget.style.boxShadow = tokens.shadows.md;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: `${tool.color}15`,
                                        borderRadius: tokens.borderRadius.md,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Icon size={20} color={tool.color} />
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.md,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.neutral[900],
                                            marginBottom: tokens.spacing.xs,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}>
                                            {tool.title}
                                            <ArrowRight size={14} />
                                        </h3>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            color: tokens.colors.neutral[600],
                                            lineHeight: 1.4,
                                        }}>
                                            {tool.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
                    {/* Next Deadline Card */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                        borderRadius: tokens.borderRadius.lg,
                        boxShadow: tokens.shadows.sm,
                    }}>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.md,
                            fontWeight: tokens.typography.fontWeight.bold,
                            marginBottom: tokens.spacing.md,
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.sm,
                        }}>
                            <Clock size={18} color={tokens.colors.warning[600]} />
                            Upcoming Deadline
                        </h3>
                        {nextDeadline ? (
                            <div style={{
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.neutral[50],
                                borderRadius: tokens.borderRadius.md,
                                borderLeft: `4px solid ${tokens.colors.warning[600]}`,
                            }}>
                                <p style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: tokens.colors.neutral[500],
                                    textTransform: 'uppercase',
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    {nextDeadline.date}
                                </p>
                                <p style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    {nextDeadline.title}
                                </p>
                                <button
                                    onClick={() => navigate('/tax-planner/calendar')}
                                    style={{
                                        marginTop: tokens.spacing.sm,
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.accent[600],
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacing.xs,
                                    }}
                                >
                                    View Calendar <ArrowRight size={12} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: tokens.spacing.md }}>
                                <CheckCircle2 size={32} color={tokens.colors.success[600]} style={{ marginBottom: tokens.spacing.sm }} />
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    All caught up! No pending deadlines.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: `${tokens.colors.info[600]}05`,
                        border: `1px solid ${tokens.colors.info[200]}`,
                        borderRadius: tokens.borderRadius.lg,
                    }}>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.md,
                            fontWeight: tokens.typography.fontWeight.bold,
                            marginBottom: tokens.spacing.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.sm,
                            color: tokens.colors.info[700],
                        }}>
                            <AlertCircle size={18} />
                            Planner Tip
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[700],
                            lineHeight: 1.5,
                        }}>
                            Choosing the **New Tax Regime** is now the default. However, if you have high deductions (80C, HRA), the **Old Regime** might still save you more money. Use our comparison tool to be sure!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxPlannerPage;
