// =====================================================
// FILING OVERVIEW - Screen 1 (Trust-Hardened)
// "Your Financial Year at a Glance"
// With micro-reassurance and safety guarantees
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, CheckCircle, XCircle, Clock, ArrowRight, Download, Loader2, ShieldCheck, CheckCircle2, Plus, Home, TrendingUp, Building2, DollarSign, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { PageContent } from '../../components/Layout';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const FilingOverview = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taxData, setTaxData] = useState(null);
    const [readinessData, setReadinessData] = useState(null);
    const [loadingTax, setLoadingTax] = useState(false);
    const [loadingReadiness, setLoadingReadiness] = useState(false);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/overview`, { headers });
                console.log('[FILING OVERVIEW] Data received:', response.data.data);
                console.log('[FILING OVERVIEW] Selected sources:', response.data.data.identity.selectedIncomeSources);
                setData(response.data.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load overview');
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
        fetchTaxBreakdown();
        fetchReadiness();
    }, [filingId]);

    const fetchTaxBreakdown = async () => {
        try {
            setLoadingTax(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/tax-breakdown`, { headers });
            setTaxData(response.data.data);
        } catch (err) {
            console.error('[TAX BREAKDOWN] Error:', err);
            setTaxData(null);
        } finally {
            setLoadingTax(false);
        }
    };

    const fetchReadiness = async () => {
        try {
            setLoadingReadiness(true);
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/readiness`, { headers });
            setReadinessData(response.data.data);
        } catch (err) {
            console.error('[READINESS] Error:', err);
            setReadinessData(null);
        } finally {
            setLoadingReadiness(false);
        }
    };

    if (loading) {

        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--s29-primary)]" />
                <p className="text-[var(--s29-text-muted)] font-medium">Preparing your financial summary...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center p-6">
                <Card>
                    <XCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Error</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">{error}</p>
                    <button onClick={() => navigate('/itr/start')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">
                        Return to ID Verification
                    </button>
                </Card>
            </div>
        );
    }

    const { identity, incomeSummary, eligibilityBadge, missingBlocks } = data;

    // Check if income source was selected (not if amount > 0, since user hasn't entered data yet)
    const hasIncome = (type) => {
        // Check from filing's selected income sources
        const selectedSources = identity.selectedIncomeSources || [];
        const payload = data.jsonPayload || {};
        const income = payload.income || {};

        if (type === 'salary') return selectedSources.includes('salary') || !!income.salary;
        if (type === 'capitalGains') return selectedSources.some(s => s.startsWith('capitalGains_')) || !!income.capitalGains;
        if (type === 'business') return selectedSources.some(s => s.includes('business_') || s.includes('professional_')) || !!income.business || !!income.presumptive;
        if (type === 'rental') return selectedSources.some(s => s.startsWith('rental_') || s === 'selfOccupied') || !!income.houseProperty;
        if (type === 'interest') return selectedSources.includes('interest_savings') || (payload.interestIncome && payload.interestIncome.totalInterest > 0);
        if (type === 'dividend') return selectedSources.includes('dividend') || (payload.dividendIncome && payload.dividendIncome.totalDividend > 0);
        if (type === 'familyPension') return selectedSources.includes('familyPension') || !!income.familyPension;
        if (type === 'other') return selectedSources.includes('other_income') || !!income.otherSources;
        return false;
    };

    // JSON Export Handler (Manual Escape Hatch - BBDocs/15 Requirement)
    const handleExportJSON = () => {
        if (!data) {
            toast.error('No filing data available to export');
            return;
        }

        try {
            const exportData = {
                filingId: data.id,
                assessmentYear: data.assessmentYear,
                taxpayerPan: data.taxpayerPan,
                itrType: data.jsonPayload?.itrType || 'Not determined',
                status: data.status,
                identity: data.identity,
                jsonPayload: data.jsonPayload,
                exportedAt: new Date().toISOString(),
                exportPurpose: 'Manual filing, CA handoff, or audit',
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `filing-${filingId}-${data.assessmentYear}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Filing data exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export filing data');
        }
    };

    return (
        <OrientationPage
            title="Your Year at a Glance"
            subtitle={`AY ${identity.assessmentYear} • ${identity.taxpayerPan}`}
        >
            {/* Reassurance: Safety First */}
            <ReassuranceBanner
                type="safety"
                message="We prioritize accuracy and truth. Nothing is submitted without your final permission."
            />

            {/* Income Sources - Actionable Cards */}
            <PageContent spacing="section">
                <div className="flex items-center justify-between">
                    <h2 className={typography.sectionTitle}>Income Details</h2>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            navigate(`/filing/${filingId}/edit-sources`, {
                                state: {
                                    pan: data?.identity?.pan || data?.taxpayerPan,
                                    ay: data?.assessmentYear,
                                    prefillData: data?.jsonPayload?.prefill,
                                    currentSources: data?.jsonPayload?.selectedIncomeSources,
                                },
                            });
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Manage Sources
                    </Button>
                </div>

                <div className={layout.blockGap}>
                    {(!hasIncome('salary') && !hasIncome('rental') && !hasIncome('capitalGains') && !hasIncome('business') && !hasIncome('interest') && !hasIncome('dividend') && !hasIncome('other')) && (
                        <Card padding="lg" className="text-center bg-amber-50 border-amber-200">
                            <p className="text-amber-800 font-medium mb-4">No income sources selected yet.</p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/itr/start')}
                            >
                                Select Income Sources
                            </Button>
                        </Card>
                    )}

                    {/* Salary Income */}
                    {hasIncome('salary') && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={typography.cardTitle}>Salary Income</h3>
                                        <p className={typography.bodySmallMuted}>From your employer (Form 16)</p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate(`/filing/${filingId}/income-story`)}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* House Property / Rental Income */}
                    {hasIncome('rental') && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <Home className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={typography.cardTitle}>House Property</h3>
                                        <p className={typography.bodySmallMuted}>Rental income, self-occupied</p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate(`/filing/${filingId}/house-properties`)}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Capital Gains */}
                    {hasIncome('capitalGains') && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={typography.cardTitle}>Capital Gains</h3>
                                        <p className={typography.bodySmallMuted}>Stocks, mutual funds, property</p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate(`/filing/${filingId}/capital-gains-story`)}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Business Income */}
                    {hasIncome('business') && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={typography.cardTitle}>Business Income</h3>
                                        <p className={typography.bodySmallMuted}>Business, Professional & Freelance</p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate(`/filing/${filingId}/business-profession`)}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}

                    <div className="pt-8 border-t border-slate-100">
                        <h2 className={typography.sectionTitle}>Tax Savings</h2>
                        <p className={typography.bodySmallMuted}>Claim investments and insurance to reduce your tax liability.</p>
                    </div>

                    {/* Deductions Card */}
                    <Card
                        padding="lg"
                        className="hover:border-gold-500 cursor-pointer transition-colors"
                        onClick={() => navigate(`/filing/${filingId}/deductions`)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={typography.cardTitle}>Tax Deductions</h3>
                                        {data.jsonPayload?.deductions?.section80C?.complete && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={typography.bodySmallMuted}>80C, 80D, 80G and other savings</p>
                                </div>
                            </div>
                            <Button variant="primary">
                                Maximize Savings
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Filing Status Card */}
                <Card padding="lg">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className={typography.sectionTitle}>Your {data.assessmentYear} Tax Return</h2>
                            <p className={typography.bodySmallMuted}>
                                {data.identity?.name || 'Taxpayer'} • PAN: {data.taxpayerPan}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleExportJSON}
                            title="Download filing data for manual filing, CA handoff, or audit"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Income Details</span>
                            <span className="text-[10px] text-orange-600 font-bold uppercase px-3 py-1 bg-orange-50 rounded-full tracking-wider">In Progress</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Tax Computation</span>
                            {loadingTax ? (
                                <span className="text-xs text-slate-500 font-medium italic">Calculating...</span>
                            ) : taxData ? (
                                <span className="text-xs text-emerald-600 font-bold px-3 py-1 bg-emerald-50 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    ₹{taxData.selectedRegime === 'old' ? taxData.oldRegime?.finalTaxLiability?.toLocaleString('en-IN') : taxData.newRegime?.finalTaxLiability?.toLocaleString('en-IN')}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 font-medium italic">Awaiting Data</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Readiness Check</span>
                            {loadingReadiness ? (
                                <span className="text-xs text-slate-500 font-medium italic">Checking...</span>
                            ) : readinessData?.legalStatus?.safeToSubmit ? (
                                <span className="text-xs text-emerald-600 font-bold uppercase px-3 py-1 bg-emerald-50 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Ready
                                </span>
                            ) : (
                                <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Not Ready</span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Return Type Recommendation Banner */}
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-6 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                        <FileText className="w-6 h-6 text-gold-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-1">Return Type Decision</h3>
                        <p className="text-sm text-slate-600">
                            Based on your financial activity, we've selected <span className="font-bold text-gold-600">{identity.itrType}</span> as the safest and most efficient form for you.
                        </p>
                    </div>
                </div>

                {/* Download Draft Progress */}
                <div className="pt-4">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            if (readinessData?.actions?.canDownloadJSON !== false) {
                                window.open(`${API_BASE_URL}/filings/${filingId}/export/json`, '_blank');
                            } else {
                                toast.error('Please complete all required sections before downloading');
                            }
                        }}
                        disabled={readinessData?.actions?.canDownloadJSON === false}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {readinessData?.legalStatus?.safeToSubmit ? 'Download Complete Filing (JSON)' : 'Download Draft Progress (JSON)'}
                    </Button>
                    {
                        readinessData?.actions?.canDownloadJSON === false && (
                            <p className="text-[10px] text-slate-400 text-center mt-2 uppercase tracking-widest font-bold">
                                Complete income details and deductions to enable download
                            </p>
                        )
                    }
                </div>
            </PageContent>
        </OrientationPage>
    );
};

export default FilingOverview;
