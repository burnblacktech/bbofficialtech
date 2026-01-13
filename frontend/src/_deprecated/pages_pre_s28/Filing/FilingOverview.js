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
import { UIButton, UICard, Heading2, Heading3, BodySmall } from '../../components/UI';

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
                <div className="max-w-md w-full bg-white p-8 rounded-[var(--s29-radius-large)] shadow-xl border border-[var(--s29-border-light)] text-center">
                    <XCircle className="w-12 h-12 text-[var(--s29-error)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">Error</h2>
                    <p className="text-[var(--s29-text-muted)] mb-6">{error}</p>
                    <button onClick={() => navigate('/itr/start')} className="w-full bg-[var(--s29-primary)] text-white py-3 rounded-[var(--s29-radius-main)] font-medium">
                        Return to ID Verification
                    </button>
                </div>
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
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header: Context Lock-in */}
                <header className="mb-10">
                    <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                        Step 1 of 5
                    </span>
                    <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mt-2">
                        Your Year at a Glance
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-white border border-[var(--s29-border-light)] rounded-full text-xs font-semibold text-[var(--s29-text-muted)] flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            AY {identity.assessmentYear}
                        </div>
                        <div className="px-4 py-2 bg-white border border-[var(--s29-border-light)] rounded-full text-xs font-semibold text-[var(--s29-text-muted)] flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            {identity.taxpayerPan}
                        </div>
                    </div>
                </header>

                {/* Reassurance: Safety First */}
                <div className="mb-8">
                    <ReassuranceBanner
                        type="safety"
                        message="We prioritize accuracy and truth. Nothing is submitted without your final permission."
                    />
                </div>

                {/* Income Sources - Actionable Cards */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <Heading2>Income Details</Heading2>
                        <UIButton
                            variant="ghost"
                            size="sm"
                            icon={Plus}
                            iconPosition="left"
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
                            Manage Sources
                        </UIButton>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(!hasIncome('salary') && !hasIncome('rental') && !hasIncome('capitalGains') && !hasIncome('business') && !hasIncome('interest') && !hasIncome('dividend') && !hasIncome('other')) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                                <p className="text-amber-800 font-medium mb-4">No income sources selected yet.</p>
                                <button
                                    onClick={() => navigate('/itr/start')}
                                    className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                                >
                                    Select Income Sources
                                </button>
                            </div>
                        )}
                        {/* Salary Income */}
                        {hasIncome('salary') && (
                            <UICard hover className="group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Heading3>Salary Income</Heading3>
                                            <BodySmall muted>From your employer (Form 16)</BodySmall>
                                        </div>
                                    </div>
                                    <UIButton
                                        variant="primary"
                                        icon={ArrowRight}
                                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                                    >
                                        Continue
                                    </UIButton>
                                </div>
                            </UICard>
                        )}

                        {/* House Property / Rental Income */}
                        {hasIncome('rental') && (
                            <UICard hover className="group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            <Home className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Heading3>House Property</Heading3>
                                            <BodySmall muted>Rental income, self-occupied</BodySmall>
                                        </div>
                                    </div>
                                    <UIButton
                                        variant="primary"
                                        icon={ArrowRight}
                                        onClick={() => navigate(`/filing/${filingId}/house-properties`)}
                                    >
                                        Continue
                                    </UIButton>
                                </div>
                            </UICard>
                        )}

                        {/* Capital Gains */}
                        {hasIncome('capitalGains') && (
                            <UICard hover className="group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Heading3>Capital Gains</Heading3>
                                            <BodySmall muted>Stocks, mutual funds, property</BodySmall>
                                        </div>
                                    </div>
                                    <UIButton
                                        variant="primary"
                                        icon={ArrowRight}
                                        onClick={() => navigate(`/filing/${filingId}/capital-gains-story`)}
                                    >
                                        Continue
                                    </UIButton>
                                </div>
                            </UICard>
                        )}

                        {/* Business Income */}
                        {hasIncome('business') && (
                            <UICard hover className="group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Heading3>Business Income</Heading3>
                                            <BodySmall muted>
                                                {identity.itrType === 'ITR-3' ? 'Professional/Business income' : 'Presumptive business income'}
                                            </BodySmall>
                                        </div>
                                    </div>
                                    <UIButton
                                        variant="primary"
                                        icon={ArrowRight}
                                        onClick={() => {
                                            if (identity.itrType === 'ITR-3') {
                                                navigate(`/filing/${filingId}/itr3-business-profile`);
                                            } else if (identity.itrType === 'ITR-4') {
                                                navigate(`/filing/${filingId}/presumptive-income`);
                                            } else {
                                                navigate(`/filing/${filingId}/business-income`);
                                            }
                                        }}
                                    >
                                        Continue
                                    </UIButton>
                                </div>
                            </UICard>
                        )}

                        {/* Interest, Dividend, Family Pension, Other */}
                        {[
                            { type: 'interest', title: 'Interest Income', desc: 'Savings bank, FDs', nav: `/filing/${filingId}/interest-income`, icon: DollarSign },
                            { type: 'dividend', title: 'Dividend Income', desc: 'Stocks, mutual funds', nav: `/filing/${filingId}/dividend-income`, icon: TrendingUp },
                            { type: 'familyPension', title: 'Family Pension', desc: 'Pension received as heir', nav: `/filing/${filingId}/income/family-pension`, icon: Users },
                            { type: 'other', title: 'Other Income', desc: 'Any other sources', nav: `/filing/${filingId}/other-income-sources`, icon: Plus },
                        ].map(({ type, title, desc, nav, icon: Icon }) => (
                            hasIncome(type) && (
                                <UICard key={type} hover className="group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <Heading3>{title}</Heading3>
                                                <BodySmall muted>{desc}</BodySmall>
                                            </div>
                                        </div>
                                        <UIButton
                                            variant="primary"
                                            icon={ArrowRight}
                                            onClick={() => navigate(nav)}
                                        >
                                            Continue
                                        </UIButton>
                                    </div>
                                </UICard>
                            )
                        ))}

                        <div className="pt-8 mb-4 border-t border-slate-100">
                            <Heading2>Tax Savings</Heading2>
                            <BodySmall muted>Claim investments and insurance to reduce your tax liability.</BodySmall>
                        </div>

                        {/* Deductions Card */}
                        <UICard hover clickable className="group mb-8" onClick={() => navigate(`/filing/${filingId}/deductions`)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Heading3>Tax Deductions</Heading3>
                                            {data.jsonPayload?.deductions?.section80C?.complete && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <BodySmall muted>80C, 80D, 80G and other savings</BodySmall>
                                    </div>
                                </div>
                                <UIButton variant="primary" icon={ArrowRight}>
                                    Maximize Savings
                                </UIButton>
                            </div>
                        </UICard>
                    </div>
                </div>

                {/* Filing Status Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary-600" />
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <Heading2>Your {data.assessmentYear} Tax Return</Heading2>
                                <BodySmall className="text-[var(--s29-text-muted)] mt-1">
                                    {data.identity?.name || 'Taxpayer'} • PAN: {data.taxpayerPan}
                                </BodySmall>
                            </div>
                            <button
                                onClick={handleExportJSON}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                                title="Download filing data for manual filing, CA handoff, or audit"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Export JSON</span>
                            </button>
                        </div>
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Income Details</span>
                            <span className="text-xs text-orange-600 font-semibold px-3 py-1 bg-orange-50 rounded-full">In Progress</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Tax Computation</span>
                            {loadingTax ? (
                                <span className="text-xs text-slate-500 font-medium">Calculating...</span>
                            ) : taxData ? (
                                <span className="text-xs text-emerald-600 font-semibold px-3 py-1 bg-emerald-50 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    ₹{taxData.selectedRegime === 'old' ? taxData.oldRegime?.finalTaxLiability?.toLocaleString('en-IN') : taxData.newRegime?.finalTaxLiability?.toLocaleString('en-IN')}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 font-medium">Awaiting Data</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-medium">Readiness Check</span>
                            {loadingReadiness ? (
                                <span className="text-xs text-slate-500 font-medium">Checking...</span>
                            ) : readinessData?.legalStatus?.safeToSubmit ? (
                                <span className="text-xs text-emerald-600 font-bold uppercase px-3 py-1 bg-emerald-50 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Ready
                                </span>
                            ) : (
                                <span className="text-xs text-red-600 font-bold uppercase">Not Ready</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Return Type Recommendation Banner */}
                <div className="bg-[var(--s29-primary-light)]/10 border border-[var(--s29-primary-light)] rounded-[var(--s29-radius-main)] p-6 mb-8 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                        <FileText className="w-6 h-6 text-[var(--s29-primary)]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--s29-text-main)] mb-1">Return Type Decision</h3>
                        <p className="text-sm text-[var(--s29-text-muted)]">
                            Based on your financial activity, we've selected <span className="font-bold text-[var(--s29-primary)]">{identity.itrType}</span> as the safest and most efficient form for you.
                        </p>
                    </div>
                </div>

                {/* Download Draft Progress */}
                <button
                    onClick={() => {
                        if (readinessData?.actions?.canDownloadJSON !== false) {
                            window.open(`${API_BASE_URL}/filings/${filingId}/export/json`, '_blank');
                        } else {
                            toast.error('Please complete all required sections before downloading');
                        }
                    }}
                    disabled={readinessData?.actions?.canDownloadJSON === false}
                    className={`w-full flex items-center justify-center gap-2 py-3 transition-colors text-sm font-medium border rounded-xl ${readinessData?.actions?.canDownloadJSON === false
                        ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <Download className="w-4 h-4" />
                    {readinessData?.legalStatus?.safeToSubmit ? 'Download Complete Filing (JSON)' : 'Download Draft Progress (JSON)'}
                </button>
                {readinessData?.actions?.canDownloadJSON === false && (
                    <p className="text-xs text-slate-500 text-center mt-2">
                        Complete income details and deductions to enable download
                    </p>
                )}
            </div>
        </div>
    );
};

export default FilingOverview;
