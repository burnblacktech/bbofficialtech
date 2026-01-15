/**
 * Unified Filing Dashboard
 * Central hub for managing a single ITR filing
 * Shows progress, quick stats, and all filing sections
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    IndianRupee,
    FileText,
    Home,
    Briefcase,
    TrendingUp,
    Gift,
    CreditCard,
    Building2,
    Save,
    Eye,
    Send,
    Edit,
    CheckCircle,
    Clock,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import ProgressStepper from '../../components/molecules/ProgressStepper';
import StatCard from '../../components/molecules/StatCard';
import { tokens } from '../../styles/tokens';

const UnifiedFilingDashboard = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [lastSaved, setLastSaved] = useState('2 minutes ago');

    // Mock data - replace with real API
    const filing = {
        id: filingId || '1',
        year: '2023-24',
        status: 'draft',
        progress: 45,
        lastUpdated: '2024-01-14 02:15 PM',
    };

    const steps = ['Personal Info', 'Income', 'Deductions', 'Review', 'Submit'];
    const currentStep = 1; // 0-indexed

    const stats = [
        { icon: IndianRupee, label: 'Total Income', value: '₹8,50,000', color: tokens.colors.info[600] },
        { icon: Gift, label: 'Total Deductions', value: '₹1,50,000', color: tokens.colors.success[600] },
        { icon: TrendingUp, label: 'Tax Liability', value: '₹45,000', color: tokens.colors.warning[600] },
        { icon: CheckCircle, label: 'Expected Refund', value: '₹12,450', color: tokens.colors.success[600] },
    ];

    const sections = [
        {
            icon: User,
            title: 'Personal Information',
            description: 'Name, PAN, DOB, Address',
            status: 'complete',
            route: `/filing/${filing.id}/personal`,
        },
        {
            icon: IndianRupee,
            title: 'Income Sources',
            description: 'Salary, Business, Capital Gains',
            status: 'in-progress',
            route: `/filing/${filing.id}/income`,
        },
        {
            icon: Gift,
            title: 'Deductions',
            description: '80C, 80D, 80G and others',
            status: 'pending',
            route: `/filing/${filing.id}/deductions`,
        },
        {
            icon: CreditCard,
            title: 'Tax Paid',
            description: 'TDS, Advance Tax, Self-Assessment',
            status: 'pending',
            route: `/filing/${filing.id}/tax-paid`,
        },
        {
            icon: Building2,
            title: 'Bank Details',
            description: 'For refund credit',
            status: 'pending',
            route: `/filing/${filing.id}/bank`,
        },
    ];

    const getStatusColor = (status) => {
        const colors = {
            complete: 'success',
            'in-progress': 'warning',
            pending: 'neutral',
        };
        return colors[status] || 'neutral';
    };

    const getStatusIcon = (status) => {
        if (status === 'complete') return <CheckCircle size={16} />;
        if (status === 'in-progress') return <Clock size={16} />;
        return null;
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: tokens.spacing.lg,
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                            <h1 style={{
                                fontSize: tokens.typography.fontSize['2xl'],
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[900],
                                margin: 0,
                            }}>
                                ITR Filing AY {filing.year}
                            </h1>
                            <Badge variant={getStatusColor(filing.status)}>
                                {filing.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}>
                            Last saved {lastSaved}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                        <Button variant="outline" size="sm">
                            <Save size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Save Draft
                        </Button>
                        <Button variant="outline" size="sm">
                            <Eye size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Preview
                        </Button>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div style={{ marginBottom: tokens.spacing.lg }}>
                    <ProgressStepper steps={steps} currentStep={currentStep} />
                </div>

                {/* Quick Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: tokens.spacing.md,
                    marginBottom: tokens.spacing.lg,
                }}>
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                {/* Section Cards */}
                <div>
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.md,
                    }}>
                        Filing Sections
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: tokens.spacing.md,
                    }}>
                        {sections.map((section, index) => (
                            <Card
                                key={index}
                                padding="lg"
                                hoverable
                                onClick={() => navigate(section.route)}
                                style={{
                                    cursor: 'pointer',
                                    border: `1px solid ${section.status === 'in-progress' ? tokens.colors.accent[300] : tokens.colors.neutral[200]}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing.md }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: section.status === 'complete'
                                            ? `${tokens.colors.success[600]}15`
                                            : section.status === 'in-progress'
                                                ? `${tokens.colors.accent[600]}15`
                                                : `${tokens.colors.neutral[600]}15`,
                                        borderRadius: tokens.borderRadius.lg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <section.icon
                                            size={24}
                                            color={section.status === 'complete'
                                                ? tokens.colors.success[600]
                                                : section.status === 'in-progress'
                                                    ? tokens.colors.accent[600]
                                                    : tokens.colors.neutral[600]}
                                        />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: tokens.spacing.xs,
                                        }}>
                                            <h3 style={{
                                                fontSize: tokens.typography.fontSize.base,
                                                fontWeight: tokens.typography.fontWeight.semibold,
                                                color: tokens.colors.neutral[900],
                                                margin: 0,
                                            }}>
                                                {section.title}
                                            </h3>
                                            <Badge variant={getStatusColor(section.status)} size="sm">
                                                {getStatusIcon(section.status)}
                                            </Badge>
                                        </div>
                                        <p style={{
                                            fontSize: tokens.typography.fontSize.sm,
                                            color: tokens.colors.neutral[600],
                                            marginBottom: tokens.spacing.sm,
                                        }}>
                                            {section.description}
                                        </p>
                                        <div style={{
                                            fontSize: tokens.typography.fontSize.xs,
                                            color: tokens.colors.accent[600],
                                            fontWeight: tokens.typography.fontWeight.medium,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: tokens.spacing.xs,
                                        }}>
                                            <Edit size={14} />
                                            {section.status === 'complete' ? 'Edit' : section.status === 'in-progress' ? 'Continue' : 'Start'}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    marginTop: tokens.spacing.xl,
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    borderRadius: tokens.borderRadius.lg,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Ready to proceed?
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                        }}>
                            Complete all sections to submit your ITR
                        </p>
                    </div>
                    <Button variant="primary" size="lg" disabled={filing.progress < 100}>
                        <Send size={18} style={{ marginRight: tokens.spacing.xs }} />
                        Submit ITR
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UnifiedFilingDashboard;
