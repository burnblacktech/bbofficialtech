/**
 * Deductions Page
 * Claim tax deductions under various sections (80C, 80D, 80G, etc.)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Plus,
    Heart,
    GraduationCap,
    Home,
    Shield,
    PiggyBank,
    Gift,
    TrendingUp,
    IndianRupee,
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import Input from '../../components/atoms/Input';
import FormField from '../../components/molecules/FormField';
import Accordion from '../../components/molecules/Accordion';
import LimitIndicator from '../../components/molecules/LimitIndicator';
import { tokens } from '../../styles/tokens';

const Deductions = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();

    // Mock data
    const [deductions80C, setDeductions80C] = useState({
        ppf: 50000,
        epf: 30000,
        lifeInsurance: 25000,
        elss: 20000,
        homeLoanPrincipal: 0,
        tuitionFees: 0,
        nsc: 0,
        taxSaverFD: 0,
    });

    const [deductions80D, setDeductions80D] = useState({
        selfFamily: 15000,
        parents: 25000,
        healthCheckup: 5000,
    });

    const total80C = Object.values(deductions80C).reduce((sum, val) => sum + val, 0);
    const total80D = Object.values(deductions80D).reduce((sum, val) => sum + val, 0);

    const section80CItems = [
        { id: 'ppf', label: 'Public Provident Fund (PPF)', icon: PiggyBank, value: deductions80C.ppf },
        { id: 'epf', label: 'Employee Provident Fund (EPF)', icon: Shield, value: deductions80C.epf },
        { id: 'lifeInsurance', label: 'Life Insurance Premium', icon: Heart, value: deductions80C.lifeInsurance },
        { id: 'elss', label: 'ELSS Mutual Funds', icon: TrendingUp, value: deductions80C.elss },
        { id: 'homeLoanPrincipal', label: 'Home Loan Principal', icon: Home, value: deductions80C.homeLoanPrincipal },
        { id: 'tuitionFees', label: 'Tuition Fees', icon: GraduationCap, value: deductions80C.tuitionFees },
        { id: 'nsc', label: 'National Savings Certificate', icon: Shield, value: deductions80C.nsc },
        { id: 'taxSaverFD', label: 'Tax Saver Fixed Deposit', icon: PiggyBank, value: deductions80C.taxSaverFD },
    ];

    const accordionItems = [
        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: tokens.spacing.md }}>
                    <span>Section 80C - Investments & Expenses</span>
                    <Badge variant={total80C >= 150000 ? 'success' : 'warning'}>
                        ₹{total80C.toLocaleString()} / ₹1,50,000
                    </Badge>
                </div>
            ),
            content: (
                <div>
                    <LimitIndicator
                        current={total80C}
                        limit={150000}
                        label="Total 80C Deductions"
                    />

                    <div style={{ marginTop: tokens.spacing.lg, display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                        {section80CItems.map((item) => (
                            <div key={item.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.md,
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.neutral[50],
                                borderRadius: tokens.borderRadius.md,
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: `${tokens.colors.accent[600]}15`,
                                    borderRadius: tokens.borderRadius.lg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <item.icon size={18} color={tokens.colors.accent[600]} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <FormField label={item.label}>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.value || ''}
                                            onChange={(e) => setDeductions80C({
                                                ...deductions80C,
                                                [item.id]: parseInt(e.target.value) || 0,
                                            })}
                                            fullWidth
                                        />
                                    </FormField>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: tokens.spacing.md }}>
                    <span>Section 80D - Medical Insurance</span>
                    <Badge variant={total80D > 0 ? 'success' : 'neutral'}>
                        ₹{total80D.toLocaleString()}
                    </Badge>
                </div>
            ),
            content: (
                <div>
                    <div style={{ marginBottom: tokens.spacing.lg }}>
                        <p style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.neutral[600],
                            marginBottom: tokens.spacing.sm,
                        }}>
                            Claim deduction for health insurance premiums paid for self, family, and parents.
                        </p>
                        <LimitIndicator
                            current={total80D}
                            limit={75000}
                            label="Total 80D Deductions (Max for senior citizens)"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                        <FormField label="Self & Family Premium">
                            <Input
                                type="number"
                                placeholder="0"
                                value={deductions80D.selfFamily || ''}
                                onChange={(e) => setDeductions80D({
                                    ...deductions80D,
                                    selfFamily: parseInt(e.target.value) || 0,
                                })}
                                fullWidth
                            />
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500], marginTop: tokens.spacing.xs }}>
                                Max: ₹25,000 (₹50,000 if senior citizen)
                            </p>
                        </FormField>

                        <FormField label="Parents Premium">
                            <Input
                                type="number"
                                placeholder="0"
                                value={deductions80D.parents || ''}
                                onChange={(e) => setDeductions80D({
                                    ...deductions80D,
                                    parents: parseInt(e.target.value) || 0,
                                })}
                                fullWidth
                            />
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500], marginTop: tokens.spacing.xs }}>
                                Max: ₹25,000 (₹50,000 if senior citizen)
                            </p>
                        </FormField>

                        <FormField label="Preventive Health Checkup">
                            <Input
                                type="number"
                                placeholder="0"
                                value={deductions80D.healthCheckup || ''}
                                onChange={(e) => setDeductions80D({
                                    ...deductions80D,
                                    healthCheckup: parseInt(e.target.value) || 0,
                                })}
                                fullWidth
                            />
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500], marginTop: tokens.spacing.xs }}>
                                Max: ₹5,000 (included in above limits)
                            </p>
                        </FormField>
                    </div>
                </div>
            ),
        },
        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: tokens.spacing.md }}>
                    <span>Section 80G - Donations</span>
                    <Badge variant="neutral">₹0</Badge>
                </div>
            ),
            content: (
                <div style={{ textAlign: 'center', padding: tokens.spacing.lg }}>
                    <Gift size={32} color={tokens.colors.neutral[400]} style={{ margin: '0 auto', marginBottom: tokens.spacing.md }} />
                    <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.md }}>
                        No donations added yet
                    </p>
                    <Button variant="outline" size="sm">
                        <Plus size={14} style={{ marginRight: tokens.spacing.xs }} />
                        Add Donation
                    </Button>
                </div>
            ),
        },
        {
            title: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: tokens.spacing.md }}>
                    <span>Other Deductions</span>
                    <Badge variant="neutral">₹0</Badge>
                </div>
            ),
            content: (
                <div>
                    <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.md }}>
                        Additional deduction sections:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                        <Button variant="outline" size="sm" fullWidth style={{ justifyContent: 'flex-start' }}>
                            80E - Education Loan Interest
                        </Button>
                        <Button variant="outline" size="sm" fullWidth style={{ justifyContent: 'flex-start' }}>
                            80TTA/TTB - Interest on Savings
                        </Button>
                        <Button variant="outline" size="sm" fullWidth style={{ justifyContent: 'flex-start' }}>
                            80GG - House Rent (No HRA)
                        </Button>
                        <Button variant="outline" size="sm" fullWidth style={{ justifyContent: 'flex-start' }}>
                            NPS - Additional ₹50,000
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    const totalDeductions = total80C + total80D;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing.lg,
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                                Tax Deductions
                            </h1>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.neutral[600],
                            }}>
                                Claim all eligible deductions to reduce your tax liability
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            <Save size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Save & Continue
                        </Button>
                    </div>
                </div>

                {/* Total Deductions Summary */}
                <Card padding="md" style={{ marginBottom: tokens.spacing.lg, backgroundColor: tokens.colors.success[50], border: `1px solid ${tokens.colors.success[200]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: tokens.colors.success[600],
                                borderRadius: tokens.borderRadius.lg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Gift size={20} color={tokens.colors.neutral.white} />
                            </div>
                            <div>
                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                    Total Deductions Claimed
                                </p>
                                <p style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[700] }}>
                                    ₹{totalDeductions.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <Badge variant="success">Tax Savings: ₹{Math.round(totalDeductions * 0.3).toLocaleString()}</Badge>
                    </div>
                </Card>

                {/* Deduction Sections */}
                <Accordion items={accordionItems} defaultOpen={0} />
            </div>
        </div>
    );
};

export default Deductions;
