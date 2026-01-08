// =====================================================
// FILING OVERVIEW - Screen 1 (Trust-Hardened)
// "Your Financial Year at a Glance"
// With micro-reassurance and safety guarantees
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, CheckCircle, XCircle, Clock, ArrowRight, Download } from 'lucide-react';
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading your financial year...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    const { identity, incomeSummary, eligibilityBadge, missingBlocks } = data;

    // Determine what income sources user indicated
    const hasIncome = (type) => {
        if (type === 'salary') return incomeSummary.salary > 0;
        if (type === 'capitalGains') return incomeSummary.capitalGains > 0;
        if (type === 'business') return incomeSummary.businessIncome > 0;
        if (type === 'other') return incomeSummary.otherIncome > 0;
        return false;
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header: Context Lock-in */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        Your Financial Year at a Glance
                    </h1>
                    <p className="text-sm text-slate-500">
                        Assessment Year {identity.assessmentYear}
                    </p>
                    <p className="text-sm text-slate-500">
                        Filing for income earned between Apr 2023 – Mar 2024
                    </p>
                </div>

                {/* Reassurance: Nothing Bad Will Happen */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="safety"
                        message="We will never submit without your confirmation. You can add or edit information at any time."
                    />
                </div>

                {/* What we know so far */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        What we know so far
                    </h2>
                    <p className="text-slate-700 mb-3">
                        Based on what you've told us, you have:
                    </p>
                    <ul className="space-y-2 mb-4">
                        {hasIncome('salary') && (
                            <li className="flex items-center gap-2 text-slate-700">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Salary income
                            </li>
                        )}
                        {hasIncome('capitalGains') && (
                            <li className="flex items-center gap-2 text-slate-700">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Capital gains
                            </li>
                        )}
                        {hasIncome('business') && (
                            <li className="flex items-center gap-2 text-slate-700">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Business income
                            </li>
                        )}
                        {hasIncome('other') && (
                            <li className="flex items-center gap-2 text-slate-700">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Other income
                            </li>
                        )}
                    </ul>
                    <p className="text-sm text-slate-500">
                        You can add or change this later.
                    </p>
                </div>

                {/* Return Type (De-emphasised) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium">Return type (automatically selected):</span> {identity.itrType}
                    </p>
                    <p className="text-xs text-slate-500">
                        (You don't need to worry about this)
                    </p>
                </div>

                {/* Status Snapshot (Progress, not checklist) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Status Snapshot
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-slate-700">Income details</span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm text-slate-600">Not added yet</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-slate-700">Tax calculation</span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm text-slate-600">Pending</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-slate-700">Readiness to file</span>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-slate-600">Not ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reassurance: Self-Paced */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="time"
                        message="You can come back anytime. We've saved everything so far."
                    />
                </div>

                {/* Navigation: Primary CTA (only ONE) */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue → Add income details
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Secondary (quiet) */}
                    <button
                        onClick={() => window.open(`/api/filings/${filingId}/export/json`, '_blank')}
                        className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Download current data (JSON)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilingOverview;
