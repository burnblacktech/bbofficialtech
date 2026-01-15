import React from 'react';
import { Check, X, AlertCircle, Building2, User, Landmark, IndianRupee } from 'lucide-react';
import { tokens } from '../../../styles/tokens';
import Button from '../../../components/atoms/Button';

const AutofillConfirmationModal = ({ isOpen, onClose, onConfirm, data, isLoading }) => {
    if (!isOpen) return null;

    const { employer, employee, financial } = data || {};

    const DataRow = ({ icon: Icon, label, value, subValue }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.md,
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.neutral[50],
            borderRadius: tokens.borderRadius.md,
            marginBottom: tokens.spacing.sm,
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: tokens.colors.accent[50],
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={20} color={tokens.colors.accent[600]} />
            </div>
            <div style={{ flex: 1 }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.neutral[500],
                    marginBottom: '2px',
                }}>{label}</p>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900],
                }}>{value || 'Not detected'}</p>
                {subValue && (
                    <p style={{
                        fontSize: tokens.typography.fontSize.xs,
                        color: tokens.colors.neutral[600],
                    }}>{subValue}</p>
                )}
            </div>
        </div>
    );

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'Not detected';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: tokens.borderRadius.xl,
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: tokens.shadows.xl,
            }}>
                {/* Header */}
                <div style={{
                    padding: tokens.spacing.lg,
                    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 1,
                }}>
                    <div>
                        <h2 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                        }}>Verify Extracted Data</h2>
                        <p style={{
                            fontSize: tokens.typography.fontSize.xs,
                            color: tokens.colors.neutral[500],
                        }}>We've analyzed your Form 16. Please confirm the details below.</p>
                    </div>
                    <button onClick={onClose} style={{
                        padding: tokens.spacing.xs,
                        borderRadius: tokens.borderRadius.md,
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: tokens.colors.neutral[400],
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: tokens.spacing.lg }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: `3px solid ${tokens.colors.neutral[100]}`,
                                borderTop: `3px solid ${tokens.colors.accent[600]}`,
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto mb-4',
                            }} />
                            <p style={{ color: tokens.colors.neutral[600] }}>Analyzing document...</p>
                        </div>
                    ) : (
                        <>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.xs,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[400],
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: tokens.spacing.md,
                            }}>Basic Info</h3>

                            <DataRow
                                icon={Building2}
                                label="Employer Name"
                                value={employer?.name}
                                subValue={employer?.tan ? `TAN: ${employer.tan}` : null}
                            />

                            <DataRow
                                icon={User}
                                label="Employee PAN"
                                value={employee?.pan}
                            />

                            <h3 style={{
                                fontSize: tokens.typography.fontSize.xs,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[400],
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginTop: tokens.spacing.xl,
                                marginBottom: tokens.spacing.md,
                            }}>Financial Details</h3>

                            <DataRow
                                icon={Landmark}
                                label="Assessment Year"
                                value={financial?.assessmentYear}
                            />

                            <DataRow
                                icon={IndianRupee}
                                label="Gross Salary"
                                value={formatCurrency(financial?.grossSalary)}
                            />

                            <DataRow
                                icon={IndianRupee}
                                label="Total TDS Deducted"
                                value={formatCurrency(financial?.tds)}
                            />

                            <div style={{
                                marginTop: tokens.spacing.lg,
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.colors.info[50],
                                borderRadius: tokens.borderRadius.md,
                                display: 'flex',
                                gap: tokens.spacing.sm,
                            }}>
                                <AlertCircle size={18} color={tokens.colors.info[600]} style={{ flexShrink: 0 }} />
                                <p style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    color: tokens.colors.info[700],
                                    lineHeight: '1.4',
                                }}>
                                    Deductions under 80C ({formatCurrency(financial?.deductions80C || 0)}) and 80D ({formatCurrency(financial?.deductions80D || 0)}) will also be applied to your tax planner.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: tokens.spacing.lg,
                    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                    display: 'flex',
                    gap: tokens.spacing.md,
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'white',
                }}>
                    <Button variant="outline" fullWidth onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" fullWidth onClick={onConfirm} disabled={isLoading || !data}>
                        Confirm & Apply
                    </Button>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default AutofillConfirmationModal;
