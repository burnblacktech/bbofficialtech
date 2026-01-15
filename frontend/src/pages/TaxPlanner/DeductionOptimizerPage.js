/**
 * Deduction Optimizer Page
 * Smart recommendations to maximize tax savings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Target, ArrowLeft, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const DeductionOptimizerPage = () => {
    const navigate = useNavigate();

    const [deductions, setDeductions] = useState({
        section80C: 0,
        section80D: 0,
        hra: 0,
        homeLoanInterest: 0,
    });

    // Deduction limits
    const limits = {
        section80C: 150000,
        section80D: 25000,
        section80DParents: 50000,
        homeLoanInterest: 200000,
    };

    // Calculate utilization percentage
    const getUtilization = (amount, limit) => {
        return Math.min((amount / limit) * 100, 100);
    };

    // Calculate potential savings
    const calculateSavings = (amount) => {
        // Assuming 30% tax bracket
        return amount * 0.30;
    };

    // Get recommendation status
    const getStatus = (utilization) => {
        if (utilization >= 100) return { color: tokens.colors.success[600], label: 'Maxed Out', icon: CheckCircle };
        if (utilization >= 75) return { color: tokens.colors.warning[600], label: 'Good', icon: TrendingUp };
        return { color: tokens.colors.error[600], label: 'Can Improve', icon: AlertCircle };
    };

    const deductionCategories = [
        {
            id: '80c',
            title: 'Section 80C',
            description: 'Investments & Expenses',
            limit: limits.section80C,
            current: deductions.section80C,
            options: [
                { name: 'EPF (Employee Provident Fund)', recommended: true },
                { name: 'PPF (Public Provident Fund)', recommended: true },
                { name: 'ELSS Mutual Funds', recommended: true },
                { name: 'Life Insurance Premium (LIC)', recommended: false },
                { name: 'NSC (National Savings Certificate)', recommended: false },
                { name: 'Tax Saving FD', recommended: false },
                { name: 'Home Loan Principal', recommended: false },
                { name: 'Tuition Fees', recommended: false },
            ],
        },
        {
            id: '80d',
            title: 'Section 80D',
            description: 'Health Insurance',
            limit: limits.section80D,
            current: deductions.section80D,
            options: [
                { name: 'Self & Family Health Insurance', recommended: true },
                { name: 'Parents Health Insurance (Additional ₹25K)', recommended: true },
                { name: 'Preventive Health Checkup (₹5K)', recommended: false },
            ],
        },
        {
            id: 'hra',
            title: 'HRA',
            description: 'House Rent Allowance',
            limit: null,
            current: deductions.hra,
            options: [
                { name: 'Rent paid minus 10% of salary', recommended: true },
                { name: 'Actual HRA received', recommended: true },
                { name: '50% of salary (metro) or 40% (non-metro)', recommended: true },
            ],
        },
        {
            id: 'homeLoan',
            title: 'Home Loan Interest',
            description: 'Interest on Home Loan',
            limit: limits.homeLoanInterest,
            current: deductions.homeLoanInterest,
            options: [
                { name: 'Self-occupied property (Max ₹2L)', recommended: true },
                { name: 'Let-out property (No limit)', recommended: false },
            ],
        },
    ];

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <button
                    onClick={() => navigate('/tax-planner')}
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
                    Back to Tax Planner
                </button>
                <h1 style={{
                    fontSize: tokens.typography.fontSize['3xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Deduction Optimizer
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                }}>
                    Maximize your tax savings with smart deduction recommendations
                </p>
            </div>

            {/* Summary Card */}
            <div style={{
                padding: tokens.spacing.xl,
                backgroundColor: `${tokens.colors.success[600]}10`,
                border: `2px solid ${tokens.colors.success[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: tokens.spacing.lg,
            }}>
                <div>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.success[700],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Total Deductions
                    </p>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.success[900],
                    }}>
                        ₹{Object.values(deductions).reduce((sum, val) => sum + val, 0).toLocaleString('en-IN')}
                    </h2>
                </div>
                <div>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.success[700],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Tax Savings (30% bracket)
                    </p>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.success[900],
                    }}>
                        ₹{calculateSavings(Object.values(deductions).reduce((sum, val) => sum + val, 0)).toLocaleString('en-IN')}
                    </h2>
                </div>
                <div>
                    <p style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.success[700],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Potential Additional Savings
                    </p>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.success[900],
                    }}>
                        ₹{calculateSavings((limits.section80C - deductions.section80C) + (limits.section80D - deductions.section80D)).toLocaleString('en-IN')}
                    </h2>
                </div>
            </div>

            {/* Deduction Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.lg }}>
                {deductionCategories.map((category) => {
                    const utilization = category.limit ? getUtilization(category.current, category.limit) : 0;
                    const status = category.limit ? getStatus(utilization) : null;
                    const StatusIcon = status?.icon;

                    return (
                        <div
                            key={category.id}
                            style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                            }}
                        >
                            {/* Header */}
                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.sm }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: tokens.typography.fontSize.xl,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            {category.title}
                                        </h3>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            color: tokens.colors.neutral[600],
                                        }}>
                                            {category.description}
                                        </p>
                                    </div>
                                    {status && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: tokens.spacing.xs,
                                            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                                            backgroundColor: `${status.color}15`,
                                            borderRadius: tokens.borderRadius.sm,
                                        }}>
                                            <StatusIcon size={14} color={status.color} />
                                            <span style={{
                                                fontSize: tokens.typography.fontSize.xs,
                                                fontWeight: tokens.typography.fontWeight.medium,
                                                color: status.color,
                                            }}>
                                                {status.label}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                {category.limit && (
                                    <>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: tokens.colors.neutral[200],
                                            borderRadius: tokens.borderRadius.full,
                                            overflow: 'hidden',
                                            marginBottom: tokens.spacing.sm,
                                        }}>
                                            <div style={{
                                                width: `${utilization}%`,
                                                height: '100%',
                                                backgroundColor: status.color,
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: tokens.typography.fontSize.sm }}>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{category.current.toLocaleString('en-IN')}
                                            </span>
                                            <span style={{ color: tokens.colors.neutral[600] }}>
                                                of ₹{category.limit.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Investment Options */}
                            <div style={{
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.neutral[50],
                                borderRadius: tokens.borderRadius.md,
                            }}>
                                <p style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    marginBottom: tokens.spacing.sm,
                                }}>
                                    Investment Options:
                                </p>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: tokens.spacing.xs,
                                }}>
                                    {category.options.map((option, index) => (
                                        <li
                                            key={index}
                                            style={{
                                                fontSize: tokens.typography.fontSize.sm,
                                                color: tokens.colors.neutral[700],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: tokens.spacing.xs,
                                            }}
                                        >
                                            <span style={{
                                                width: '4px',
                                                height: '4px',
                                                backgroundColor: option.recommended ? tokens.colors.success[600] : tokens.colors.neutral[400],
                                                borderRadius: '50%',
                                            }} />
                                            {option.name}
                                            {option.recommended && (
                                                <span style={{
                                                    fontSize: tokens.typography.fontSize.xs,
                                                    color: tokens.colors.success[600],
                                                    fontWeight: tokens.typography.fontWeight.medium,
                                                }}>
                                                    (Recommended)
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Potential Savings */}
                            {category.limit && category.current < category.limit && (
                                <div style={{
                                    marginTop: tokens.spacing.md,
                                    padding: tokens.spacing.sm,
                                    backgroundColor: `${tokens.colors.info[600]}10`,
                                    borderRadius: tokens.borderRadius.md,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: tokens.spacing.sm,
                                }}>
                                    <Target size={16} color={tokens.colors.info[600]} />
                                    <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.info[700] }}>
                                        Invest ₹{(category.limit - category.current).toLocaleString('en-IN')} more to save ₹{calculateSavings(category.limit - category.current).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tips Section */}
            <div style={{
                marginTop: tokens.spacing.xl,
                padding: tokens.spacing.lg,
                backgroundColor: tokens.colors.neutral.white,
                border: `1px solid ${tokens.colors.neutral[200]}`,
                borderRadius: tokens.borderRadius.lg,
            }}>
                <h3 style={{
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold,
                    marginBottom: tokens.spacing.md,
                }}>
                    💡 Smart Tax Planning Tips
                </h3>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.spacing.sm,
                }}>
                    <li style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                        <strong>Start Early:</strong> Spread investments throughout the year instead of last-minute rush
                    </li>
                    <li style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                        <strong>Diversify:</strong> Don't put all eggs in one basket - mix EPF, PPF, and ELSS
                    </li>
                    <li style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                        <strong>Health First:</strong> Maximize 80D by covering parents too (additional ₹25K-₹50K)
                    </li>
                    <li style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                        <strong>HRA Optimization:</strong> If you pay rent, claim HRA even if not in metro
                    </li>
                    <li style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                        <strong>Home Loan:</strong> Both principal (80C) and interest (separate) are deductible
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default DeductionOptimizerPage;
