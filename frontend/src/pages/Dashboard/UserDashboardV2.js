// =====================================================
// USER DASHBOARD V2 - FILING CONTROL ROOM (CORRECTED)
// Shows derived facts only - no guessing
// Pure projection from backend state
// Implements: completion %, sorting, derived next actions
// =====================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, FileText, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const UserDashboardV2 = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filings, setFilings] = useState([]);
    const [filingsWithReadiness, setFilingsWithReadiness] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFilings = async () => {
            try {
                // Fetch user's filings
                const response = await axios.get('/api/filings');
                const filingsData = response.data.data || [];

                // Fetch readiness for each filing
                const filingsWithReadinessData = await Promise.all(
                    filingsData.map(async (filing) => {
                        try {
                            const readinessRes = await axios.get(`/api/filings/${filing.id}/readiness`);
                            return {
                                ...filing,
                                readiness: readinessRes.data.data,
                            };
                        } catch (error) {
                            return {
                                ...filing,
                                readiness: null,
                            };
                        }
                    }),
                );

                setFilings(filingsData);
                setFilingsWithReadiness(filingsWithReadinessData);
            } catch (error) {
                console.error('Failed to fetch filings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilings();
    }, []);

    const getStatusDisplay = (filing) => {
        const state = filing.lifecycleState;

        if (state === 'submitted_to_eri' || state === 'eri_success') {
            return {
                label: 'Submitted',
                color: 'text-green-700',
                bg: 'bg-green-50',
                icon: CheckCircle,
            };
        }

        if (state === 'eri_failed') {
            return {
                label: 'Failed',
                color: 'text-red-700',
                bg: 'bg-red-50',
                icon: AlertCircle,
            };
        }

        return {
            label: 'Draft',
            color: 'text-slate-700',
            bg: 'bg-slate-50',
            icon: Clock,
        };
    };

    const getCompletionPercentage = (readiness) => {
        if (!readiness) return 0;
        const checklist = readiness.completionChecklist;
        const total = Object.keys(checklist).length;
        const completed = Object.values(checklist).filter(Boolean).length;
        return Math.round((completed / total) * 100);
    };

    const getNextAction = (filing, readiness) => {
        const state = filing.lifecycleState;

        if (state === 'eri_success') {
            return 'No further action required';
        }

        if (state === 'eri_failed') {
            return 'Review and retry';
        }

        if (!readiness) {
            return 'Continue filing';
        }

        // Derived from backend state
        if (readiness.legalStatus.safeToSubmit) {
            return 'Ready to submit';
        }

        // Get first missing block
        const missingBlocks = readiness.legalStatus.missingBlocks;
        if (missingBlocks.length > 0) {
            const firstMissing = missingBlocks[0];
            // Convert camelCase to readable text
            const readable = firstMissing.replace(/([A-Z])/g, ' $1').trim();
            return `Add ${readable.toLowerCase()}`;
        }

        return 'Continue filing';
    };

    const getSafeToSubmit = (readiness) => {
        return readiness?.legalStatus?.safeToSubmit || false;
    };

    // Sorting: Incomplete & unsafe first, then ready, then submitted
    const sortedFilings = [...filingsWithReadiness].sort((a, b) => {
        const aState = a.lifecycleState;
        const bState = b.lifecycleState;
        const aSafe = getSafeToSubmit(a.readiness);
        const bSafe = getSafeToSubmit(b.readiness);

        // Submitted filings last
        if (aState === 'eri_success' && bState !== 'eri_success') return 1;
        if (bState === 'eri_success' && aState !== 'eri_success') return -1;

        // Ready to submit before incomplete
        if (aSafe && !bSafe) return 1;
        if (bSafe && !aSafe) return -1;

        // Otherwise by updated date (newest first)
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading your filings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        Hello, {user?.fullName?.split(' ')[0] || 'there'}.
                    </h1>
                    <p className="text-lg text-slate-600">
                        Your filing control room.
                    </p>
                </div>

                {/* Filings List */}
                {sortedFilings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-medium text-slate-900 mb-2">
                            No filings yet
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Start your first ITR filing to see it here.
                        </p>
                        <button
                            onClick={() => navigate('/itr/start')}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                        >
                            Start Filing <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedFilings.map((filing) => {
                            const status = getStatusDisplay(filing);
                            const StatusIcon = status.icon;
                            const completionPct = getCompletionPercentage(filing.readiness);
                            const nextAction = getNextAction(filing, filing.readiness);
                            const safeToSubmit = getSafeToSubmit(filing.readiness);

                            return (
                                <div
                                    key={filing.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/filing/${filing.id}/overview`)}
                                >
                                    <div className="flex items-start justify-between">
                                        {/* Left: Filing Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Calendar className="w-5 h-5 text-slate-400" />
                                                <span className="font-semibold text-slate-900">
                                                    AY {filing.assessmentYear}
                                                </span>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color} flex items-center gap-1.5`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {status.label}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                                                <div>
                                                    <p className="text-slate-500 mb-1">ITR Type</p>
                                                    <p className="font-medium text-slate-900">
                                                        {filing.readiness?.legalStatus?.itrType || 'Determining...'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 mb-1">Completion</p>
                                                    <p className="font-medium text-slate-900">{completionPct}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 mb-1">Safe to Submit</p>
                                                    <p className={`font-medium ${safeToSubmit ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {safeToSubmit ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 mb-1">Next Action</p>
                                                    <p className="font-medium text-primary-600">
                                                        {nextAction}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                Last updated: {new Date(filing.updatedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>

                                        {/* Right: Action Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/filing/${filing.id}/overview`);
                                            }}
                                            className="ml-4 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                                        >
                                            View Details
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create New Filing */}
                {sortedFilings.length > 0 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/itr/start')}
                            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
                        >
                            + Start New Filing
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboardV2;
