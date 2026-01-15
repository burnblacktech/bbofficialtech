import { CheckCircle2, Circle, AlertCircle, ArrowLeft } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const FinancialHealth = ({ data, onBack }) => {
    const healthScore = data?.financialHealth || 0;

    // Determine status color based on score
    const getStatusColor = (score) => {
        if (score >= 80) return tokens.colors.success[600];
        if (score >= 60) return tokens.colors.warning[600];
        return tokens.colors.error[600];
    };

    const statusColor = getStatusColor(healthScore);

    const checklistItems = [
        {
            label: 'PAN Verified',
            status: 'completed',
            description: 'Your identity is verified with the IT department.',
        },
        {
            label: 'Income Sources Linked',
            status: data?.incomeSourceCount > 0 ? 'completed' : 'pending',
            description: data?.incomeSourceCount > 0
                ? `${data.incomeSourceCount} source(s) identified.`
                : 'No income sources found yet.',
        },
        {
            label: 'Tax Saving Maximized',
            status: data?.taxSaved > (data?.totalIncome * 0.05) ? 'completed' : 'warning',
            description: 'Based on current investments vs potential savings.',
        },
        {
            label: 'Documents Uploaded',
            status: 'pending',
            description: 'Upload Form 16 or AIS for 100% accuracy.',
        },
    ];

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
                <div style={{ textAlign: 'center', marginBottom: tokens.spacing.xl }}>
                    <div style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '120px',
                        height: '120px',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={tokens.colors.neutral[100]}
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={statusColor}
                                strokeWidth="3"
                                strokeDasharray={`${healthScore}, 100`}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                        }}>
                            {healthScore}
                        </div>
                    </div>
                    <h2 style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold }}>
                        Overall Wellness Score
                    </h2>
                    <p style={{ color: tokens.colors.neutral[600], fontSize: tokens.typography.fontSize.sm }}>
                        Your tax file is {healthScore}% ready for FY 2024-25.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: tokens.spacing.md }}>
                    <h3 style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[800], marginBottom: tokens.spacing.xs }}>
                        Optimization Checklist
                    </h3>
                    {checklistItems.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            gap: tokens.spacing.md,
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.colors.neutral[50],
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.neutral[100]}`,
                        }}>
                            <div style={{ marginTop: '2px' }}>
                                {item.status === 'completed' ? (
                                    <CheckCircle2 color={tokens.colors.success[600]} size={20} />
                                ) : item.status === 'warning' ? (
                                    <AlertCircle color={tokens.colors.warning[600]} size={20} />
                                ) : (
                                    <Circle color={tokens.colors.neutral[300]} size={20} />
                                )}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    color: tokens.colors.neutral[900],
                                }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                                    {item.description}
                                </div>
                            </div>
                        </div>
                    ))}
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

export default FinancialHealth;
