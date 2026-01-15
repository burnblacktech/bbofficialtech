import React, { useState } from 'react';
import { Lightbulb, TrendingUp, FileText, PieChart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '../../services/dashboardService';
import { tokens } from '../../styles/tokens';

// Detailed Views
import FinancialHealth from './FinancialHealth';
import TaxSavingsReport from './TaxSavingsReport';
import YearEndSummary from './YearEndSummary';

const InsightsPage = () => {
    const [activeView, setActiveView] = useState(null); // 'savings', 'health', 'summary' or null

    // Fetch real data
    const { data: recommendations, isLoading: LoadingRecs } = useQuery({
        queryKey: ['dashboard', 'recommendations'],
        queryFn: () => dashboardService.getRecommendations(),
    });

    const { data: stats, isLoading: LoadingStats } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardService.getStats(),
    });

    const { data: incomeBreakdown, isLoading: LoadingBreakdown } = useQuery({
        queryKey: ['dashboard', 'income-breakdown'],
        queryFn: () => dashboardService.getIncomeBreakdown(),
    });

    const isLoading = LoadingRecs || LoadingStats || LoadingBreakdown;

    if (isLoading) {
        return (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
                <p>Loading your financial insights...</p>
            </div>
        );
    }

    // Process recommendations
    const activeRecommendations = recommendations?.data || recommendations || [];
    const displayRecs = activeRecommendations.length > 0
        ? activeRecommendations.map(r => r.message)
        : [
            'No specific recommendations at this time.',
            'Keep your income and documents updated for better insights.',
        ];

    // Process stats
    const overview = stats?.data || stats || {};
    const metrics = [
        { label: 'Total Income', value: overview.totalIncome || 0, trend: '+12% from last month', icon: TrendingUp, color: tokens.colors.accent[600] },
        { label: 'Tax Liability', value: overview.taxLiability || 0, trend: '-5% vs last year', icon: Activity, color: tokens.colors.error[600] },
        { label: 'Tax Saved', value: overview.taxSaved || 0, trend: 'Optimization in progress', icon: PieChart, color: tokens.colors.success[600] },
    ];

    // Render Detailed View if one is active
    if (activeView === 'savings') return <TaxSavingsReport data={overview} onBack={() => setActiveView(null)} />;
    if (activeView === 'health') return <FinancialHealth data={overview} onBack={() => setActiveView(null)} />;
    if (activeView === 'summary') return <YearEndSummary data={overview} onBack={() => setActiveView(null)} />;

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <h1 style={{
                    fontSize: tokens.typography.fontSize['3xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Insights & Reports
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                }}>
                    Smart recommendations and financial reports
                </p>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
                {metrics.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                        <div key={idx} style={{
                            padding: tokens.spacing.lg,
                            backgroundColor: tokens.colors.neutral.white,
                            border: `1px solid ${tokens.colors.neutral[200]}`,
                            borderRadius: tokens.borderRadius.lg,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], fontWeight: tokens.typography.fontWeight.medium }}>
                                    {metric.label}
                                </span>
                                <Icon size={20} color={metric.color} />
                            </div>
                            <div style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing.xs }}>
                                ₹{metric.value.toLocaleString()}
                            </div>
                            <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500], display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {metric.trend.includes('+') ? <ArrowUpRight size={12} color={tokens.colors.success[600]} /> : <ArrowDownRight size={12} color={tokens.colors.error[600]} />}
                                {metric.trend}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.accent[600]}10`,
                border: `1px solid ${tokens.colors.accent[200]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: tokens.spacing.md }}>
                    <Lightbulb size={24} color={tokens.colors.accent[600]} style={{ marginRight: tokens.spacing.sm }} />
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.accent[900],
                    }}>
                        Smart Recommendations
                    </h2>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {displayRecs.map((rec, idx) => (
                        <li key={idx} style={{
                            padding: tokens.spacing.sm,
                            marginBottom: tokens.spacing.sm,
                            backgroundColor: tokens.colors.neutral.white,
                            borderRadius: tokens.borderRadius.md,
                            fontSize: tokens.typography.fontSize.base,
                            color: tokens.colors.neutral[700],
                            borderLeft: `4px solid ${tokens.colors.accent[600]}`,
                        }}>
                            {rec}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Income Breakdown Chart */}
            {incomeBreakdown && (
                <div style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.borderRadius.lg,
                    marginBottom: tokens.spacing.xl,
                }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Income Breakdown
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                        {Object.entries(incomeBreakdown.data?.breakdown || incomeBreakdown.breakdown || {}).map(([key, value]) => {
                            if (value === 0) return null;
                            const total = incomeBreakdown.data?.total || overview.totalIncome || 1;
                            const percentage = Math.round((value / total) * 100);
                            return (
                                <div key={key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, textTransform: 'capitalize', color: tokens.colors.neutral[700], fontWeight: tokens.typography.fontWeight.medium }}>
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                            ₹{value.toLocaleString()} ({percentage}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '10px',
                                        backgroundColor: tokens.colors.neutral[100],
                                        borderRadius: tokens.borderRadius.full,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${percentage}%`,
                                            backgroundColor: key === 'salary' ? tokens.colors.accent[500] :
                                                key === 'business' ? tokens.colors.error[400] :
                                                    key === 'houseProperty' ? tokens.colors.success[400] :
                                                        tokens.colors.info[400],
                                            borderRadius: tokens.borderRadius.full,
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reports Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: tokens.spacing.lg }}>
                {[
                    { id: 'savings', icon: TrendingUp, title: 'Tax Savings Report', description: 'Year-over-year tax savings analysis' },
                    { id: 'health', icon: PieChart, title: 'Financial Health', description: 'Overall financial wellness score' },
                    { id: 'summary', icon: FileText, title: 'Year-End Summary', description: 'Complete financial summary for FY 2024-25' },
                ].map((report) => {
                    const Icon = report.icon;
                    return (
                        <div
                            key={report.title}
                            onClick={() => setActiveView(report.id)}
                            style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = tokens.colors.accent[600];
                                e.currentTarget.style.boxShadow = tokens.shadows.md;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.accent[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: tokens.spacing.md,
                            }}>
                                <Icon size={24} color={tokens.colors.accent[600]} />
                            </div>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                {report.title}
                            </h3>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.neutral[600],
                            }}>
                                {report.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InsightsPage;
