// =====================================================
// INCOME STORY - Screen 2 (S29 Hardened)
// Section-wise Data Capture with Time Estimates & Status
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Home, Building2, DollarSign, ChevronRight, CheckCircle2, Clock, Info, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/common/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { PageContent } from '../../components/Layout';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

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
                <Card padding="lg">
                    <p className="text-[var(--s29-text-muted)]">Could not find this filing. Please start again.</p>
                </Card>
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
            path: `/filing/${filingId}/income/salary`,
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
            path: `/filing/${filingId}/capital-gains-story`,
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
            path: `/filing/${filingId}/house-properties`,
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
            path: `/filing/${filingId}/business-profession`,
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
            path: `/filing/${filingId}/business-profession`,
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
            path: `/filing/${filingId}/other-income-sources`,
        });
    }

    const completedCount = sections.filter(s => s.status === 'COMPLETED').length;
    const allSectionsComplete = sections.every(s => s.status === 'COMPLETED');

    return (
        <OrientationPage
            title="Your Income Story"
            subtitle="Tell us about your earnings. One section at a time."
        >
            <PageContent spacing="section">
                <div className={layout.blockGap}>
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Card
                                key={section.id}
                                padding="lg"
                                className="hover:border-gold-500 cursor-pointer transition-colors"
                                onClick={() => navigate(section.path)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-gold-500 transition-colors">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={typography.cardTitle}>{section.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {section.status === 'COMPLETED' ? (
                                                    <span className="text-emerald-600 text-[10px] font-bold uppercase flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[10px] uppercase font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {section.time}
                                                    </span>
                                                )}
                                                <span className="text-slate-200">•</span>
                                                <span className="text-slate-400 text-[10px] italic">
                                                    {section.status === 'NOT_STARTED' ? 'Not added yet' : section.status === 'IN_PROGRESS' ? 'In progress' : 'Verified'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <ReassuranceBanner
                    message="You can save progress and come back anytime. Your draft is automatically saved."
                />

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={!allSectionsComplete}
                        onClick={() => {
                            if (allSectionsComplete) {
                                navigate(`/filing/${filingId}/tax-breakdown`);
                            } else {
                                toast('Complete all sections to see your tax calculation', { icon: '⏳' });
                            }
                        }}
                    >
                        Review Tax Calculation
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                    >
                        Go back to Overview
                    </Button>
                </div>

                <div className="pt-8 border-t border-slate-100">
                    <p className={typography.bodySmallMuted}>
                        Why am I seeing these sections? Based on your profile summary for PAN {filing.taxpayerPan}, these are the required income disclosures for {filing.jsonPayload?.itrType}.
                    </p>
                </div>
            </PageContent>
        </OrientationPage>
    );
};

export default IncomeStory;
