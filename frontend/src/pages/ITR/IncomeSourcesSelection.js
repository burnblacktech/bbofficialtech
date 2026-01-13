// =====================================================
// INCOME SOURCES SELECTION - Filing Entry Point
// Multi-select income sources (canonical v1)
// S22 determines ITR type automatically
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Briefcase, TrendingUp, Home, Building2, DollarSign, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { trackEvent } from '../../utils/analyticsEvents';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const API_BASE_URL = getApiBaseUrl();

const IncomeSourcesSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { filingId } = useParams();
    const [loading, setLoading] = useState(false);
    const [selectedSources, setSelectedSources] = useState([]);
    const [filingData, setFilingData] = useState(null);

    const { pan, dob, ay, prefillData, currentSources } = location.state || {};

    // Load existing filing if in edit mode
    useEffect(() => {
        if (filingId) {
            const fetchFiling = async () => {
                try {
                    setLoading(true);
                    const token = localStorage.getItem('accessToken');
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const response = await axios.get(`${API_BASE_URL}/filings/${filingId}`, { headers });
                    const data = response.data.data || response.data;
                    setFilingData(data);

                    if (currentSources || data.jsonPayload?.selectedIncomeSources) {
                        setSelectedSources(currentSources || data.jsonPayload?.selectedIncomeSources || []);
                    }
                } catch (error) {
                    toast.error('Failed to load filing details');
                    navigate('/filing/history');
                } finally {
                    setLoading(false);
                }
            };

            if (!currentSources) {
                fetchFiling();
            } else {
                setSelectedSources(currentSources);
            }
        } else if (!pan) {
            // Redirect back if no PAN in state (direct URL access in create mode)
            navigate('/itr/start');
        } else if (prefillData) {
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
    }, [pan, prefillData, navigate, filingId, currentSources]);

    const incomeSources = [
        {
            category: 'Employment Income',
            sources: [
                {
                    id: 'salary',
                    title: 'Salary / Pension',
                    description: 'Income from employment or pension',
                    icon: Briefcase,
                    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    activeColor: 'bg-emerald-100 border-emerald-500',
                    prefilled: prefillData?.income?.salary > 0,
                },
            ],
        },
        {
            category: 'Investment Income',
            sources: [
                {
                    id: 'capitalGains_equity',
                    title: 'Equity Shares',
                    description: 'Sale of listed/unlisted shares',
                    icon: TrendingUp,
                    color: 'bg-purple-50 text-purple-600 border-purple-200',
                    activeColor: 'bg-purple-100 border-purple-500',
                },
                {
                    id: 'capitalGains_mutualFunds',
                    title: 'Mutual Funds',
                    description: 'Equity/debt mutual fund redemptions',
                    icon: TrendingUp,
                    color: 'bg-purple-50 text-purple-600 border-purple-200',
                    activeColor: 'bg-purple-100 border-purple-500',
                },
                {
                    id: 'capitalGains_property',
                    title: 'Property Sale',
                    description: 'Sale of land, house, or building',
                    icon: Home,
                    color: 'bg-purple-50 text-purple-600 border-purple-200',
                    activeColor: 'bg-purple-100 border-purple-500',
                },
                {
                    id: 'capitalGains_other',
                    title: 'Other Capital Assets',
                    description: 'Bonds, gold, crypto, etc.',
                    icon: TrendingUp,
                    color: 'bg-purple-50 text-purple-600 border-purple-200',
                    activeColor: 'bg-purple-100 border-purple-500',
                },
            ],
        },
        {
            category: 'Property Income',
            sources: [
                {
                    id: 'rental_residential',
                    title: 'Residential Rental',
                    description: 'Rent from house/apartment',
                    icon: Home,
                    color: 'bg-blue-50 text-blue-600 border-blue-200',
                    activeColor: 'bg-blue-100 border-blue-500',
                },
                {
                    id: 'rental_commercial',
                    title: 'Commercial Rental',
                    description: 'Rent from shop/office',
                    icon: Building2,
                    color: 'bg-blue-50 text-blue-600 border-blue-200',
                    activeColor: 'bg-blue-100 border-blue-500',
                },
                {
                    id: 'selfOccupied',
                    title: 'Self-Occupied Property',
                    description: 'Own house with home loan',
                    icon: Home,
                    color: 'bg-blue-50 text-blue-600 border-blue-200',
                    activeColor: 'bg-blue-100 border-blue-500',
                },
            ],
        },
        {
            category: 'Other Income',
            sources: [
                {
                    id: 'interest_savings',
                    title: 'Savings Interest',
                    description: 'Bank savings, FD interest',
                    icon: DollarSign,
                    color: 'bg-slate-50 text-slate-600 border-slate-200',
                    activeColor: 'bg-slate-100 border-slate-500',
                    prefilled: prefillData?.income?.interestIncome > 0,
                },
                {
                    id: 'dividend',
                    title: 'Dividend Income',
                    description: 'Dividends from shares/mutual funds',
                    icon: TrendingUp,
                    color: 'bg-slate-50 text-slate-600 border-slate-200',
                    activeColor: 'bg-slate-100 border-slate-500',
                    prefilled: prefillData?.income?.dividendIncome > 0,
                },
                {
                    id: 'familyPension',
                    title: 'Family Pension',
                    description: 'Pension received as heir',
                    icon: Briefcase,
                    color: 'bg-slate-50 text-slate-600 border-slate-200',
                    activeColor: 'bg-slate-100 border-slate-500',
                },
                {
                    id: 'other_income',
                    title: 'Other Sources',
                    description: 'Gifts, lottery, etc.',
                    icon: DollarSign,
                    color: 'bg-slate-50 text-slate-600 border-slate-200',
                    activeColor: 'bg-slate-100 border-slate-500',
                },
            ],
        },
        {
            category: 'Business Income',
            sources: [
                {
                    id: 'business_presumptive',
                    title: 'Small Business (Presumptive)',
                    description: 'Turnover ≤ ₹2Cr. No books required.',
                    icon: Building2,
                    color: 'bg-orange-50 text-orange-600 border-orange-200',
                    activeColor: 'bg-orange-100 border-orange-500',
                },
                {
                    id: 'professional_presumptive',
                    title: 'Professional (Presumptive)',
                    description: 'Receipts ≤ ₹50L. Section 44ADA.',
                    icon: Briefcase,
                    color: 'bg-orange-50 text-orange-600 border-orange-200',
                    activeColor: 'bg-orange-100 border-orange-500',
                },
                {
                    id: 'business_full',
                    title: 'Business (Full Books)',
                    description: 'P&L, Balance Sheet required',
                    icon: Building2,
                    color: 'bg-red-50 text-red-600 border-red-200',
                    activeColor: 'bg-red-100 border-red-500',
                },
                {
                    id: 'professional_full',
                    title: 'Professional (Full Books)',
                    description: 'Doctor, CA, Lawyer with books',
                    icon: Briefcase,
                    color: 'bg-red-50 text-red-600 border-red-200',
                    activeColor: 'bg-red-100 border-red-500',
                },
            ],
        },
    ];

    const toggleSource = (sourceId) => {
        setSelectedSources(prev =>
            prev.includes(sourceId)
                ? prev.filter(id => id !== sourceId)
                : [...prev, sourceId],
        );
    };

    const determineITRType = (sources) => {
        // Check for business/professional with full books
        const hasBusinessFull = sources.some(s => s === 'business_full' || s === 'professional_full');

        // Check for presumptive business/professional
        const hasPresumptive = sources.some(s => s === 'business_presumptive' || s === 'professional_presumptive');

        // Check for capital gains
        const hasCapitalGains = sources.some(s => s.startsWith('capitalGains_'));

        // Check for rental income
        const hasRental = sources.some(s => s.startsWith('rental_') || s === 'selfOccupied');

        // Check for salary
        const hasSalary = sources.includes('salary');

        if (hasBusinessFull) return 'ITR-3';
        if (hasPresumptive) return 'ITR-4';
        if (hasCapitalGains || hasRental) return 'ITR-2';
        if (hasSalary) return 'ITR-1';
        return 'ITR-1';
    };

    const handleContinue = async () => {
        if (selectedSources.length === 0) {
            toast.error('Please select at least one income source');
            return;
        }

        trackEvent('income_sources_selected', { sources: selectedSources });

        if (filingId) {
            // UPDATE EXISTING FILING
            try {
                setLoading(true);
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Calculate new ITR type
                const itrType = determineITRType(selectedSources);

                // Calculate intent flags from granular sources
                const incomeIntent = {
                    salary: selectedSources.includes('salary') || selectedSources.includes('familyPension'),
                    capitalGains: selectedSources.some(s => s.startsWith('capitalGains_')),
                    rental: selectedSources.some(s => s.startsWith('rental_') || s === 'selfOccupied'),
                    businessPresumptive: selectedSources.includes('business_presumptive') || selectedSources.includes('professional_presumptive'),
                    businessFull: selectedSources.includes('business_full') || selectedSources.includes('professional_full'),
                    other: selectedSources.includes('interest_savings') || selectedSources.includes('dividend') || selectedSources.includes('other_income'),

                    // Granular flags for better data mapping
                    hasEquity: selectedSources.includes('capitalGains_equity'),
                    hasMutualFunds: selectedSources.includes('capitalGains_mutualFunds'),
                    hasPropertySale: selectedSources.includes('capitalGains_property'),
                    hasResidentialRental: selectedSources.includes('rental_residential'),
                    hasCommercialRental: selectedSources.includes('rental_commercial'),
                    hasSelfOccupied: selectedSources.includes('selfOccupied'),
                    hasInterest: selectedSources.includes('interest_savings'),
                    hasDividend: selectedSources.includes('dividend'),
                    hasFamilyPension: selectedSources.includes('familyPension'),
                };

                // Merge with existing payload
                // If we fetched filingData, use it. Otherwise rely on update backend logic or fetch it first?
                // Ideally we should have the full payload. The useEffect fetches it if not passed.
                // But for robustness, let's assume we might need to be careful.
                // However, fetching first is safer. We did that in useEffect.

                const currentPayload = filingData?.jsonPayload || location.state?.filing?.jsonPayload || {};

                // Helper to update section intent while preserving data
                // If deselected, return null to remove the section entirely
                const updateSection = (currentSection, isSelected, prefillValue) => {
                    if (!isSelected) {
                        return null; // Remove section when deselected
                    }
                    return {
                        ...(currentSection || {}),
                        intent: true,
                        prefill: currentSection?.prefill || prefillValue || 0,
                    };
                };

                // Build income object with only selected sources
                const incomeData = {
                    salary: updateSection(currentPayload.income?.salary, incomeIntent.salary, prefillData?.income?.salary),
                    capitalGains: updateSection(currentPayload.income?.capitalGains, incomeIntent.capitalGains),
                    houseProperty: updateSection(currentPayload.income?.houseProperty, incomeIntent.rental),
                    presumptive: updateSection(currentPayload.income?.presumptive, incomeIntent.businessPresumptive),
                    business: updateSection(currentPayload.income?.business, incomeIntent.businessFull),
                    otherSources: updateSection(currentPayload.income?.otherSources, incomeIntent.other, prefillData?.income?.otherIncome),
                };

                // Remove null values (deselected sources)
                const cleanedIncome = Object.fromEntries(
                    Object.entries(incomeData).filter(([_, value]) => value !== null),
                );

                const newPayload = {
                    ...currentPayload,
                    selectedIncomeSources: selectedSources,
                    itrType: itrType,
                    income: cleanedIncome,
                };

                await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                    jsonPayload: newPayload,
                }, { headers });

                toast.success('Income sources updated');
                navigate(`/filing/${filingId}/overview`);
            } catch (error) {
                console.error('Update failed:', error);
                toast.error('Failed to update sources');
            } finally {
                setLoading(false);
            }
        } else {
            // CREATE NEW FILING FLOW
            navigate('/itr/determination', {
                state: {
                    pan,
                    dob,
                    ay,
                    prefillData,
                    selectedSources,
                },
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-12 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 mb-4">
                        How did you earn income this year?
                    </h1>
                    <p className="text-lg text-slate-600">
                        Select everything that applies. You can add specific details later.
                    </p>
                </div>

                {/* Income Sources Grid - Categorized */}
                <div className="space-y-8 mb-8">
                    {incomeSources.map((category) => (
                        <div key={category.category}>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                {category.category}
                                {selectedSources.some(s => category.sources.some(src => src.id === s)) && (
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        {selectedSources.filter(s => category.sources.some(src => src.id === s)).length} selected
                                    </span>
                                )}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {category.sources.map((source) => {
                                    const isSelected = selectedSources.includes(source.id);
                                    const Icon = source.icon;

                                    return (
                                        <button
                                            key={source.id}
                                            onClick={() => toggleSource(source.id)}
                                            className={`flex items-start p-5 bg-white rounded-xl border-2 transition-all text-left group ${isSelected
                                                ? source.activeColor
                                                : `${source.color} hover:border-primary-200`
                                                }`}
                                        >
                                            <div className={`p-2.5 rounded-lg mr-3 ${source.color} group-hover:scale-105 transition-transform`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base font-semibold text-slate-900">
                                                        {source.title}
                                                    </h3>
                                                    {source.prefilled && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary-100">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            Prefilled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {source.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
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
