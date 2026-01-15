/**
 * Regime Comparison Page
 * Side-by-side comparison of Old vs New Tax Regimes
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Info,
    CheckCircle,
    XCircle,
    TrendingDown,
    ArrowRight,
} from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const RegimeComparisonPage = () => {
    const navigate = useNavigate();
    const [income, setIncome] = useState(1000000); // Default 10L
    const [deductions, setDeductions] = useState(150000); // Default 1.5L (80C)

    // Fetch tax slab info
    const { data: slabInfo } = useQuery({
        queryKey: ['tax', 'slabs'],
        queryFn: async () => {
            const response = await api.get('/api/tax/slabs');
            return response.data;
        },
    });

    // Mock calculation (Real one happens via API, but for interactive slider we can use logic)
    const calculateTax = (amount, regime, deds = 0) => {
        const slabs = regime === 'new'
            ? [
                { min: 0, max: 300000, rate: 0 },
                { min: 300000, max: 600000, rate: 5 },
                { min: 600000, max: 900000, rate: 10 },
                { min: 900000, max: 1200000, rate: 15 },
                { min: 1200000, max: 1500000, rate: 20 },
                { min: 1500000, max: Infinity, rate: 30 },
            ]
            : [
                { min: 0, max: 250000, rate: 0 },
                { min: 250000, max: 500000, rate: 5 },
                { min: 500000, max: 1000000, rate: 20 },
                { min: 1000000, max: Infinity, rate: 30 },
            ];

        const taxableIncome = Math.max(0, amount - 50000 - (regime === 'old' ? deds : 0));
        let tax = 0;

        for (const slab of slabs) {
            if (taxableIncome <= slab.min) break;
            const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
            tax += (taxableInSlab * slab.rate) / 100;
        }

        const cess = tax * 0.04;
        return { tax, cess, total: tax + cess };
    };

    const oldRegime = useMemo(() => calculateTax(income, 'old', deductions), [income, deductions]);
    const newRegime = useMemo(() => calculateTax(income, 'new'), [income]);

    const savings = Math.abs(oldRegime.total - newRegime.total);
    const recommended = oldRegime.total < newRegime.total ? 'OLD' : 'NEW';

    const formatCurrency = (val) => `₹${Math.round(val).toLocaleString('en-IN')}`;

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
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
                    Regime Comparison
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                }}>
                    Detailed analysis of Old vs New tax regimes
                </p>
            </div>

            {/* Interactive Inputs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: tokens.spacing.xl,
                marginBottom: tokens.spacing.xl,
            }}>
                <div style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.borderRadius.lg,
                }}>
                    <label style={{ display: 'block', marginBottom: tokens.spacing.md }}>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.medium,
                            color: tokens.colors.neutral[700],
                        }}>
                            Gross Annual Income
                        </span>
                        <input
                            type="range"
                            min="300000"
                            max="5000000"
                            step="50000"
                            value={income}
                            onChange={(e) => setIncome(parseInt(e.target.value))}
                            style={{ width: '100%', marginTop: tokens.spacing.sm }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xs }}>
                            <span style={{ fontWeight: tokens.typography.fontWeight.bold, fontSize: tokens.typography.fontSize.xl }}>
                                {formatCurrency(income)}
                            </span>
                        </div>
                    </label>
                </div>

                <div style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.borderRadius.lg,
                }}>
                    <label style={{ display: 'block', marginBottom: tokens.spacing.md }}>
                        <span style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.medium,
                            color: tokens.colors.neutral[700],
                        }}>
                            Total Deductions (80C, 80D, etc.)
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="1000000"
                            step="10000"
                            value={deductions}
                            onChange={(e) => setDeductions(parseInt(e.target.value))}
                            style={{ width: '100%', marginTop: tokens.spacing.sm }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xs }}>
                            <span style={{ fontWeight: tokens.typography.fontWeight.bold, fontSize: tokens.typography.fontSize.xl }}>
                                {formatCurrency(deductions)}
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Verdict Card */}
            <div style={{
                padding: tokens.spacing.xl,
                backgroundColor: recommended === 'NEW' ? `${tokens.colors.success[600]}10` : `${tokens.colors.info[600]}10`,
                border: `2px solid ${recommended === 'NEW' ? tokens.colors.success[600] : tokens.colors.info[600]}`,
                borderRadius: tokens.borderRadius.xl,
                marginBottom: tokens.spacing.xl,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        {recommended === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'} is better for you!
                    </h2>
                    <p style={{ color: tokens.colors.neutral[700] }}>
                        You will save <strong style={{ color: recommended === 'NEW' ? tokens.colors.success[700] : tokens.colors.info[700] }}>
                            {formatCurrency(savings)}
                        </strong> by choosing the {recommended.toLowerCase()} regime.
                    </p>
                </div>
                <div style={{
                    padding: tokens.spacing.md,
                    backgroundColor: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.full,
                    boxShadow: tokens.shadows.md,
                }}>
                    <TrendingDown size={32} color={recommended === 'NEW' ? tokens.colors.success[600] : tokens.colors.info[600]} />
                </div>
            </div>

            {/* Comparison Table */}
            <div style={{
                backgroundColor: tokens.colors.neutral.white,
                border: `1px solid ${tokens.colors.neutral[200]}`,
                borderRadius: tokens.borderRadius.lg,
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: tokens.colors.neutral[50] }}>
                            <th style={{ padding: tokens.spacing.lg, textAlign: 'left', borderBottom: `1px solid ${tokens.colors.neutral[200]}` }}>Parameter</th>
                            <th style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[200]}` }}>Old Regime</th>
                            <th style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[200]}` }}>New Regime</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Gross Income</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(income)}</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(income)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Standard Deduction</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}`, color: tokens.colors.success[600] }}>-₹50,000</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}`, color: tokens.colors.success[600] }}>-₹50,000</td>
                        </tr>
                        <tr>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Other Deductions</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}`, color: tokens.colors.success[600] }}>-{formatCurrency(deductions)}</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>₹0</td>
                        </tr>
                        <tr style={{ fontWeight: tokens.typography.fontWeight.bold }}>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Taxable Income</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(Math.max(0, income - 50000 - deductions))}</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(Math.max(0, income - 50000))}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Base Tax</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(oldRegime.tax)}</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(newRegime.tax)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>Health & Edu Cess (4%)</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(oldRegime.cess)}</td>
                            <td style={{ padding: tokens.spacing.lg, textAlign: 'right', borderBottom: `1px solid ${tokens.colors.neutral[100]}` }}>{formatCurrency(newRegime.cess)}</td>
                        </tr>
                        <tr style={{
                            fontWeight: tokens.typography.fontWeight.bold,
                            backgroundColor: tokens.colors.neutral[50],
                            fontSize: tokens.typography.fontSize.lg,
                        }}>
                            <td style={{ padding: tokens.spacing.lg }}>Net Tax Payable</td>
                            <td style={{
                                padding: tokens.spacing.lg,
                                textAlign: 'right',
                                color: recommended === 'OLD' ? tokens.colors.info[700] : tokens.colors.neutral[900],
                            }}>
                                {formatCurrency(oldRegime.total)}
                                {recommended === 'OLD' && <CheckCircle size={16} style={{ marginLeft: tokens.spacing.xs, verticalAlign: 'middle' }} color={tokens.colors.info[600]} />}
                            </td>
                            <td style={{
                                padding: tokens.spacing.lg,
                                textAlign: 'right',
                                color: recommended === 'NEW' ? tokens.colors.success[700] : tokens.colors.neutral[900],
                            }}>
                                {formatCurrency(newRegime.total)}
                                {recommended === 'NEW' && <CheckCircle size={16} style={{ marginLeft: tokens.spacing.xs, verticalAlign: 'middle' }} color={tokens.colors.success[600]} />}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: tokens.spacing.xl, display: 'flex', gap: tokens.spacing.md }}>
                <button
                    onClick={() => navigate('/tax-planner/optimizer')}
                    style={{
                        padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                        backgroundColor: tokens.colors.accent[600],
                        color: tokens.colors.neutral.white,
                        border: 'none',
                        borderRadius: tokens.borderRadius.md,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.sm,
                    }}
                >
                    Maximize Deductions <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default RegimeComparisonPage;
