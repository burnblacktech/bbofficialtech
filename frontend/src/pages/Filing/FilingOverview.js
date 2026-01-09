// =====================================================
// FILING OVERVIEW - Screen 1 (Trust-Hardened)
// "Your Financial Year at a Glance"
// With micro-reassurance and safety guarantees
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, CheckCircle, XCircle, Clock, ArrowRight, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const FilingOverview = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}/overview`, { headers });
                setData(response.data.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load overview');
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [filingId]);

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

    const hasIncome = (type) => {
        if (type === 'salary') return incomeSummary.salary > 0;
        if (type === 'capitalGains') return incomeSummary.capitalGains > 0;
        if (type === 'business') return incomeSummary.businessIncome > 0;
        if (type === 'other') return incomeSummary.otherIncome > 0;
        return false;
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Income Declaration Snapshot */}
                    <div className="bg-white rounded-[var(--s29-radius-large)] border border-[var(--s29-border-light)] p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[var(--s29-success)]" />
                            Income Identified
                        </h2>
                        <div className="space-y-4">
                            {['salary', 'capitalGains', 'business', 'other'].map(type => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-[var(--s29-text-main)] font-medium capitalize">
                                        {type.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    {hasIncome(type) ? (
                                        <div className="px-2 py-1 bg-[var(--s29-success)]/10 text-[var(--s29-success)] rounded text-[10px] font-bold uppercase tracking-tighter">
                                            Identified
                                        </div>
                                    ) : (
                                        <div className="px-2 py-1 bg-slate-100 text-slate-400 rounded text-[10px] font-bold uppercase tracking-tighter">
                                            Not Found
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Readiness Snapshot */}
                    <div className="bg-white rounded-[var(--s29-radius-large)] border border-[var(--s29-border-light)] p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-[var(--s29-text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[var(--s29-primary)]" />
                            Filing Status
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--s29-text-main)] font-medium">Income Details</span>
                                <span className="text-xs text-[var(--s29-text-muted)] font-medium">In Progress</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--s29-text-main)] font-medium">Tax Computation</span>
                                <span className="text-xs text-[var(--s29-text-muted)] font-medium">Awaiting Data</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--s29-text-main)] font-medium">Readiness Check</span>
                                <span className="text-xs text-[var(--s29-error)] font-bold uppercase tracking-tighter">Not Ready</span>
                            </div>
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

                {/* Primary CTA */}
                <button
                    onClick={() => navigate(`/filing/${filingId}/income-story`)}
                    className="w-full py-5 bg-[var(--s29-primary)] text-white rounded-[var(--s29-radius-main)] font-bold text-xl hover:bg-[var(--s29-primary-dark)] shadow-lg shadow-[var(--s29-primary-light)]/30 transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
                >
                    Start Income Story
                    <ArrowRight className="w-6 h-6" />
                </button>

                <button
                    onClick={() => window.open(`${API_BASE_URL}/filings/${filingId}/export/json`, '_blank')}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-[var(--s29-text-muted)] hover:text-[var(--s29-text-main)] transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Download Draft Progress (JSON)
                </button>
            </div>
        </div>
    );
};

export default FilingOverview;
