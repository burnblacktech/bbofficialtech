/**
 * Streamlined ITR Filing - Screen 2: Single-Screen Verification
 * All income, deductions, and tax computation on one screen
 */

import { useState } from 'react';
import { Edit2, Plus, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import { tokens } from '../../../styles/tokens';

const SingleScreenVerification = ({ aggregatedData, onBack, onNext }) => {
    const [data, setData] = useState(aggregatedData);
    const [editingItem, setEditingItem] = useState(null);

    const updateIncome = (index, newAmount) => {
        const newSources = [...data.income.sources];
        newSources[index].amount = parseFloat(newAmount) || 0;
        setData({
            ...data,
            income: {
                sources: newSources,
                total: newSources.reduce((sum, s) => sum + s.amount, 0),
            },
        });
    };

    const updateDeduction = (index, newAmount) => {
        const newItems = [...data.deductions.items];
        newItems[index].amount = parseFloat(newAmount) || 0;
        setData({
            ...data,
            deductions: {
                items: newItems,
                total: newItems.reduce((sum, d) => sum + d.amount, 0),
            },
        });
    };

    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

    const { computation } = data;
    const savingsWithOldRegime = computation.newRegimeTax - computation.oldRegimeTax;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: tokens.spacing.xl }}>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.xs,
                    }}>
                        📋 Review Your Tax Data - {data.recommendedITR} Recommended
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.base,
                        color: tokens.colors.neutral[600],
                    }}>
                        Verify all details below. Click ✎ to edit any value.
                    </p>
                </div>

                {/* Income Sources */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                        }}>
                            💰 Income Sources
                        </h2>
                        <Button variant="secondary" size="sm" icon={<Plus size={14} />}>
                            Add Income
                        </Button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${tokens.colors.neutral[100]}` }}>
                                <th style={{ textAlign: 'left', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Description</th>
                                <th style={{ textAlign: 'left', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Source</th>
                                <th style={{ textAlign: 'right', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Amount</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.income.sources.map((source, index) => (
                                <tr key={index} style={{ borderBottom: `1px solid ${tokens.colors.neutral[50]}` }}>
                                    <td style={{ padding: tokens.spacing.sm }}>
                                        <div style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                                            {source.source}
                                        </div>
                                        {source.conflict && (
                                            <div style={{
                                                fontSize: tokens.typography.fontSize.xs,
                                                color: tokens.colors.warning[600],
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginTop: '2px',
                                            }}>
                                                <AlertTriangle size={12} />
                                                Conflict detected
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: tokens.spacing.sm }}>
                                        <span style={{
                                            fontSize: tokens.typography.fontSize.xs,
                                            color: tokens.colors.neutral[500],
                                            backgroundColor: tokens.colors.neutral[50],
                                            padding: '2px 6px',
                                            borderRadius: tokens.borderRadius.sm,
                                        }}>
                                            {source.origin}
                                        </span>
                                    </td>
                                    <td style={{ padding: tokens.spacing.sm, textAlign: 'right', fontWeight: tokens.typography.fontWeight.semibold }}>
                                        {editingItem === `income-${index}` ? (
                                            <input
                                                type="number"
                                                value={source.amount}
                                                onChange={(e) => updateIncome(index, e.target.value)}
                                                onBlur={() => setEditingItem(null)}
                                                autoFocus
                                                style={{
                                                    width: '120px',
                                                    padding: '4px 8px',
                                                    border: `1px solid ${tokens.colors.accent[600]}`,
                                                    borderRadius: tokens.borderRadius.sm,
                                                    textAlign: 'right',
                                                }}
                                            />
                                        ) : (
                                            formatCurrency(source.amount)
                                        )}
                                    </td>
                                    <td style={{ padding: tokens.spacing.sm }}>
                                        <button
                                            onClick={() => setEditingItem(`income-${index}`)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: tokens.colors.neutral[400],
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ borderTop: `2px solid ${tokens.colors.neutral[100]}`, fontWeight: tokens.typography.fontWeight.bold }}>
                                <td colSpan={2} style={{ padding: tokens.spacing.sm }}>Total Income</td>
                                <td style={{ padding: tokens.spacing.sm, textAlign: 'right' }}>{formatCurrency(data.income.total)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                {/* Deductions */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                        }}>
                            📊 Deductions
                        </h2>
                        <Button variant="secondary" size="sm" icon={<Plus size={14} />}>
                            Add Deduction
                        </Button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${tokens.colors.neutral[100]}` }}>
                                <th style={{ textAlign: 'left', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Section</th>
                                <th style={{ textAlign: 'left', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Source</th>
                                <th style={{ textAlign: 'right', padding: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Amount</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.deductions.items.length > 0 ? data.deductions.items.map((ded, index) => (
                                <tr key={index} style={{ borderBottom: `1px solid ${tokens.colors.neutral[50]}` }}>
                                    <td style={{ padding: tokens.spacing.sm }}>{ded.section} - {ded.description}</td>
                                    <td style={{ padding: tokens.spacing.sm }}>
                                        <span style={{
                                            fontSize: tokens.typography.fontSize.xs,
                                            color: tokens.colors.neutral[500],
                                            backgroundColor: tokens.colors.neutral[50],
                                            padding: '2px 6px',
                                            borderRadius: tokens.borderRadius.sm,
                                        }}>
                                            {ded.origin}
                                        </span>
                                    </td>
                                    <td style={{ padding: tokens.spacing.sm, textAlign: 'right', fontWeight: tokens.typography.fontWeight.semibold }}>
                                        {formatCurrency(ded.amount)}
                                    </td>
                                    <td style={{ padding: tokens.spacing.sm }}>
                                        <button
                                            onClick={() => setEditingItem(`ded-${index}`)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: tokens.colors.neutral[400],
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.neutral[500] }}>
                                        No deductions claimed yet
                                    </td>
                                </tr>
                            )}
                            {data.deductions.items.length > 0 && (
                                <tr style={{ borderTop: `2px solid ${tokens.colors.neutral[100]}`, fontWeight: tokens.typography.fontWeight.bold }}>
                                    <td colSpan={2} style={{ padding: tokens.spacing.sm }}>Total Deductions</td>
                                    <td style={{ padding: tokens.spacing.sm, textAlign: 'right' }}>{formatCurrency(data.deductions.total)}</td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>

                {/* Tax Computation */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.md,
                    }}>
                        📊 Tax Computation
                    </h2>

                    <div style={{ display: 'grid', gap: tokens.spacing.sm, fontSize: tokens.typography.fontSize.sm }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm }}>
                            <span>Gross Total Income:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(computation.grossIncome)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm, backgroundColor: tokens.colors.neutral[50] }}>
                            <span>Total Deductions:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(computation.totalDeductions)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm }}>
                            <span>Taxable Income:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(computation.taxableIncome)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm, backgroundColor: tokens.colors.neutral[50] }}>
                            <span>Tax Liability ({computation.recommendedRegime === 'new' ? 'New' : 'Old'} Regime):</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[700] }}>{formatCurrency(computation.taxLiability)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm }}>
                            <span>TDS Already Paid:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(data.taxPaid.total)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.md,
                            backgroundColor: computation.isRefund ? `${tokens.colors.success[600]}10` : `${tokens.colors.error[600]}10`,
                            borderRadius: tokens.borderRadius.md,
                            marginTop: tokens.spacing.sm,
                        }}>
                            <span style={{ fontWeight: tokens.typography.fontWeight.bold }}>
                                {computation.isRefund ? '✓ Refund Due:' : '⚠ Tax Payable:'}
                            </span>
                            <span style={{
                                fontWeight: tokens.typography.fontWeight.bold,
                                fontSize: tokens.typography.fontSize.lg,
                                color: computation.isRefund ? tokens.colors.success[700] : tokens.colors.error[700],
                            }}>
                                {formatCurrency(Math.abs(computation.refundOrPayable))}
                            </span>
                        </div>
                    </div>

                    {/* Regime Comparison */}
                    {savingsWithOldRegime !== 0 && (
                        <div style={{
                            marginTop: tokens.spacing.lg,
                            padding: tokens.spacing.md,
                            backgroundColor: `${tokens.colors.info[600]}08`,
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.info[100]}`,
                        }}>
                            <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.info[700] }}>
                                ⚠ Regime Comparison: {savingsWithOldRegime > 0 ? 'Old' : 'New'} regime saves {formatCurrency(Math.abs(savingsWithOldRegime))} more
                            </div>
                            <Button variant="secondary" size="sm" style={{ marginTop: tokens.spacing.sm }}>
                                Switch to {savingsWithOldRegime > 0 ? 'Old' : 'New'} Regime
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>
                        Back
                    </Button>
                    <Button variant="primary" onClick={() => onNext(data)} icon={<ArrowRight size={16} />} iconPosition="right">
                        Continue to Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SingleScreenVerification;
