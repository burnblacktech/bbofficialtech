// =====================================================
// TAX BREAKDOWN - Screen 3 (CORRECTED)
// "How Your Tax Was Calculated"
// Two-column comparison: Old vs New Regime
// Pure projection from /api/filings/:filingId/tax-breakdown
// and /api/regime-comparison/:filingId
// =====================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const TaxBreakdown = () => {
    const { filingId } = useParams();
    const navigate = useNavigate();
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComparison = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/regime-comparison/${filingId}`, { headers });
                setComparison(response.data.data);
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Failed to load tax breakdown';
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchComparison();
    }, [filingId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Calculating your tax...</div>
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

    const { oldRegime, newRegime, comparison: comparisonData } = comparison;
    const selectedRegime = comparisonData.recommendedRegime;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-medium text-slate-900 mb-2">
                        How Your Tax Was Calculated
                    </h1>
                    <p className="text-slate-600">
                        Based on what you declared, this is how tax law applies.
                    </p>
                </div>

                {/* Two-Column Comparison */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Old Regime */}
                    <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${selectedRegime === 'old' ? 'border-primary-500' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Old Regime</h2>
                            {selectedRegime === 'old' && (
                                <CheckCircle className="w-5 h-5 text-primary-600" />
                            )}
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Total income you're taxed on</span>
                                <span className="font-medium text-slate-900">
                                    ₹{oldRegime.taxableIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Income tax</span>
                                <span className="font-medium text-slate-900">
                                    ₹{oldRegime.taxOnIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {oldRegime.rebate > 0 && (
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Tax discount</span>
                                    <span className="font-medium text-green-600">
                                        - ₹{oldRegime.rebate.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                            {oldRegime.surcharge > 0 && (
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Additional tax for high income</span>
                                    <span className="font-medium text-slate-900">
                                        ₹{oldRegime.surcharge.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Health & education fee</span>
                                <span className="font-medium text-slate-900">
                                    ₹{oldRegime.cess.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between py-3 bg-slate-50 rounded-lg px-3 mt-3">
                                <span className="font-semibold text-slate-900">Total tax you pay</span>
                                <span className="font-semibold text-slate-900 text-lg">
                                    ₹{oldRegime.finalTaxLiability.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* New Regime */}
                    <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${selectedRegime === 'new' ? 'border-primary-500' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">New (Simplified) Regime</h2>
                            {selectedRegime === 'new' && (
                                <CheckCircle className="w-5 h-5 text-primary-600" />
                            )}
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Total income you're taxed on</span>
                                <span className="font-medium text-slate-900">
                                    ₹{newRegime.taxableIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Income tax</span>
                                <span className="font-medium text-slate-900">
                                    ₹{newRegime.taxOnIncome.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {newRegime.rebate > 0 && (
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Tax discount</span>
                                    <span className="font-medium text-green-600">
                                        - ₹{newRegime.rebate.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                            {newRegime.surcharge > 0 && (
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Additional tax for high income</span>
                                    <span className="font-medium text-slate-900">
                                        ₹{newRegime.surcharge.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Health & education fee</span>
                                <span className="font-medium text-slate-900">
                                    ₹{newRegime.cess.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between py-3 bg-slate-50 rounded-lg px-3 mt-3">
                                <span className="font-semibold text-slate-900">Total tax you pay</span>
                                <span className="font-semibold text-slate-900 text-lg">
                                    ₹{newRegime.finalTaxLiability.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Regime & Reason */}
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6 text-center">
                    <h3 className="font-semibold text-primary-900 mb-2">
                        Tax saving found!
                    </h3>
                    <p className="text-primary-800">
                        We picked the {selectedRegime === 'old' ? 'Old Regime' : 'New Regime'} because it saves you ₹{comparisonData.savings.toLocaleString('en-IN')} in tax.
                    </p>
                    {comparison.steps?.finalLiability?.refundOrPayable < 0 && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 font-medium">
                            Attention: You have a pending tax liability of ₹{Math.abs(comparison.steps.finalLiability.refundOrPayable).toLocaleString('en-IN')}.
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => {
                            if (comparison.steps?.finalLiability?.refundOrPayable < 0) {
                                navigate(`/filing/${filingId}/tax-payment`);
                            } else {
                                navigate(`/filing/${filingId}/readiness`);
                            }
                        }}
                        className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-3"
                    >
                        <CheckCircle className="w-6 h-6" />
                        {comparison.steps?.finalLiability?.refundOrPayable < 0 ? 'Pay My Tax & Submit' : 'Submit My Return'}
                    </button>
                    <button
                        onClick={() => navigate(`/filing/${filingId}/income-story`)}
                        className="w-full bg-white text-slate-600 py-3 px-6 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        ← Wait, I need to edit something
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaxBreakdown;
