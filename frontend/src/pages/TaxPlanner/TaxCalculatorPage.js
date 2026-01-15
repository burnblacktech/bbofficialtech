/**
 * Tax Calculator Page
 * Calculate and compare tax liability for Old vs New regime
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calculator, ArrowLeft, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const TaxCalculatorPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        grossIncome: '',
        // Old regime deductions
        deduction80c: '',
        deduction80d: '',
        deduction80e: '',
        deduction80g: '',
        deductionHra: '',
        deductionHomeLoan: '',
    });

    const [showDeductions, setShowDeductions] = useState(false);
    const [comparison, setComparison] = useState(null);

    // Fetch income from income module
    const { data: incomeData } = useQuery({
        queryKey: ['income', 'summary'],
        queryFn: async () => {
            const response = await api.get('/api/income/summary');
            return response.data;
        },
    });

    // Auto-populate gross income from income module
    React.useEffect(() => {
        if (incomeData?.data) {
            const totalIncome = incomeData.data.reduce((sum, item) => sum + item.totalAmount, 0);
            if (totalIncome > 0 && !formData.grossIncome) {
                setFormData(prev => ({ ...prev, grossIncome: totalIncome.toString() }));
            }
        }
    }, [incomeData]);

    // Calculate tax mutation
    const calculateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/api/tax/compare-regimes', data);
            return response.data;
        },
        onSuccess: (data) => {
            setComparison(data.data);
        },
    });

    const handleCalculate = (e) => {
        e.preventDefault();

        const filingData = {
            income: {
                salary: parseFloat(formData.grossIncome) || 0,
            },
            deductions: {
                section80C: parseFloat(formData.deduction80c) || 0,
                section80D: parseFloat(formData.deduction80d) || 0,
                section80E: parseFloat(formData.deduction80e) || 0,
                section80G: parseFloat(formData.deduction80g) || 0,
                hra: parseFloat(formData.deductionHra) || 0,
                homeLoanInterest: parseFloat(formData.deductionHomeLoan) || 0,
            },
        };

        calculateMutation.mutate({ filingData });
    };

    const formatCurrency = (amount) => {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    };

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
                    Tax Calculator
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.lg,
                    color: tokens.colors.neutral[600],
                }}>
                    Calculate and compare your tax liability for FY 2024-25
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: tokens.spacing.xl }}>
                {/* Input Form */}
                <div>
                    <form onSubmit={handleCalculate}>
                        <div style={{
                            padding: tokens.spacing.lg,
                            backgroundColor: tokens.colors.neutral.white,
                            border: `1px solid ${tokens.colors.neutral[200]}`,
                            borderRadius: tokens.borderRadius.lg,
                            marginBottom: tokens.spacing.md,
                        }}>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.lg,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                marginBottom: tokens.spacing.md,
                            }}>
                                Income Details
                            </h3>

                            <div style={{ marginBottom: tokens.spacing.md }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    Gross Annual Income *
                                </label>
                                <input
                                    type="number"
                                    value={formData.grossIncome}
                                    onChange={(e) => setFormData({ ...formData, grossIncome: e.target.value })}
                                    required
                                    placeholder="Enter your total income"
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                                {incomeData?.data && (
                                    <p style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.neutral[600],
                                        marginTop: tokens.spacing.xs,
                                    }}>
                                        Auto-populated from your income sources
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Deductions Section */}
                        <div style={{
                            padding: tokens.spacing.lg,
                            backgroundColor: tokens.colors.neutral.white,
                            border: `1px solid ${tokens.colors.neutral[200]}`,
                            borderRadius: tokens.borderRadius.lg,
                            marginBottom: tokens.spacing.md,
                        }}>
                            <div
                                onClick={() => setShowDeductions(!showDeductions)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginBottom: showDeductions ? tokens.spacing.md : 0,
                                }}
                            >
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.lg,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                }}>
                                    Deductions (Old Regime)
                                </h3>
                                <span style={{ fontSize: tokens.typography.fontSize.xl }}>
                                    {showDeductions ? '−' : '+'}
                                </span>
                            </div>

                            {showDeductions && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: tokens.typography.fontSize.sm,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            80C (Max ₹1,50,000)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deduction80c}
                                            onChange={(e) => setFormData({ ...formData, deduction80c: e.target.value })}
                                            placeholder="EPF, PPF, ELSS, LIC, NSC"
                                            style={{
                                                width: '100%',
                                                padding: tokens.spacing.sm,
                                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                                borderRadius: tokens.borderRadius.md,
                                                fontSize: tokens.typography.fontSize.sm,
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: tokens.typography.fontSize.sm,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            80D (Max ₹25,000)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deduction80d}
                                            onChange={(e) => setFormData({ ...formData, deduction80d: e.target.value })}
                                            placeholder="Health insurance"
                                            style={{
                                                width: '100%',
                                                padding: tokens.spacing.sm,
                                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                                borderRadius: tokens.borderRadius.md,
                                                fontSize: tokens.typography.fontSize.sm,
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: tokens.typography.fontSize.sm,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            HRA
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deductionHra}
                                            onChange={(e) => setFormData({ ...formData, deductionHra: e.target.value })}
                                            placeholder="House rent allowance"
                                            style={{
                                                width: '100%',
                                                padding: tokens.spacing.sm,
                                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                                borderRadius: tokens.borderRadius.md,
                                                fontSize: tokens.typography.fontSize.sm,
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: tokens.typography.fontSize.sm,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            Home Loan Interest (Max ₹2,00,000)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deductionHomeLoan}
                                            onChange={(e) => setFormData({ ...formData, deductionHomeLoan: e.target.value })}
                                            placeholder="Interest on home loan"
                                            style={{
                                                width: '100%',
                                                padding: tokens.spacing.sm,
                                                border: `1px solid ${tokens.colors.neutral[300]}`,
                                                borderRadius: tokens.borderRadius.md,
                                                fontSize: tokens.typography.fontSize.sm,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={calculateMutation.isLoading}
                            style={{
                                width: '100%',
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.accent[600],
                                color: tokens.colors.neutral.white,
                                border: 'none',
                                borderRadius: tokens.borderRadius.md,
                                fontSize: tokens.typography.fontSize.base,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: tokens.spacing.sm,
                            }}
                        >
                            <Calculator size={20} />
                            {calculateMutation.isLoading ? 'Calculating...' : 'Calculate Tax'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div>
                    {comparison ? (
                        <>
                            {/* Recommendation Banner */}
                            <div style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: comparison.recommendedRegime === 'NEW' ? `${tokens.colors.success[600]}15` : `${tokens.colors.info[600]}15`,
                                border: `2px solid ${comparison.recommendedRegime === 'NEW' ? tokens.colors.success[600] : tokens.colors.info[600]}`,
                                borderRadius: tokens.borderRadius.lg,
                                marginBottom: tokens.spacing.lg,
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.md,
                            }}>
                                <Info size={24} color={comparison.recommendedRegime === 'NEW' ? tokens.colors.success[600] : tokens.colors.info[600]} />
                                <div>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.lg,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        marginBottom: tokens.spacing.xs,
                                    }}>
                                        Recommended: {comparison.recommendedRegime === 'NEW' ? 'New' : 'Old'} Tax Regime
                                    </h3>
                                    <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                        Save {formatCurrency(comparison.taxSavings)} by choosing the {comparison.recommendedRegime === 'NEW' ? 'new' : 'old'} regime
                                    </p>
                                </div>
                            </div>

                            {/* Regime Comparison Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.lg }}>
                                {/* Old Regime */}
                                <div style={{
                                    padding: tokens.spacing.lg,
                                    backgroundColor: tokens.colors.neutral.white,
                                    border: `2px solid ${comparison.recommendedRegime === 'OLD' ? tokens.colors.info[600] : tokens.colors.neutral[200]}`,
                                    borderRadius: tokens.borderRadius.lg,
                                }}>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.xl,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        marginBottom: tokens.spacing.md,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacing.sm,
                                    }}>
                                        Old Regime
                                        {comparison.recommendedRegime === 'OLD' && (
                                            <span style={{
                                                padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                                                backgroundColor: tokens.colors.info[600],
                                                color: tokens.colors.neutral.white,
                                                borderRadius: tokens.borderRadius.sm,
                                                fontSize: tokens.typography.fontSize.xs,
                                            }}>
                                                Recommended
                                            </span>
                                        )}
                                    </h3>

                                    <div style={{ marginBottom: tokens.spacing.lg }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Gross Income:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(comparison.oldRegime.grossTotalIncome)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Deductions:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                                -{formatCurrency(comparison.oldRegime.totalDeductions)}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: tokens.spacing.sm,
                                            borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                        }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>Taxable Income:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.bold }}>{formatCurrency(comparison.oldRegime.taxableIncome)}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: tokens.spacing.md,
                                        backgroundColor: tokens.colors.neutral[50],
                                        borderRadius: tokens.borderRadius.md,
                                        marginBottom: tokens.spacing.md,
                                    }}>
                                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                            Total Tax Liability
                                        </p>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize['3xl'],
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.neutral[900],
                                        }}>
                                            {formatCurrency(comparison.oldRegime.totalTax)}
                                        </p>
                                    </div>

                                    <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Tax:</span>
                                            <span>{formatCurrency(comparison.oldRegime.tax)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Cess (4%):</span>
                                            <span>{formatCurrency(comparison.oldRegime.cess)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* New Regime */}
                                <div style={{
                                    padding: tokens.spacing.lg,
                                    backgroundColor: tokens.colors.neutral.white,
                                    border: `2px solid ${comparison.recommendedRegime === 'NEW' ? tokens.colors.success[600] : tokens.colors.neutral[200]}`,
                                    borderRadius: tokens.borderRadius.lg,
                                }}>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.xl,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        marginBottom: tokens.spacing.md,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacing.sm,
                                    }}>
                                        New Regime
                                        {comparison.recommendedRegime === 'NEW' && (
                                            <span style={{
                                                padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                                                backgroundColor: tokens.colors.success[600],
                                                color: tokens.colors.neutral.white,
                                                borderRadius: tokens.borderRadius.sm,
                                                fontSize: tokens.typography.fontSize.xs,
                                            }}>
                                                Recommended
                                            </span>
                                        )}
                                    </h3>

                                    <div style={{ marginBottom: tokens.spacing.lg }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Gross Income:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(comparison.newRegime.grossTotalIncome)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Standard Deduction:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                                -₹50,000
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: tokens.spacing.sm,
                                            borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                        }}>
                                            <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>Taxable Income:</span>
                                            <span style={{ fontWeight: tokens.typography.fontWeight.bold }}>{formatCurrency(comparison.newRegime.taxableIncome)}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: tokens.spacing.md,
                                        backgroundColor: tokens.colors.neutral[50],
                                        borderRadius: tokens.borderRadius.md,
                                        marginBottom: tokens.spacing.md,
                                    }}>
                                        <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                            Total Tax Liability
                                        </p>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize['3xl'],
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.neutral[900],
                                        }}>
                                            {formatCurrency(comparison.newRegime.totalTax)}
                                        </p>
                                    </div>

                                    <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing.xs }}>
                                            <span>Tax:</span>
                                            <span>{formatCurrency(comparison.newRegime.tax)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Cess (4%):</span>
                                            <span>{formatCurrency(comparison.newRegime.cess)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            padding: tokens.spacing.xl,
                            backgroundColor: tokens.colors.neutral[50],
                            borderRadius: tokens.borderRadius.lg,
                            textAlign: 'center',
                        }}>
                            <Calculator size={48} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                            <p style={{ color: tokens.colors.neutral[600] }}>
                                Enter your income details and click "Calculate Tax" to see the comparison
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaxCalculatorPage;
