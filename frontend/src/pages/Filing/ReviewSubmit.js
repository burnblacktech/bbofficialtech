/**
 * Review & Submit Page
 * Final review before ITR submission
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Send,
    Download,
    CheckCircle,
    AlertCircle,
    User,
    IndianRupee,
    Gift,
    CreditCard,
    Building2,
    FileText,
    Shield,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import Checklist from '../../components/molecules/Checklist';
import { tokens } from '../../styles/tokens';

const ReviewSubmit = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [verified, setVerified] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock data
    const completeness = [
        { label: 'Personal details verified', status: 'complete' },
        { label: 'All income sources added', status: 'complete' },
        { label: 'Deductions claimed', status: 'complete' },
        { label: 'Bank details added', status: 'complete' },
        { label: 'Tax calculation reviewed', status: 'complete' },
    ];

    const summary = {
        personal: {
            name: 'Vivek Kumar',
            pan: 'ABCDE1234F',
            dob: '15/03/1990',
            address: 'Mumbai, Maharashtra',
        },
        income: {
            salary: 850000,
            business: 0,
            capitalGains: 0,
            other: 0,
            total: 850000,
        },
        deductions: {
            section80C: 125000,
            section80D: 45000,
            other: 0,
            total: 170000,
        },
        tax: {
            regime: 'New',
            taxableIncome: 850000,
            totalLiability: 41600,
            tds: 67050,
            refund: 25450,
        },
    };

    const allComplete = completeness.every(item => item.status === 'complete');

    const handleSubmit = () => {
        if (!verified) {
            alert('Please verify that all information is correct');
            return;
        }
        setShowSuccess(true);
    };

    if (showSuccess) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: tokens.colors.neutral[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: tokens.spacing.lg,
            }}>
                <Card padding="xl" style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: tokens.colors.success[50],
                        borderRadius: tokens.borderRadius.full,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.lg,
                    }}>
                        <CheckCircle size={48} color={tokens.colors.success[600]} />
                    </div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['2xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.sm,
                    }}>
                        ITR Submitted Successfully!
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.base,
                        color: tokens.colors.neutral[600],
                        marginBottom: tokens.spacing.xl,
                    }}>
                        Your ITR for AY 2023-24 has been submitted. Download your ITR-V and complete e-verification.
                    </p>

                    <div style={{
                        padding: tokens.spacing.lg,
                        backgroundColor: tokens.colors.info[50],
                        borderRadius: tokens.borderRadius.lg,
                        marginBottom: tokens.spacing.xl,
                        textAlign: 'left',
                    }}>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.sm,
                        }}>
                            Next Steps:
                        </h3>
                        <ol style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[700],
                            paddingLeft: tokens.spacing.lg,
                            margin: 0,
                        }}>
                            <li style={{ marginBottom: tokens.spacing.xs }}>Download ITR-V (acknowledgement)</li>
                            <li style={{ marginBottom: tokens.spacing.xs }}>Complete e-verification within 120 days</li>
                            <li>Track your refund status</li>
                        </ol>
                    </div>

                    <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'center' }}>
                        <Button variant="primary" size="md">
                            <Download size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Download ITR-V
                        </Button>
                        <Button variant="outline" size="md" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/filing/${filingId}/unified`)}
                        style={{ marginBottom: tokens.spacing.md }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: tokens.spacing.xs }} />
                        Back to Filing Dashboard
                    </Button>

                    <div>
                        <h1 style={{
                            fontSize: tokens.typography.fontSize['2xl'],
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Review & Submit
                        </h1>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}>
                            Review all details before submitting your ITR
                        </p>
                    </div>
                </div>

                {/* Completeness Checklist */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.md,
                    }}>
                        Completeness Check
                    </h2>
                    <Checklist items={completeness} />
                    {allComplete && (
                        <div style={{
                            marginTop: tokens.spacing.md,
                            padding: tokens.spacing.sm,
                            backgroundColor: tokens.colors.success[50],
                            borderRadius: tokens.borderRadius.md,
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacing.xs,
                        }}>
                            <CheckCircle size={16} color={tokens.colors.success[600]} />
                            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.success[700] }}>
                                All sections complete! Ready to submit.
                            </span>
                        </div>
                    )}
                </Card>

                {/* Summary Sections */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: tokens.spacing.md,
                    marginBottom: tokens.spacing.lg,
                }}>
                    {/* Personal Info */}
                    <Card padding="lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                <User size={20} color={tokens.colors.accent[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Personal Details
                                </h3>
                            </div>
                            <Button variant="ghost" size="sm">
                                <Edit size={14} />
                            </Button>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Name:</strong> {summary.personal.name}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>PAN:</strong> {summary.personal.pan}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>DOB:</strong> {summary.personal.dob}</div>
                            <div><strong>Address:</strong> {summary.personal.address}</div>
                        </div>
                    </Card>

                    {/* Income Summary */}
                    <Card padding="lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                <IndianRupee size={20} color={tokens.colors.info[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Income Summary
                                </h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/filing/${filingId}/income`)}>
                                <Edit size={14} />
                            </Button>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Salary:</strong> ₹{summary.income.salary.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Business:</strong> ₹{summary.income.business.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Capital Gains:</strong> ₹{summary.income.capitalGains.toLocaleString()}</div>
                            <div style={{
                                marginTop: tokens.spacing.sm,
                                paddingTop: tokens.spacing.sm,
                                borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                fontWeight: tokens.typography.fontWeight.semibold,
                            }}>
                                <strong>Total:</strong> ₹{summary.income.total.toLocaleString()}
                            </div>
                        </div>
                    </Card>

                    {/* Deductions Summary */}
                    <Card padding="lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                <Gift size={20} color={tokens.colors.success[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Deductions
                                </h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/filing/${filingId}/deductions`)}>
                                <Edit size={14} />
                            </Button>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Section 80C:</strong> ₹{summary.deductions.section80C.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Section 80D:</strong> ₹{summary.deductions.section80D.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Other:</strong> ₹{summary.deductions.other.toLocaleString()}</div>
                            <div style={{
                                marginTop: tokens.spacing.sm,
                                paddingTop: tokens.spacing.sm,
                                borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                fontWeight: tokens.typography.fontWeight.semibold,
                            }}>
                                <strong>Total:</strong> ₹{summary.deductions.total.toLocaleString()}
                            </div>
                        </div>
                    </Card>

                    {/* Tax Summary */}
                    <Card padding="lg" style={{ gridColumn: 'span 1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                <FileText size={20} color={tokens.colors.warning[600]} />
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    margin: 0,
                                }}>
                                    Tax Summary
                                </h3>
                            </div>
                            <Badge variant="info">{summary.tax.regime} Regime</Badge>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Taxable Income:</strong> ₹{summary.tax.taxableIncome.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>Tax Liability:</strong> ₹{summary.tax.totalLiability.toLocaleString()}</div>
                            <div style={{ marginBottom: tokens.spacing.xs }}><strong>TDS Paid:</strong> ₹{summary.tax.tds.toLocaleString()}</div>
                            <div style={{
                                marginTop: tokens.spacing.sm,
                                paddingTop: tokens.spacing.sm,
                                borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.success[50],
                                borderRadius: tokens.borderRadius.md,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.success[700],
                            }}>
                                <strong>Refund Due:</strong> ₹{summary.tax.refund.toLocaleString()}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Verification */}
                <Card padding="lg" style={{ marginBottom: tokens.spacing.lg }}>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.md,
                    }}>
                        Verification
                    </h2>
                    <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: tokens.spacing.sm,
                        cursor: 'pointer',
                        padding: tokens.spacing.md,
                        backgroundColor: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.md,
                        border: `2px solid ${verified ? tokens.colors.accent[600] : tokens.colors.neutral[200]}`,
                    }}>
                        <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) => setVerified(e.target.checked)}
                            style={{ marginTop: '2px', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                I verify that all information provided is true and correct
                            </p>
                            <p style={{
                                fontSize: tokens.typography.fontSize.xs,
                                color: tokens.colors.neutral[600],
                            }}>
                                I understand that providing false information may result in penalties under the Income Tax Act.
                            </p>
                        </div>
                    </label>
                </Card>

                {/* Submit Actions */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.lg,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                }}>
                    <div>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Ready to submit?
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}>
                            You can download a copy before submitting
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                        <Button variant="outline" size="md">
                            <Download size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Download ITR
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            disabled={!allComplete || !verified}
                            onClick={handleSubmit}
                        >
                            <Send size={18} style={{ marginRight: tokens.spacing.xs }} />
                            Submit ITR
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewSubmit;
