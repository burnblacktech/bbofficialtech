// =====================================================
// INCOME STORY - Screen 2 (S29 Hardened)
// Section-wise Data Capture with Time Estimates & Status
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Home, Building2, DollarSign, ChevronRight, CheckCircle2, Clock, Info, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SectionCard from '../../components/common/SectionCard';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';
import InlineHint from '../../components/common/InlineHint';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const IncomeStory = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiling = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                setFiling(response.data.data || response.data);
            } catch (err) {
                toast.error('Failed to load filing');
            } finally {
                setLoading(false);
            }
        };

        fetchFiling();
    }, [filingId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--s29-primary)]" />
            </div>
        );
    }

    if (!filing) {
        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center">
                <SectionCard title="Not Found">
                    <p className="text-[var(--s29-text-muted)]">Could not find this filing. Please start again.</p>
                </SectionCard>
            </div>
        );
    }

    const incomeIntent = filing.jsonPayload?.income || {};
    const sections = [];

    const getSectionStatus = (sectionData) => {
        if (!sectionData || Object.keys(sectionData).length <= 1) return 'NOT_STARTED';
        if (sectionData.complete) return 'COMPLETED';
        return 'IN_PROGRESS';
    };

    if (incomeIntent.salary?.intent) {
        sections.push({
            id: 'salary',
            title: 'Salary Income',
            description: 'Income from employer, allowances, and perquisites.',
            icon: Briefcase,
            time: '2 mins',
            status: getSectionStatus(incomeIntent.salary),
        });
    }

    if (incomeIntent.capitalGains?.intent) {
        sections.push({
            id: 'capital-gains',
            title: 'Capital Gains',
            description: 'Profits from sale of shares, mutual funds, or property.',
            icon: TrendingUp,
            time: '5 mins',
            status: getSectionStatus(incomeIntent.capitalGains),
        });
    }

    if (incomeIntent.houseProperty?.intent) {
        sections.push({
            id: 'house-property',
            title: 'Rental Income',
            description: 'Income from residential or commercial properties.',
            icon: Home,
            time: '3 mins',
            status: getSectionStatus(incomeIntent.houseProperty),
        });
    }

    if (incomeIntent.presumptive?.intent) {
        sections.push({
            id: 'presumptive',
            title: 'Business (Simplified)',
            description: 'Presumptive scheme for small businesses (44AD/ADA).',
            icon: Building2,
            time: '4 mins',
            status: getSectionStatus(incomeIntent.presumptive),
        });
    }

    if (incomeIntent.business?.intent) {
        sections.push({
            id: 'business',
            title: 'Business (Full)',
            description: 'Business income requiring full balance sheet & P&L.',
            icon: Building2,
            time: '15 mins',
            status: getSectionStatus(incomeIntent.business),
        });
    }

    if (incomeIntent.otherSources?.intent) {
        sections.push({
            id: 'other',
            title: 'Other Income',
            description: 'Interest from bank, dividends, and gifts.',
            icon: DollarSign,
            time: '1 min',
            status: getSectionStatus(incomeIntent.otherSources),
        });
    }

    const completedCount = sections.filter(s => s.status === 'COMPLETED').length;
    const allSectionsComplete = sections.every(s => s.status === 'COMPLETED');

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-12 px-6">
            <div className="max-w-xl mx-auto">
                <header className="mb-10 text-center">
                    <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] font-medium uppercase tracking-widest">
                        Step 3 of 5
                    </span>
                    <h1 className="text-[var(--s29-font-size-h2)] font-bold text-[var(--s29-text-main)] mt-2">
                        Your Income Story
                    </h1>
                    <p className="text-[var(--s29-text-muted)] mt-1">
                        Tell us about your earnings. One section at a time.
                    </p>
                </header>

                <div className="space-y-4 mb-10">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={section.id}
                                onClick={() => navigate(`/filing/${filingId}/income/${section.id}`)}
                                className="group bg-white border border-[var(--s29-border-light)] p-5 rounded-[var(--s29-radius-large)] hover:border-[var(--s29-primary)] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[var(--s29-bg-page)] rounded-full flex items-center justify-center text-[var(--s29-text-muted)] group-hover:text-[var(--s29-primary)] transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--s29-text-main)]">{section.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {section.status === 'COMPLETED' ? (
                                                <span className="text-[var(--s29-success)] text-[var(--s29-font-size-xs)] font-medium flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {section.time}
                                                </span>
                                            )}
                                            <span className="text-[var(--s29-border-light)]">•</span>
                                            <span className="text-[var(--s29-text-muted)] text-[var(--s29-font-size-xs)] italic">
                                                {section.status === 'NOT_STARTED' ? 'Not added yet' : section.status === 'IN_PROGRESS' ? 'We need a few details' : 'Looks good'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--s29-border-light)] group-hover:text-[var(--s29-primary)] transition-colors" />
                            </div>
                        );
                    })}
                </div>

                <ReassuranceBanner
                    message="You can save progress and come back anytime. Your draft is automatically saved."
                />

                <div className="mt-12 flex flex-col gap-4">
                    <button
                        onClick={() => {
                            if (allSectionsComplete) {
                                navigate(`/filing/${filingId}/tax-breakdown`);
                            } else {
                                toast('Complete all sections to see your tax calculation', { icon: '⏳' });
                            }
                        }}
                        className={`w-full py-4 rounded-[var(--s29-radius-main)] font-semibold text-lg transition-all flex items-center justify-center gap-2 ${allSectionsComplete
                            ? 'bg-[var(--s29-primary)] text-white hover:bg-[var(--s29-primary-dark)] shadow-md'
                            : 'bg-white border border-[var(--s29-border-light)] text-[var(--s29-text-muted)] cursor-not-allowed'
                            }`}
                    >
                        Review Tax Calculation
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="w-full text-[var(--s29-text-muted)] py-2 text-sm hover:text-[var(--s29-text-main)] transition-colors"
                    >
                        Go back to Dashboard
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-[var(--s29-border-light)]">
                    <InlineHint icon={<Info className="w-4 h-4" />}>
                        Why am I seeing these sections? Based on your profile summary for PAN {filing.taxpayerPan}, these are the required income disclosures for {filing.jsonPayload?.itrType}.
                    </InlineHint>
                </div>
            </div>
        </div>
    );
};

export default IncomeStory;
