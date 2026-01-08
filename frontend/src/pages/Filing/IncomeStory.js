// =====================================================
// INCOME STORY - Screen 2 (Trust-Hardened)
// Section-wise Data Capture with Reassurance
// "You can add or edit this later. Nothing is submitted yet."
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Home, Building2, DollarSign, ChevronDown, ChevronUp, Plus, Check, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const IncomeStory = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState(null);

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    if (!filing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-red-600">Filing not found</div>
            </div>
        );
    }

    // Determine which sections to show based on income intent
    const incomeIntent = filing.jsonPayload?.income || {};
    const sections = [];

    if (incomeIntent.salary?.intent) {
        sections.push({
            id: 'salary',
            title: 'Salary income',
            icon: Briefcase,
            status: getSectionStatus('salary', incomeIntent.salary),
            color: 'text-emerald-600',
        });
    }

    if (incomeIntent.capitalGains?.intent) {
        sections.push({
            id: 'capital-gains',
            title: 'Capital gains',
            icon: TrendingUp,
            status: getSectionStatus('capitalGains', incomeIntent.capitalGains),
            color: 'text-purple-600',
        });
    }

    if (incomeIntent.houseProperty?.intent) {
        sections.push({
            id: 'house-property',
            title: 'Rental income',
            icon: Home,
            status: getSectionStatus('houseProperty', incomeIntent.houseProperty),
            color: 'text-blue-600',
        });
    }

    if (incomeIntent.presumptive?.intent) {
        sections.push({
            id: 'presumptive',
            title: 'Business (Presumptive)',
            icon: Building2,
            status: getSectionStatus('presumptive', incomeIntent.presumptive),
            color: 'text-orange-600',
        });
    }

    if (incomeIntent.business?.intent) {
        sections.push({
            id: 'business',
            title: 'Business (Full Books)',
            icon: Building2,
            status: getSectionStatus('business', incomeIntent.business),
            color: 'text-red-600',
        });
    }

    if (incomeIntent.otherSources?.intent) {
        sections.push({
            id: 'other',
            title: 'Other income',
            icon: DollarSign,
            status: getSectionStatus('other', incomeIntent.otherSources),
            color: 'text-slate-600',
        });
    }

    function getSectionStatus(sectionId, sectionData) {
        // Check if section has data beyond intent
        if (!sectionData || Object.keys(sectionData).length === 1) {
            return { label: 'Not added yet', icon: Clock, color: 'text-yellow-600' };
        }

        // Check if section is complete (simplified for v1)
        if (sectionData.complete) {
            return { label: 'Complete', icon: Check, color: 'text-green-600' };
        }

        return { label: 'Details incomplete', icon: Clock, color: 'text-yellow-600' };
    }

    const allSectionsComplete = sections.every(s => s.status.label === 'Complete');

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Your Income Story
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/overview`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to overview
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us your income story — one section at a time.
                    </p>
                </div>

                {/* Reassurance: Can Edit Later */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="You can add or edit this later. Nothing is submitted yet."
                    />
                </div>

                {/* Income Sections (Accordion) */}
                <div className="space-y-4 mb-8">
                    {sections.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No income sources selected</h3>
                            <p className="text-slate-600 mb-6">
                                You haven't told us how you earned money yet.
                            </p>
                            <button
                                onClick={() => navigate('/itr/start')}
                                className="inline-flex items-center gap-2 bg-primary-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                Select Income Sources
                            </button>
                        </div>
                    ) : (
                        sections.map((section) => {
                            const Icon = section.icon;
                            const StatusIcon = section.status.icon;
                            const isExpanded = expandedSection === section.id;

                            return (
                                <div
                                    key={section.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                                >
                                    {/* Section Header */}
                                    <div
                                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg bg-opacity-10 ${section.color.replace('text-', 'bg-')}`}>
                                                <Icon className={`w-6 h-6 ${section.color}`} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-semibold text-slate-900">
                                                    {section.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusIcon className={`w-4 h-4 ${section.status.color}`} />
                                                    <span className={`text-sm font-medium ${section.status.color}`}>
                                                        {section.status.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/filing/${filingId}/income/${section.id}`);
                                                }}
                                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${section.status.label === 'Not added yet'
                                                    ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {section.status.label === 'Not added yet' ? (
                                                    <span className="flex items-center gap-2">
                                                        <Plus className="w-4 h-4" />
                                                        Add details
                                                    </span>
                                                ) : (
                                                    'Edit'
                                                )}
                                            </button>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Section Content (Expanded) */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/30">
                                            <div className="pt-6 text-sm text-slate-600">
                                                {section.status.label === 'Not added yet' ? (
                                                    <div className="space-y-4">
                                                        <p>We need your {section.title.toLowerCase()} to calculate your total tax liability accurately.</p>
                                                        <ul className="space-y-2">
                                                            <li className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                                                <span>Securely encrypted data</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                                                <span>Audit-ready documentation</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="font-medium text-slate-900">Details already added.</p>
                                                        <p>If you've received additional income or need to correct a mistake, click "Edit" to update your records.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Add More Sources Link */}
                {sections.length > 0 && (
                    <div className="text-center mb-8">
                        <button
                            onClick={() => navigate('/itr/start')}
                            className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Need to add another income source?
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/overview`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back to Overview
                    </button>
                    <button
                        onClick={() => {
                            if (allSectionsComplete) {
                                navigate(`/filing/${filingId}/tax-breakdown`);
                            } else {
                                toast('Please complete all income sections first', { icon: '⏳' });
                            }
                        }}
                        disabled={!allSectionsComplete}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {allSectionsComplete ? 'Review tax calculation →' : 'Save & continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomeStory;
