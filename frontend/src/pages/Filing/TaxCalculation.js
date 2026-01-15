/**
 * Tax Calculation Page
 * Shows detailed tax calculation breakdown and regime comparison with real data
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    ArrowRight,
    TrendingDown,
    TrendingUp,
    CheckCircle,
    Loader2,
    Briefcase, // Fallback icon
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import { tokens } from '../../styles/tokens';

const API_BASE_URL = getApiBaseUrl();

const TaxCalculation = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedRegime, setSelectedRegime] = useState('new'); // Default to new, will update from API
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCalculationData();
    }, [filingId]);

    const fetchCalculationData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            // Using the same endpoint as RegimeComparison/TaxBreakdown to get full comparison data
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/tax-breakdown`, { headers });

            if (response.data && response.data.data) {
                setData(response.data.data);
                setSelectedRegime(response.data.data.selectedRegime || 'new');
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (err) {
            console.error('Error fetching tax calculation:', err);
            setError(err.response?.data?.error || 'Failed to load tax calculation');
            toast.error('Failed to load latest tax calculation');
        } finally {
            setLoading(false);
        }
    };

    const handleRegimeChange = async (regime) => {
        setSelectedRegime(regime);
        // Optional: Persist the choice to backend if the user explicitly switches here
        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                selectedRegime: regime,
            }, { headers });
            toast.success(`Switched to ${regime === 'new' ? 'New' : 'Old'} Regime`);
            // Refresh data to ensure all breakdowns match the new selection if backend does stateful calc
            fetchCalculationData();
        } catch (err) {
            console.error('Failed to save regime preference:', err);
            toast.error('Could not save regime selection');
        }
    };

    const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.colors.neutral[50],
            }}>
                <Loader2 className="animate-spin text-primary-600 w-12 h-12" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.colors.neutral[50],
                padding: tokens.spacing.lg,
            }}>
                <div className="text-red-500 mb-4 font-bold">Unable to load Tax Calculation</div>
                <Button onClick={() => navigate(`/filing/${filingId}/unified`)}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    // Extract data from the API response structure
    // Expected structure: { oldRegime: {...}, newRegime: {...}, recommendedRegime: 'old'|'new', savings: number }
    const { oldRegime, newRegime, recommendedRegime } = data;
    const activeCalculation = selectedRegime === 'old' ? oldRegime : newRegime;

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
                                Tax Calculation
                            </h1>
                            <p style={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.colors.neutral[600],
                            }}>
                                Review your tax calculation and choose the best regime
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download size={16} style={{ marginRight: tokens.spacing.xs }} />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Regime Comparison Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: tokens.spacing.md,
                    marginBottom: tokens.spacing.lg,
                }}>
                    {/* Old Regime */}
                    <Card
                        padding="lg"
                        onClick={() => handleRegimeChange('old')}
                        hoverable
                        style={{
                            cursor: 'pointer',
                            border: `2px solid ${selectedRegime === 'old' ? tokens.colors.accent[600] : tokens.colors.neutral[200]}`,
                            position: 'relative',
                        }}
                    >
                        {recommendedRegime === 'old' && (
                            <Badge
                                variant="success"
                                style={{
                                    position: 'absolute',
                                    top: tokens.spacing.sm,
                                    right: tokens.spacing.sm,
                                }}
                            >
                                Recommended
                            </Badge>
                        )}
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.md,
                        }}>
                            Old Tax Regime
                        </h3>
                        <div style={{ marginBottom: tokens.spacing.md }}>
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                Tax Liability
                            </p>
                            <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                {formatCurrency(oldRegime.finalTaxLiability || oldRegime.totalTaxLiability)}
                            </p>
                        </div>
                        <div style={{
                            padding: tokens.spacing.sm,
                            backgroundColor: (oldRegime.refundAmount || 0) > 0 ? tokens.colors.success[50] : tokens.colors.error[50],
                            borderRadius: tokens.borderRadius.md,
                            marginBottom: tokens.spacing.md,
                        }}>
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                {(oldRegime.refundAmount || 0) > 0 ? 'Refund' : 'Tax Payable'}
                            </p>
                            <p style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: (oldRegime.refundAmount || 0) > 0 ? tokens.colors.success[700] : tokens.colors.error[700],
                            }}>
                                {formatCurrency(Math.abs((oldRegime.refundAmount || 0) > 0 ? oldRegime.refundAmount : (oldRegime.taxPayable || oldRegime.finalTaxLiability)))}
                            </p>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                            • Allows all deductions<br />
                            • Deductions Available: {formatCurrency(oldRegime.totalDeductions)}
                        </div>
                    </Card>

                    {/* New Regime */}
                    <Card
                        padding="lg"
                        onClick={() => handleRegimeChange('new')}
                        hoverable
                        style={{
                            cursor: 'pointer',
                            border: `2px solid ${selectedRegime === 'new' ? tokens.colors.accent[600] : tokens.colors.neutral[200]}`,
                            position: 'relative',
                        }}
                    >
                        {recommendedRegime === 'new' && (
                            <Badge
                                variant="success"
                                style={{
                                    position: 'absolute',
                                    top: tokens.spacing.sm,
                                    right: tokens.spacing.sm,
                                }}
                            >
                                Recommended
                            </Badge>
                        )}
                        <h3 style={{
                            fontSize: tokens.typography.fontSize.lg,
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.md,
                        }}>
                            New Tax Regime
                        </h3>
                        <div style={{ marginBottom: tokens.spacing.md }}>
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                Tax Liability
                            </p>
                            <p style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                {formatCurrency(newRegime.finalTaxLiability || newRegime.totalTaxLiability)}
                            </p>
                        </div>
                        <div style={{
                            padding: tokens.spacing.sm,
                            backgroundColor: (newRegime.refundAmount || 0) > 0 ? tokens.colors.success[50] : tokens.colors.error[50],
                            borderRadius: tokens.borderRadius.md,
                            marginBottom: tokens.spacing.md,
                        }}>
                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xs }}>
                                {(newRegime.refundAmount || 0) > 0 ? 'Refund' : 'Tax Payable'}
                            </p>
                            <p style={{
                                fontSize: tokens.typography.fontSize.xl,
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: (newRegime.refundAmount || 0) > 0 ? tokens.colors.success[700] : tokens.colors.error[700],
                            }}>
                                {formatCurrency(Math.abs((newRegime.refundAmount || 0) > 0 ? newRegime.refundAmount : (newRegime.taxPayable || newRegime.finalTaxLiability)))}
                            </p>
                        </div>
                        <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>
                            • Default Regime<br />
                            • No deductions allowed<br />
                            • Lower tax rates
                        </div>
                    </Card>
                </div>

                {/* Detailed Breakdown */}
                <Card padding="lg">
                    <h2 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Detailed Tax Calculation ({selectedRegime === 'old' ? 'Old' : 'New'} Regime)
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                        {/* Gross Income */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.sm,
                            backgroundColor: tokens.colors.neutral[50],
                            borderRadius: tokens.borderRadius.md,
                        }}>
                            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                Gross Total Income
                            </span>
                            <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                {formatCurrency(activeCalculation.grossTotalIncome)}
                            </span>
                        </div>

                        {/* Deductions */}
                        {activeCalculation.totalDeductions > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.success[50],
                                borderRadius: tokens.borderRadius.md,
                            }}>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                    Less: Deductions
                                </span>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[700] }}>
                                    - {formatCurrency(activeCalculation.totalDeductions)}
                                </span>
                            </div>
                        )}

                        {/* Taxable Income */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.colors.accent[50],
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.accent[200]}`,
                        }}>
                            <span style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                Taxable Income
                            </span>
                            <span style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.accent[700] }}>
                                {formatCurrency(activeCalculation.totalIncome)}
                            </span>
                        </div>

                        {/* Tax Slabs - Dynamic if available, else summary */}
                        <div style={{ marginTop: tokens.spacing.md }}>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.sm,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                color: tokens.colors.neutral[900],
                                marginBottom: tokens.spacing.sm,
                            }}>
                                Tax Calculation
                            </h3>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: tokens.spacing.sm,
                                    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
                                }}
                            >
                                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                    Income Tax on {formatCurrency(activeCalculation.totalIncome)}
                                </span>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                    {formatCurrency(activeCalculation.taxCalculation?.slabTax || activeCalculation.taxLiability)}
                                </span>
                            </div>
                        </div>

                        {/* Cess */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.sm,
                        }}>
                            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                Add: Health & Education Cess (4%)
                            </span>
                            <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                {formatCurrency(activeCalculation.taxCalculation?.cess || activeCalculation.cess)}
                            </span>
                        </div>

                        {/* Rebate 87A */}
                        {(activeCalculation.taxCalculation?.rebate || 0) > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: tokens.spacing.sm,
                                color: tokens.colors.success[700]
                            }}>
                                <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                    Less: Rebate u/s 87A
                                </span>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold }}>
                                    - {formatCurrency(activeCalculation.taxCalculation?.rebate)}
                                </span>
                            </div>
                        )}

                        {/* Total Liability */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.colors.warning[50],
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.warning[200]}`,
                        }}>
                            <span style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900] }}>
                                Total Tax Liability
                            </span>
                            <span style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.warning[700] }}>
                                {formatCurrency(activeCalculation.finalTaxLiability || activeCalculation.totalTaxLiability)}
                            </span>
                        </div>

                        {/* TDS */}
                        {(activeCalculation.tdsDeducted || 0) > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: tokens.spacing.sm,
                                backgroundColor: tokens.colors.success[50],
                                borderRadius: tokens.borderRadius.md,
                            }}>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                                    Less: TDS Paid
                                </span>
                                <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.success[700] }}>
                                    - {formatCurrency(activeCalculation.tdsDeducted)}
                                </span>
                            </div>
                        )}

                        {/* Final Result */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.lg,
                            backgroundColor: (activeCalculation.refundAmount || 0) > 0 ? tokens.colors.success[50] : tokens.colors.error[50],
                            borderRadius: tokens.borderRadius.lg,
                            border: `2px solid ${(activeCalculation.refundAmount || 0) > 0 ? tokens.colors.success[300] : tokens.colors.error[300]}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                {(activeCalculation.refundAmount || 0) > 0 ? (
                                    <TrendingDown size={24} color={tokens.colors.success[600]} />
                                ) : (
                                    <TrendingUp size={24} color={tokens.colors.error[600]} />
                                )}
                                <span style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.neutral[900] }}>
                                    {(activeCalculation.refundAmount || 0) > 0 ? 'Refund Due' : 'Tax Payable'}
                                </span>
                            </div>
                            <span style={{
                                fontSize: tokens.typography.fontSize['2xl'],
                                fontWeight: tokens.typography.fontWeight.bold,
                                color: (activeCalculation.refundAmount || 0) > 0 ? tokens.colors.success[700] : tokens.colors.error[700],
                            }}>
                                {formatCurrency(Math.abs((activeCalculation.refundAmount || 0) > 0 ? activeCalculation.refundAmount : (activeCalculation.taxPayable || activeCalculation.finalTaxLiability)))}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div style={{
                    marginTop: tokens.spacing.lg,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: tokens.spacing.sm,
                }}>
                    <Button variant="outline" size="md" onClick={() => navigate(`/filing/${filingId}/unified`)}>
                        Edit Income Details
                    </Button>
                    <Button variant="primary" size="md" onClick={() => navigate(`/filing/${filingId}/review`)}>
                        Proceed to Review
                        <ArrowRight size={16} style={{ marginLeft: tokens.spacing.xs }} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TaxCalculation;
