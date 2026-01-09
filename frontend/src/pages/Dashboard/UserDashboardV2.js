// =====================================================
// USER DASHBOARD V2 - FILING CONTROL ROOM (CORRECTED)
// Shows derived facts only - no guessing
// Pure projection from backend state
// Implements: completion %, sorting, derived next actions
// =====================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, FileText, CheckCircle, Clock, AlertCircle, ArrowRight, Info } from 'lucide-react';
import axios from 'axios';
import SectionCard from '../../components/common/SectionCard';

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
                color: 'text-[var(--s29-success)]',
                bg: 'bg-[var(--s29-success)]/10',
                icon: CheckCircle,
            };
        }

        if (state === 'eri_failed') {
            return {
                label: 'Failed',
                color: 'text-[var(--s29-error)]',
                bg: 'bg-[var(--s29-error)]/10',
                icon: AlertCircle,
            };
        }

        return {
            label: 'Draft',
            color: 'text-[var(--s29-text-muted)]',
            bg: 'bg-[var(--s29-bg-alt)]',
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
            <div className="min-h-screen bg-[var(--s29-bg-main)] flex items-center justify-center">
                <div className="text-[var(--s29-text-muted)] font-medium animate-pulse">Loading your filings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--s29-bg-main)] py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--s29-text-main)] mb-2">
                        Hello, {user?.fullName?.split(' ')[0] || 'there'}.
                    </h1>
                    <p className="text-lg text-[var(--s29-text-muted)] font-medium">
                        Your tax records for the current year.
                    </p>
                </div>

                {/* Filings List */}
                {sortedFilings.length === 0 ? (
                    <SectionCard className="p-12 text-center">
                        <FileText className="w-12 h-12 text-[var(--s29-text-muted)]/20 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-[var(--s29-text-main)] mb-2">
                            No filings yet
                        </h2>
                        <p className="text-[var(--s29-text-muted)] mb-6">
                            Start your first ITR filing to see it here.
                        </p>
                        <button
                            onClick={() => navigate('/itr/start')}
                            className="bg-[var(--s29-primary)] text-white px-8 py-3 rounded-[var(--s29-radius-main)] font-bold hover:bg-[var(--s29-primary-dark)] transition-all shadow-lg active:scale-[0.98] inline-flex items-center gap-2"
                        >
                            Start Filing <ArrowRight className="w-4 h-4" />
                        </button>
                    </SectionCard>
                ) : (
                    <div className="space-y-6">
                        {sortedFilings.map((filing) => {
                            const status = getStatusDisplay(filing);
                            const StatusIcon = status.icon;
                            const completionPct = getCompletionPercentage(filing.readiness);
                            const nextAction = getNextAction(filing, filing.readiness);
                            const safeToSubmit = getSafeToSubmit(filing.readiness);

                            return (
                                <SectionCard
                                    key={filing.id}
                                    className="p-0 overflow-hidden hover:shadow-xl transition-all group"
                                    onClick={() => navigate(`/filing/${filing.id}/overview`)}
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                            {/* Left: Filing Info */}
                                            <div className="flex-1 w-full">
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--s29-bg-alt)] rounded-lg text-[var(--s29-text-main)] font-bold">
                                                        <Calendar className="w-4 h-4 text-[var(--s29-primary)]" />
                                                        AY {filing.assessmentYear}
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-lg text-sm font-bold ${status.bg} ${status.color} flex items-center gap-1.5`}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {status.label}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                                                    <div>
                                                        <p className="text-[var(--s29-text-muted)] text-xs font-medium uppercase tracking-wider mb-1">ITR Type</p>
                                                        <p className="font-bold text-[var(--s29-text-main)]">
                                                            {filing.readiness?.legalStatus?.itrType || 'Determining...'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--s29-text-muted)] text-xs font-medium uppercase tracking-wider mb-1">Progress</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-[var(--s29-bg-alt)] rounded-full overflow-hidden min-w-[60px]">
                                                                <div
                                                                    className="h-full bg-[var(--s29-primary)] transition-all duration-1000"
                                                                    style={{ width: `${completionPct}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold text-[var(--s29-text-main)] text-sm">{completionPct}%</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--s29-text-muted)] text-xs font-medium uppercase tracking-wider mb-1">Status</p>
                                                        <p className={`font-bold flex items-center gap-1.5 ${safeToSubmit ? 'text-[var(--s29-success)]' : 'text-[var(--s29-warning)]'}`}>
                                                            {safeToSubmit ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                            {safeToSubmit ? 'Ready' : 'Incomplete'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--s29-text-muted)] text-xs font-medium uppercase tracking-wider mb-1">Next Action</p>
                                                        <p className="font-bold text-[var(--s29-primary)]">
                                                            {nextAction}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-[var(--s29-text-muted)] font-medium">
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
                                            <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[var(--s29-border-light)]">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/filing/${filing.id}/overview`);
                                                    }}
                                                    className="w-full md:w-auto px-6 py-2.5 bg-[var(--s29-bg-alt)] text-[var(--s29-text-main)] font-bold rounded-lg hover:bg-[var(--s29-primary)] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:bg-[var(--s29-primary)] group-hover:text-white"
                                                >
                                                    View Filing
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>
                            );
                        })}
                    </div>
                )}

                {/* Create New Filing */}
                {sortedFilings.length > 0 && (
                    <div className="mt-8 text-center pb-8">
                        <button
                            onClick={() => navigate('/itr/start')}
                            className="bg-[var(--s29-primary-light)]/10 text-[var(--s29-primary)] px-8 py-3 rounded-[var(--s29-radius-main)] font-bold hover:bg-[var(--s29-primary-light)]/20 transition-all inline-flex items-center gap-2"
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
