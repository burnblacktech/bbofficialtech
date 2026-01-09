// =====================================================
// INCOME SOURCES SELECTION - Filing Entry Point
// Multi-select income sources (canonical v1)
// S22 determines ITR type automatically
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, TrendingUp, Home, Building2, DollarSign, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../../utils/analyticsEvents';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const IncomeSourcesSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [selectedSources, setSelectedSources] = useState([]);

    const { pan, dob, ay, prefillData } = location.state || {};

    useEffect(() => {
        if (!pan) {
            // Redirect back if no PAN in state (direct URL access)
            navigate('/itr/start');
            return;
        }

        if (prefillData) {
            const suggested = [];
            // Auto-select based on prefill values
            if (prefillData.income?.salary > 0) suggested.push('salary');
            if (prefillData.income?.interestIncome > 0 ||
                prefillData.income?.dividendIncome > 0 ||
                prefillData.income?.otherIncome > 0) {
                suggested.push('other');
            }

            if (suggested.length > 0) {
                setSelectedSources(prev => [...new Set([...prev, ...suggested])]);
                toast.success(`We found ${suggested.length} income sources for you!`, { icon: '✨' });
            }
        }
    }, [pan, prefillData, navigate]);

    const incomeSources = [
        {
            id: 'salary',
            title: 'Salary income',
            description: 'Job income, pension',
            icon: Briefcase,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            activeColor: 'bg-emerald-100 border-emerald-500',
            prefilled: prefillData?.income?.salary > 0,
        },
        {
            id: 'capitalGains',
            title: 'Capital gains',
            description: 'Shares, mutual funds, property',
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-600 border-purple-200',
            activeColor: 'bg-purple-100 border-purple-500',
        },
        {
            id: 'rental',
            title: 'Rental income',
            description: 'House property rent',
            icon: Home,
            color: 'bg-blue-50 text-blue-600 border-blue-200',
            activeColor: 'bg-blue-100 border-blue-500',
        },
        {
            id: 'business_presumptive',
            title: 'Business (Presumptive)',
            description: 'No books required. ITR-4 Sugam.',
            icon: Building2,
            color: 'bg-orange-50 text-orange-600 border-orange-200',
            activeColor: 'bg-orange-100 border-orange-500',
        },
        {
            id: 'business_full',
            title: 'Business (Full Books)',
            description: 'Balance sheet, P&L required. ITR-3.',
            icon: Building2,
            color: 'bg-red-50 text-red-600 border-red-200',
            activeColor: 'bg-red-100 border-red-500',
        },
        {
            id: 'other',
            title: 'Other income',
            description: 'Interest, dividends, etc.',
            icon: DollarSign,
            color: 'bg-slate-50 text-slate-600 border-slate-200',
            activeColor: 'bg-slate-100 border-slate-500',
            prefilled: (prefillData?.income?.interestIncome > 0 ||
                prefillData?.income?.dividendIncome > 0 ||
                prefillData?.income?.otherIncome > 0),
        },
    ];

    const toggleSource = (sourceId) => {
        setSelectedSources(prev =>
            prev.includes(sourceId)
                ? prev.filter(id => id !== sourceId)
                : [...prev, sourceId],
        );
    };

    const handleContinue = () => {
        if (selectedSources.length === 0) {
            toast.error('Please select at least one income source');
            return;
        }

        trackEvent('income_sources_selected', { sources: selectedSources });

        // Navigate to ITR Determination (Ceremony) instead of creating filing here
        navigate('/itr/determination', {
            state: {
                pan,
                dob,
                ay,
                prefillData,
                selectedSources,
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-12 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 mb-4">
                        Tell us how you earned income this year
                    </h1>
                    <p className="text-lg text-slate-600">
                        Select all that apply. We'll take care of the rest.
                    </p>
                </div>

                {/* Income Sources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {incomeSources.map((source) => {
                        const isSelected = selectedSources.includes(source.id);
                        const Icon = source.icon;

                        return (
                            <button
                                key={source.id}
                                onClick={() => toggleSource(source.id)}
                                className={`flex items-start p-6 bg-white rounded-xl border-2 transition-all text-left group ${isSelected
                                    ? source.activeColor
                                    : `${source.color} hover:border-primary-200`
                                    }`}
                            >
                                <div className={`p-3 rounded-lg mr-4 ${source.color} group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {source.title}
                                        </h3>
                                        {source.prefilled && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary-100">
                                                <Sparkles className="w-2.5 h-2.5" />
                                                Prefilled
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {source.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 ml-2" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Reassurance */}
                <div className="text-center mb-8">
                    <p className="text-sm text-slate-500">
                        You can change this later as you add details
                    </p>
                </div>

                {/* Continue Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleContinue}
                        disabled={loading || selectedSources.length === 0}
                        className="flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating your filing...' : 'Continue'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Selection Summary */}
                {selectedSources.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600">
                            Selected: <span className="font-medium text-slate-900">
                                {selectedSources.length} income {selectedSources.length === 1 ? 'source' : 'sources'}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomeSourcesSelection;
