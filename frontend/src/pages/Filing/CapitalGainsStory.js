// =====================================================
// CAPITAL GAINS STORY - Screen 3B (ITR-2)
// "Tell us about things you sold this year"
// Progressive Entry: Overview → Add Event → Details
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, Edit, Trash2, Home, Award, Package } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReassuranceBanner from '../../components/ReassuranceBanner';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const CapitalGainsStory = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAssetTypeModal, setShowAssetTypeModal] = useState(false);

    useEffect(() => {
        fetchFiling();
    }, [filingId]);

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

    const events = filing?.jsonPayload?.income?.capitalGains?.events || [];

    const getAssetIcon = (assetType) => {
        switch (assetType) {
            case 'equity': return TrendingUp;
            case 'property': return Home;
            case 'gold': return Award;
            default: return Package;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleAddEvent = (assetType) => {
        setShowAssetTypeModal(false);
        if (assetType === 'property') {
            navigate(`/filing/${filingId}/income/property-sale`);
        } else {
            navigate(`/filing/${filingId}/income/capital-gains/add?type=${assetType}`);
        }
    };

    const handleEditEvent = (eventId) => {
        navigate(`/filing/${filingId}/income/capital-gains/edit/${eventId}`);
    };

    const handleDeleteEvent = async (eventId) => {
        // eslint-disable-next-line no-alert, no-restricted-globals
        if (!window.confirm('Remove this sale?')) return;

        try {
            const updatedEvents = events.filter(e => e.id !== eventId);

            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE_URL}/filings/${filingId}`, {
                jsonPayload: {
                    ...filing.jsonPayload,
                    income: {
                        ...filing.jsonPayload?.income,
                        capitalGains: {
                            ...filing.jsonPayload?.income?.capitalGains,
                            events: updatedEvents,
                        },
                    },
                },
            }, { headers });

            toast.success('Sale removed');
            fetchFiling();
        } catch (error) {
            toast.error('Failed to remove sale');
        }
    };

    // Calculate summary
    const stcgTotal = events
        .filter(e => e.taxType === 'STCG')
        .reduce((sum, e) => sum + (e.gain || 0), 0);

    const ltcgTotal = events
        .filter(e => e.taxType === 'LTCG')
        .reduce((sum, e) => sum + (e.gain || 0), 0);

    const stcgTax = events
        .filter(e => e.taxType === 'STCG')
        .reduce((sum, e) => sum + (e.taxAmount || 0), 0);

    const ltcgTax = events
        .filter(e => e.taxType === 'LTCG')
        .reduce((sum, e) => sum + (e.taxAmount || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-serif font-medium text-slate-900">
                            Capital Gains
                        </h1>
                        <button
                            onClick={() => navigate(`/filing/${filingId}/income-story`)}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            ← Back to Income Story
                        </button>
                    </div>
                    <p className="text-slate-600">
                        Tell us about things you sold this year.
                    </p>
                </div>

                {/* Reassurance */}
                <div className="mb-6">
                    <ReassuranceBanner
                        type="default"
                        message="Most people sell 1-3 things per year. This is normal."
                    />
                </div>

                {/* Events List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                        Your sales this year
                    </h2>

                    {events.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No sales added yet</p>
                            <p className="text-sm mt-1">Click "Add a sale" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event) => {
                                const Icon = getAssetIcon(event.assetType);
                                return (
                                    <div
                                        key={event.id}
                                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Icon className="w-5 h-5 text-slate-400 mt-1" />
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-slate-900 mb-1">
                                                        {event.assetName}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mb-2">
                                                        Sold: {event.saleDate}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-1 rounded ${event.taxType === 'LTCG'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {event.taxType === 'LTCG' ? 'Long-term' : 'Short-term'}
                                                        </span>
                                                        <span className="text-sm text-slate-600">
                                                            Tax: {formatCurrency(event.taxAmount || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditEvent(event.id)}
                                                    className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={() => setShowAssetTypeModal(true)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add a sale
                    </button>
                </div>

                {/* Summary */}
                {events.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
                        <div className="space-y-2">
                            {stcgTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        Short-term gains: {formatCurrency(stcgTotal)}
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        Tax: {formatCurrency(stcgTax)}
                                    </span>
                                </div>
                            )}
                            {ltcgTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        Long-term gains: {formatCurrency(ltcgTotal)}
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        Tax: {formatCurrency(ltcgTax)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                        ← Back to Income Story
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>

                {/* Asset Type Selection Modal */}
                {showAssetTypeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    What did you sell?
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Choose the type of asset
                                </p>
                            </div>

                            <div className="p-6 space-y-3">
                                <button
                                    onClick={() => handleAddEvent('equity')}
                                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6 text-primary-600" />
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                Stocks or mutual funds
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Shares, ETFs, mutual funds
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-primary-600">Select →</span>
                                </button>

                                <button
                                    onClick={() => toast('Property support coming soon!')}
                                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                                    disabled
                                >
                                    <div className="flex items-center gap-3">
                                        <Home className="w-6 h-6 text-slate-400" />
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                Property
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                House, land, commercial property
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-400">Coming soon</span>
                                </button>

                                <button
                                    onClick={() => toast('Gold support coming soon!')}
                                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                                    disabled
                                >
                                    <div className="flex items-center gap-3">
                                        <Award className="w-6 h-6 text-slate-400" />
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                Gold or jewelry
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Physical gold, jewelry, gold bonds
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-400">Coming soon</span>
                                </button>

                                <button
                                    onClick={() => toast('Other assets support coming soon!')}
                                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed text-left"
                                    disabled
                                >
                                    <div className="flex items-center gap-3">
                                        <Package className="w-6 h-6 text-slate-400" />
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                Other assets
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Bonds, crypto, art, etc.
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-400">Coming soon</span>
                                </button>
                            </div>

                            <div className="p-6 border-t border-slate-200">
                                <button
                                    onClick={() => setShowAssetTypeModal(false)}
                                    className="w-full py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CapitalGainsStory;
