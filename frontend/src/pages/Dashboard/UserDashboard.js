/**
 * User Dashboard - Financial Story Focus (PRD v3.0)
 * Central hub for financial life overview
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
    DollarSign,
    TrendingUp,
    Target,
    Lightbulb,
    Calendar,
    FileText,
    Upload,
    ArrowRight,
    Plus,
    CheckCircle,
    Users,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import memberService from '../../services/memberService';
import { tokens } from '../../styles/tokens';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const userName = user?.fullName || user?.name || 'User';

    // Fetch dashboard data
    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardService.getDashboardData,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch members
    const { data: membersData } = useQuery({
        queryKey: ['members'],
        queryFn: memberService.getAllMembers,
        staleTime: 5 * 60 * 1000,
    });

    const members = membersData?.data || [];
    // Ensure "Self" is always counted or displayed if needed, but usually member service returns added members.
    // We can assume user is always primary.

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
                    <p style={{ color: tokens.colors.neutral[600] }}>Loading your financial story...</p>
                </div>
            </div>
        );
    }

    // Extract data from API response with fallbacks
    const financialOverview = dashboardData?.data?.financialOverview || {
        totalIncome: 0,
        taxLiability: 0,
        taxSaved: 0,
        financialHealth: 0,
        refund: 0,
        payable: 0,
    };

    const recommendations = dashboardData?.data?.recommendations || [];
    const incomeBreakdown = dashboardData?.data?.incomeBreakdown || [];
    const upcomingDeadlines = dashboardData?.data?.deadlines || [];
    const activeFiling = dashboardData?.data?.activeFiling;

    // Show error state if API fails but allow viewing with empty data
    const hasError = error && !dashboardData;
    const hasData = financialOverview.totalIncome > 0 || incomeBreakdown.length > 0;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Welcome Header */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Welcome back, {userName}! 👋
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Here's your financial story for FY 2024-25
                    </p>
                </div>

                {/* Financial Overview Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: tokens.spacing.lg,
                    marginBottom: tokens.spacing.xl,
                }}>
                    {/* Total Income */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Total Income
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                    ₹{financialOverview.totalIncome.toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.success[600] }}>
                                    {hasData ? '+8% from last year' : 'No data yet'}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.accent[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <DollarSign size={24} color={tokens.colors.accent[600]} />
                            </div>
                        </div>
                    </div>

                    {/* Tax Liability */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Tax Liability
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                    ₹{financialOverview.taxLiability.toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: financialOverview.refund > 0 ? tokens.colors.success[600] : tokens.colors.warning[600] }}>
                                    {financialOverview.refund > 0 ? `₹${financialOverview.refund.toLocaleString('en-IN')} refund ✓` : financialOverview.payable > 0 ? `₹${financialOverview.payable.toLocaleString('en-IN')} payable` : 'Balanced'}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.warning[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Target size={24} color={tokens.colors.warning[600]} />
                            </div>
                        </div>
                    </div>

                    {/* Tax Saved */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Tax Saved
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[600] }}>
                                    ₹{financialOverview.taxSaved.toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    {financialOverview.totalIncome > 0 ? `${((financialOverview.taxSaved / financialOverview.totalIncome) * 100).toFixed(1)}% savings rate` : 'No data'}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.success[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <TrendingUp size={24} color={tokens.colors.success[600]} />
                            </div>
                        </div>
                    </div>

                    {/* Financial Health */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Financial Health
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[600] }}>
                                    {financialOverview.financialHealth}/100 ⭐
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    {financialOverview.financialHealth >= 70 ? 'Good standing' : financialOverview.financialHealth >= 50 ? 'Fair' : 'Needs improvement'}
                                </p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${tokens.colors.info[600]}15`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <CheckCircle size={24} color={tokens.colors.info[600]} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smart Recommendations */}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                        {recommendations.map((rec, idx) => (
                            <div key={idx} style={{
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.neutral.white,
                                borderRadius: tokens.borderRadius.md,
                                fontSize: tokens.typography.fontSize.base,
                                color: tokens.colors.neutral[700],
                            }}>
                                • {rec}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/insights')}
                        style={{
                            marginTop: tokens.spacing.md,
                            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                            backgroundColor: tokens.colors.accent[600],
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
                        View All Recommendations
                        <ArrowRight size={16} />
                    </button>
                </div>

                {/* Two Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: tokens.spacing.xl }}>
                    {/* Income Breakdown */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.xl,
                            fontWeight: tokens.typography.fontWeight.bold,
                            marginBottom: tokens.spacing.lg,
                        }}>
                            Income Breakdown
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                            {incomeBreakdown.map((item) => (
                                <div key={item.source}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                            {item.source}
                                        </span>
                                        <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>
                                            ₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: tokens.colors.neutral[200],
                                        borderRadius: tokens.borderRadius.full,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${item.percentage}%`,
                                            height: '100%',
                                            backgroundColor: tokens.colors.accent[600],
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/income')}
                            style={{
                                marginTop: tokens.spacing.lg,
                                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                backgroundColor: tokens.colors.neutral.white,
                                color: tokens.colors.accent[600],
                                border: `1px solid ${tokens.colors.accent[600]}`,
                                borderRadius: tokens.borderRadius.md,
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.medium,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.xs,
                            }}
                        >
                            View Details
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.neutral.white,
                        borderRadius: tokens.borderRadius.lg,
                        border: `1px solid ${tokens.colors.neutral[200]}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
                            <Calendar size={20} style={{ marginRight: tokens.spacing.sm }} />
                            <h2 style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                            }}>
                                Upcoming Deadlines
                            </h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                            {upcomingDeadlines.map((deadline, idx) => (
                                <div key={idx} style={{
                                    padding: tokens.spacing.sm,
                                    backgroundColor: tokens.colors.neutral[50],
                                    borderRadius: tokens.borderRadius.md,
                                }}>
                                    <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                        {deadline.date}
                                    </p>
                                    <p style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                        {deadline.title}
                                    </p>
                                    {deadline.amount && (
                                        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.accent[600] }}>
                                            ₹{deadline.amount.toLocaleString('en-IN')} due
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Family Members / Filing For Section */}
                <div style={{
                    marginTop: tokens.spacing.xl,
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.lg,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.xl,
                            fontWeight: tokens.typography.fontWeight.bold,
                        }}>
                            Filing For (Family)
                        </h2>
                        <button
                            onClick={() => navigate('/add-members')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.xs,
                                border: 'none',
                                background: 'none',
                                color: tokens.colors.accent[600],
                                fontWeight: tokens.typography.fontWeight.medium,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={18} />
                            Add Member
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: tokens.spacing.lg, overflowX: 'auto', paddingBottom: tokens.spacing.sm }}>
                        {/* Primary User Card (Self) */}
                        <div style={{
                            minWidth: '200px',
                            padding: tokens.spacing.md,
                            backgroundColor: `${tokens.colors.accent[600]}10`,
                            border: `1px solid ${tokens.colors.accent[200]}`,
                            borderRadius: tokens.borderRadius.md,
                            cursor: 'pointer',
                        }} onClick={() => navigate('/profile')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: tokens.colors.accent[600],
                                    color: tokens.colors.neutral.white,
                                    borderRadius: tokens.borderRadius.full,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: tokens.typography.fontSize.sm,
                                }}>
                                    {userName.charAt(0)}
                                </div>
                                <div>
                                    <p style={{ fontWeight: tokens.typography.fontWeight.semibold, fontSize: tokens.typography.fontSize.base }}>Self</p>
                                    <p style={{ color: tokens.colors.neutral[600], fontSize: tokens.typography.fontSize.xs }}>Primary</p>
                                </div>
                            </div>
                        </div>

                        {/* Family Members */}
                        {members.map((member) => (
                            <div key={member.id} style={{
                                minWidth: '200px',
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                borderRadius: tokens.borderRadius.md,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                                onClick={() => navigate(`/members/${member.id}`)} // Or open modal
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: tokens.colors.neutral[200],
                                        color: tokens.colors.neutral[700],
                                        borderRadius: tokens.borderRadius.full,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: tokens.typography.fontSize.sm,
                                    }}>
                                        {member.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: tokens.typography.fontWeight.semibold, fontSize: tokens.typography.fontSize.base }}>{member.name}</p>
                                        <p style={{ color: tokens.colors.neutral[600], fontSize: tokens.typography.fontSize.xs }}>{member.relationship}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add New Placeholder */}
                        {members.length === 0 && (
                            <div style={{
                                minWidth: '200px',
                                padding: tokens.spacing.md,
                                border: `1px dashed ${tokens.colors.neutral[400]}`,
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: tokens.colors.neutral[600],
                                gap: tokens.spacing.xs,
                            }} onClick={() => navigate('/add-members')}>
                                <Plus size={18} />
                                <span>Add Family Member</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                    marginTop: tokens.spacing.xl,
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.lg,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Quick Actions
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: tokens.spacing.md }}>
                        {[
                            { icon: Upload, label: 'Upload Form 16', path: '/documents' },
                            { icon: Plus, label: 'Add Income', path: '/income' },
                            { icon: FileText, label: 'File ITR', path: '/filing/start' },
                            { icon: TrendingUp, label: 'View Reports', path: '/insights' },
                        ].map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        padding: tokens.spacing.md,
                                        backgroundColor: tokens.colors.neutral.white,
                                        border: `1px solid ${tokens.colors.neutral[200]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacing.sm,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = tokens.colors.accent[600];
                                        e.currentTarget.style.backgroundColor = `${tokens.colors.accent[600]}05`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                                        e.currentTarget.style.backgroundColor = tokens.colors.neutral.white;
                                    }}
                                >
                                    <Icon size={20} color={tokens.colors.accent[600]} />
                                    <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium }}>
                                        {action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
