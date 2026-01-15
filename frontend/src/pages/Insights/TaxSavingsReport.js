import { ArrowLeft, TrendingUp, Sparkles } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const TaxSavingsReport = ({ data, onBack }) => {
    const totalIncome = data?.totalIncome || 0;
    const taxLiability = data?.taxLiability || 0;
    const taxSaved = data?.taxSaved || 0;

    // Simulation: Calculate old vs new (dummy logic for visual demo)
    const oldRegimeTax = taxLiability + (taxSaved * 0.8); // Usually higher without optimization
    const potentialSavings = Math.round(taxLiability * 0.15); // Extra 15% possible

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
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
                    marginBottom: tokens.spacing.lg,
                    padding: 0,
                }}
            >
                <ArrowLeft size={16} />
                Back to Insights
            </button>

            <div style={{
                backgroundColor: tokens.colors.neutral.white,
                borderRadius: tokens.borderRadius.lg,
                border: `1px solid ${tokens.colors.neutral[200]}`,
                padding: tokens.spacing.xl,
                marginBottom: tokens.spacing.xl,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        padding: tokens.spacing.md,
                        backgroundColor: `${tokens.colors.success[600]}10`,
                        borderRadius: tokens.borderRadius.md,
                    }}>
                        <TrendingUp color={tokens.colors.success[600]} size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold }}>
                            Tax Savings Report
                        </h2>
                        <p style={{ color: tokens.colors.neutral[600], fontSize: tokens.typography.fontSize.sm }}>
                            Comparative analysis for FY 2024-25
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
                    <div style={{ padding: tokens.spacing.lg, backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.neutral[100]}` }}>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>Current Liability</div>
                        <div style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold }}>₹{taxLiability.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: tokens.spacing.lg, backgroundColor: `${tokens.colors.success[600]}08`, borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.success[100]}` }}>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.success[700], marginBottom: tokens.spacing.xs }}>Total Saved</div>
                        <div style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[700] }}>₹{taxSaved.toLocaleString()}</div>
                    </div>
                </div>

                <h3 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.md }}>
                    Regime Comparison
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${tokens.colors.neutral[100]}` }}>
                                <th style={{ padding: tokens.spacing.md, color: tokens.colors.neutral[600] }}>Description</th>
                                <th style={{ padding: tokens.spacing.md, color: tokens.colors.neutral[600] }}>Old Regime</th>
                                <th style={{ padding: tokens.spacing.md, color: tokens.colors.neutral[600] }}>New Regime (Recommended)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: `1px solid ${tokens.colors.neutral[50]}` }}>
                                <td style={{ padding: tokens.spacing.md }}>Gross Income</td>
                                <td style={{ padding: tokens.spacing.md }}>₹{totalIncome.toLocaleString()}</td>
                                <td style={{ padding: tokens.spacing.md }}>₹{totalIncome.toLocaleString()}</td>
                            </tr>
                            <tr style={{ borderBottom: `1px solid ${tokens.colors.neutral[50]}` }}>
                                <td style={{ padding: tokens.spacing.md }}>Deductions</td>
                                <td style={{ padding: tokens.spacing.md }}>₹{(totalIncome * 0.1).toLocaleString()}</td>
                                <td style={{ padding: tokens.spacing.md }}>Standard Only</td>
                            </tr>
                            <tr style={{ backgroundColor: `${tokens.colors.accent[600]}05` }}>
                                <td style={{ padding: tokens.spacing.md, fontWeight: tokens.typography.fontWeight.bold }}>Final Tax</td>
                                <td style={{ padding: tokens.spacing.md }}>₹{oldRegimeTax.toLocaleString()}</td>
                                <td style={{ padding: tokens.spacing.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[700] }}>₹{taxLiability.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{
                    marginTop: tokens.spacing.xl,
                    padding: tokens.spacing.lg,
                    backgroundColor: `${tokens.colors.info[600]}08`,
                    borderRadius: tokens.borderRadius.lg,
                    border: `1px solid ${tokens.colors.info[100]}`,
                    display: 'flex',
                    gap: tokens.spacing.md,
                }}>
                    <Sparkles color={tokens.colors.info[600]} size={24} />
                    <div>
                        <div style={{ fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.info[700], marginBottom: '4px' }}>
                            Optimization Opportunity
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.info[600] }}>
                            You can save an additional ₹{potentialSavings.toLocaleString()} by declaring NPS contributions and health insurance premiums.
                        </div>
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

export default TaxSavingsReport;
