/**
 * Streamlined ITR Filing - Screen 3: Final Review & Submit
 * Legal declarations and submission
 */

import { useState } from 'react';
import { CheckCircle, AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import { tokens } from '../../../styles/tokens';
import newFilingService from '../../../services/newFilingService';
import toast from 'react-hot-toast';

const FinalReviewSubmit = ({ verifiedData, onBack, onSubmitSuccess }) => {
    const [declarations, setDeclarations] = useState({
        truthful: false,
        allIncome: false,
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            // Create filing with all verified data
            const response = await newFilingService.createFiling({
                financialYear: '2024-25',
                pan: verifiedData.personal.pan,
                determinedITR: verifiedData.recommendedITR,
                formData: verifiedData,
                status: 'submitted',
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success('ITR submitted successfully!');
            onSubmitSuccess(response.filingId);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to submit ITR');
        },
    });

    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;
    const { computation } = verifiedData;

    const validationChecklist = [
        { label: 'PAN verified', status: true },
        { label: 'All income sources declared', status: verifiedData.income.sources.length > 0 },
        { label: 'Deductions within limits', status: true },
        { label: 'Bank details provided', status: !!verifiedData.personal.bankAccount },
        { label: 'Aadhaar linked', status: false, warning: 'E-verify will require OTP' },
    ];

    const canSubmit = declarations.truthful && declarations.allIncome;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.xl,
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    marginBottom: tokens.spacing.xs,
                }}>
                    ✅ Final Review & Submit
                </h1>
                <p style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.neutral[600],
                    marginBottom: tokens.spacing.xl,
                }}>
                    Review the summary and submit your ITR
                </p>

                {/* Summary */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.md,
                    }}>
                        📄 Summary
                    </h2>

                    <div style={{ display: 'grid', gap: tokens.spacing.sm, fontSize: tokens.typography.fontSize.base }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm }}>
                            <span>Total Income:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(computation.grossIncome)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm, backgroundColor: tokens.colors.neutral[50] }}>
                            <span>Tax Liability:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.semibold }}>{formatCurrency(computation.taxLiability)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.md,
                            backgroundColor: computation.isRefund ? `${tokens.colors.success[600]}10` : `${tokens.colors.error[600]}10`,
                            borderRadius: tokens.borderRadius.md,
                        }}>
                            <span style={{ fontWeight: tokens.typography.fontWeight.bold }}>
                                {computation.isRefund ? 'Refund:' : 'Tax Payable:'}
                            </span>
                            <span style={{
                                fontWeight: tokens.typography.fontWeight.bold,
                                fontSize: tokens.typography.fontSize.xl,
                                color: computation.isRefund ? tokens.colors.success[700] : tokens.colors.error[700],
                            }}>
                                {formatCurrency(Math.abs(computation.refundOrPayable))}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: tokens.spacing.sm }}>
                            <span>Bank Account:</span>
                            <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                                {verifiedData.personal.bankAccount || 'Not provided'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Validation Checklist */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.md,
                    }}>
                        ✓ Validation Checklist
                    </h2>

                    <div style={{ display: 'grid', gap: tokens.spacing.sm }}>
                        {validationChecklist.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: tokens.spacing.sm,
                                    padding: tokens.spacing.sm,
                                    backgroundColor: tokens.colors.neutral[50],
                                    borderRadius: tokens.borderRadius.md,
                                }}
                            >
                                {item.status ? (
                                    <CheckCircle size={18} color={tokens.colors.success[600]} />
                                ) : (
                                    <AlertTriangle size={18} color={tokens.colors.warning[600]} />
                                )}
                                <span style={{ flex: 1, fontSize: tokens.typography.fontSize.sm }}>
                                    {item.label}
                                </span>
                                {item.warning && (
                                    <span style={{
                                        fontSize: tokens.typography.fontSize.xs,
                                        color: tokens.colors.warning[700],
                                    }}>
                                        {item.warning}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Declarations */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.md,
                    }}>
                        📋 Declaration
                    </h2>

                    <div style={{ display: 'grid', gap: tokens.spacing.md }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: tokens.spacing.sm,
                            cursor: 'pointer',
                        }}>
                            <input
                                type="checkbox"
                                checked={declarations.truthful}
                                onChange={(e) => setDeclarations({ ...declarations, truthful: e.target.checked })}
                                style={{ marginTop: '2px' }}
                            />
                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                I verify that the information provided is true and correct to the best of my knowledge and belief.
                            </span>
                        </label>

                        <label style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: tokens.spacing.sm,
                            cursor: 'pointer',
                        }}>
                            <input
                                type="checkbox"
                                checked={declarations.allIncome}
                                onChange={(e) => setDeclarations({ ...declarations, allIncome: e.target.checked })}
                                style={{ marginTop: '2px' }}
                            />
                            <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                I have disclosed all sources of income and have not concealed any information.
                            </span>
                        </label>
                    </div>
                </Card>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>
                        Edit Data
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => submitMutation.mutate()}
                        disabled={!canSubmit || submitMutation.isLoading}
                        icon={<Send size={16} />}
                        iconPosition="right"
                    >
                        {submitMutation.isLoading ? 'Submitting...' : 'Submit ITR & E-Verify'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FinalReviewSubmit;
