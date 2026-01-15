/**
 * Income Sources Page
 * Manage all income sources: Salary, Business, Capital Gains, Other
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Upload,
    Plus,
    Edit,
    Trash2,
    Building2,
    TrendingUp,
    Briefcase,
    DollarSign,
    ArrowLeft,
    Save,
    IndianRupee,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import Tabs from '../../components/molecules/Tabs';
import { tokens } from '../../styles/tokens';

const IncomeSources = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('salary');
    const [showAddForm, setShowAddForm] = useState(false);

    // Mock data
    const salaryIncome = [
        {
            id: 1,
            employerName: 'Tech Corp India Pvt Ltd',
            grossSalary: 850000,
            exemptions: 50000,
            standardDeduction: 50000,
            netSalary: 750000,
        },
    ];

    const tabs = [
        { id: 'salary', label: 'Salary', icon: Building2 },
        { id: 'business', label: 'Business', icon: Briefcase },
        { id: 'capital-gains', label: 'Capital Gains', icon: TrendingUp },
        { id: 'other', label: 'Other Sources', icon: DollarSign },
    ];

    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

    const renderSalaryTab = () => (
        <div>
            {/* Upload Form 16 */}
            <Card padding="md" style={{ marginBottom: tokens.spacing.md, backgroundColor: tokens.colors.accent[50], border: `1px solid ${tokens.colors.accent[200]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Quick Upload Form 16
                        </h3>
                        <p style={{
                            fontSize: tokens.typography.fontSize.xs,
                            color: tokens.colors.neutral[600],
                        }}>
                            Auto-fill salary details from your Form 16
                        </p>
                    </div>
                    <Button variant="primary" size="sm">
                        <Upload size={16} style={{ marginRight: tokens.spacing.xs }} />
                        Upload Form 16
                    </Button>
                </div>
            </Card>

            {/* Salary Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {salaryIncome.map((salary) => (
                    <Card key={salary.id} padding="lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.md }}>
                            <div>
                                <h3 style={{
                                    fontSize: tokens.typography.fontSize.base,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: tokens.colors.neutral[900],
                                    marginBottom: tokens.spacing.xs,
                                }}>
                                    {salary.employerName}
                                </h3>
                                <Badge variant="success" size="sm">Active</Badge>
                            </div>
                            <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                                <Button variant="outline" size="sm">
                                    <Edit size={14} />
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: tokens.spacing.md,
                        }}>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Gross Salary
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                    {formatCurrency(salary.grossSalary)}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Exemptions
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                    {formatCurrency(salary.exemptions)}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Standard Deduction
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[600] }}>
                                    {formatCurrency(salary.standardDeduction)}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Net Salary
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[600] }}>
                                    {formatCurrency(salary.netSalary)}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* Add New Button */}
                <Button variant="outline" size="md" onClick={() => setShowAddForm(true)}>
                    <Plus size={16} style={{ marginRight: tokens.spacing.xs }} />
                    Add Another Employer
                </Button>
            </div>
        </div>
    );

    const renderBusinessTab = () => (
        <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: `${tokens.colors.accent[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
            }}>
                <Briefcase size={32} color={tokens.colors.accent[600]} />
            </div>
            <h3 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing.sm,
            }}>
                No Business Income Added
            </h3>
            <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
                marginBottom: tokens.spacing.lg,
            }}>
                Add income from business or profession
            </p>
            <Button variant="primary" size="md">
                <Plus size={16} style={{ marginRight: tokens.spacing.xs }} />
                Add Business Income
            </Button>
        </Card>
    );

    const renderCapitalGainsTab = () => (
        <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: `${tokens.colors.success[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
            }}>
                <TrendingUp size={32} color={tokens.colors.success[600]} />
            </div>
            <h3 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing.sm,
            }}>
                No Capital Gains Added
            </h3>
            <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
                marginBottom: tokens.spacing.lg,
            }}>
                Add income from sale of stocks, property, or other assets
            </p>
            <Button variant="primary" size="md">
                <Plus size={16} style={{ marginRight: tokens.spacing.xs }} />
                Add Capital Gains
            </Button>
        </Card>
    );

    const renderOtherTab = () => (
        <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: `${tokens.colors.info[600]}15`,
                borderRadius: tokens.borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: tokens.spacing.md,
            }}>
                <DollarSign size={32} color={tokens.colors.info[600]} />
            </div>
            <h3 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing.sm,
            }}>
                No Other Income Added
            </h3>
            <p style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
                marginBottom: tokens.spacing.lg,
            }}>
                Add interest income, rental income, or other sources
            </p>
            <Button variant="primary" size="md">
                <Plus size={16} style={{ marginRight: tokens.spacing.xs }} />
                Add Other Income
            </Button>
        </Card>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'salary':
                return renderSalaryTab();
            case 'business':
                return renderBusinessTab();
            case 'capital-gains':
                return renderCapitalGainsTab();
            case 'other':
                return renderOtherTab();
            default:
                return null;
        }
    };

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{
                                fontSize: tokens.typography.fontSize['2xl'],
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.xs,
                            }}>
                                Income Sources
                            </h1>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.neutral[600],
                            }}>
                                Add all your income sources for accurate tax calculation
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            <Save size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Save & Continue
                        </Button>
                    </div>
                </div>

                {/* Total Income Summary */}
                <Card padding="md" style={{ marginBottom: tokens.spacing.lg, backgroundColor: tokens.colors.accent[50], border: `1px solid ${tokens.colors.accent[200]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: tokens.colors.accent[600],
                                borderRadius: tokens.borderRadius.lg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <IndianRupee size={20} color={tokens.colors.neutral.white} />
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Total Income
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[700] }}>
                                    ₹7,50,000
                                </p>
                            </div>
                        </div>
                        <Badge variant="info">1 source added</Badge>
                    </div>
                </Card>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {/* Tab Content */}
                {renderTabContent()}
            </div>
        </div>
    );
};

export default IncomeSources;
