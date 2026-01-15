import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const YearEndSummary = ({ data, onBack }) => {
    const totalIncome = data?.totalIncome || 0;
    const taxLiability = data?.taxLiability || 0;
    const taxSaved = data?.taxSaved || 0;
    const refund = data?.refund || 0;
    const payable = data?.payable || 0;

    const summaryRows = [
        { label: 'Salary Income', value: totalIncome * 0.8, type: 'income' },
        { label: 'Other Sources', value: totalIncome * 0.2, type: 'income' },
        { label: '80C Deductions', value: taxSaved * 2, type: 'deduction' },
        { label: 'TDS Deducted', value: taxLiability + (refund > 0 ? refund : -payable), type: 'tax' },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        color: tokens.colors.accent[600],
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.medium,
                        padding: 0,
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Insights
                </button>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.xs,
                    backgroundColor: tokens.colors.neutral[900],
                    color: tokens.colors.neutral.white,
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: tokens.borderRadius.md,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    cursor: 'pointer',
                }}>
                    <Download size={16} />
                    Download PDF
                </button>
            </div>

            <div style={{
                backgroundColor: tokens.colors.neutral.white,
                borderRadius: tokens.borderRadius.lg,
                border: `1px solid ${tokens.colors.neutral[200]}`,
                padding: tokens.spacing.xl,
                marginBottom: tokens.spacing.xl,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${tokens.colors.neutral[100]}`, paddingBottom: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
                    <div>
                        <h2 style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold }}>
                            FY 2024-25 Summary
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: tokens.colors.neutral[500], fontSize: tokens.typography.fontSize.xs, marginTop: '4px' }}>
                            <Calendar size={12} />
                            Generated on {new Date().toLocaleDateString()}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>Status</div>
                        <div style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.success[700],
                            backgroundColor: `${tokens.colors.success[600]}10`,
                            padding: '2px 8px',
                            borderRadius: tokens.borderRadius.full,
                            display: 'inline-block',
                            marginTop: '4px',
                        }}>
                            Ready to File
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: tokens.spacing.md }}>
                    {summaryRows.map((row, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.md, backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.md }}>
                            <span style={{ color: tokens.colors.neutral[700] }}>{row.label}</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>₹{row.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: tokens.spacing.xl,
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral[900],
                    color: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.lg,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, opacity: 0.7 }}>Estimated Refund</div>
                        <div style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold }}>₹{refund.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, opacity: 0.7 }}>Tax Payable</div>
                        <div style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold }}>₹{payable.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default YearEndSummary;
